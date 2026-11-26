import React, { useEffect, useState } from 'react';
import { LibraryProvider, useLibrary } from './context/LibraryContext';
import { HomeView } from './components/HomeView';
import { CatalogView } from './components/CatalogView';
import { FavoritesView } from './components/FavoritesView';
import { HistoryView } from './components/HistoryView';
import { ProfileView } from './components/ProfileView';
import { BottomNav } from './components/BottomNav';
import { BookDetailModal } from './components/BookDetailModal';
import { PdfReaderModal } from './components/PdfReaderModal';
import { AdminPanelModal } from './components/AdminPanelModal';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const AppShell: React.FC = () => {
  const { activeTab, toastMessage, showToast } = useLibrary();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      showToast('Aplikasi DaftarBuku sedang di-install ke perangkat Anda!');
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-dvh bg-slate-200/70 flex justify-center">
      <div className="w-full max-w-lg min-h-dvh bg-[#F4F7FB] shadow-2xl relative flex flex-col">
        <main className="flex-1">
          {activeTab === 'beranda' && (
            <HomeView canInstallPwa={Boolean(deferredPrompt)} onInstallPwa={handleInstallPwa} />
          )}
          {activeTab === 'katalog' && <CatalogView />}
          {activeTab === 'favorit' && <FavoritesView />}
          {activeTab === 'riwayat' && <HistoryView />}
          {activeTab === 'profil' && <ProfileView />}
        </main>

        <BottomNav />
        <BookDetailModal />
        <PdfReaderModal />
        <AdminPanelModal />

        {/* Notifikasi Ringkas (Toast) */}
        {toastMessage && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] max-w-[90vw] px-4 py-2.5 rounded-2xl bg-slate-900/95 text-white text-xs font-bold shadow-xl border border-white/10 text-center pointer-events-none">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LibraryProvider>
      <AppShell />
    </LibraryProvider>
  );
};

export default App;
