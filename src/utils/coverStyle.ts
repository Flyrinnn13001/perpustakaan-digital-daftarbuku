export interface CoverPalette {
  initials: string;
  bgFrom: string;
  bgTo: string;
  accent: string;
  badgeBg: string;
  badgeText: string;
  patternType: 'circles' | 'grid' | 'waves' | 'diagonal';
}

const coverCache = new Map<string, CoverPalette>();

const PALETTES: Omit<CoverPalette, 'initials'>[] = [
  // Biru Tua Perpustakaan + Emas
  {
    bgFrom: '#0F294A',
    bgTo: '#1E4976',
    accent: '#F59E0B',
    badgeBg: 'rgba(245, 158, 11, 0.22)',
    badgeText: '#FDE68A',
    patternType: 'circles',
  },
  // Teal Zamrud + Amber
  {
    bgFrom: '#0F4C5C',
    bgTo: '#1B7A8C',
    accent: '#FBBF24',
    badgeBg: 'rgba(251, 191, 36, 0.2)',
    badgeText: '#FEF3C7',
    patternType: 'waves',
  },
  // Indigo Royal + Oranye Hangat
  {
    bgFrom: '#1E296B',
    bgTo: '#3346A8',
    accent: '#FB923C',
    badgeBg: 'rgba(251, 146, 60, 0.22)',
    badgeText: '#FFEDD5',
    patternType: 'grid',
  },
  // Hijau Hutan Literasi + Kuning
  {
    bgFrom: '#134E4A',
    bgTo: '#0F766E',
    accent: '#FACC15',
    badgeBg: 'rgba(250, 204, 21, 0.2)',
    badgeText: '#FEF9C3',
    patternType: 'diagonal',
  },
  // Terracotta / Coklat Sastra + Krem Emas
  {
    bgFrom: '#7C2D12',
    bgTo: '#B45309',
    accent: '#FDE047',
    badgeBg: 'rgba(253, 224, 71, 0.2)',
    badgeText: '#FEF9C3',
    patternType: 'circles',
  },
  // Ungu Sains & Seni + Amber
  {
    bgFrom: '#3B1D5E',
    bgTo: '#5B2C8D',
    accent: '#F59E0B',
    badgeBg: 'rgba(245, 158, 11, 0.22)',
    badgeText: '#FDE68A',
    patternType: 'waves',
  },
  // Biru Samudra + Oranye
  {
    bgFrom: '#0C4A6E',
    bgTo: '#0284C7',
    accent: '#FDBA74',
    badgeBg: 'rgba(253, 186, 116, 0.22)',
    badgeText: '#FFEDD5',
    patternType: 'grid',
  },
  // Merah Marun Sejarah + Emas
  {
    bgFrom: '#6D1A36',
    bgTo: '#9F1239',
    accent: '#FCD34D',
    badgeBg: 'rgba(252, 211, 77, 0.22)',
    badgeText: '#FEF3C7',
    patternType: 'diagonal',
  },
];

function computeInitials(mapel: string, judul: string): string {
  const source = (mapel || judul).trim();
  const specialMap: Record<string, string> = {
    'Bahasa Indonesia': 'BI',
    'Bahasa Indonesia Tingkat Lanjut': 'BIL',
    'Bahasa Inggris': 'ING',
    'Bahasa Inggris Tingkat Lanjut': 'IGL',
    'Bahasa Korea': 'KOR',
    'Bahasa Mandarin': 'MAN',
    Matematika: 'MTK',
    'Matematika Tingkat Lanjut': 'MTL',
    IPA: 'IPA',
    IPS: 'IPS',
    Fisika: 'FIS',
    Kimia: 'KIM',
    Biologi: 'BIO',
    Geografi: 'GEO',
    Ekonomi: 'EKO',
    Sosiologi: 'SOS',
    Antropologi: 'ANT',
    Sejarah: 'SEJ',
    'Pendidikan Pancasila': 'PP',
    PJOK: 'PJK',
    Informatika: 'INF',
    'KKA (Kecerdasan Artifisial)': 'KKA',
    Animasi: 'ANI',
    'Pengembangan Gim': 'GIM',
    Kuliner: 'KUL',
    'Dasar-Dasar Kuliner': 'KUL',
    'Dasar-Dasar Teknik Elektronika': 'ELK',
    'Dasar-Dasar Usaha Layanan Pariwisata': 'ULP',
    'Dasar-Dasar Manajemen Perkantoran dan Layanan Bisnis': 'MPLB',
    'Majalah Literasi': 'MJL',
    'Cerita Rakyat & Legenda': 'CRL',
    'Sastra & Sejarah': 'SAS',
    'Cerita Anak & Nusantara': 'LIT',
  };

  if (specialMap[source]) return specialMap[source];
  if (source.startsWith('Agama ')) {
    const sub = source.replace('Agama ', '').trim();
    return `AG${sub[0]?.toUpperCase() || ''}`;
  }
  if (source.startsWith('Seni ')) {
    const sub = source.replace('Seni ', '').trim();
    return `S${sub.slice(0, 2).toUpperCase()}`;
  }
  if (source.startsWith('Prakarya ')) {
    const sub = source.replace('Prakarya ', '').trim();
    return `PK${sub[0]?.toUpperCase() || ''}`;
  }

  const words = source
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0 && !['dan', 'di', 'ke', 'dari', 'yang', 'sang', 'si'].includes(w.toLowerCase()));

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return (words[0] || 'BK').slice(0, 3).toUpperCase();
}

function selectPaletteIndex(mapel: string): number {
  const m = mapel.toLowerCase();
  if (m.includes('matematika') || m.includes('informatika') || m.includes('kka') || m.includes('elektronika')) return 0;
  if (m.includes('biologi') || m.includes('ipa') || m.includes('fisika') || m.includes('kimia')) return 1;
  if (m.includes('bahasa') || m.includes('sastra')) return 2;
  if (m.includes('agama') || m.includes('kepercayaan') || m.includes('cerita anak')) return 3;
  if (m.includes('cerita rakyat') || m.includes('kuliner') || m.includes('prakarya')) return 4;
  if (m.includes('seni') || m.includes('animasi') || m.includes('gim') || m.includes('majalah')) return 5;
  if (m.includes('ekonomi') || m.includes('geografi') || m.includes('ips') || m.includes('pariwisata') || m.includes('perkantoran')) return 6;
  if (m.includes('sejarah') || m.includes('pancasila') || m.includes('sosiologi') || m.includes('antropologi') || m.includes('pjok')) return 7;

  let hash = 0;
  for (let i = 0; i < m.length; i++) {
    hash = (hash * 31 + m.charCodeAt(i)) >>> 0;
  }
  return hash % PALETTES.length;
}

export function getBookCoverPalette(mapel: string, judul: string): CoverPalette {
  const cacheKey = `${mapel}::${judul.slice(0, 12)}`;
  const cached = coverCache.get(cacheKey);
  if (cached) return cached;

  const base = PALETTES[selectPaletteIndex(mapel || judul)];
  const initials = computeInitials(mapel, judul);
  const result: CoverPalette = { ...base, initials };
  coverCache.set(cacheKey, result);
  return result;
}
