import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Download,
  Edit3,
  ExternalLink,
  FileSpreadsheet,
  FolderSync,
  Loader2,
  Plus,
  Power,
  RefreshCw,
  Search,
  Upload,
  X,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import {
  Buku,
  HasilImportCsv,
  HasilSyncDrive,
  KelasKategori,
  StatusBuku,
} from '../types/library';
import {
  DRIVE_ROOT_FOLDER_ID,
  DRIVE_ROOT_FOLDER_URL,
  exportCatalogToCsv,
  inferMapelAndCleanTitle,
  isValidDriveLink,
} from '../utils/catalogNormalizer';

export const AdminPanelModal: React.FC = () => {
  const {
    books,
    adminOpen,
    setAdminOpen,
    saveBookAdmin,
    toggleBookStatusAdmin,
    importCsvAdmin,
    syncDriveAdmin,
    resetCatalogToSeed,
    integrationConfig,
    updateIntegrationConfig,
    showToast,
  } = useLibrary();

  const [tab, setTab] = useState<'kelola' | 'csv' | 'drive' | 'cloud'>('kelola');

  // State Tab Kelola Buku
  const [searchAdmin, setSearchAdmin] = useState('');
  const [statusFilter, setStatusFilter] = useState<'semua' | StatusBuku>('semua');
  const [editingBook, setEditingBook] = useState<Buku | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const [fJudul, setFJudul] = useState('');
  const [fKelas, setFKelas] = useState<KelasKategori>('Umum');
  const [fMapel, setFMapel] = useState('');
  const [fLink, setFLink] = useState('');
  const [fStatus, setFStatus] = useState<StatusBuku>('aktif');
  const [fError, setFError] = useState('');

  // State Tab CSV Import
  const [csvText, setCsvText] = useState('');
  const [sheetUrl, setSheetUrl] = useState(integrationConfig.googleSheetCsvUrl || '');
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvReport, setCsvReport] = useState<HasilImportCsv | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // State Tab Drive Sync
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncReport, setSyncReport] = useState<HasilSyncDrive | null>(null);

  // State Tab Cloud Config
  const [cfgDraft, setCfgDraft] = useState(integrationConfig);

  const adminBooks = useMemo(() => {
    let list = books;
    if (statusFilter !== 'semua') {
      list = list.filter((b) => b.status === statusFilter);
    }
    if (searchAdmin.trim()) {
      const q = searchAdmin.toLowerCase();
      list = list.filter(
        (b) =>
          b.judul.toLowerCase().includes(q) ||
          b.mapel.toLowerCase().includes(q) ||
          (b.judul_asli || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [books, statusFilter, searchAdmin]);

  if (!adminOpen) return null;

  const openAddForm = () => {
    setEditingBook(null);
    setFJudul('');
    setFKelas('Umum');
    setFMapel('');
    setFLink('');
    setFStatus('aktif');
    setFError('');
    setFormOpen(true);
  };

  const openEditForm = (b: Buku) => {
    setEditingBook(b);
    setFJudul(b.judul);
    setFKelas(b.kelas);
    setFMapel(b.mapel);
    setFLink(b.drive_link);
    setFStatus(b.status);
    setFError('');
    setFormOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fJudul.trim()) {
      setFError('Judul buku wajib diisi.');
      return;
    }
    if (!isValidDriveLink(fLink)) {
      setFError(
        'drive_link tidak valid! Gunakan URL Google Drive seperti https://drive.google.com/file/d/FILE_ID/view'
      );
      return;
    }
    await saveBookAdmin({
      id: editingBook?.id,
      judul: fJudul,
      kelas: fKelas,
      mapel: fMapel,
      drive_link: fLink,
      status: fStatus,
    });
    setFormOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(String(reader.result || ''));
      setCsvReport(null);
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleLoadMasterDriveCsv = async () => {
    setCsvLoading(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/import_bacaan.csv`);
      const txt = await res.text();
      setCsvText(txt);
      setCsvReport(null);
      showToast('File import_bacaan.csv (215 baris) berhasil dimuat ke editor');
    } catch {
      showToast('Gagal memuat sampel import_bacaan.csv');
    } finally {
      setCsvLoading(false);
    }
  };

  const handleLoadValidationDemoCsv = () => {
    const demo = [
      'judul,kelas,mapel,drive_link,status',
      'Nurin, Si Anak Elang ,Umum,,https://drive.google.com/file/d/1GBtBApIW81hHLoGr2h8LxA8uaO3jZ-e1/view,aktif',
      'Salinan Bahasa_Indonesia_BS_KLS_X_Rev.pdf,X,,https://drive.google.com/file/d/1pg5zSkuZs7rsySNB5Z54VINME-r69Rip/view,aktif',
      'Sitat Gurindam Dua Belas,Umum,,https://drive.google.com/file/d/1sZazzfxNpcEPgjQf0viVK9Rd5Bo0Zsqh/view,aktif',
      'Sitat Gurindam Dua Belas,Umum,,https://drive.google.com/file/d/1swn4fBPJQVL8fhQ2egYMpQjHiiswHehp/view,aktif',
      'Buku Link Kosong,XI,Matematika,,aktif',
      'Buku Link Rusak,XII,Fisika,https://contoh-salah.com/file.pdf,aktif',
    ].join('\n');
    setCsvText(demo);
    setCsvReport(null);
  };

  const handleFetchGoogleSheetCsv = async () => {
    if (!sheetUrl.trim()) {
      showToast('Masukkan URL CSV Google Sheets terlebih dahulu');
      return;
    }
    setCsvLoading(true);
    try {
      const res = await fetch(sheetUrl.trim());
      if (!res.ok) throw new Error('HTTP error');
      const txt = await res.text();
      setCsvText(txt);
      const rep = await importCsvAdmin(txt, false);
      setCsvReport(rep);
    } catch {
      showToast('Gagal mengambil URL CSV. Pastikan Sheet sudah di-Publish ke Web (CSV).');
    } finally {
      setCsvLoading(false);
    }
  };

  const handleRunCsvImport = async () => {
    if (!csvText.trim()) {
      showToast('Tempel atau pilih file CSV terlebih dahulu');
      return;
    }
    setCsvLoading(true);
    try {
      const rep = await importCsvAdmin(csvText, false);
      setCsvReport(rep);
    } finally {
      setCsvLoading(false);
    }
  };

  const handleExportCsv = () => {
    const csv = exportCatalogToCsv(books);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `katalog_daftarbuku_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Katalog berhasil diekspor ke CSV');
  };

  const handleRunDriveSync = async () => {
    setSyncLoading(true);
    try {
      const rep = await syncDriveAdmin();
      setSyncReport(rep);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal sinkronisasi Google Drive');
    } finally {
      setSyncLoading(false);
    }
  };

  const previewNormalization = fJudul.trim()
    ? inferMapelAndCleanTitle(fJudul, fKelas, fMapel)
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center">
      <div className="w-full max-w-lg bg-[#F5F8FC] rounded-t-[28px] sm:rounded-[28px] h-[94dvh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        {/* Header Admin Panel */}
        <div className="bg-[#0F294A] text-white px-4 pt-4 pb-3 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300">
                Panel Pustakawan
              </span>
              <h2 className="text-lg font-extrabold leading-tight">
                Manajemen Katalog & Sinkronisasi
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setAdminOpen(false)}
              aria-label="Tutup Panel Admin"
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Sub-Navigasi Admin */}
          <div className="mt-3 grid grid-cols-4 gap-1 bg-white/10 p-1 rounded-2xl text-[11px] font-extrabold">
            <button
              type="button"
              onClick={() => setTab('kelola')}
              className={`py-2 rounded-xl transition ${
                tab === 'kelola' ? 'bg-amber-400 text-slate-950' : 'text-slate-200'
              }`}
            >
              Buku ({books.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('csv')}
              className={`py-2 rounded-xl transition ${
                tab === 'csv' ? 'bg-amber-400 text-slate-950' : 'text-slate-200'
              }`}
            >
              Import CSV
            </button>
            <button
              type="button"
              onClick={() => setTab('drive')}
              className={`py-2 rounded-xl transition ${
                tab === 'drive' ? 'bg-amber-400 text-slate-950' : 'text-slate-200'
              }`}
            >
              Sync Drive
            </button>
            <button
              type="button"
              onClick={() => setTab('cloud')}
              className={`py-2 rounded-xl transition ${
                tab === 'cloud' ? 'bg-amber-400 text-slate-950' : 'text-slate-200'
              }`}
            >
              Database
            </button>
          </div>
        </div>

        {/* Isi Konten Tab Admin */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* ==================== TAB 1: KELOLA BUKU ==================== */}
          {tab === 'kelola' && (
            <>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openAddForm}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#0F294A] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  Tambah Buku Baru
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="py-2.5 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  Ekspor CSV
                </button>
              </div>

              {formOpen && (
                <form
                  onSubmit={handleSaveForm}
                  className="bg-white rounded-2xl p-4 border-2 border-[#0F294A]/20 shadow-md space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-slate-900">
                      {editingBook ? 'Edit Buku' : 'Tambah Buku ke Katalog'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setFormOpen(false)}
                      className="text-xs font-bold text-slate-500"
                    >
                      Batal
                    </button>
                  </div>

                  {fError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                      {fError}
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Judul Buku / Nama File PDF
                    </label>
                    <input
                      type="text"
                      value={fJudul}
                      onChange={(e) => setFJudul(e.target.value)}
                      placeholder="Contoh: Bahasa_Indonesia_BS_KLS_X_Rev.pdf"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                    />
                    {!editingBook && previewNormalization && (
                      <p className="text-[11px] text-emerald-700 mt-1">
                        Judul otomatis: <strong>{previewNormalization.judul}</strong> (
                        {previewNormalization.mapel})
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Kelas
                      </label>
                      <select
                        value={fKelas}
                        onChange={(e) => setFKelas(e.target.value as KelasKategori)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                      >
                        <option value="Umum">Umum (Literasi)</option>
                        <option value="X">Kelas X</option>
                        <option value="XI">Kelas XI</option>
                        <option value="XII">Kelas XII</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Status Tampil
                      </label>
                      <select
                        value={fStatus}
                        onChange={(e) => setFStatus(e.target.value as StatusBuku)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                      >
                        <option value="aktif">aktif (Ditampilkan)</option>
                        <option value="nonaktif">nonaktif (Disembunyikan)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Mata Pelajaran (Kosongkan untuk deteksi otomatis)
                    </label>
                    <input
                      type="text"
                      value={fMapel}
                      onChange={(e) => setFMapel(e.target.value)}
                      placeholder="Otomatis terisi dari judul jika dikosongkan"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Google Drive Link (Wajib)
                    </label>
                    <input
                      type="url"
                      value={fLink}
                      onChange={(e) => setFLink(e.target.value)}
                      placeholder="https://drive.google.com/file/d/.../view"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-extrabold"
                  >
                    Simpan Data Buku
                  </button>
                </form>
              )}

              {/* Pencarian & Filter Status */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={searchAdmin}
                    onChange={(e) => setSearchAdmin(e.target.value)}
                    placeholder="Cari buku aktif / nonaktif..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'semua' | StatusBuku)}
                  className="px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold"
                >
                  <option value="semua">Semua ({books.length})</option>
                  <option value="aktif">
                    Aktif ({books.filter((b) => b.status === 'aktif').length})
                  </option>
                  <option value="nonaktif">
                    Nonaktif ({books.filter((b) => b.status === 'nonaktif').length})
                  </option>
                </select>
              </div>

              {/* Daftar Buku Admin */}
              <div className="space-y-2">
                {adminBooks.slice(0, 80).map((b) => (
                  <div
                    key={b.id}
                    className={`bg-white rounded-2xl p-3 border flex items-center justify-between gap-2.5 ${
                      b.status === 'nonaktif'
                        ? 'border-rose-200 bg-rose-50/40 opacity-80'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-700">
                          {b.kelas === 'Umum' ? 'Umum' : `Kls ${b.kelas}`}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                          {b.jenis}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                            b.status === 'aktif'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 mt-1 truncate">{b.judul}</p>
                      <p className="text-[11px] text-slate-500 truncate">{b.mapel}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditForm(b)}
                        aria-label="Edit buku"
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleBookStatusAdmin(b.id)}
                        aria-label="Aktif/Nonaktifkan"
                        title={b.status === 'aktif' ? 'Nonaktifkan buku' : 'Aktifkan buku'}
                        className={`p-2 rounded-xl ${
                          b.status === 'aktif'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-rose-100 hover:text-rose-700'
                            : 'bg-rose-100 text-rose-700 hover:bg-emerald-100 hover:text-emerald-800'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {adminBooks.length > 80 && (
                  <p className="text-center text-[11px] text-slate-500 py-2">
                    Menampilkan 80 dari {adminBooks.length} buku. Gunakan kolom pencarian untuk menyaring judul tertentu.
                  </p>
                )}
              </div>
            </>
          )}

          {/* ==================== TAB 2: IMPORT CSV ==================== */}
          {tab === 'csv' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-start gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-[#0F294A] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Import / Update dari CSV (`import_bacaan.csv`)
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Format wajib: <code className="bg-slate-100 px-1 rounded">judul,kelas,mapel,drive_link,status</code>.
                      Otomatis memperbaiki judul berkoma (seperti <em>Nurin, Si Anak Elang</em>), menghapus awalan <em>Salinan </em>, mengisi mapel kosong, dan menolak link rusak.
                    </p>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-2.5 px-3 rounded-xl bg-[#0F294A] text-white text-xs font-extrabold flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-4 h-4 text-amber-400" />
                    Pilih File .CSV
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadMasterDriveCsv}
                    className="py-2.5 px-3 rounded-xl bg-amber-100 text-amber-950 text-xs font-extrabold flex items-center justify-center gap-1.5"
                  >
                    Muat CSV Drive (215)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleLoadValidationDemoCsv}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold"
                >
                  Muat Contoh Uji Validasi (Judul Berkoma + Duplikat + Link Rusak)
                </button>

                {/* Sync langsung dari Link Publish CSV Google Sheets */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-600">
                    Atau Tarik Langsung dari URL CSV Google Sheets:
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      value={sheetUrl}
                      onChange={(e) => setSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleFetchGoogleSheetCsv}
                      disabled={csvLoading}
                      className="px-3 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold shrink-0"
                    >
                      Tarik
                    </button>
                  </div>
                </div>

                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="judul,kelas,mapel,drive_link,status&#10;Adipati Blambangan,Umum,,https://drive.google.com/file/d/1Qi7saz_aZSnzhvZZAD07moB8XCgxMZQm/view,aktif"
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F294A]"
                />

                <button
                  type="button"
                  onClick={handleRunCsvImport}
                  disabled={csvLoading}
                  className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs"
                >
                  {csvLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Validasi & Simpan ke Katalog
                </button>
              </div>

              {/* Laporan Hasil Validasi CSV */}
              {csvReport && (
                <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3 text-xs">
                  <h4 className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Hasil Validasi & Import CSV
                  </h4>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <span className="text-emerald-900 font-extrabold text-sm block">
                        {csvReport.validBooks.length}
                      </span>
                      <span className="text-[11px] text-emerald-800">
                        Baris Valid ({csvReport.newCount} baru, {csvReport.updatedCount} diperbarui)
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200">
                      <span className="text-sky-900 font-extrabold text-sm block">
                        {csvReport.fixedCommaCount}
                      </span>
                      <span className="text-[11px] text-sky-800">Judul Berkoma Diperbaiki</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                      <span className="text-amber-900 font-extrabold text-sm block">
                        {csvReport.deduplicatedCount}
                      </span>
                      <span className="text-[11px] text-amber-800">Duplikat Dilewati Otomatis</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                      <span className="text-rose-900 font-extrabold text-sm block">
                        {csvReport.rejectedRows.length}
                      </span>
                      <span className="text-[11px] text-rose-800">Baris Ditolak (Link Rusak)</span>
                    </div>
                  </div>

                  {csvReport.rejectedRows.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <p className="font-extrabold text-rose-700 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Detail Baris yang Ditolak:
                      </p>
                      {csvReport.rejectedRows.map((err) => (
                        <div
                          key={err.baris}
                          className="p-2 rounded-lg bg-rose-50 text-[11px] text-rose-900 border border-rose-200"
                        >
                          <strong>Baris {err.baris}:</strong> {err.alasan}
                          <div className="font-mono text-[10px] text-rose-700 truncate mt-0.5">
                            {err.isi}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB 3: SYNC GOOGLE DRIVE ==================== */}
          {tab === 'drive' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-start gap-2.5">
                  <FolderSync className="w-5 h-5 text-[#0F294A] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Sinkronisasi Folder Google Drive Utama
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Memindai Folder ID <code className="bg-slate-100 px-1 rounded">{DRIVE_ROOT_FOLDER_ID}</code> beserta subfolder <strong>Buku Umum</strong>, <strong>Kelas X</strong>, <strong>Kelas XI</strong>, dan <strong>Kelas XII</strong> untuk mendeteksi PDF baru & ukuran file.
                    </p>
                  </div>
                </div>

                <a
                  href={DRIVE_ROOT_FOLDER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Buka Folder Google Drive Sumber
                </a>

                <button
                  type="button"
                  onClick={handleRunDriveSync}
                  disabled={syncLoading}
                  className="w-full py-3.5 rounded-xl bg-[#0F294A] hover:bg-[#173B6B] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm"
                >
                  {syncLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-amber-400" />
                  )}
                  Scan & Sync Folder Drive Sekarang
                </button>
              </div>

              {syncReport && (
                <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Laporan Pemindaian Subfolder Drive
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {syncReport.source === 'google_drive_api'
                        ? 'Drive REST API Live'
                        : syncReport.source === 'apps_script'
                        ? 'Apps Script Live'
                        : 'Snapshot Drive Terverifikasi'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {syncReport.scannedFolders.map((f) => (
                      <div
                        key={f.folderId}
                        className={`p-2.5 rounded-xl border flex items-center justify-between ${
                          f.diabaikanSebagaiDuplikat
                            ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div>
                          <span className="font-extrabold">{f.nama}</span>
                          {f.diabaikanSebagaiDuplikat && (
                            <p className="text-[10px] text-amber-800">
                              Diabaikan otomatis (100% duplikat Salinan Kelas X)
                            </p>
                          )}
                        </div>
                        <span className="font-extrabold">{f.jumlahPdf} PDF</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
                    <p>
                      PDF Baru Ditambahkan: <strong>{syncReport.newBooks.length} buku</strong>
                    </p>
                    <p>
                      Metadata Ukuran Diperbarui: <strong>{syncReport.updatedSizeCount} file</strong>
                    </p>
                    <p>
                      Duplikat Buku Umum Dicegah: <strong>{syncReport.skippedDuplicateCount} file</strong>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB 4: DATABASE & CLOUD ==================== */}
          {tab === 'cloud' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-start gap-2.5">
                  <Database className="w-5 h-5 text-[#0F294A] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Integrasi Supabase & Google Drive API
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Hubungkan ke tabel <code className="bg-slate-100 px-1 rounded">bacaan</code> di Supabase agar pembaruan katalog dari Admin tersinkron ke seluruh HP siswa secara real-time.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    value={cfgDraft.supabaseUrl}
                    onChange={(e) => setCfgDraft({ ...cfgDraft, supabaseUrl: e.target.value })}
                    placeholder="https://xxxx.supabase.co"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Supabase Anon Public Key
                  </label>
                  <input
                    type="password"
                    value={cfgDraft.supabaseAnonKey}
                    onChange={(e) => setCfgDraft({ ...cfgDraft, supabaseAnonKey: e.target.value })}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Google Drive API Key (Opsional — untuk live scan langsung)
                  </label>
                  <input
                    type="password"
                    value={cfgDraft.googleDriveApiKey}
                    onChange={(e) =>
                      setCfgDraft({ ...cfgDraft, googleDriveApiKey: e.target.value })
                    }
                    placeholder="AIzaSy..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    URL Google Apps Script Sync (Opsional tanpa API Key)
                  </label>
                  <input
                    type="url"
                    value={cfgDraft.appsScriptSyncUrl}
                    onChange={(e) =>
                      setCfgDraft({ ...cfgDraft, appsScriptSyncUrl: e.target.value })
                    }
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => updateIntegrationConfig(cfgDraft)}
                  className="w-full py-3 rounded-xl bg-[#0F294A] text-white text-xs font-extrabold"
                >
                  Simpan & Hubungkan Konfigurasi
                </button>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2">
                <h4 className="text-xs font-extrabold text-slate-800">Reset Katalog Lokal</h4>
                <p className="text-[11px] text-slate-500">
                  Kembalikan data lokal ke 214 buku asli hasil deduplikasi CSV + Folder Drive.
                </p>
                <button
                  type="button"
                  onClick={resetCatalogToSeed}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold"
                >
                  Kembalikan ke Seed Data Awal (214 Buku)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
