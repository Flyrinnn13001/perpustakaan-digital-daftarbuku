import React from 'react';
import { Buku } from '../types/library';
import { getBookCoverPalette } from '../utils/coverStyle';

interface BookCoverProps {
  book: Buku;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BookCover: React.FC<BookCoverProps> = React.memo(({ book, size = 'md', className = '' }) => {
  const palette = getBookCoverPalette(book.mapel, book.judul);

  const jenisBadge =
    book.jenis === 'BG'
      ? { text: 'BG • Guru', bg: 'bg-amber-400 text-slate-950' }
      : book.jenis === 'BS'
      ? { text: 'BS • Siswa', bg: 'bg-white/90 text-slate-900' }
      : { text: 'Literasi', bg: 'bg-amber-300/95 text-slate-950' };

  const kelasText = book.kelas === 'Umum' ? 'UMUM' : `KLS ${book.kelas}`;

  if (size === 'sm') {
    return (
      <div
        className={`relative overflow-hidden rounded-xl select-none shrink-0 shadow-sm ${className}`}
        style={{
          background: `linear-gradient(145deg, ${palette.bgFrom} 0%, ${palette.bgTo} 100%)`,
        }}
      >
        <div className="absolute inset-y-0 left-0 w-2 bg-black/25 border-r border-white/15" />
        <div
          className="absolute -right-4 -top-4 w-14 h-14 rounded-full opacity-20"
          style={{ backgroundColor: palette.accent }}
        />
        <div className="relative h-full w-full flex flex-col items-center justify-center p-2 text-center">
          <span
            className="font-extrabold tracking-tight text-white text-base leading-none"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.35)' }}
          >
            {palette.initials}
          </span>
          <span className="mt-1 text-[9px] font-bold uppercase tracking-wider text-amber-200/95">
            {kelasText}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative aspect-[3/4] w-full overflow-hidden rounded-2xl select-none shadow-md ${className}`}
      style={{
        background: `linear-gradient(150deg, ${palette.bgFrom} 0%, ${palette.bgTo} 100%)`,
      }}
    >
      {/* Efek Jilid Buku di Sisi Kiri */}
      <div className="absolute inset-y-0 left-0 w-3.5 bg-gradient-to-r from-black/35 via-black/15 to-transparent border-r border-white/15 z-10" />

      {/* Ornamen Geometris Halus Hemat Kuota */}
      {palette.patternType === 'circles' && (
        <>
          <div
            className="absolute -right-8 -top-8 w-28 h-28 rounded-full opacity-20"
            style={{ backgroundColor: palette.accent }}
          />
          <div className="absolute right-4 bottom-10 w-16 h-16 rounded-full border-2 border-white/10" />
        </>
      )}
      {palette.patternType === 'waves' && (
        <div
          className="absolute -left-6 -bottom-10 w-44 h-28 rounded-[100%] opacity-20 rotate-12"
          style={{ backgroundColor: palette.accent }}
        />
      )}
      {palette.patternType === 'grid' && (
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(#ffffff 1.2px, transparent 1.2px)',
            backgroundSize: '14px 14px',
          }}
        />
      )}
      {palette.patternType === 'diagonal' && (
        <div
          className="absolute -right-10 bottom-6 w-40 h-10 -rotate-45 opacity-25"
          style={{ backgroundColor: palette.accent }}
        />
      )}

      {/* Pita Aksen Atas */}
      <div
        className="absolute top-0 right-3 w-3.5 h-8 rounded-b-sm shadow-sm"
        style={{ backgroundColor: palette.accent }}
      />

      <div className="relative z-10 h-full flex flex-col justify-between p-3.5 pl-5">
        {/* Baris Badge Kelas & Jenis */}
        <div className="flex items-center justify-between gap-1 pr-3">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider bg-black/30 text-white backdrop-blur-xs">
            {kelasText}
          </span>
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${jenisBadge.bg}`}>
            {jenisBadge.text}
          </span>
        </div>

        {/* Inisial Mapel Besar di Tengah */}
        <div className="my-auto py-1">
          <div
            className={`inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xs shadow-inner ${
              size === 'lg' ? 'w-20 h-20 text-3xl' : 'w-14 h-14 text-xl'
            } font-extrabold text-white tracking-tight`}
          >
            {palette.initials}
          </div>
          <p
            className={`mt-2.5 font-bold text-white leading-snug line-clamp-3 ${
              size === 'lg' ? 'text-base' : 'text-xs'
            }`}
          >
            {book.judul.split('—')[0].trim()}
          </p>
        </div>

        {/* Footer Mapel */}
        <div className="pt-2 border-t border-white/15">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-200 truncate">
            {book.mapel}
          </p>
        </div>
      </div>
    </div>
  );
});
