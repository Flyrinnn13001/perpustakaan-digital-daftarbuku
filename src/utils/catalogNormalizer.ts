import {
  BarisDitolak,
  Buku,
  HasilImportCsv,
  JenisBuku,
  KelasKategori,
  StatusBuku,
} from '../types/library';

export const DRIVE_ROOT_FOLDER_ID = '1Du4ZdTS22RuSDdP8Zr9_YVVKZud0_dlI';
export const DRIVE_ROOT_FOLDER_URL = `https://drive.google.com/drive/folders/${DRIVE_ROOT_FOLDER_ID}`;

export const DRIVE_SUBFOLDERS = {
  BUKU_UMUM: '1HU7VyfaFOPLi30LithQ3f7U0RwG6YfNg',
  KELAS_X: '1AkgSLbgAjU10JsXCECDx3MtQVPAI-Pt-',
  KELAS_XI: '1w8QDx08u_r7CuiTRSBHgK9NXSmCG4FJ7',
  KELAS_XII: '1BSo3BkfvQn9-jjJD-tjZcgySec2mgkw2',
} as const;

export function extractDriveFileId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/);
  if (fileMatch) return fileMatch[1];
  const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
  if (dMatch) return dMatch[1];
  const idParam = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (idParam) return idParam[1];
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) return trimmed;
  return null;
}

export function isValidDriveLink(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!/^https?:\/\/(drive|docs)\.google\.com\//i.test(trimmed)) return false;
  return extractDriveFileId(trimmed) !== null;
}

export function getDrivePreviewUrl(driveLinkOrId: string, page?: number): string {
  const id = extractDriveFileId(driveLinkOrId);
  if (!id) return driveLinkOrId;
  const base = `https://drive.google.com/file/d/${id}/preview`;
  return page && page > 1 ? `${base}#page=${page}` : base;
}

export function getDriveDownloadUrl(driveLinkOrId: string): string {
  const id = extractDriveFileId(driveLinkOrId);
  if (!id) return driveLinkOrId;
  return `https://drive.google.com/uc?export=download&id=${id}`;
}

export function getDriveViewUrl(driveLinkOrId: string): string {
  const id = extractDriveFileId(driveLinkOrId);
  if (!id) return driveLinkOrId;
  return `https://drive.google.com/file/d/${id}/view`;
}

export function stripSalinanAndExt(raw: string): string {
  return raw
    .replace(/^["']+|["']+$/g, '')
    .replace(/^Salinan\s+/i, '')
    .replace(/\.pdf$/i, '')
    .trim();
}

export function detectJenisBuku(rawName: string, kelas: KelasKategori): JenisBuku {
  if (kelas === 'Umum') return 'Umum';
  const padded = `_${rawName}_`;
  if (/[-_]BG[-_]/i.test(padded)) return 'BG';
  if (/[-_]BS[-_]/i.test(padded)) return 'BS';
  return 'BS';
}

export function inferMapelAndCleanTitle(
  rawTitle: string,
  kelas: KelasKategori,
  providedMapel = ''
): { judul: string; mapel: string; jenis: JenisBuku } {
  const cleanedRaw = stripSalinanAndExt(rawTitle);

  // Jika judul sudah dinormalisasi sebelumnya (mengandung " — Buku Siswa" / " — Buku Guru")
  if (kelas !== 'Umum' && /—\s*Buku\s+(Siswa|Guru)/i.test(cleanedRaw)) {
    const isBG = /Buku\s+Guru/i.test(cleanedRaw);
    const leftPart = cleanedRaw.split('—')[0].replace(/\(Semester\s*\d+\)|\(Edisi\s*\d+\)/gi, '').trim();
    return {
      judul: cleanedRaw,
      mapel: providedMapel.trim() || leftPart,
      jenis: isBG ? 'BG' : 'BS',
    };
  }

  if (kelas === 'Umum') {
    let title = cleanedRaw
      .replace(/_/g, ' ')
      .replace(/Puisi“/g, 'Puisi “')
      .replace(/\s+/g, ' ')
      .trim();

    if (title === title.toLowerCase()) {
      title = title.replace(/\b\w/g, (c) => c.toUpperCase());
    }
    if (/^Ondel ondel kite$/i.test(title)) {
      title = 'Ondel-Ondel Kite';
    }

    let mapel = providedMapel.trim();
    if (!mapel) {
      if (/^Majalah Liris/i.test(title)) {
        mapel = 'Majalah Literasi';
      } else if (
        /Legenda|Asal Mula|Danau|Rawa Pening|Naga|Kerajaan|Adipati|Datuk|Dewi|Sabai|Putri|Rumah Bolon|Lamin/i.test(
          title
        )
      ) {
        mapel = 'Cerita Rakyat & Legenda';
      } else if (
        /Cut Nyak|Pejuang|Gajah Mada|Max Havelaar|Puisi|Gurindam|Sengsara Membawa Nikmat|Si Djamin/i.test(
          title
        )
      ) {
        mapel = 'Sastra & Sejarah';
      } else {
        mapel = 'Cerita Anak & Nusantara';
      }
    }

    return { judul: title, mapel, jenis: 'Umum' };
  }

  const jenis = detectJenisBuku(cleanedRaw, kelas);
  const jenisLabel = jenis === 'BG' ? 'Buku Guru' : 'Buku Siswa';
  const isXIXII = /XI[-_](?:dan[-_])?XII/i.test(cleanedRaw);
  const kelasLabel = isXIXII ? 'Kelas XI–XII' : `Kelas ${kelas}`;

  let extraNote = '';
  if (/Sem[-_]?1/i.test(cleanedRaw)) extraNote = ' (Semester 1)';
  else if (/Semester[-_]?2/i.test(cleanedRaw)) extraNote = ' (Semester 2)';
  else if (/KLS_X_2$/i.test(cleanedRaw)) extraNote = ' (Edisi 2)';

  const norm = cleanedRaw.replace(/[-_]+/g, ' ').trim();
  let mapel = providedMapel.trim();

  if (!mapel) {
    if (/^Bahasa Indonesia|^Indonesia\b/i.test(norm)) {
      mapel = /\bTL\b|Tingkat Lanjut/i.test(norm)
        ? 'Bahasa Indonesia Tingkat Lanjut'
        : 'Bahasa Indonesia';
    } else if (/^Bahasa Inggris|^Inggris\b/i.test(norm)) {
      mapel = /Lanjut/i.test(norm) ? 'Bahasa Inggris Tingkat Lanjut' : 'Bahasa Inggris';
    } else if (/^B Korea|Bahasa Korea/i.test(norm)) {
      mapel = 'Bahasa Korea';
    } else if (/^Mandarin|Bahasa Mandarin/i.test(norm)) {
      mapel = 'Bahasa Mandarin';
    } else if (/^Matematika/i.test(norm)) {
      mapel = /Lanjut/i.test(norm) ? 'Matematika Tingkat Lanjut' : 'Matematika';
    } else if (/^IPA\b/i.test(norm)) {
      mapel = 'IPA';
    } else if (/^IPS\b/i.test(norm)) {
      mapel = 'IPS';
    } else if (/^Fisika\b/i.test(norm)) {
      mapel = 'Fisika';
    } else if (/^Kimia\b/i.test(norm)) {
      mapel = 'Kimia';
    } else if (/^Biologi\b/i.test(norm)) {
      mapel = 'Biologi';
    } else if (/^Geografi\b/i.test(norm)) {
      mapel = 'Geografi';
    } else if (/^Ekonomi\b/i.test(norm)) {
      mapel = 'Ekonomi';
    } else if (/^Sosiologi\b/i.test(norm)) {
      mapel = 'Sosiologi';
    } else if (/^Antropologi\b/i.test(norm)) {
      mapel = 'Antropologi';
    } else if (/^Sejarah\b/i.test(norm)) {
      mapel = 'Sejarah';
    } else if (/^Pendidikan Pancasila/i.test(norm)) {
      mapel = 'Pendidikan Pancasila';
    } else if (/^PJOK\b/i.test(norm)) {
      mapel = 'PJOK';
    } else if (/^Informatika\b/i.test(norm)) {
      mapel = 'Informatika';
    } else if (/^KKA\b/i.test(norm)) {
      mapel = 'KKA (Kecerdasan Artifisial)';
    } else if (/^Islam\b|Agama Islam/i.test(norm)) {
      mapel = 'Agama Islam';
    } else if (/^Kristen\b|Agama Kristen/i.test(norm)) {
      mapel = 'Agama Kristen';
    } else if (/^Katolik\b|Agama Katolik/i.test(norm)) {
      mapel = 'Agama Katolik';
    } else if (/^Hindu\b|Agama Hindu/i.test(norm)) {
      mapel = 'Agama Hindu';
    } else if (/^Buddha\b|Agama Buddha/i.test(norm)) {
      mapel = 'Agama Buddha';
    } else if (/^Khonghucu\b|Agama Khonghucu/i.test(norm)) {
      mapel = 'Agama Khonghucu';
    } else if (/^Kepercayaan\b/i.test(norm)) {
      mapel = 'Kepercayaan';
    } else if (/^Seni Musik/i.test(norm)) {
      mapel = 'Seni Musik';
    } else if (/^Seni Rupa|^Rupa\b/i.test(norm)) {
      mapel = 'Seni Rupa';
    } else if (/^Seni Tari/i.test(norm)) {
      mapel = 'Seni Tari';
    } else if (/^Seni Teater/i.test(norm)) {
      mapel = 'Seni Teater';
    } else if (/^Prakarya Budi ?Daya/i.test(norm)) {
      mapel = 'Prakarya Budidaya';
    } else if (/^Prakarya Kerajinan/i.test(norm)) {
      mapel = 'Prakarya Kerajinan';
    } else if (/^Prakarya Pengolahan/i.test(norm)) {
      mapel = 'Prakarya Pengolahan';
    } else if (/^Prakarya Rekayasa/i.test(norm)) {
      mapel = 'Prakarya Rekayasa';
    } else if (/Manajemen Perkantoran/i.test(norm)) {
      mapel = 'Dasar-Dasar Manajemen Perkantoran dan Layanan Bisnis';
    } else if (/Usaha Layanan Pariwisata/i.test(norm)) {
      mapel = 'Dasar-Dasar Usaha Layanan Pariwisata';
    } else if (/Teknik Elektronika/i.test(norm)) {
      mapel = 'Dasar-Dasar Teknik Elektronika';
    } else if (/Kuliner/i.test(norm)) {
      mapel = kelas === 'X' ? 'Dasar-Dasar Kuliner' : 'Kuliner';
    } else if (/^Animasi\b/i.test(norm)) {
      mapel = 'Animasi';
    } else if (/^Pengembangan Gim/i.test(norm)) {
      mapel = 'Pengembangan Gim';
    } else {
      mapel = norm.replace(/\b(BG|BS|KLS|Kelas|X|XI|XII|10|11|12|Rev|efc)\b/gi, '').replace(/\s+/g, ' ').trim() || 'Umum';
    }
  }

  const judul = `${mapel}${extraNote} — ${jenisLabel} ${kelasLabel}`;
  return { judul, mapel, jenis };
}

export function formatUkuranFile(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return 'Ukuran di Drive';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) {
    return `${mb >= 100 ? mb.toFixed(0) : mb.toFixed(1)} MB`;
  }
  const kb = bytes / 1024;
  return `${kb.toFixed(0)} KB`;
}

export function getLevelUkuranFile(bytes: number | null | undefined): 'normal' | 'sedang' | 'besar' {
  if (!bytes) return 'normal';
  const mb = bytes / (1024 * 1024);
  if (mb >= 50) return 'besar';
  if (mb >= 25) return 'sedang';
  return 'normal';
}

function splitCsvFieldsRespectingQuotes(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/**
 * Parser CSV pintar sesuai spesifikasi import_bacaan.csv:
 * Kolom: judul,kelas,mapel,drive_link,status
 * - Memperbaiki judul yang mengandung koma tanpa tanda kutip (contoh: "Nurin, Si Anak Elang")
 * - Menolak baris dengan drive_link kosong atau rusak
 * - Menghapus awalan "Salinan " & menormalisasi nama file PDF menjadi judul rapi
 * - Menolak duplikat Buku Umum yang merupakan salinan buku pelajaran Kelas X
 * - Mendeduplikasi judul yang muncul 2x (contoh: "Sitat Gurindam Dua Belas")
 */
export function parseImportCsv(csvText: string, existingBooks: Buku[] = []): HasilImportCsv {
  const lines = csvText.replace(/^\uFEFF/, '').split(/\r?\n/);
  const validBooks: Buku[] = [];
  const rejectedRows: BarisDitolak[] = [];
  let fixedCommaCount = 0;
  let deduplicatedCount = 0;
  let newCount = 0;
  let updatedCount = 0;

  const existingByKey = new Map<string, Buku>();
  for (const b of existingBooks) {
    existingByKey.set(`${b.kelas}::${b.judul.toLowerCase()}`, b);
  }

  const seenInBatch = new Set<string>();

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx].trim();
    if (!rawLine) continue;

    // Lewati baris header
    if (idx === 0 && /^judul\s*,\s*kelas\s*,/i.test(rawLine)) {
      continue;
    }

    const fields = splitCsvFieldsRespectingQuotes(rawLine);
    if (fields.length < 5) {
      rejectedRows.push({
        baris: idx + 1,
        isi: rawLine,
        alasan: `Jumlah kolom kurang (${fields.length}/5 kolom wajib: judul,kelas,mapel,drive_link,status)`,
      });
      continue;
    }

    // Ambil 4 kolom paling kanan (kelas, mapel, drive_link, status) sehingga koma di dalam judul otomatis tersambung
    let rawStatus = fields[fields.length - 1].trim().toLowerCase();
    let rawDriveLink = fields[fields.length - 2].trim();
    let rawMapel = fields[fields.length - 3].trim();
    let rawKelas = fields[fields.length - 4].trim();
    let rawJudul = fields.slice(0, fields.length - 4).join(',').trim();

    if (fields.length > 5 && !rawLine.startsWith('"')) {
      fixedCommaCount++;
    }

    // Normalisasi nilai kelas
    let kelasNorm: KelasKategori | null = null;
    if (/^umum$/i.test(rawKelas)) kelasNorm = 'Umum';
    else if (/^(x|10|kelas\s*x)$/i.test(rawKelas)) kelasNorm = 'X';
    else if (/^(xi|11|kelas\s*xi)$/i.test(rawKelas)) kelasNorm = 'XI';
    else if (/^(xii|12|kelas\s*xii)$/i.test(rawKelas)) kelasNorm = 'XII';

    if (!kelasNorm) {
      rejectedRows.push({
        baris: idx + 1,
        isi: rawLine,
        alasan: `Kelas "${rawKelas}" tidak valid (harus Umum, X, XI, atau XII)`,
      });
      continue;
    }

    if (!rawJudul) {
      rejectedRows.push({
        baris: idx + 1,
        isi: rawLine,
        alasan: 'Judul buku kosong',
      });
      continue;
    }

    if (!isValidDriveLink(rawDriveLink)) {
      rejectedRows.push({
        baris: idx + 1,
        isi: rawLine,
        alasan: rawDriveLink
          ? `Link Google Drive rusak/tidak valid: "${rawDriveLink}"`
          : 'Kolom drive_link kosong',
      });
      continue;
    }

    // Cegah duplikat folder "Buku Umum" yang berisi buku pelajaran Kelas X masuk ke kategori Umum
    if (kelasNorm === 'Umum' && /[-_](BG|BS)[-_]KLS[-_]X\b|KLS[-_]10\b/i.test(rawJudul)) {
      deduplicatedCount++;
      continue;
    }

    const statusNorm: StatusBuku = rawStatus === 'nonaktif' ? 'nonaktif' : 'aktif';
    const baseAsli = stripSalinanAndExt(rawJudul);
    const { judul, mapel, jenis } = inferMapelAndCleanTitle(baseAsli, kelasNorm, rawMapel);
    const dedupeKey = `${kelasNorm}::${judul.toLowerCase()}`;

    if (seenInBatch.has(dedupeKey)) {
      deduplicatedCount++;
      continue;
    }
    seenInBatch.add(dedupeKey);

    const existing = existingByKey.get(dedupeKey);
    const driveFileId = extractDriveFileId(rawDriveLink) || '';

    if (existing) {
      updatedCount++;
      validBooks.push({
        ...existing,
        judul,
        judul_asli: baseAsli,
        kelas: kelasNorm,
        mapel,
        jenis,
        drive_link: rawDriveLink,
        drive_file_id: driveFileId,
        status: statusNorm,
      });
    } else {
      newCount++;
      validBooks.push({
        id: `buku-${Date.now().toString(36)}-${idx}`,
        judul,
        judul_asli: baseAsli,
        kelas: kelasNorm,
        mapel,
        jenis,
        drive_link: rawDriveLink,
        drive_file_id: driveFileId,
        folder_file_id: null,
        status: statusNorm,
        ukuran_file: null,
        created_at: new Date().toISOString(),
      });
    }
  }

  return {
    validBooks,
    newCount,
    updatedCount,
    fixedCommaCount,
    deduplicatedCount,
    rejectedRows,
  };
}

/**
 * Pencarian real-time toleran salah ketik ringan (Levenshtein bounded + normalisasi fonetik Indonesia)
 */
function normalizePhoneticId(s: string): string {
  return s
    .toLowerCase()
    .replace(/kh/g, 'k')
    .replace(/sy/g, 's')
    .replace(/dj/g, 'j')
    .replace(/tj/g, 'c')
    .replace(/oe/g, 'u')
    .replace(/ph/g, 'f')
    .replace(/v/g, 'f')
    .replace(/y/g, 'i')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function editDistanceAtMost2(a: string, b: string): number {
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 2) return 3;

  const prev = new Array(lb + 1).fill(0).map((_, j) => j);
  const curr = new Array(lb + 1).fill(0);

  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > 2) return 3;
    for (let j = 0; j <= lb; j++) prev[j] = curr[j];
  }
  return prev[lb];
}

export function fuzzySearchBooks(books: Buku[], rawQuery: string): Buku[] {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return books;

  const qTokens = q.split(/\s+/).filter(Boolean);
  const qPhoneticTokens = normalizePhoneticId(q).split(/\s+/).filter(Boolean);

  const scored: { book: Buku; score: number }[] = [];

  for (const book of books) {
    const haystack = `${book.judul} ${book.mapel} kelas ${book.kelas} ${book.judul_asli || ''} ${
      book.jenis === 'BG' ? 'buku guru bg' : book.jenis === 'BS' ? 'buku siswa bs' : 'umum literasi'
    }`.toLowerCase();

    if (haystack.includes(q)) {
      const startsWithBonus = book.judul.toLowerCase().startsWith(q) ? 40 : 0;
      const mapelBonus = book.mapel.toLowerCase().includes(q) ? 20 : 0;
      scored.push({ book, score: 100 + startsWithBonus + mapelBonus });
      continue;
    }

    const hayWords = haystack.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
    const hayPhoneticWords = normalizePhoneticId(haystack).split(/\s+/).filter(Boolean);

    let allTokensMatched = true;
    let totalTokenScore = 0;

    for (let tIdx = 0; tIdx < qTokens.length; tIdx++) {
      const token = qTokens[tIdx];
      const pToken = qPhoneticTokens[tIdx] || token;

      if (haystack.includes(token)) {
        totalTokenScore += 25;
        continue;
      }

      if (pToken.length >= 3 && hayPhoneticWords.some((hw) => hw.includes(pToken))) {
        totalTokenScore += 18;
        continue;
      }

      if (token.length >= 4) {
        const maxDist = token.length >= 6 ? 2 : 1;
        let bestDist = 3;
        for (const hw of hayWords) {
          if (Math.abs(hw.length - token.length) > maxDist) continue;
          const d = editDistanceAtMost2(token, hw);
          if (d < bestDist) bestDist = d;
          if (bestDist === 1) break;
        }
        if (bestDist <= maxDist) {
          totalTokenScore += bestDist === 1 ? 14 : 8;
          continue;
        }
      }

      allTokensMatched = false;
      break;
    }

    if (allTokensMatched && totalTokenScore > 0) {
      scored.push({ book, score: totalTokenScore });
    }
  }

  return scored.sort((a, b) => b.score - a.score).map((s) => s.book);
}

export function exportCatalogToCsv(books: Buku[]): string {
  const header = 'judul,kelas,mapel,drive_link,status';
  const rows = books.map((b) => {
    const escField = (val: string) =>
      val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
    return [
      escField(b.judul),
      b.kelas,
      escField(b.mapel),
      b.drive_link,
      b.status,
    ].join(',');
  });
  return [header, ...rows].join('\n');
}
