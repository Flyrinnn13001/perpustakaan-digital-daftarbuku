import { createClient, SupabaseClient } from '@supabase/supabase-js';
import seedBooksData from '../data/seedBooks.json';
import {
  Buku,
  HasilImportCsv,
  HasilSyncDrive,
  KelasKategori,
  KonfigurasiIntegrasi,
  ProfilPengguna,
  RiwayatBaca,
  StatusBuku,
  UnduhanOffline,
} from '../types/library';
import {
  DRIVE_ROOT_FOLDER_ID,
  DRIVE_SUBFOLDERS,
  extractDriveFileId,
  getDriveViewUrl,
  inferMapelAndCleanTitle,
  parseImportCsv,
  stripSalinanAndExt,
} from '../utils/catalogNormalizer';

const STORAGE_KEYS = {
  BOOKS: 'daftarbuku_catalog_v1',
  USER: 'daftarbuku_active_user_v1',
  CONFIG: 'daftarbuku_integration_config_v1',
  FAVORITES_PREFIX: 'daftarbuku_fav_',
  HISTORY_PREFIX: 'daftarbuku_hist_',
  OFFLINE_PREFIX: 'daftarbuku_offline_',
};

export function getDefaultIntegrationConfig(): KonfigurasiIntegrasi {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        supabaseUrl: parsed.supabaseUrl || import.meta.env.VITE_SUPABASE_URL || '',
        supabaseAnonKey: parsed.supabaseAnonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        googleDriveApiKey:
          parsed.googleDriveApiKey || import.meta.env.VITE_GOOGLE_DRIVE_API_KEY || '',
        googleSheetCsvUrl:
          parsed.googleSheetCsvUrl || import.meta.env.VITE_GOOGLE_SHEET_CSV_URL || '',
        appsScriptSyncUrl: parsed.appsScriptSyncUrl || '',
      };
    }
  } catch {
    // ignore storage errors
  }
  return {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    googleDriveApiKey: import.meta.env.VITE_GOOGLE_DRIVE_API_KEY || '',
    googleSheetCsvUrl: import.meta.env.VITE_GOOGLE_SHEET_CSV_URL || '',
    appsScriptSyncUrl: '',
  };
}

export function saveIntegrationConfig(cfg: KonfigurasiIntegrasi): void {
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(cfg));
  cachedSupabase = null;
}

let cachedSupabase: { key: string; client: SupabaseClient } | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const cfg = getDefaultIntegrationConfig();
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) return null;
  const composite = `${cfg.supabaseUrl}::${cfg.supabaseAnonKey}`;
  if (cachedSupabase && cachedSupabase.key === composite) {
    return cachedSupabase.client;
  }
  try {
    const client = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    cachedSupabase = { key: composite, client };
    return client;
  } catch {
    return null;
  }
}

export function getSeedBooks(): Buku[] {
  return (seedBooksData as Buku[]).map((b) => ({ ...b }));
}

export function loadLocalBooks(): Buku[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKS);
    if (raw) {
      const parsed = JSON.parse(raw) as Buku[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback to seed
  }
  const initial = getSeedBooks();
  saveLocalBooks(initial);
  return initial;
}

export function saveLocalBooks(books: Buku[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
  } catch {
    // ignore quota error
  }
}

export async function fetchCatalogWithCloudFallback(): Promise<{
  books: Buku[];
  cloudConnected: boolean;
}> {
  const local = loadLocalBooks();
  const sb = getSupabaseClient();
  if (!sb) {
    return { books: local, cloudConnected: false };
  }

  try {
    const { data, error } = await sb
      .from('bacaan')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (data && data.length > 0) {
      const mapped: Buku[] = data.map((row: Record<string, unknown>) => ({
        id: String(row.id),
        judul: String(row.judul || ''),
        judul_asli: row.judul_asli ? String(row.judul_asli) : undefined,
        kelas: (row.kelas as KelasKategori) || 'Umum',
        mapel: String(row.mapel || ''),
        jenis: (row.jenis as Buku['jenis']) || 'BS',
        drive_link: String(row.drive_link || ''),
        drive_file_id:
          String(row.drive_file_id || '') || extractDriveFileId(String(row.drive_link || '')) || '',
        folder_file_id: row.folder_file_id ? String(row.folder_file_id) : null,
        status: (row.status as StatusBuku) === 'nonaktif' ? 'nonaktif' : 'aktif',
        ukuran_file: row.ukuran_file !== null && row.ukuran_file !== undefined ? Number(row.ukuran_file) : null,
        created_at: String(row.created_at || new Date().toISOString()),
      }));
      saveLocalBooks(mapped);
      return { books: mapped, cloudConnected: true };
    }

    // Jika tabel Supabase masih kosong, unggah seed awal otomatis
    await sb.from('bacaan').upsert(
      local.map((b) => ({
        id: b.id,
        judul: b.judul,
        judul_asli: b.judul_asli || null,
        kelas: b.kelas,
        mapel: b.mapel,
        drive_link: b.drive_link,
        drive_file_id: b.drive_file_id,
        folder_file_id: b.folder_file_id || null,
        status: b.status,
        jenis: b.jenis,
        ukuran_file: b.ukuran_file,
        created_at: b.created_at,
      }))
    );
    return { books: local, cloudConnected: true };
  } catch {
    return { books: local, cloudConnected: false };
  }
}

export async function persistBooksUpdate(books: Buku[], changedBooks?: Buku[]): Promise<void> {
  saveLocalBooks(books);
  const sb = getSupabaseClient();
  if (!sb) return;
  const targets = changedBooks || books;
  if (targets.length === 0) return;

  try {
    await sb.from('bacaan').upsert(
      targets.map((b) => ({
        id: b.id,
        judul: b.judul,
        judul_asli: b.judul_asli || null,
        kelas: b.kelas,
        mapel: b.mapel,
        drive_link: b.drive_link,
        drive_file_id: b.drive_file_id,
        folder_file_id: b.folder_file_id || null,
        status: b.status,
        jenis: b.jenis,
        ukuran_file: b.ukuran_file,
        created_at: b.created_at,
      }))
    );
  } catch {
    // Tetap tersimpan lokal jika koneksi sedang offline
  }
}

export function loadActiveUser(): ProfilPengguna {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (raw) {
      return JSON.parse(raw) as ProfilPengguna;
    }
  } catch {
    // default user
  }
  return {
    id: 'siswa-default',
    nama: 'Siswa Pembaca',
    kelas: 'X',
    peran: 'siswa',
    loginMethod: 'sederhana',
  };
}

export function saveActiveUser(user: ProfilPengguna): void {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export function loadFavorites(userId: string): string[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.FAVORITES_PREFIX}${userId}`);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveFavorites(userId: string, ids: string[]): void {
  localStorage.setItem(`${STORAGE_KEYS.FAVORITES_PREFIX}${userId}`, JSON.stringify(ids));
}

export function loadReadingHistory(userId: string): Record<string, RiwayatBaca> {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.HISTORY_PREFIX}${userId}`);
    return raw ? (JSON.parse(raw) as Record<string, RiwayatBaca>) : {};
  } catch {
    return {};
  }
}

export function saveReadingHistory(userId: string, map: Record<string, RiwayatBaca>): void {
  localStorage.setItem(`${STORAGE_KEYS.HISTORY_PREFIX}${userId}`, JSON.stringify(map));
}

export function loadOfflineDownloads(userId: string): UnduhanOffline[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.OFFLINE_PREFIX}${userId}`);
    return raw ? (JSON.parse(raw) as UnduhanOffline[]) : [];
  } catch {
    return [];
  }
}

export function saveOfflineDownloads(userId: string, list: UnduhanOffline[]): void {
  localStorage.setItem(`${STORAGE_KEYS.OFFLINE_PREFIX}${userId}`, JSON.stringify(list));
}

interface RawDriveFile {
  id: string;
  name: string;
  size?: string | number;
  modifiedTime?: string;
}

interface DriveSnapshotPayload {
  rootFolderId: string;
  syncedAt: string;
  folders: Record<
    string,
    {
      id: string;
      ignoredAsDuplicateOfKelasX?: boolean;
      files: RawDriveFile[];
    }
  >;
}

async function listDriveFolderViaRestApi(
  folderId: string,
  apiKey: string
): Promise<RawDriveFile[]> {
  const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const fields = encodeURIComponent('files(id,name,mimeType,size,modifiedTime)');
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&pageSize=200&fields=${fields}&key=${encodeURIComponent(
    apiKey
  )}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Google Drive API mengembalikan status ${res.status}`);
  }
  const json = await res.json();
  return (json.files || []).filter(
    (f: { mimeType?: string; name?: string }) =>
      f.mimeType === 'application/pdf' || /\.pdf$/i.test(f.name || '')
  );
}

/**
 * Sinkronisasi folder Google Drive 1Du4ZdTS22RuSDdP8Zr9_YVVKZud0_dlI
 * Memindai subfolder Buku Umum (diabaikan karena duplikat Kelas X), Kelas X, Kelas XI, dan Kelas XII.
 */
export async function syncCatalogWithDriveFolder(
  existingBooks: Buku[]
): Promise<{ mergedBooks: Buku[]; report: HasilSyncDrive }> {
  const cfg = getDefaultIntegrationConfig();
  let snapshot: DriveSnapshotPayload | null = null;
  let source: HasilSyncDrive['source'] = 'drive_snapshot';

  if (cfg.googleDriveApiKey.trim()) {
    const apiKey = cfg.googleDriveApiKey.trim();
    const [bukuUmum, kelasX, kelasXI, kelasXII] = await Promise.all([
      listDriveFolderViaRestApi(DRIVE_SUBFOLDERS.BUKU_UMUM, apiKey),
      listDriveFolderViaRestApi(DRIVE_SUBFOLDERS.KELAS_X, apiKey),
      listDriveFolderViaRestApi(DRIVE_SUBFOLDERS.KELAS_XI, apiKey),
      listDriveFolderViaRestApi(DRIVE_SUBFOLDERS.KELAS_XII, apiKey),
    ]);
    snapshot = {
      rootFolderId: DRIVE_ROOT_FOLDER_ID,
      syncedAt: new Date().toISOString(),
      folders: {
        'Buku Umum': { id: DRIVE_SUBFOLDERS.BUKU_UMUM, ignoredAsDuplicateOfKelasX: true, files: bukuUmum },
        'Kelas X': { id: DRIVE_SUBFOLDERS.KELAS_X, files: kelasX },
        'Kelas XI': { id: DRIVE_SUBFOLDERS.KELAS_XI, files: kelasXI },
        'Kelas XII': { id: DRIVE_SUBFOLDERS.KELAS_XII, files: kelasXII },
      },
    };
    source = 'google_drive_api';
  } else if (cfg.appsScriptSyncUrl.trim()) {
    const res = await fetch(cfg.appsScriptSyncUrl.trim());
    if (!res.ok) throw new Error('Gagal menghubungi URL Google Apps Script Sync');
    snapshot = (await res.json()) as DriveSnapshotPayload;
    source = 'apps_script';
  } else {
    const res = await fetch(`${import.meta.env.BASE_URL}data/drive_snapshot.json`);
    if (!res.ok) throw new Error('Snapshot metadata folder Google Drive tidak ditemukan');
    snapshot = (await res.json()) as DriveSnapshotPayload;
    source = 'drive_snapshot';
  }

  const merged = existingBooks.map((b) => ({ ...b }));
  const byKelasAndTitle = new Map<string, Buku>();
  const byFileId = new Map<string, Buku>();

  for (const b of merged) {
    byKelasAndTitle.set(`${b.kelas}::${b.judul.toLowerCase()}`, b);
    if (b.drive_file_id) byFileId.set(b.drive_file_id, b);
    if (b.folder_file_id) byFileId.set(b.folder_file_id, b);
  }

  const scannedFolders: HasilSyncDrive['scannedFolders'] = [];
  const newBooks: Buku[] = [];
  let updatedSizeCount = 0;
  let skippedDuplicateCount = 0;

  const folderMapping: { folderKey: string; kelas: KelasKategori | null }[] = [
    { folderKey: 'Buku Umum', kelas: null }, // Diabaikan karena 100% duplikat Kelas X
    { folderKey: 'Kelas X', kelas: 'X' },
    { folderKey: 'Kelas XI', kelas: 'XI' },
    { folderKey: 'Kelas XII', kelas: 'XII' },
  ];

  for (const { folderKey, kelas } of folderMapping) {
    const fInfo = snapshot.folders[folderKey];
    if (!fInfo) continue;

    if (kelas === null || fInfo.ignoredAsDuplicateOfKelasX) {
      skippedDuplicateCount += fInfo.files.length;
      scannedFolders.push({
        nama: folderKey,
        folderId: fInfo.id,
        jumlahPdf: fInfo.files.length,
        diabaikanSebagaiDuplikat: true,
      });
      continue;
    }

    scannedFolders.push({
      nama: folderKey,
      folderId: fInfo.id,
      jumlahPdf: fInfo.files.length,
    });

    for (const file of fInfo.files) {
      const baseAsli = stripSalinanAndExt(file.name);
      const { judul, mapel, jenis } = inferMapelAndCleanTitle(baseAsli, kelas);
      const key = `${kelas}::${judul.toLowerCase()}`;
      const sizeBytes = file.size ? Number(file.size) : null;

      const existing = byFileId.get(file.id) || byKelasAndTitle.get(key);
      if (existing) {
        if (sizeBytes && existing.ukuran_file !== sizeBytes) {
          existing.ukuran_file = sizeBytes;
          updatedSizeCount++;
        }
        if (!existing.folder_file_id) {
          existing.folder_file_id = file.id;
        }
      } else {
        const created: Buku = {
          id: `buku-drv-${file.id.slice(0, 8)}`,
          judul,
          judul_asli: baseAsli,
          kelas,
          mapel,
          jenis,
          drive_link: getDriveViewUrl(file.id),
          drive_file_id: file.id,
          folder_file_id: file.id,
          status: 'aktif',
          ukuran_file: sizeBytes,
          created_at: file.modifiedTime || new Date().toISOString(),
        };
        merged.unshift(created);
        newBooks.push(created);
        byKelasAndTitle.set(key, created);
        byFileId.set(file.id, created);
      }
    }
  }

  await persistBooksUpdate(merged, newBooks.length > 0 ? newBooks : undefined);

  return {
    mergedBooks: merged,
    report: {
      source,
      rootFolderId: snapshot.rootFolderId || DRIVE_ROOT_FOLDER_ID,
      scannedFolders,
      newBooks,
      updatedSizeCount,
      skippedDuplicateCount,
      syncedAt: new Date().toISOString(),
    },
  };
}

export async function mergeImportedCsvIntoCatalog(
  csvText: string,
  existingBooks: Buku[],
  replaceAll = false
): Promise<{ mergedBooks: Buku[]; report: HasilImportCsv }> {
  const report = parseImportCsv(csvText, existingBooks);
  if (report.validBooks.length === 0) {
    return { mergedBooks: existingBooks, report };
  }

  let nextBooks: Buku[];
  if (replaceAll) {
    nextBooks = report.validBooks;
  } else {
    const map = new Map<string, Buku>();
    for (const b of existingBooks) {
      map.set(`${b.kelas}::${b.judul.toLowerCase()}`, b);
    }
    for (const incoming of report.validBooks) {
      const k = `${incoming.kelas}::${incoming.judul.toLowerCase()}`;
      const prev = map.get(k);
      map.set(k, {
        ...prev,
        ...incoming,
        id: prev ? prev.id : incoming.id,
        ukuran_file: incoming.ukuran_file ?? prev?.ukuran_file ?? null,
        folder_file_id: incoming.folder_file_id ?? prev?.folder_file_id ?? null,
      });
    }
    nextBooks = Array.from(map.values());
  }

  await persistBooksUpdate(nextBooks, report.validBooks);
  return { mergedBooks: nextBooks, report };
}
