-- ===========================================================================
--  Manage Batch CDK — skema Supabase
--  Jalankan SEKALI di Supabase → SQL Editor → New query → tempel → Run.
--
--  Bentuknya sengaja sederhana: satu baris = satu project/orang/batch, isinya
--  disimpan apa adanya di kolom JSON. Jadi aplikasi tidak perlu diubah kalau
--  nanti ada kolom baru (mis. tenggat, tanda urgent, terjemahan brief).
-- ===========================================================================

create table if not exists public.projects (
  id          text primary key,
  data        jsonb       not null,
  diperbarui  timestamptz not null default now()
);
create table if not exists public.tim (
  id          text primary key,
  data        jsonb       not null,
  diperbarui  timestamptz not null default now()
);
create table if not exists public.batches (
  id          text primary key,
  data        jsonb       not null,
  diperbarui  timestamptz not null default now()
);

create index if not exists projects_diperbarui_idx on public.projects (diperbarui desc);
create index if not exists tim_diperbarui_idx      on public.tim      (diperbarui desc);
create index if not exists batches_diperbarui_idx  on public.batches  (diperbarui desc);

-- ---------------------------------------------------------------------------
--  Keamanan: tim memakai aplikasi TANPA login, jadi kunci publik (anon) boleh
--  membaca, menambah, dan mengubah — tapi TIDAK BOLEH MENGHAPUS baris.
--  Penghapusan di aplikasi hanya menandai data.dihapus = true, sehingga
--  data yang terlanjur terhapus selalu bisa dikembalikan.
-- ---------------------------------------------------------------------------
alter table public.projects enable row level security;
alter table public.tim      enable row level security;
alter table public.batches  enable row level security;

do $$
declare t text;
begin
  foreach t in array array['projects','tim','batches'] loop
    execute format('drop policy if exists "baca %1$s"   on public.%1$I', t);
    execute format('drop policy if exists "tambah %1$s" on public.%1$I', t);
    execute format('drop policy if exists "ubah %1$s"   on public.%1$I', t);
    execute format('create policy "baca %1$s"   on public.%1$I for select to anon, authenticated using (true)', t);
    execute format('create policy "tambah %1$s" on public.%1$I for insert to anon, authenticated with check (true)', t);
    execute format('create policy "ubah %1$s"   on public.%1$I for update to anon, authenticated using (true) with check (true)', t);
    -- sengaja TIDAK ada policy DELETE
  end loop;
end $$;

-- ---------------------------------------------------------------------------
--  Satu panggilan ringan untuk menanyakan "ada yang berubah?" tanpa menarik
--  seluruh data. Dipakai aplikasi tiap 5 detik; balasannya cuma satu tanggal.
-- ---------------------------------------------------------------------------
create or replace function public.cap_perubahan()
returns timestamptz language sql stable as $$
  select greatest(
    coalesce((select max(diperbarui) from public.projects), 'epoch'::timestamptz),
    coalesce((select max(diperbarui) from public.tim),      'epoch'::timestamptz),
    coalesce((select max(diperbarui) from public.batches),  'epoch'::timestamptz));
$$;
grant execute on function public.cap_perubahan() to anon, authenticated;

-- ---------------------------------------------------------------------------
--  Selesai. Langkah berikutnya:
--  1. Settings → API → salin "Project URL" dan kunci "anon public".
--  2. Buka aplikasi → ⚙ → tempel keduanya → Simpan pengaturan.
--  3. Tekan "Kirim semua data ke Supabase" sekali untuk mengisi tabel ini
--     dari daftar yang sekarang.
-- ---------------------------------------------------------------------------
