import React, { useMemo, useState } from 'react';
import { BookOpen, Download, HardDrive, Heart, Trash2 } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { formatUkuranFile } from '../utils/catalogNormalizer';
import { BookCard } from './BookCard';

export const FavoritesView: React.FC = () => {
  const {
    visibleBooksForUser,
    activeBooks,
    favorites,
    offlineList,
    removeOfflineRecord,
    openReader,
    setActiveTab,
  } = useLibrary();

  const [subTab, setSubTab] = useState<'favorit' | 'offline'>('favorit');

  const favoriteBooks = useMemo(() => {
    const map = new Map(visibleBooksForUser.map((b) => [b.id, b]));
    return favorites.map((id) => map.get(id)).filter((b): b is NonNullable<typeof b> => Boolean(b));
  }, [visibleBooksForUser, favorites]);

  return (
    <div className="pb-24">
      <header className="bg-[#0F294A] text-white px-4 pt-5 pb-4 shadow-md">
        <h1 className="text-lg font-extrabold tracking-tight">Favorit & Koleksi Saya</h1>
        <p className="text-xs text-slate-300 mt-0.5">
          Simpan bacaan pilihan dan kelola daftar buku yang telah diunduh offline
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2 bg-white/10 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setSubTab('favorit')}
            className={`py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
              subTab === 'favorit'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-200 hover:bg-white/10'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            Favorit ({favoriteBooks.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('offline')}
            className={`py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
              subTab === 'offline'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-slate-200 hover:bg-white/10'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Unduhan Offline ({offlineList.length})
          </button>
        </div>
      </header>

      <div className="px-4 mt-4">
        {subTab === 'favorit' ? (
          favoriteBooks.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 mt-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
                <Heart className="w-6 h-6" />
              </div>
              <h2 className="text-base font-extrabold text-slate-800">Belum ada buku favorit</h2>
              <p className="text-xs text-slate-500 mt-1">
                Ketuk ikon hati pada sampul buku untuk menyimpannya ke koleksi pribadi Anda.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('katalog')}
                className="mt-4 px-4 py-2.5 rounded-xl bg-[#0F294A] text-white text-xs font-extrabold"
              >
                Jelajahi Katalog
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {favoriteBooks.map((book) => (
                <BookCard key={book.id} book={book} layout="grid" />
              ))}
            </div>
          )
        ) : offlineList.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 mt-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <Download className="w-6 h-6" />
            </div>
            <h2 className="text-base font-extrabold text-slate-800">Belum ada unduhan offline</h2>
            <p className="text-xs text-slate-500 mt-1">
              Unduh PDF buku pelajaran melalui halaman Detail Buku agar tetap bisa dibuka di perangkat tanpa kuota internet.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {offlineList.map((item) => {
              const matchedBook = activeBooks.find((b) => b.id === item.bacaan_id);
              return (
                <div
                  key={item.bacaan_id}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0F294A]/10 text-[#0F294A]">
                      {item.kelas === 'Umum' ? 'Umum' : `Kelas ${item.kelas}`} • {item.mapel}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 mt-1 truncate">{item.judul}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 inline-flex items-center gap-1.5">
                      <HardDrive className="w-3 h-3" />
                      {formatUkuranFile(item.ukuran_file)} • Diunduh{' '}
                      {new Date(item.downloaded_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {matchedBook && (
                      <button
                        type="button"
                        onClick={() => openReader(matchedBook)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#0F294A] text-white text-xs font-bold"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                        Baca
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeOfflineRecord(item.bacaan_id)}
                      aria-label="Hapus catatan unduhan"
                      className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
