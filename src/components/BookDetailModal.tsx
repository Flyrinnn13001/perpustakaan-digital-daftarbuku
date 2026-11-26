import React, { useState } from 'react';
import {
  AlertTriangle,
  Bookmark,
  BookOpen,
  CheckCircle2,
  Download,
  HardDrive,
  Heart,
  Share2,
  X,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { formatUkuranFile, getLevelUkuranFile } from '../utils/catalogNormalizer';
import { BookCover } from './BookCover';

export const BookDetailModal: React.FC = () => {
  const {
    selectedBook,
    closeBookDetail,
    openReader,
    toggleFavorite,
    isFavorite,
    recordOfflineDownload,
    history,
    showToast,
  } = useLibrary();

  const [confirmLargeDownload, setConfirmLargeDownload] = useState(false);

  if (!selectedBook) return null;

  const fav = isFavorite(selectedBook.id);
  const progress = history[selectedBook.id];
  const sizeLevel = getLevelUkuranFile(selectedBook.ukuran_file);
  const formattedSize = formatUkuranFile(selectedBook.ukuran_file);

  const jenisFullLabel =
    selectedBook.jenis === 'BG'
      ? 'Buku Guru (BG)'
      : selectedBook.jenis === 'BS'
      ? 'Buku Siswa (BS)'
      : 'Bacaan Literasi Umum';

  const handleDownloadClick = () => {
    // Tampilkan konfirmasi peringatan kuota jika ukuran >= 25 MB
    if (selectedBook.ukuran_file && selectedBook.ukuran_file >= 25 * 1024 * 1024) {
      setConfirmLargeDownload(true);
      return;
    }
    recordOfflineDownload(selectedBook);
  };

  const handleShare = async () => {
    const shareText = `${selectedBook.judul} (${
      selectedBook.kelas === 'Umum' ? 'Bacaan Umum' : `Kelas ${selectedBook.kelas}`
    } - ${selectedBook.mapel}) di Perpustakaan Digital DaftarBuku`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: selectedBook.judul,
          text: shareText,
          url: selectedBook.drive_link,
        });
        return;
      } catch {
        // user membatalkan share sheet
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareText}\n${selectedBook.drive_link}`);
      showToast('Tautan buku disalin ke papan klip!');
    } catch {
      showToast('Gagal menyalin tautan');
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-lg bg-white rounded-t-[28px] sm:rounded-[28px] max-h-[92dvh] overflow-y-auto shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Detail Koleksi Buku
          </span>
          <button
            type="button"
            onClick={() => {
              setConfirmLargeDownload(false);
              closeBookDetail();
            }}
            aria-label="Tutup detail"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Cover + Metadata Utama */}
          <div className="flex gap-4 items-start">
            <div className="w-28 shrink-0">
              <BookCover book={selectedBook} size="md" />
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-[#0F294A] text-white">
                  {selectedBook.kelas === 'Umum' ? 'Kategori Umum' : `Kelas ${selectedBook.kelas}`}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {selectedBook.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>

              <h2 className="text-lg font-extrabold text-slate-900 leading-snug">
                {selectedBook.judul}
              </h2>

              <p className="text-xs font-semibold text-amber-700 bg-amber-50 inline-block px-2.5 py-1 rounded-lg border border-amber-200/70">
                {selectedBook.mapel}
              </p>
            </div>
          </div>

          {/* Tabel Info Ringkas */}
          <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-500 block">Jenis Buku</span>
              <span className="font-extrabold text-slate-900 mt-0.5 block">{jenisFullLabel}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Ukuran File PDF</span>
              <span className="font-extrabold text-slate-900 mt-0.5 inline-flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                {selectedBook.ukuran_file ? formattedSize : 'Tersedia di Google Drive'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Kelas / Kategori</span>
              <span className="font-extrabold text-slate-900 mt-0.5 block">
                {selectedBook.kelas === 'Umum' ? 'Umum (Literasi)' : `SMA/SMK Kelas ${selectedBook.kelas}`}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Riwayat Halaman</span>
              <span className="font-extrabold text-emerald-700 mt-0.5 inline-flex items-center gap-1">
                <Bookmark className="w-3.5 h-3.5" />
                {progress ? `Terakhir Hal. ${progress.halaman_terakhir}` : 'Belum dibaca'}
              </span>
            </div>
          </div>

          {/* Peringatan Ukuran File Besar (contoh: Biologi XII 118 MB, Mtk Lanjut XII 102 MB, Informatika XII 93 MB) */}
          {sizeLevel !== 'normal' && (
            <div
              className={`rounded-2xl p-3.5 border flex items-start gap-3 ${
                sizeLevel === 'besar'
                  ? 'bg-orange-50 border-orange-300 text-orange-950'
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}
            >
              <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-extrabold">
                  Perhatian Ukuran File {sizeLevel === 'besar' ? 'Besar' : 'Menengah'} ({formattedSize})
                </p>
                <p className="mt-0.5 text-orange-900/90">
                  Gunakan <strong>Baca Sekarang</strong> untuk membaca langsung secara streaming hemat kuota, atau gunakan koneksi Wi-Fi sebelum menekan tombol Download.
                </p>
              </div>
            </div>
          )}

          {/* Konfirmasi Ekstra Sebelum Download File Besar */}
          {confirmLargeDownload && (
            <div className="rounded-2xl p-4 bg-slate-900 text-white space-y-3 shadow-lg">
              <p className="text-sm font-extrabold text-amber-300">
                Konfirmasi Unduh File PDF ({formattedSize})
              </p>
              <p className="text-xs text-slate-200 leading-relaxed">
                File <strong>{selectedBook.judul}</strong> berukuran <strong>{formattedSize}</strong>. Pastikan kuota data mencukupi atau terhubung ke Wi-Fi.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmLargeDownload(false);
                    recordOfflineDownload(selectedBook);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-extrabold"
                >
                  Ya, Tetap Download
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmLargeDownload(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/15 text-white text-xs font-bold"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          {/* Tombol Utama: Baca Sekarang (In-App PDF Viewer) & Download */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                setConfirmLargeDownload(false);
                closeBookDetail();
                openReader(selectedBook);
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#0F294A] hover:bg-[#173B6B] text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 active:scale-[0.99] transition"
            >
              <BookOpen className="w-5 h-5 text-amber-400" />
              {progress
                ? `Baca Sekarang (Lanjut Hal. ${progress.halaman_terakhir})`
                : 'Baca Sekarang di Aplikasi'}
            </button>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={handleDownloadClick}
                className="py-3 px-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition"
              >
                <Download className="w-4 h-4" />
                Download
              </button>

              <button
                type="button"
                onClick={() => toggleFavorite(selectedBook.id)}
                className={`py-3 px-3 rounded-2xl border font-extrabold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition ${
                  fav
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${fav ? 'fill-rose-500' : ''}`} />
                {fav ? 'Tersimpan' : 'Favorit'}
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="py-3 px-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
              >
                <Share2 className="w-4 h-4" />
                Bagikan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
