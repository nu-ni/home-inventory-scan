-- AI Home Inventory – Supabase Schema
-- Ausführen: Supabase Dashboard -> SQL Editor -> diese Datei einfügen -> Run
-- (oder via Supabase CLI: supabase db push)

-- ---------------------------------------------------------------------------
-- Tabellen
-- ---------------------------------------------------------------------------

create table if not exists public.homes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  name text not null,
  category text,
  brand text,
  model text,
  color text,
  condition text check (condition in ('neu','sehr_gut','gut','gebraucht','defekt')),
  estimated_value_chf numeric(10, 2),
  quantity integer not null default 1,
  image_url text,
  notes text,
  source text not null default 'manual' check (source in ('ai','manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_rooms_home_id on public.rooms (home_id);
create index if not exists idx_items_room_id on public.items (room_id);

-- updated_at automatisch nachführen
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_items_updated_at on public.items;
create trigger trg_items_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: ein Nutzer sieht/bearbeitet nur seine eigenen Daten.
-- rooms/items haben keine eigene owner_id, sondern leiten den Besitz über
-- home_id -> homes.owner_id ab (klassisches Ownership-Chain-Pattern).
-- ---------------------------------------------------------------------------

alter table public.homes enable row level security;
alter table public.rooms enable row level security;
alter table public.items enable row level security;

create policy "homes: owner full access"
  on public.homes for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "rooms: owner full access"
  on public.rooms for all
  using (
    exists (select 1 from public.homes h where h.id = rooms.home_id and h.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.homes h where h.id = rooms.home_id and h.owner_id = auth.uid())
  );

create policy "items: owner full access"
  on public.items for all
  using (
    exists (
      select 1 from public.rooms r
      join public.homes h on h.id = r.home_id
      where r.id = items.room_id and h.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.rooms r
      join public.homes h on h.id = r.home_id
      where r.id = items.room_id and h.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Storage Bucket für Fotos (im Dashboard unter Storage einmalig anlegen,
-- ODER per SQL wie unten). Public Read, damit image_url direkt anzeigbar ist;
-- Upload nur für eingeloggte Nutzer.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('item-photos', 'item-photos', true)
on conflict (id) do nothing;

create policy "item-photos: authenticated upload"
  on storage.objects for insert
  with check (bucket_id = 'item-photos' and auth.role() = 'authenticated');

create policy "item-photos: public read"
  on storage.objects for select
  using (bucket_id = 'item-photos');

-- ---------------------------------------------------------------------------
-- Später (Familienmodus, siehe Konzept-Doc): home_members Tabelle mit
-- (home_id, user_id, role) ergänzen und obige Policies auf "exists in
-- home_members" statt nur "owner_id = auth.uid()" erweitern.
-- ---------------------------------------------------------------------------
