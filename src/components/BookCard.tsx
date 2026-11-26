import React from 'react';
import { Bookmark, BookOpen, Heart, HardDrive } from 'lucide-react';
import { Buku } from '../types/library';
import { formatUkuranFile, getLevelUkuranFile } from '../utils/catalogNormalizer';
import { useLibrary } from '../context/LibraryContext';
import { BookCover } from './BookCover';

interface BookCardProps {
  book: Buku;
  layout?: 'grid' | 'list';
}

export const BookCard: React.FC<BookCardProps> = ({ book, layout = 'grid' }) => {
  const { openBookDetail, openReader, toggleFavorite, isFavorite, history } = useLibrary();
  const fav = isFavorite(book.id);
  const progress = history[book.id];
  const sizeLevel = getLevelUkuranFile(book.ukuran_file);

  if (layout === 'list') {
    return (
      <div
        onClick={() => openBookDetail(book)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && openBookDetail(book)}
        className="group bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs hover:shadow-md active:scale-[0.99] transition-all flex items-center gap-3.5 cursor-pointer"
      >
        <BookCover book={book} size="sm" className="w-16 h-22" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#0F294A]/10 text-[#0F294A]">
              {book.kelas === 'Umum' ? 'Umum' : `Kelas ${book.kelas}`}
            </span>
            {book.jenis !== 'Umum' && (
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                  book.jenis === 'BG'
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-sky-100 text-sky-900'
                }`}
              >
                {book.jenis === 'BG' ? 'Buku Guru' : 'Buku Siswa'}
              </span>
            )}
            {progress && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                <Bookmark className="w-2.5 h-2.5" /> Hal. {progress.halaman_terakhir}
              </span>
            )}
          </div>

          <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
            {book.judul}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{book.mapel}</p>

          <div className="mt-2 flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                sizeLevel === 'besar'
                  ? 'text-orange-700'
                  : 'text-slate-500'
              }`}
            >
              <HardDrive className="w-3 h-3" />
              {formatUkuranFile(book.ukuran_file)}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(book.id);
                }}
                aria-label="Simpan ke Favorit"
                className={`p-2 rounded-xl border transition-colors ${
                  fav
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-rose-500'
                }`}
              >
                <Heart className={`w-4 h-4 ${fav ? 'fill-rose-500' : ''}`} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openReader(book);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0F294A] text-white text-xs font-bold hover:bg-[#173B6B] active:scale-95 transition"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                Baca
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => openBookDetail(book)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && openBookDetail(book)}
      className="group bg-white rounded-2xl p-2.5 border border-slate-200/80 shadow-xs hover:shadow-md active:scale-[0.98] transition-all flex flex-col cursor-pointer"
    >
      <div className="relative">
        <BookCover book={book} size="md" />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(book.id);
          }}
          aria-label="Favorit"
          className={`absolute bottom-2.5 right-2.5 z-20 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition ${
            fav
              ? 'bg-rose-500 text-white'
              : 'bg-white/90 text-slate-600 hover:text-rose-500 backdrop-blur-xs'
          }`}
        >
          <Heart className={`w-4 h-4 ${fav ? 'fill-white' : ''}`} />
        </button>

        {progress && (
          <span className="absolute top-2.5 left-4 z-20 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600/95 text-white text-[10px] font-bold shadow-xs">
            <Bookmark className="w-2.5 h-2.5 fill-white" />
            Hal. {progress.halaman_terakhir}
          </span>
        )}
      </div>

      <div className="pt-2.5 px-0.5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-[13px] leading-snug line-clamp-2">
            {book.judul}
          </h3>
          <p className="text-[11px] font-medium text-slate-500 mt-1 truncate">{book.mapel}</p>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span
            className={`font-semibold truncate ${
              sizeLevel === 'besar' ? 'text-orange-600' : 'text-slate-500'
            }`}
          >
            {book.ukuran_file ? formatUkuranFile(book.ukuran_file) : 'PDF Drive'}
          </span>
          <span className="font-bold text-[#0F294A] group-hover:text-amber-600 transition-colors">
            Detail →
          </span>
        </div>
      </div>
    </div>
  );
};
