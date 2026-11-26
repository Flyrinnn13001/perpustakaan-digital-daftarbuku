-- ============================================================================
-- SKEMA DATABASE SUPABASE: Perpustakaan Digital DaftarBuku
-- Sumber Data Utama: Google Drive Folder 1Du4ZdTS22RuSDdP8Zr9_YVVKZud0_dlI
-- ============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.bacaan (
  id text primary key default ('buku-' || substr(gen_random_uuid()::text, 1, 8)),
  judul text not null,
  judul_asli text,
  kelas text not null check (kelas in ('Umum', 'X', 'XI', 'XII')),
  mapel text not null default '',
  drive_link text not null,
  drive_file_id text,
  folder_file_id text,
  status text not null default 'aktif' check (status in ('aktif', 'nonaktif')),
  jenis text not null default 'BS' check (jenis in ('Umum', 'BS', 'BG')),
  ukuran_file bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bacaan_status_kelas on public.bacaan (status, kelas);
create index if not exists idx_bacaan_mapel on public.bacaan (mapel);
create index if not exists idx_bacaan_jenis on public.bacaan (jenis);
create unique index if not exists idx_bacaan_kelas_judul_unique on public.bacaan (kelas, lower(judul));

-- Tabel Riwayat & Bookmark per Pengguna (Opsional Cloud Sync)
create table if not exists public.riwayat_baca (
  id uuid primary key default gen_random_uuid(),
  user_key text not null,
  bacaan_id text not null references public.bacaan(id) on delete cascade,
  halaman_terakhir integer not null default 1,
  total_halaman integer,
  catatan_bookmark text,
  last_read_at timestamptz not null default now(),
  unique (user_key, bacaan_id)
);

-- Tabel Favorit per Pengguna (Opsional Cloud Sync)
create table if not exists public.favorit_bacaan (
  id uuid primary key default gen_random_uuid(),
  user_key text not null,
  bacaan_id text not null references public.bacaan(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_key, bacaan_id)
);

-- Row Level Security (RLS)
alter table public.bacaan enable row level security;
alter table public.riwayat_baca enable row level security;
alter table public.favorit_bacaan enable row level security;

-- Kebijakan baca publik untuk buku aktif & kelola katalog
drop policy if exists "Semua pengguna dapat membaca katalog" on public.bacaan;
create policy "Semua pengguna dapat membaca katalog"
  on public.bacaan for select
  using (true);

drop policy if exists "Admin dapat menambah dan mengubah katalog" on public.bacaan;
create policy "Admin dapat menambah dan mengubah katalog"
  on public.bacaan for all
  using (true)
  with check (true);

drop policy if exists "Pengguna dapat mengelola riwayat baca sendiri" on public.riwayat_baca;
create policy "Pengguna dapat mengelola riwayat baca sendiri"
  on public.riwayat_baca for all
  using (true)
  with check (true);

drop policy if exists "Pengguna dapat mengelola favorit sendiri" on public.favorit_bacaan;
create policy "Pengguna dapat mengelola favorit sendiri"
  on public.favorit_bacaan for all
  using (true)
  with check (true);
