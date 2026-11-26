import React, { useMemo, useState } from 'react';
import {
  ArrowDownAZ,
  ArrowUpZA,
  Clock,
  Filter,
  Grid2X2,
  List,
  Lock,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { KelasKategori } from '../types/library';
import { fuzzySearchBooks } from '../utils/catalogNormalizer';
import { BookCard } from './BookCard';

export const CatalogView: React.FC = () => {
  const { visibleBooksForUser, activeBooks, user, filter, updateFilter, switchRoleQuick } =
    useLibrary();
  const [showBgPrompt, setShowBgPrompt] = useState(false);

  const kelasTabs: { value: 'Semua' | KelasKategori; label: string }[] = [
    { value: 'Semua', label: 'Semua' },
    { value: 'Umum', label: 'Umum' },
    { value: 'X', label: 'Kelas X' },
    { value: 'XI', label: 'Kelas XI' },
    { value: 'XII', label: 'Kelas XII' },
  ];

  // Daftar mata pelajaran dinamis sesuai tab kelas yang dipilih
  const availableMapels = useMemo(() => {
    const base =
      filter.kelas === 'Semua'
        ? visibleBooksForUser
        : visibleBooksForUser.filter((b) => b.kelas === filter.kelas);

    const counts = new Map<string, number>();
    for (const b of base) {
      counts.set(b.mapel, (counts.get(b.mapel) || 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0], 'id'));
  }, [visibleBooksForUser, filter.kelas]);

  // Jumlah Buku Guru (BG) di katalog aktif (sebagai info untuk Mode Siswa)
  const hiddenBgCount = useMemo(
    () => activeBooks.filter((b) => b.jenis === 'BG').length,
    [activeBooks]
  );

  // Proses filter gabungan + pencarian toleran typo + sortir
  const filteredBooks = useMemo(() => {
    let list = visibleBooksForUser;

    if (filter.kelas !== 'Semua') {
      list = list.filter((b) => b.kelas === filter.kelas);
    }

    if (filter.jenis !== 'Semua') {
      list = list.filter((b) => b.jenis === filter.jenis);
    }

    if (filter.mapel !== 'Semua') {
      list = list.filter((b) => b.mapel === filter.mapel);
    }

    if (filter.query.trim()) {
      list = fuzzySearchBooks(list, filter.query);
    } else {
      list = [...list].sort((a, b) => {
        if (filter.sortir === 'az') return a.judul.localeCompare(b.judul, 'id');
        if (filter.sortir === 'za') return b.judul.localeCompare(a.judul, 'id');
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }

    // Jika sedang mencari DAN memilih sortir eksplisit Z-A atau Terbaru
    if (filter.query.trim() && filter.sortir !== 'az') {
      list = [...list].sort((a, b) => {
        if (filter.sortir === 'za') return b.judul.localeCompare(a.judul, 'id');
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }

    return list;
  }, [visibleBooksForUser, filter]);

  const hasActiveFilter =
    filter.query.trim() !== '' ||
    filter.kelas !== 'Semua' ||
    filter.mapel !== 'Semua' ||
    filter.jenis !== 'Semua';

  const handleSelectJenis = (jenis: 'Semua' | 'BS' | 'BG' | 'Umum') => {
    if (jenis === 'BG' && user.peran === 'siswa') {
      setShowBgPrompt(true);
      return;
    }
    setShowBgPrompt(false);
    updateFilter({ jenis });
  };

  return (
    <div className="pb-24">
      {/* Header Sticky Pencarian & Tab Kelas */}
      <div className="sticky top-0 z-30 bg-[#0F294A] text-white px-4 pt-4 pb-3 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-extrabold tracking-tight">Katalog & Pencarian</h1>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/12 text-amber-300">
            {filteredBooks.length} buku tampil
          </span>
        </div>

        {/* Kolom Cari Real-time Toleran Typo */}
        <div className="relative">
          <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={filter.query}
            onChange={(e) => updateFilter({ query: e.target.value })}
            placeholder="Ketik judul atau mapel (toleran salah ketik)..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          {filter.query && (
            <button
              type="button"
              onClick={() => updateFilter({ query: '' })}
              aria-label="Hapus pencarian"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tab Kategori Kelas */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {kelasTabs.map((tab) => {
            const active = filter.kelas === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => updateFilter({ kelas: tab.value })}
                className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition ${
                  active
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'bg-white/10 text-slate-200 hover:bg-white/15'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Baris Filter Gabungan: Jenis (BS/BG) + Mapel + Sortir + Grid/List */}
      <div className="px-4 pt-3 space-y-2.5">
        {/* Filter Jenis Buku (BS / BG / Umum) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-slate-500 shrink-0 mr-1 inline-flex items-center gap-1">
            <Filter className="w-3 h-3" /> Jenis:
          </span>
          {(
            [
              { id: 'Semua', label: 'Semua Jenis' },
              { id: 'BS', label: 'BS (Buku Siswa)' },
              { id: 'BG', label: 'BG (Buku Guru)' },
              { id: 'Umum', label: 'Literasi Umum' },
            ] as const
          ).map((j) => {
            const active = filter.jenis === j.id;
            const locked = j.id === 'BG' && user.peran === 'siswa';
            return (
              <button
                key={j.id}
                type="button"
                onClick={() => handleSelectJenis(j.id)}
                className={`shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                  active
                    ? 'bg-[#0F294A] text-white border-[#0F294A]'
                    : locked
                    ? 'bg-amber-50/80 text-amber-900 border-amber-200'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                {locked && <Lock className="w-3 h-3 text-amber-600" />}
                {j.label}
              </button>
            );
          })}
        </div>

        {/* Info Akses Buku Guru jika Siswa mengetuk BG */}
        {showBgPrompt && user.peran === 'siswa' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center justify-between gap-3">
            <div className="text-xs text-amber-950">
              <p className="font-extrabold">Filter Buku Guru ({hiddenBgCount} buku BG)</p>
              <p className="text-amber-800 mt-0.5">
                Khusus Mode Guru atau Pustakawan. Aktifkan Mode Guru untuk membuka seluruh Buku Guru.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                switchRoleQuick('guru');
                updateFilter({ jenis: 'BG' });
                setShowBgPrompt(false);
              }}
              className="shrink-0 px-3 py-2 rounded-xl bg-[#0F294A] text-white text-xs font-extrabold"
            >
              Mode Guru
            </button>
          </div>
        )}

        {/* Dropdown Mata Pelajaran + Sortir + Toggle Grid/List */}
        <div className="flex items-center gap-2">
          <select
            aria-label="Filter Mata Pelajaran"
            value={filter.mapel}
            onChange={(e) => updateFilter({ mapel: e.target.value })}
            className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F294A]"
          >
            <option value="Semua">Semua Mata Pelajaran ({availableMapels.length})</option>
            {availableMapels.map(([m, cnt]) => (
              <option key={m} value={m}>
                {m} ({cnt})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              const nextSort =
                filter.sortir === 'az' ? 'za' : filter.sortir === 'za' ? 'terbaru' : 'az';
              updateFilter({ sortir: nextSort });
            }}
            className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700"
            title="Urutkan"
          >
            {filter.sortir === 'az' && (
              <>
                <ArrowDownAZ className="w-3.5 h-3.5 text-[#0F294A]" /> A–Z
              </>
            )}
            {filter.sortir === 'za' && (
              <>
                <ArrowUpZA className="w-3.5 h-3.5 text-[#0F294A]" /> Z–A
              </>
            )}
            {filter.sortir === 'terbaru' && (
              <>
                <Clock className="w-3.5 h-3.5 text-amber-600" /> Terbaru
              </>
            )}
          </button>

          <div className="shrink-0 inline-flex rounded-xl bg-white border border-slate-200 p-0.5">
            <button
              type="button"
              onClick={() => updateFilter({ tampilan: 'grid' })}
              aria-label="Tampilan Grid"
              className={`p-1.5 rounded-lg transition ${
                filter.tampilan === 'grid'
                  ? 'bg-[#0F294A] text-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Grid2X2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => updateFilter({ tampilan: 'list' })}
              aria-label="Tampilan Daftar"
              className={`p-1.5 rounded-lg transition ${
                filter.tampilan === 'list'
                  ? 'bg-[#0F294A] text-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chip Cepat Mata Pelajaran */}
        {availableMapels.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              onClick={() => updateFilter({ mapel: 'Semua' })}
              className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                filter.mapel === 'Semua'
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-200/75 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Semua Mapel
            </button>
            {availableMapels.map(([mapelName, count]) => (
              <button
                key={mapelName}
                type="button"
                onClick={() =>
                  updateFilter({ mapel: filter.mapel === mapelName ? 'Semua' : mapelName })
                }
                className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  filter.mapel === mapelName
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-200/75 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {mapelName} ({count})
              </button>
            ))}
          </div>
        )}

        {hasActiveFilter && (
          <div className="flex items-center justify-between bg-slate-200/60 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-slate-600 truncate">
              Menampilkan <strong>{filteredBooks.length}</strong> hasil filter aktif
            </span>
            <button
              type="button"
              onClick={() =>
                updateFilter({
                  query: '',
                  kelas: 'Semua',
                  mapel: 'Semua',
                  jenis: 'Semua',
                })
              }
              className="shrink-0 inline-flex items-center gap-1 font-bold text-[#0F294A]"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
        )}
      </div>

      {/* Daftar Buku Grid 2 Kolom atau List */}
      <div className="px-4 mt-3">
        {filteredBooks.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 mt-4">
            <p className="text-base font-extrabold text-slate-800">Buku tidak ditemukan</p>
            <p className="text-xs text-slate-500 mt-1">
              Coba kata kunci lain atau ubah filter Kelas / Mata Pelajaran di atas.
            </p>
            <button
              type="button"
              onClick={() =>
                updateFilter({ query: '', kelas: 'Semua', mapel: 'Semua', jenis: 'Semua' })
              }
              className="mt-4 px-4 py-2 rounded-xl bg-[#0F294A] text-white text-xs font-bold"
            >
              Tampilkan Semua Buku
            </button>
          </div>
        ) : filter.tampilan === 'grid' ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} layout="grid" />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} layout="list" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
