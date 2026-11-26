import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  Buku,
  HasilImportCsv,
  HasilSyncDrive,
  KelasKategori,
  KonfigurasiIntegrasi,
  ProfilPengguna,
  RiwayatBaca,
  StatusBuku,
  TabNavigasi,
  UnduhanOffline,
} from '../types/library';
import {
  extractDriveFileId,
  getDriveDownloadUrl,
  inferMapelAndCleanTitle,
  stripSalinanAndExt,
} from '../utils/catalogNormalizer';
import {
  fetchCatalogWithCloudFallback,
  getDefaultIntegrationConfig,
  getSeedBooks,
  loadActiveUser,
  loadFavorites,
  loadLocalBooks,
  loadOfflineDownloads,
  loadReadingHistory,
  mergeImportedCsvIntoCatalog,
  persistBooksUpdate,
  saveActiveUser,
  saveFavorites,
  saveIntegrationConfig,
  saveLocalBooks,
  saveOfflineDownloads,
  saveReadingHistory,
  syncCatalogWithDriveFolder,
} from '../services/libraryStore';

interface FilterKatalogState {
  query: string;
  kelas: 'Semua' | KelasKategori;
  mapel: string;
  jenis: 'Semua' | 'BS' | 'BG' | 'Umum';
  sortir: 'az' | 'za' | 'terbaru';
  tampilan: 'grid' | 'list';
}

interface LibraryContextValue {
  books: Buku[];
  activeBooks: Buku[];
  visibleBooksForUser: Buku[];
  cloudConnected: boolean;
  isLoading: boolean;
  user: ProfilPengguna;
  favorites: string[];
  history: Record<string, RiwayatBaca>;
  offlineList: UnduhanOffline[];
  activeTab: TabNavigasi;
  selectedBook: Buku | null;
  readingBook: Buku | null;
  adminOpen: boolean;
  filter: FilterKatalogState;
  toastMessage: string | null;
  integrationConfig: KonfigurasiIntegrasi;

  setActiveTab: (tab: TabNavigasi) => void;
  openBookDetail: (book: Buku) => void;
  closeBookDetail: () => void;
  openReader: (book: Buku) => void;
  closeReader: () => void;
  setAdminOpen: (open: boolean) => void;
  updateFilter: (partial: Partial<FilterKatalogState>) => void;
  navigateToKelasCatalog: (kelas: 'Semua' | KelasKategori, searchQuery?: string) => void;

  toggleFavorite: (bookId: string) => void;
  isFavorite: (bookId: string) => boolean;
  updateReadingProgress: (
    bookId: string,
    patch: Partial<Omit<RiwayatBaca, 'bacaan_id' | 'last_read_at'>>
  ) => void;
  recordOfflineDownload: (book: Buku) => void;
  removeOfflineRecord: (bookId: string) => void;

  loginSimple: (nama: string, kelas: string, peran: 'siswa' | 'guru') => void;
  loginGoogleSimulated: (nama: string, email: string, peran: 'siswa' | 'guru') => void;
  loginAdmin: (nama: string, pin: string) => boolean;
  switchRoleQuick: (peran: 'siswa' | 'guru') => void;
  logoutToGuest: () => void;

  saveBookAdmin: (draft: {
    id?: string;
    judul: string;
    kelas: KelasKategori;
    mapel: string;
    drive_link: string;
    status: StatusBuku;
    jenis?: Buku['jenis'];
    ukuran_file?: number | null;
  }) => Promise<void>;
  toggleBookStatusAdmin: (bookId: string) => Promise<void>;
  importCsvAdmin: (csvText: string, replaceAll?: boolean) => Promise<HasilImportCsv>;
  syncDriveAdmin: () => Promise<HasilSyncDrive>;
  resetCatalogToSeed: () => Promise<void>;
  updateIntegrationConfig: (cfg: KonfigurasiIntegrasi) => Promise<void>;
  showToast: (msg: string) => void;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [books, setBooks] = useState<Buku[]>(() => loadLocalBooks());
  const [cloudConnected, setCloudConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<ProfilPengguna>(() => loadActiveUser());
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites(loadActiveUser().id));
  const [history, setHistory] = useState<Record<string, RiwayatBaca>>(() =>
    loadReadingHistory(loadActiveUser().id)
  );
  const [offlineList, setOfflineList] = useState<UnduhanOffline[]>(() =>
    loadOfflineDownloads(loadActiveUser().id)
  );

  const [activeTab, setActiveTab] = useState<TabNavigasi>('beranda');
  const [selectedBook, setSelectedBook] = useState<Buku | null>(null);
  const [readingBook, setReadingBook] = useState<Buku | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [integrationConfig, setIntegrationConfig] = useState<KonfigurasiIntegrasi>(() =>
    getDefaultIntegrationConfig()
  );

  const [filter, setFilter] = useState<FilterKatalogState>({
    query: '',
    kelas: 'Semua',
    mapel: 'Semua',
    jenis: 'Semua',
    sortir: 'az',
    tampilan: 'grid',
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(t);
  }, [toastMessage]);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    fetchCatalogWithCloudFallback()
      .then(({ books: loaded, cloudConnected: connected }) => {
        if (!mounted) return;
        setBooks(loaded);
        setCloudConnected(connected);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Muat ulang koleksi personal saat berganti profil pengguna
  useEffect(() => {
    setFavorites(loadFavorites(user.id));
    setHistory(loadReadingHistory(user.id));
    setOfflineList(loadOfflineDownloads(user.id));
  }, [user.id]);

  // Hanya buku berstatus "aktif" yang tampil di Beranda & Katalog publik
  const activeBooks = useMemo(() => books.filter((b) => b.status === 'aktif'), [books]);

  // Mode Siswa menampilkan Buku Siswa (BS) + Bacaan Umum; Guru & Admin dapat mengakses Buku Guru (BG) juga
  const visibleBooksForUser = useMemo(() => {
    if (user.peran === 'guru' || user.peran === 'admin') {
      return activeBooks;
    }
    return activeBooks.filter((b) => b.jenis !== 'BG');
  }, [activeBooks, user.peran]);

  const updateFilter = useCallback((partial: Partial<FilterKatalogState>) => {
    setFilter((prev) => {
      const next = { ...prev, ...partial };
      // Reset mapel jika kelas diganti dan mapel sebelumnya tidak relevan
      if (partial.kelas !== undefined && partial.kelas !== prev.kelas && partial.mapel === undefined) {
        next.mapel = 'Semua';
      }
      return next;
    });
  }, []);

  const navigateToKelasCatalog = useCallback(
    (kelas: 'Semua' | KelasKategori, searchQuery?: string) => {
      setFilter((prev) => ({
        ...prev,
        kelas,
        mapel: 'Semua',
        query: searchQuery !== undefined ? searchQuery : prev.query,
      }));
      setActiveTab('katalog');
    },
    []
  );

  const openBookDetail = useCallback((book: Buku) => {
    setSelectedBook(book);
  }, []);

  const closeBookDetail = useCallback(() => {
    setSelectedBook(null);
  }, []);

  const updateReadingProgress = useCallback(
    (bookId: string, patch: Partial<Omit<RiwayatBaca, 'bacaan_id' | 'last_read_at'>>) => {
      setHistory((prev) => {
        const current = prev[bookId];
        const updated: RiwayatBaca = {
          bacaan_id: bookId,
          halaman_terakhir: patch.halaman_terakhir ?? current?.halaman_terakhir ?? 1,
          total_halaman: patch.total_halaman ?? current?.total_halaman,
          zoom_terakhir: patch.zoom_terakhir ?? current?.zoom_terakhir ?? 100,
          mode_malam: patch.mode_malam ?? current?.mode_malam ?? false,
          catatan: patch.catatan !== undefined ? patch.catatan : current?.catatan,
          last_read_at: new Date().toISOString(),
        };
        const next = { ...prev, [bookId]: updated };
        saveReadingHistory(user.id, next);
        return next;
      });
    },
    [user.id]
  );

  const openReader = useCallback(
    (book: Buku) => {
      updateReadingProgress(book.id, {});
      setReadingBook(book);
    },
    [updateReadingProgress]
  );

  const closeReader = useCallback(() => {
    setReadingBook(null);
  }, []);

  const toggleFavorite = useCallback(
    (bookId: string) => {
      setFavorites((prev) => {
        const exists = prev.includes(bookId);
        const next = exists ? prev.filter((id) => id !== bookId) : [bookId, ...prev];
        saveFavorites(user.id, next);
        showToast(exists ? 'Dihapus dari Favorit' : 'Ditambahkan ke Favorit');
        return next;
      });
    },
    [user.id, showToast]
  );

  const isFavorite = useCallback((bookId: string) => favorites.includes(bookId), [favorites]);

  const recordOfflineDownload = useCallback(
    (book: Buku) => {
      const downloadUrl = getDriveDownloadUrl(book.drive_link);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      setOfflineList((prev) => {
        const filtered = prev.filter((item) => item.bacaan_id !== book.id);
        const next: UnduhanOffline[] = [
          {
            bacaan_id: book.id,
            judul: book.judul,
            kelas: book.kelas,
            mapel: book.mapel,
            ukuran_file: book.ukuran_file,
            drive_link: book.drive_link,
            downloaded_at: new Date().toISOString(),
          },
          ...filtered,
        ];
        saveOfflineDownloads(user.id, next);
        return next;
      });
      showToast('Mengunduh PDF untuk akses offline...');
    },
    [user.id, showToast]
  );

  const removeOfflineRecord = useCallback(
    (bookId: string) => {
      setOfflineList((prev) => {
        const next = prev.filter((item) => item.bacaan_id !== bookId);
        saveOfflineDownloads(user.id, next);
        return next;
      });
      showToast('Catatan unduhan offline dihapus');
    },
    [user.id, showToast]
  );

  const loginSimple = useCallback(
    (nama: string, kelas: string, peran: 'siswa' | 'guru') => {
      const cleanName = nama.trim() || (peran === 'guru' ? 'Bapak/Ibu Guru' : 'Siswa Pembaca');
      const idSlug = `${peran}-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const nextUser: ProfilPengguna = {
        id: idSlug,
        nama: cleanName,
        kelas: peran === 'guru' ? 'Guru Mata Pelajaran' : kelas,
        peran,
        loginMethod: 'sederhana',
      };
      setUser(nextUser);
      saveActiveUser(nextUser);
      if (peran === 'siswa' && filter.jenis === 'BG') {
        setFilter((prev) => ({ ...prev, jenis: 'Semua' }));
      }
      showToast(`Selamat datang, ${cleanName}!`);
    },
    [filter.jenis, showToast]
  );

  const loginGoogleSimulated = useCallback(
    (nama: string, email: string, peran: 'siswa' | 'guru') => {
      const nextUser: ProfilPengguna = {
        id: `google-${email.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        nama,
        kelas: peran === 'guru' ? 'Guru (Akun belajar.id)' : 'X',
        peran,
        email,
        loginMethod: 'google',
      };
      setUser(nextUser);
      saveActiveUser(nextUser);
      showToast(`Masuk sebagai ${nama}`);
    },
    [showToast]
  );

  const loginAdmin = useCallback(
    (nama: string, pin: string): boolean => {
      const expectedPin = import.meta.env.VITE_ADMIN_PIN || '123456';
      if (pin.trim() !== expectedPin) {
        return false;
      }
      const cleanName = nama.trim() || 'Admin Pustakawan';
      const nextUser: ProfilPengguna = {
        id: 'admin-pustakawan',
        nama: cleanName,
        kelas: 'Pustakawan',
        peran: 'admin',
        loginMethod: 'admin',
      };
      setUser(nextUser);
      saveActiveUser(nextUser);
      showToast(`Mode Admin/Pustakawan aktif`);
      return true;
    },
    [showToast]
  );

  const switchRoleQuick = useCallback(
    (peran: 'siswa' | 'guru') => {
      const nextUser: ProfilPengguna = {
        ...user,
        peran,
        kelas: peran === 'guru' ? 'Guru Mata Pelajaran' : user.kelas === 'Pustakawan' || user.kelas.includes('Guru') ? 'X' : user.kelas,
      };
      setUser(nextUser);
      saveActiveUser(nextUser);
      if (peran === 'siswa' && filter.jenis === 'BG') {
        setFilter((prev) => ({ ...prev, jenis: 'Semua' }));
      }
      showToast(
        peran === 'guru'
          ? 'Mode Guru aktif — akses Buku Guru (BG) terbuka'
          : 'Mode Siswa aktif'
      );
    },
    [user, filter.jenis, showToast]
  );

  const logoutToGuest = useCallback(() => {
    const guest: ProfilPengguna = {
      id: 'siswa-default',
      nama: 'Siswa Pembaca',
      kelas: 'X',
      peran: 'siswa',
      loginMethod: 'sederhana',
    };
    setUser(guest);
    saveActiveUser(guest);
    setAdminOpen(false);
    setFilter((prev) => ({ ...prev, jenis: prev.jenis === 'BG' ? 'Semua' : prev.jenis }));
    showToast('Keluar ke profil Siswa standar');
  }, [showToast]);

  const saveBookAdmin = useCallback(
    async (draft: {
      id?: string;
      judul: string;
      kelas: KelasKategori;
      mapel: string;
      drive_link: string;
      status: StatusBuku;
      jenis?: Buku['jenis'];
      ukuran_file?: number | null;
    }) => {
      const baseAsli = stripSalinanAndExt(draft.judul);
      const inferred = inferMapelAndCleanTitle(baseAsli, draft.kelas, draft.mapel);
      const fileId = extractDriveFileId(draft.drive_link) || '';

      const finalBook: Buku = {
        id: draft.id || `buku-${Date.now().toString(36)}`,
        judul: draft.id ? stripSalinanAndExt(draft.judul) : inferred.judul,
        judul_asli: baseAsli,
        kelas: draft.kelas,
        mapel: draft.mapel.trim() || inferred.mapel,
        jenis: draft.jenis || inferred.jenis,
        drive_link: draft.drive_link.trim(),
        drive_file_id: fileId,
        status: draft.status,
        ukuran_file: draft.ukuran_file ?? null,
        created_at: new Date().toISOString(),
      };

      const next = draft.id
        ? books.map((b) => (b.id === draft.id ? { ...b, ...finalBook, created_at: b.created_at } : b))
        : [finalBook, ...books];

      setBooks(next);
      if (selectedBook && selectedBook.id === finalBook.id) {
        setSelectedBook(finalBook);
      }
      await persistBooksUpdate(next, [finalBook]);
      showToast(draft.id ? 'Data buku berhasil diperbarui' : 'Buku baru berhasil ditambahkan');
    },
    [books, selectedBook, showToast]
  );

  const toggleBookStatusAdmin = useCallback(
    async (bookId: string) => {
      let changed: Buku | undefined;
      const next = books.map((b) => {
        if (b.id !== bookId) return b;
        const nextStatus: StatusBuku = b.status === 'aktif' ? 'nonaktif' : 'aktif';
        changed = { ...b, status: nextStatus };
        return changed;
      });
      setBooks(next);
      if (changed) {
        await persistBooksUpdate(next, [changed]);
        showToast(
          `Buku "${changed.judul}" diubah menjadi ${changed.status.toUpperCase()}`
        );
      }
    },
    [books, showToast]
  );

  const importCsvAdmin = useCallback(
    async (csvText: string, replaceAll = false): Promise<HasilImportCsv> => {
      const { mergedBooks, report } = await mergeImportedCsvIntoCatalog(csvText, books, replaceAll);
      setBooks(mergedBooks);
      showToast(`Import selesai: ${report.validBooks.length} buku diproses`);
      return report;
    },
    [books, showToast]
  );

  const syncDriveAdmin = useCallback(async (): Promise<HasilSyncDrive> => {
    const { mergedBooks, report } = await syncCatalogWithDriveFolder(books);
    setBooks(mergedBooks);
    showToast(
      report.newBooks.length > 0
        ? `Sync selesai: ${report.newBooks.length} PDF baru ditemukan!`
        : `Sync Drive selesai: Katalog sudah mutakhir (${report.updatedSizeCount} ukuran diperbarui)`
    );
    return report;
  }, [books, showToast]);

  const resetCatalogToSeed = useCallback(async () => {
    const fresh = getSeedBooks();
    saveLocalBooks(fresh);
    setBooks(fresh);
    showToast('Katalog dikembalikan ke data awal Drive (214 buku)');
  }, [showToast]);

  const updateIntegrationConfig = useCallback(
    async (cfg: KonfigurasiIntegrasi) => {
      saveIntegrationConfig(cfg);
      setIntegrationConfig(cfg);
      const { books: refreshed, cloudConnected: connected } = await fetchCatalogWithCloudFallback();
      setBooks(refreshed);
      setCloudConnected(connected);
      showToast(
        connected
          ? 'Terhubung ke database Supabase Cloud!'
          : 'Konfigurasi disimpan (Mode Penyimpanan Lokal aktif)'
      );
    },
    [showToast]
  );

  const value = useMemo<LibraryContextValue>(
    () => ({
      books,
      activeBooks,
      visibleBooksForUser,
      cloudConnected,
      isLoading,
      user,
      favorites,
      history,
      offlineList,
      activeTab,
      selectedBook,
      readingBook,
      adminOpen,
      filter,
      toastMessage,
      integrationConfig,
      setActiveTab,
      openBookDetail,
      closeBookDetail,
      openReader,
      closeReader,
      setAdminOpen,
      updateFilter,
      navigateToKelasCatalog,
      toggleFavorite,
      isFavorite,
      updateReadingProgress,
      recordOfflineDownload,
      removeOfflineRecord,
      loginSimple,
      loginGoogleSimulated,
      loginAdmin,
      switchRoleQuick,
      logoutToGuest,
      saveBookAdmin,
      toggleBookStatusAdmin,
      importCsvAdmin,
      syncDriveAdmin,
      resetCatalogToSeed,
      updateIntegrationConfig,
      showToast,
    }),
    [
      books,
      activeBooks,
      visibleBooksForUser,
      cloudConnected,
      isLoading,
      user,
      favorites,
      history,
      offlineList,
      activeTab,
      selectedBook,
      readingBook,
      adminOpen,
      filter,
      toastMessage,
      integrationConfig,
      openBookDetail,
      closeBookDetail,
      openReader,
      closeReader,
      updateFilter,
      navigateToKelasCatalog,
      toggleFavorite,
      isFavorite,
      updateReadingProgress,
      recordOfflineDownload,
      removeOfflineRecord,
      loginSimple,
      loginGoogleSimulated,
      loginAdmin,
      switchRoleQuick,
      logoutToGuest,
      saveBookAdmin,
      toggleBookStatusAdmin,
      importCsvAdmin,
      syncDriveAdmin,
      resetCatalogToSeed,
      updateIntegrationConfig,
      showToast,
    ]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
};

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary harus dipanggil di dalam LibraryProvider');
  return ctx;
}
