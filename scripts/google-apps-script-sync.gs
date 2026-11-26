/**
 * ============================================================================
 * GOOGLE APPS SCRIPT PENDAMPING (OPSIONAL) — Perpustakaan Digital DaftarBuku
 * ============================================================================
 * Cara Pakai (jika Admin ingin sinkronisasi folder Drive tanpa API Key GCP):
 * 1. Buka https://script.google.com -> Proyek Baru
 * 2. Tempel seluruh kode ini ke Code.gs
 * 3. Klik "Terapkan" (Deploy) -> "Deployment baru" -> Jenis: "Aplikasi Web"
 *    - Jalankan sebagai: Saya (Me)
 *    - Siapa yang memiliki akses: Siapa saja (Anyone)
 * 4. Salin URL Web App ke menu Admin Panel -> Konfigurasi Sinkronisasi di aplikasi DaftarBuku.
 */

const ROOT_FOLDER_ID = '1Du4ZdTS22RuSDdP8Zr9_YVVKZud0_dlI';

function doGet() {
  const root = DriveApp.getFolderById(ROOT_FOLDER_ID);
  const foldersOut = {};

  const subFolders = root.getFolders();
  while (subFolders.hasNext()) {
    const folder = subFolders.next();
    const folderName = folder.getName();
    const files = [];
    const fileIter = folder.getFilesByType(MimeType.PDF);
    while (fileIter.hasNext()) {
      const f = fileIter.next();
      files.push({
        id: f.getId(),
        name: f.getName(),
        size: String(f.getSize()),
        modifiedTime: f.getLastUpdated().toISOString(),
        webViewLink: 'https://drive.google.com/file/d/' + f.getId() + '/view',
      });
    }
    foldersOut[folderName] = {
      id: folder.getId(),
      ignoredAsDuplicateOfKelasX: folderName.toLowerCase() === 'buku umum',
      files: files,
    };
  }

  const payload = {
    rootFolderId: ROOT_FOLDER_ID,
    syncedAt: new Date().toISOString(),
    folders: foldersOut,
  };

  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
