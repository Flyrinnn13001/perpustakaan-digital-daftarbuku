import React, { useMemo } from 'react';
import { Bookmark, BookOpen, Clock, MessageSquareQuote } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { BookCover } from './BookCover';

export const HistoryView: React.FC = () => {
  const { activeBooks, history, user, openReader, openBookDetail, setActiveTab } = useLibrary();

  const sortedHistory = useMemo(() => {
    const bookMap = new Map(activeBooks.map((b) => [b.id, b]));
    return Object.values(history)
      .sort((a, b) => new Date(b.last_read_at).getTime() - new Date(a.last_read_at).getTime())
      .map((entry) => ({
        entry,
        book: bookMap.get(entry.bacaan_id),
      }))
      .filter((x): x is { entry: typeof x.entry; book: NonNullable<typeof x.book> } =>
        Boolean(x.book)
      );
  }, [activeBooks, history]);

  return (
    <div className="pb-24">
      <header className="bg-[#0F294A] text-white px-4 pt-5 pb-4 shadow-md">
        <h1 className="text-lg font-extrabold tracking-tight">Riwayat Bacaan</h1>
        <p className="text-xs text-slate-300 mt-0.5">
          Tersimpan otomatis untuk profil <strong className="text-amber-300">{user.nama}</strong>
        </p>
      </header>

      <div className="px-4 mt-4">
        {sortedHistory.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 mt-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0F294A] flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h2 className="text-base font-extrabold text-slate-800">Belum ada riwayat bacaan</h2>
            <p className="text-xs text-slate-500 mt-1">
              Setiap buku yang Anda baca akan otomatis menyimpan halaman terakhir di sini.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('beranda')}
              className="mt-4 px-4 py-2.5 rounded-xl bg-[#0F294A] text-white text-xs font-extrabold"
            >
              Mulai Membaca
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedHistory.map(({ book, entry }) => (
              <div
                key={book.id}
                onClick={() => openBookDetail(book)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && openBookDetail(book)}
                className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs flex items-start gap-3.5 cursor-pointer hover:shadow-md transition"
              >
                <BookCover book={book} size="sm" className="w-16 h-22" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-emerald-100 text-emerald-800">
                      <Bookmark className="w-3 h-3" />
                      Halaman {entry.halaman_terakhir}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {new Date(entry.last_read_at).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 mt-1 line-clamp-2">
                    {book.judul}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{book.mapel}</p>

                  {entry.catatan && (
                    <p className="mt-1.5 text-[11px] bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200/70 inline-flex items-center gap-1 max-w-full truncate">
                      <MessageSquareQuote className="w-3 h-3 shrink-0 text-amber-600" />
                      <span className="truncate">{entry.catatan}</span>
                    </p>
                  )}

                  <div className="mt-2.5 flex justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openReader(book);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0F294A] text-white text-xs font-extrabold active:scale-95 transition"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                      Lanjut Hal. {entry.halaman_terakhir}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
