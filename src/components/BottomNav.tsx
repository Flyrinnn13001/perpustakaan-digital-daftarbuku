import React from 'react';
import { Clock, Compass, Heart, Home, User } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { TabNavigasi } from '../types/library';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, favorites, history } = useLibrary();

  const items: {
    id: TabNavigasi;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'katalog', label: 'Katalog', icon: Compass },
    { id: 'favorit', label: 'Favorit', icon: Heart, badge: favorites.length || undefined },
    {
      id: 'riwayat',
      label: 'Riwayat',
      icon: Clock,
      badge: Object.keys(history).length || undefined,
    },
    { id: 'profil', label: 'Profil', icon: User },
  ];

  return (
    <nav
      aria-label="Navigasi Utama"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(15,41,74,0.08)]"
    >
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 rounded-2xl transition active:scale-95 ${
                active
                  ? 'text-[#0F294A] font-extrabold'
                  : 'text-slate-400 hover:text-slate-600 font-semibold'
              }`}
            >
              <div
                className={`relative px-3 py-1 rounded-xl transition ${
                  active ? 'bg-amber-400/25 text-[#0F294A]' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.4]' : 'stroke-[1.9]'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-slate-950 text-[9px] font-extrabold flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-0.5 leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
