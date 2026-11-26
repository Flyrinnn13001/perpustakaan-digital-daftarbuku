import React, { useState } from 'react';
import {
  BookOpenCheck,
  CheckCircle2,
  Cloud,
  GraduationCap,
  KeyRound,
  LogOut,
  ShieldCheck,
  Smartphone,
  UserCheck,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';

export const ProfileView: React.FC = () => {
  const {
    user,
    favorites,
    history,
    offlineList,
    cloudConnected,
    loginSimple,
    loginGoogleSimulated,
    loginAdmin,
    logoutToGuest,
    setAdminOpen,
    showToast,
  } = useLibrary();

  const [loginTab, setLoginTab] = useState<'siswa_guru' | 'admin'>('siswa_guru');
  const [namaInput, setNamaInput] = useState(user.nama);
  const [kelasInput, setKelasInput] = useState(
    ['X', 'XI', 'XII', 'Umum'].includes(user.kelas) ? user.kelas : 'X'
  );
  const [peranPilihan, setPeranPilihan] = useState<'siswa' | 'guru'>(
    user.peran === 'guru' ? 'guru' : 'siswa'
  );

  const [adminNama, setAdminNama] = useState('Pustakawan Sekolah');
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleSimpleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginSimple(namaInput, kelasInput, peranPilihan);
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = loginAdmin(adminNama, adminPin);
    if (!ok) {
      setPinError(true);
      showToast('PIN Admin salah (Default demo: 123456)');
    } else {
      setPinError(false);
      setAdminPin('');
      setAdminOpen(true);
    }
  };

  return (
    <div className="pb-24">
      <header className="bg-gradient-to-br from-[#0F294A] to-[#1B4478] text-white px-4 pt-5 pb-6 rounded-b-[28px] shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
              Profil & Hak Akses
            </p>
            <h1 className="text-xl font-extrabold mt-0.5">{user.nama}</h1>
            <p className="text-xs text-slate-200 mt-0.5">
              Peran:{' '}
              <strong className="uppercase text-amber-300">
                {user.peran === 'admin'
                  ? 'Admin / Pustakawan'
                  : user.peran === 'guru'
                  ? 'Guru Mata Pelajaran'
                  : `Siswa (${user.kelas})`}
              </strong>
            </p>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-extrabold text-lg flex items-center justify-center shadow-md">
            {user.nama.slice(0, 2).toUpperCase()}
          </div>
        </div>

        {/* Ringkasan Aktivitas Pengguna */}
        <div className="mt-4 grid grid-cols-3 gap-2 bg-white/10 border border-white/15 rounded-2xl p-3 text-center">
          <div>
            <div className="text-base font-extrabold text-amber-300">
              {Object.keys(history).length}
            </div>
            <div className="text-[10px] text-slate-200 font-semibold">Buku Dibaca</div>
          </div>
          <div className="border-x border-white/15">
            <div className="text-base font-extrabold text-white">{favorites.length}</div>
            <div className="text-[10px] text-slate-200 font-semibold">Favorit</div>
          </div>
          <div>
            <div className="text-base font-extrabold text-white">{offlineList.length}</div>
            <div className="text-[10px] text-slate-200 font-semibold">Offline</div>
          </div>
        </div>
      </header>

      <div className="px-4 mt-5 space-y-4">
        {/* Tombol Cepat Buka Admin Panel jika sudah login sebagai Admin */}
        {user.peran === 'admin' && (
          <div className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl p-4 text-slate-950 shadow-sm flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider">Mode Pustakawan Aktif</p>
              <p className="text-xs font-medium mt-0.5">
                Kelola buku, import CSV baru, atau sync folder Google Drive.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAdminOpen(true)}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-[#0F294A] text-white text-xs font-extrabold shadow-sm"
            >
              Buka Panel Admin
            </button>
          </div>
        )}

        {/* Kartu Mode Pengguna: Siswa / Guru / Admin */}
        <section className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-4">
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setLoginTab('siswa_guru')}
              className={`py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                loginTab === 'siswa_guru'
                  ? 'bg-[#0F294A] text-white shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Siswa / Guru
            </button>
            <button
              type="button"
              onClick={() => setLoginTab('admin')}
              className={`py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                loginTab === 'admin' ? 'bg-[#0F294A] text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Admin / Pustakawan
            </button>
          </div>

          {loginTab === 'siswa_guru' ? (
            <form onSubmit={handleSimpleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Mode Akses
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPeranPilihan('siswa')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      peranPilihan === 'siswa'
                        ? 'border-[#0F294A] bg-[#0F294A]/5'
                        : 'border-slate-200'
                    }`}
                  >
                    <p className="text-xs font-extrabold text-slate-900">Mode Siswa</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Baca, download & favorit Buku Siswa + Umum
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeranPilihan('guru')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      peranPilihan === 'guru'
                        ? 'border-[#0F294A] bg-[#0F294A]/5'
                        : 'border-slate-200'
                    }`}
                  >
                    <p className="text-xs font-extrabold text-slate-900">Mode Guru</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Membuka filter & akses penuh Buku Guru (BG)
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={namaInput}
                  onChange={(e) => setNamaInput(e.target.value)}
                  placeholder="Contoh: Andi Pratama"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0F294A]"
                />
              </div>

              {peranPilihan === 'siswa' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={kelasInput}
                    onChange={(e) => setKelasInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F294A]"
                  >
                    <option value="X">Kelas X</option>
                    <option value="XI">Kelas XI</option>
                    <option value="XII">Kelas XII</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#0F294A] hover:bg-[#173B6B] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <UserCheck className="w-4 h-4 text-amber-400" />
                Simpan & Masuk ({peranPilihan === 'guru' ? 'Mode Guru' : `Siswa Kelas ${kelasInput}`})
              </button>

              <div className="relative py-1 text-center">
                <span className="text-[11px] text-slate-400 bg-white px-2 relative z-10">
                  atau masuk cepat akun sekolah
                </span>
                <div className="absolute inset-x-0 top-1/2 border-t border-slate-200" />
              </div>

              <button
                type="button"
                onClick={() =>
                  loginGoogleSimulated(
                    peranPilihan === 'guru' ? 'Guru Kurikulum Merdeka' : 'Siswa Akun belajar.id',
                    peranPilihan === 'guru' ? 'guru@smk.belajar.id' : 'siswa@sma.belajar.id',
                    peranPilihan
                  )
                }
                className="w-full py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-2"
              >
                <BookOpenCheck className="w-4 h-4 text-amber-600" />
                Masuk dengan Google (belajar.id)
              </button>
            </form>
          ) : (
            <form onSubmit={handleAdminSubmit} className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-950">
                <p className="font-extrabold">Login Khusus Admin / Pustakawan</p>
                <p className="mt-0.5 text-amber-800">
                  Akses tambah/edit/nonaktifkan buku, import CSV baru, dan sync ulang folder Google Drive. (PIN bawaan: <strong>123456</strong>)
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Admin / Pustakawan
                </label>
                <input
                  type="text"
                  required
                  value={adminNama}
                  onChange={(e) => setAdminNama(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0F294A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">PIN Admin</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={adminPin}
                    onChange={(e) => {
                      setAdminPin(e.target.value);
                      setPinError(false);
                    }}
                    placeholder="Masukkan PIN Admin (123456)"
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 ${
                      pinError
                        ? 'border-rose-400 focus:ring-rose-400'
                        : 'border-slate-200 focus:ring-[#0F294A]'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                Masuk & Buka Panel Admin
              </button>
            </form>
          )}
        </section>

        {/* Info Status Database & Instalasi PWA / APK */}
        <section className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 inline-flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-[#0F294A]" />
              Status Sinkronisasi Data
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold ${
                cloudConnected
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-sky-100 text-sky-900'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              {cloudConnected ? 'Supabase Cloud Aktif' : 'Penyimpanan Lokal + Drive'}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-start gap-2.5 text-slate-600">
            <Smartphone className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Tips Install di HP:</strong> Di Chrome Android pilih menu{' '}
              <em>Tambahkan ke Layar Utama / Install Aplikasi</em>, atau di Safari iPhone pilih{' '}
              <em>Bagikan → Tambahkan ke Layar Utama</em>.
            </p>
          </div>

          {user.id !== 'siswa-default' && (
            <button
              type="button"
              onClick={logoutToGuest}
              className="w-full mt-2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar dari Profil Saat Ini
            </button>
          )}
        </section>
      </div>
    </div>
  );
};
