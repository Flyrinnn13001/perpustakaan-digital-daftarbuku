import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  Heart,
  Loader2,
  Moon,
  RotateCcw,
  Sun,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { getDrivePreviewUrl } from '../utils/catalogNormalizer';

export const PdfReaderModal: React.FC = () => {
  const {
    readingBook,
    closeReader,
    history,
    updateReadingProgress,
    toggleFavorite,
    isFavorite,
    recordOfflineDownload,
    showToast,
  } = useLibrary();

  const savedProgress = readingBook ? history[readingBook.id] : undefined;

  const [currentPage, setCurrentPage] = useState<number>(savedProgress?.halaman_terakhir || 1);
  const [pageInput, setPageInput] = useState<string>(String(savedProgress?.halaman_terakhir || 1));
  const [zoom, setZoom] = useState<number>(savedProgress?.zoom_terakhir || 100);
  const [nightMode, setNightMode] = useState<boolean>(savedProgress?.mode_malam || false);
  const [noteText, setNoteText] = useState<string>(savedProgress?.catatan || '');
  const [showNoteBar, setShowNoteBar] = useState<boolean>(false);
  const [iframeLoading, setIframeLoading] = useState<boolean>(true);
  const [viewerPageAnchor, setViewerPageAnchor] = useState<number>(
    savedProgress?.halaman_terakhir || 1
  );

  useEffect(() => {
    if (!readingBook) return;
    const prog = history[readingBook.id];
    const startPage = prog?.halaman_terakhir || 1;
    setCurrentPage(startPage);
    setPageInput(String(startPage));
    setViewerPageAnchor(startPage);
    setZoom(prog?.zoom_terakhir || 100);
    setNightMode(prog?.mode_malam || false);
    setNoteText(prog?.catatan || '');
    setIframeLoading(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readingBook?.id]);

  if (!readingBook) return null;

  const fav = isFavorite(readingBook.id);
  const previewSrc = getDrivePreviewUrl(readingBook.drive_link, viewerPageAnchor);

  const applyPageChange = (nextPage: number, reloadAnchor = false) => {
    const safePage = Math.max(1, Math.min(999, nextPage));
    setCurrentPage(safePage);
    setPageInput(String(safePage));
    updateReadingProgress(readingBook.id, { halaman_terakhir: safePage });
    if (reloadAnchor) {
      setIframeLoading(true);
      setViewerPageAnchor(safePage);
    }
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(pageInput, 10);
    if (!Number.isNaN(parsed) && parsed >= 1) {
      applyPageChange(parsed, true);
      showToast(`Lompat & simpan bookmark ke Halaman ${parsed}`);
    }
  };

  const handleZoomChange = (delta: number) => {
    const nextZoom = Math.max(85, Math.min(200, zoom + delta));
    setZoom(nextZoom);
    updateReadingProgress(readingBook.id, { zoom_terakhir: nextZoom });
  };

  const handleToggleNightMode = () => {
    const nextNight = !nightMode;
    setNightMode(nextNight);
    updateReadingProgress(readingBook.id, { mode_malam: nextNight });
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    updateReadingProgress(readingBook.id, { catatan: noteText.trim() });
    setShowNoteBar(false);
    showToast('Catatan & bookmark halaman tersimpan!');
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col ${
        nightMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-900 text-white'
      }`}
    >
      {/* Top Reader App Bar */}
      <header
        className={`px-3 py-2.5 flex items-center justify-between gap-2 border-b ${
          nightMode ? 'bg-slate-950 border-slate-800' : 'bg-[#0F294A] border-white/10'
        }`}
      >
        <button
          type="button"
          onClick={closeReader}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Tutup
        </button>

        <div className="min-w-0 flex-1 text-center px-1">
          <h2 className="text-xs font-extrabold truncate">{readingBook.judul}</h2>
          <p className="text-[10px] text-amber-300 font-semibold truncate">
            Bookmark Otomatis: Hal. {currentPage} • Zoom {zoom}%
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleToggleNightMode}
            aria-label="Mode Malam"
            className={`p-2 rounded-xl transition ${
              nightMode
                ? 'bg-amber-400 text-slate-950'
                : 'bg-white/10 text-amber-300 hover:bg-white/15'
            }`}
            title="Mode Malam"
          >
            {nightMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => toggleFavorite(readingBook.id)}
            aria-label="Favorit"
            className={`p-2 rounded-xl transition ${
              fav ? 'bg-rose-500 text-white' : 'bg-white/10 text-white hover:bg-white/15'
            }`}
          >
            <Heart className={`w-4 h-4 ${fav ? 'fill-white' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => recordOfflineDownload(readingBook)}
            aria-label="Download PDF"
            className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/15"
            title="Unduh Offline"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Bar Catatan Bookmark Opsional */}
      {showNoteBar && (
        <form
          onSubmit={handleSaveNote}
          className="bg-slate-800 px-3 py-2.5 border-b border-slate-700 flex items-center gap-2"
        >
          <input
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder={`Tulis catatan singkat di halaman ${currentPage}...`}
            className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-extrabold"
          >
            Simpan
          </button>
        </form>
      )}

      {/* Area PDF Viewer In-App dengan Dukungan Zoom & Filter Mode Malam */}
      <div className="relative flex-1 overflow-auto bg-slate-900">
        {iframeLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/90 text-center p-6">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-3" />
            <p className="text-sm font-bold text-white">Memuat PDF dari Google Drive...</p>
            <p className="text-xs text-slate-400 mt-1">
              Membuka {readingBook.judul} langsung di dalam aplikasi (Halaman {currentPage})
            </p>
          </div>
        )}

        <div
          className="w-full h-full origin-top-left transition-transform duration-150"
          style={{
            width: zoom > 100 ? `${zoom}%` : '100%',
            height: zoom > 100 ? `${zoom}%` : '100%',
            filter: nightMode ? 'invert(0.9) hue-rotate(180deg) contrast(0.92)' : 'none',
          }}
        >
          <iframe
            key={`${readingBook.id}-${viewerPageAnchor}`}
            src={previewSrc}
            title={readingBook.judul}
            onLoad={() => setIframeLoading(false)}
            allow="autoplay"
            className="w-full h-full border-0 bg-white"
          />
        </div>
      </div>

      {/* Bottom Reader Toolbar: Lompat Halaman, Bookmark Otomatis & Zoom */}
      <footer
        className={`px-3 py-2.5 border-t flex flex-wrap items-center justify-between gap-2 ${
          nightMode ? 'bg-slate-950 border-slate-800' : 'bg-[#0F294A] border-white/10'
        }`}
      >
        {/* Kontrol Halaman & Lompat Halaman */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => applyPageChange(currentPage - 1, false)}
            disabled={currentPage <= 1}
            aria-label="Halaman sebelumnya"
            className="p-2 rounded-xl bg-white/10 disabled:opacity-40 hover:bg-white/15"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <form onSubmit={handleJumpSubmit} className="flex items-center gap-1">
            <span className="text-[11px] font-semibold text-slate-300">Hal.</span>
            <input
              type="number"
              min={1}
              max={999}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={() => {
                const parsed = parseInt(pageInput, 10);
                if (!Number.isNaN(parsed) && parsed >= 1 && parsed !== currentPage) {
                  applyPageChange(parsed, false);
                }
              }}
              className="w-14 px-2 py-1 rounded-lg bg-white/15 text-center text-xs font-extrabold text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
            <button
              type="submit"
              className="px-2 py-1 rounded-lg bg-amber-400 text-slate-950 text-[11px] font-extrabold"
            >
              Lompat
            </button>
          </form>

          <button
            type="button"
            onClick={() => applyPageChange(currentPage + 1, false)}
            aria-label="Halaman berikutnya"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/15"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Kontrol Zoom & Catatan Bookmark */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowNoteBar((s) => !s)}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold ${
              noteText ? 'bg-emerald-600 text-white' : 'bg-white/10 text-slate-200'
            }`}
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            Catatan
          </button>

          <button
            type="button"
            onClick={() => handleZoomChange(-25)}
            disabled={zoom <= 85}
            aria-label="Perkecil"
            className="p-1.5 rounded-xl bg-white/10 disabled:opacity-40"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setZoom(100);
              updateReadingProgress(readingBook.id, { zoom_terakhir: 100 });
            }}
            className="px-2 py-1 rounded-lg bg-white/10 text-[11px] font-bold"
            title="Reset Zoom 100%"
          >
            {zoom === 100 ? '100%' : <RotateCcw className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => handleZoomChange(25)}
            disabled={zoom >= 200}
            aria-label="Perbesar"
            className="p-1.5 rounded-xl bg-white/10 disabled:opacity-40"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
};
