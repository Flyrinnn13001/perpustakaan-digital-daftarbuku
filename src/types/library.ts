export type KelasKategori = 'Umum' | 'X' | 'XI' | 'XII';

export type JenisBuku = 'Umum' | 'BS' | 'BG';

export type StatusBuku = 'aktif' | 'nonaktif';

export type PeranPengguna = 'siswa' | 'guru' | 'admin';

export interface Buku {
  id: string;
  judul: string;
  judul_asli?: string;
  kelas: KelasKategori;
  mapel: string;
  jenis: JenisBuku;
  drive_link: string;
  drive_file_id: string;
  folder_file_id?: string | null;
  status: StatusBuku;
  ukuran_file: number | null;
  created_at: string;
}

export interface RiwayatBaca {
  bacaan_id: string;
  halaman_terakhir: number;
  total_halaman?: number;
  zoom_terakhir?: number;
  mode_malam?: boolean;
  catatan?: string;
  last_read_at: string;
}

export interface UnduhanOffline {
  bacaan_id: string;
  judul: string;
  kelas: KelasKategori;
  mapel: string;
  ukuran_file: number | null;
  drive_link: string;
  downloaded_at: string;
}

export interface ProfilPengguna {
  id: string;
  nama: string;
  kelas: string;
  peran: PeranPengguna;
  email?: string;
  loginMethod: 'sederhana' | 'google' | 'admin';
}

export interface BarisDitolak {
  baris: number;
  isi: string;
  alasan: string;
}

export interface HasilImportCsv {
  validBooks: Buku[];
  newCount: number;
  updatedCount: number;
  fixedCommaCount: number;
  deduplicatedCount: number;
  rejectedRows: BarisDitolak[];
}

export interface HasilSyncDrive {
  source: 'google_drive_api' | 'apps_script' | 'drive_snapshot';
  rootFolderId: string;
  scannedFolders: {
    nama: string;
    folderId: string;
    jumlahPdf: number;
    diabaikanSebagaiDuplikat?: boolean;
  }[];
  newBooks: Buku[];
  updatedSizeCount: number;
  skippedDuplicateCount: number;
  syncedAt: string;
}

export interface KonfigurasiIntegrasi {
  supabaseUrl: string;
  supabaseAnonKey: string;
  googleDriveApiKey: string;
  googleSheetCsvUrl: string;
  appsScriptSyncUrl: string;
}

export type TabNavigasi = 'beranda' | 'katalog' | 'favorit' | 'riwayat' | 'profil';
