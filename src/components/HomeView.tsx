import React, { useMemo, useState } from 'react';
import {
  BookMarked,
  BookOpen,
  ChevronRight,
  Download,
  Flame,
  GraduationCap,
  Library,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { KelasKategori } from '../types/library';
import { BookCard } from './BookCard';

interface HomeViewProps {
  canInstallPwa: boolean;
  onInstallPwa: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ canInstallPwa, onInstallPwa }) => {
  const {
    activeBooks,
    visibleBooksForUser,
    user,
    history,
    navigateToKelasCatalog,
    openReader,
    setAdminOpen,
    setActiveTab,
  } = useLibrary();

  const [homeSearch, setHomeSearch] = useState('');

  // Statistik total buku aktif dan total per kelas
  const stats = useMemo(() => {
    const counts = { total: activeBooks.length, Umum: 0, X: 0, XI: 0, XII: 0 };
    for (const b of activeBooks) {
      counts[b.kelas] = (counts[b.kelas] || 0) + 1;
    }
    return counts;
  }, [activeBooks]);

  // Buku terakhir dibaca untuk fitur lanjutkan cepat
  const lastReadEntry = useMemo(() => {
    const entries = Object.values(history).sort(
      (a, b) => new Date(b.last_read_at).getTime() - new Date(a.last_read_at).getTime()
    );
    if (entries.length === 0) return null;
    const book = activeBooks.find((b) => b.id === entries[0].bacaan_id);
    if (!book) return null;
    return { book, progress: entries[0] };
  }, [history, activeBooks]);

  // Buku Pelajaran Terbaru (Kelas X, XI, XII)
  const latestTextbooks = useMemo(() => {
    return visibleBooksForUser
      .filter((b) => b.kelas !== 'Umum')
      .slice(0, 6);
  }, [visibleBooksForUser]);

  // Bacaan Literasi Populer (Pilihan unggulan dari CSV Umum)
  const popularLiteracy = useMemo(() => {
    const featuredNames = [
      'Adipati Blambangan',
      'Sengsara Membawa Nikmat',
      'Danau Laut Tador',
      'Mahapatih Gajah Mada',
      'Cut Nyak Meutia',
      'Majalah Liris',
      'Gadis Rempah',
      'Kesatria Bumantara',
    ];
    const umumBooks = visibleBooksForUser.filter((b) => b.kelas === 'Umum');
    const picked = umumBooks.filter((b) =>
      featuredNames.some((fn) => b.judul.toLowerCase().includes(fn.toLowerCase()))
    );
    return (picked.length >= 6 ? picked : umumBooks).slice(0, 6);
  }, [visibleBooksForUser]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateToKelasCatalog('Semua', homeSearch);
  };

  const kategoriCards: {
    kelas: KelasKategori;
    label: string;
    sub: string;
    count: number;
    badgeColor: string;
  }[] = [
    {
      kelas: 'Umum',
      label: 'Bacaan Umum',
      sub: 'Cerita rakyat, sastra & majalah',
      count: stats.Umum,
      badgeColor: 'from-amber-500 to-orange-500',
    },
    {
      kelas: 'X',
      label: 'Kelas X',
      sub: 'Kurikulum Merdeka SMA/SMK',
      count: stats.X,
      badgeColor: 'from-[#0F294A] to-[#1E4976]',
    },
    {
      kelas: 'XI',
      label: 'Kelas XI',
      sub: 'Wajib, pilihan & kejuruan',
      count: stats.XI,
      badgeColor: 'from-sky-700 to-cyan-700',
    },
    {
      kelas: 'XII',
      label: 'Kelas XII',
      sub: 'Tingkat lanjut & vokasi',
      count: stats.XII,
      badgeColor: 'from-indigo-800 to-blue-800',
    },
  ];

  return (
    <div className="pb-24">
      {/* Header Biru Tua + Kolom Pencarian Besar */}
      <header className="bg-gradient-to-br from-[#0F294A] via-[#14355E] to-[#1B4478] text-white px-4 pt-5 pb-6 rounded-b-[28px] shadow-lg relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-amber-400/10 blur-xl pointer-events-none" />
        <div className="absolute -left-10 bottom-0 w-32 h-32 rounded-full bg-sky-400/10 blur-lg pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center shadow-inner">
              <Library className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-amber-300">
                Perpustakaan Digital
              </p>
              <h1 className="text-xl font-extrabold tracking-tight leading-tight">DaftarBuku</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canInstallPwa && (
              <button
                type="button"
                onClick={onInstallPwa}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-extrabold shadow-sm active:scale-95 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Install
              </button>
            )}
            {user.peran === 'admin' ? (
              <button
                type="button"
                onClick={() => setAdminOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-extrabold shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('profil')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/12 border border-white/20 text-xs font-bold text-white backdrop-blur-xs"
              >
                <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                {user.peran === 'guru' ? 'Mode Guru' : `Siswa • ${user.kelas}`}
              </button>
            )}
          </div>
        </div>

        {/* Kolom Pencarian Besar */}
        <form onSubmit={handleSearchSubmit} className="relative z-10 mt-4">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
            <input
              type="search"
              value={homeSearch}
              onChange={(e) => setHomeSearch(e.target.value)}
              placeholder="Cari judul buku, mata pelajaran, cerita rakyat..."
              className="w-full pl-12 pr-24 py-3.5 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 text-sm font-medium shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              type="submit"
              className="absolute right-2 px-3.5 py-2 rounded-xl bg-[#F59E0B] hover:bg-amber-500 text-slate-950 font-extrabold text-xs transition active:scale-95"
            >
              Cari
            </button>
          </div>
        </form>

        {/* Statistik Ringkas Katalog */}
        <div className="relative z-10 mt-4 grid grid-cols-5 gap-1.5 bg-white/10 border border-white/15 rounded-2xl p-2.5 backdrop-blur-xs text-center">
          <button
            type="button"
            onClick={() => navigateToKelasCatalog('Semua')}
            className="p-1 rounded-xl hover:bg-white/10 transition"
          >
            <div className="text-base font-extrabold text-amber-300">{stats.total}</div>
            <div className="text-[10px] font-semibold text-slate-200">Total Buku</div>
          </button>
          <button
            type="button"
            onClick={() => navigateToKelasCatalog('Umum')}
            className="p-1 rounded-xl hover:bg-white/10 transition border-l border-white/10"
          >
            <div className="text-base font-extrabold text-white">{stats.Umum}</div>
            <div className="text-[10px] font-semibold text-slate-200">Umum</div>
          </button>
          <button
            type="button"
            onClick={() => navigateToKelasCatalog('X')}
            className="p-1 rounded-xl hover:bg-white/10 transition border-l border-white/10"
          >
            <div className="text-base font-extrabold text-white">{stats.X}</div>
            <div className="text-[10px] font-semibold text-slate-200">Kelas X</div>
          </button>
          <button
            type="button"
            onClick={() => navigateToKelasCatalog('XI')}
            className="p-1 rounded-xl hover:bg-white/10 transition border-l border-white/10"
          >
            <div className="text-base font-extrabold text-white">{stats.XI}</div>
            <div className="text-[10px] font-semibold text-slate-200">Kelas XI</div>
          </button>
          <button
            type="button"
            onClick={() => navigateToKelasCatalog('XII')}
            className="p-1 rounded-xl hover:bg-white/10 transition border-l border-white/10"
          >
            <div className="text-base font-extrabold text-white">{stats.XII}</div>
            <div className="text-[10px] font-semibold text-slate-200">Kelas XII</div>
          </button>
        </div>
      </header>

      <div className="px-4 mt-5 space-y-6">
        {/* Banner Lanjutkan Membaca (Bookmark Otomatis) */}
        {lastReadEntry && (
          <section className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl p-3.5 shadow-xs flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-amber-800">
                <BookMarked className="w-3.5 h-3.5 text-amber-600" />
                Lanjutkan Membaca • Hal. {lastReadEntry.progress.halaman_terakhir}
              </span>
              <h2 className="font-bold text-slate-900 text-sm truncate mt-0.5">
                {lastReadEntry.book.judul}
              </h2>
              <p className="text-xs text-slate-600 truncate">{lastReadEntry.book.mapel}</p>
            </div>
            <button
              type="button"
              onClick={() => openReader(lastReadEntry.book)}
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#0F294A] text-white text-xs font-bold shadow-sm active:scale-95 transition"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              Buka
            </button>
          </section>
        )}

        {/* Menu Kategori Utama (Umum, Kelas X, Kelas XI, Kelas XII) */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-slate-900">Kategori Koleksi</h2>
            <button
              type="button"
              onClick={() => navigateToKelasCatalog('Semua')}
              className="text-xs font-bold text-[#0F294A] inline-flex items-center gap-0.5 hover:text-amber-600"
            >
              Semua Katalog <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {kategoriCards.map((kat) => (
              <button
                key={kat.kelas}
                type="button"
                onClick={() => navigateToKelasCatalog(kat.kelas)}
                className="text-left bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs hover:shadow-md active:scale-[0.98] transition flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-xl bg-gradient-to-r ${kat.badgeColor} text-white text-xs font-extrabold`}
                  >
                    {kat.label}
                  </span>
                  <span className="text-xs font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                    {kat.count} buku
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2.5 line-clamp-1 font-medium">{kat.sub}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Section Bacaan Literasi Populer */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                  Bacaan Literasi Populer
                </h2>
                <p className="text-[11px] text-slate-500">
                  Cerita rakyat, sastra klasik & Majalah Liris
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigateToKelasCatalog('Umum')}
              className="text-xs font-bold text-[#0F294A] inline-flex items-center gap-0.5"
            >
              Lihat {stats.Umum} <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {popularLiteracy.map((book) => (
              <BookCard key={book.id} book={book} layout="grid" />
            ))}
          </div>
        </section>

        {/* Section Buku Pelajaran Terbaru */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0F294A]/10 text-[#0F294A] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                  Buku Pelajaran Terbaru
                </h2>
                <p className="text-[11px] text-slate-500">
                  Kurikulum Merdeka Kelas X, XI & XII
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigateToKelasCatalog('X')}
              className="text-xs font-bold text-[#0F294A] inline-flex items-center gap-0.5"
            >
              Semua <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {latestTextbooks.map((book) => (
              <BookCard key={book.id} book={book} layout="grid" />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
