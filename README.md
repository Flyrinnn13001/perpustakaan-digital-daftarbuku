# Perpustakaan Digital DaftarBuku

🌐 **Demo Live (GitHub Pages / PWA):** https://flyrinnn13001.github.io/perpustakaan-digital-daftarbuku/

Aplikasi perpustakaan digital **mobile-first** berbahasa Indonesia yang dirancang tampil seperti aplikasi native (Android & iOS), dapat di-install langsung sebagai **PWA (Progressive Web App)**, maupun dibungkus menjadi file **APK Android** menggunakan Capacitor atau PWABuilder.

## Sumber Data & Katalog Nyata
- **Google Drive Folder Utama**: `1Du4ZdTS22RuSDdP8Zr9_YVVKZud0_dlI`  
  https://drive.google.com/drive/folders/1Du4ZdTS22RuSDdP8Zr9_YVVKZud0_dlI
- **File Katalog Utama**: `public/data/import_bacaan.csv` (215 baris asli dari Drive) + metadata ukuran asli dari 165 PDF pada subfolder Drive (`public/data/drive_snapshot.json`).
- **Hasil Deduplikasi & Normalisasi Awal (214 Buku Aktif)**:
  - **Umum (84 judul unik)**: Bacaan literasi, cerita rakyat, legenda, novel/sastra, & Majalah Liris Edisi Juli–Desember 2025 (duplikat *Sitat Gurindam Dua Belas* otomatis disatukan, dan folder *Buku Umum* yang berisi salinan buku Kelas X otomatis dicegah agar tidak tampil ganda).
  - **Kelas X (41 buku pelajaran)**: Kurikulum Merdeka SMA/SMK lengkap dengan deteksi otomatis **BS (Buku Siswa)** & **BG (Buku Guru)**.
  - **Kelas XI (33 buku pelajaran)**: Wajib, pilihan, bahasa asing (Korea, Mandarin), KKA, & kejuruan SMK.
  - **Kelas XII (56 buku pelajaran)**: Tingkat lanjut, sains, sosial, seni, vokasi, & Pendidikan Agama/Kepercayaan lengkap.

---

## Cara Menjalankan di Lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:5173` di browser HP atau desktop.
- **PIN Default Admin / Pustakawan**: `123456` (bisa diubah melalui variabel `VITE_ADMIN_PIN` di `.env`).

---

## Cara Menghubungkan ke Database Supabase (Opsional — Siap Pakai)

Aplikasi sudah berjalan penuh secara instan menggunakan seed data lokal, dan dapat disambungkan ke **Supabase Cloud** agar perubahan katalog dari Admin otomatis tersinkron ke seluruh perangkat siswa:

1. Buat proyek gratis di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, jalankan isi file `supabase/schema.sql`, lalu jalankan `supabase/seed.sql` (berisi 214 buku nyata lengkap dengan ukuran byte PDF).
3. Masukkan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` ke file `.env` **atau** tempel langsung melalui aplikasi di **Profil → Admin/Pustakawan → Buka Panel Admin → Tab Database**.

---

## Cara Deploy PWA & Membuat APK Android

### 1. Deploy Web / PWA (Gratis & Cepat)
- Upload repositori ke GitHub lalu hubungkan ke **Vercel**, **Netlify**, atau **Cloudflare Pages** (`Build command: npm run build`, `Output directory: dist`).
- Begitu online (HTTPS), siswa & guru cukup membuka link di Chrome Android / Safari iOS lalu mengetuk **Install Aplikasi / Tambahkan ke Layar Utama**.

### 2. Bungkus Menjadi File `.APK` Android
- **Cara Instan (Tanpa Android Studio)**: Buka [PWABuilder.com](https://www.pwabuilder.com), masukkan URL hasil deploy PWA Anda, lalu klik **Package for Stores → Android → Download APK**.
- **Cara Native (Capacitor — konfigurasi sudah tersedia di `capacitor.config.ts`)**:
  ```bash
  npm install @capacitor/core @capacitor/cli @capacitor/android
  npm run build
  npx cap add android
  npx cap sync android
  npx cap open android
  ```
  Di Android Studio pilih **Build → Build Bundle(s) / APK(s) → Build APK(s)**.

---

## Cara Admin Menambah Buku Baru Tanpa Coding Ulang

1. **Lewat File CSV / Google Sheets**:
   - Tambahkan baris baru dengan format: `judul,kelas,mapel,drive_link,status`
   - Kolom `mapel` boleh dikosongkan (aplikasi otomatis mendeteksi mata pelajaran serta jenis `BS`/`BG` dari nama file PDF).
   - Buka aplikasi → **Tab Profil → Login Admin (PIN: `123456`) → Tab Import CSV** → pilih file `.csv` baru atau tarik dari link Publish CSV Google Sheets → klik **Validasi & Simpan ke Katalog**.
2. **Lewat Sync Folder Google Drive**:
   - Unggah PDF baru ke subfolder `Kelas X`, `Kelas XI`, atau `Kelas XII` di dalam folder Drive `1Du4ZdTS22RuSDdP8Zr9_YVVKZud0_dlI`.
   - Pasang Google Drive API Key atau deploy `scripts/google-apps-script-sync.gs` sebagai Web App, lalu tekan **Scan & Sync Folder Drive Sekarang** di Panel Admin.
