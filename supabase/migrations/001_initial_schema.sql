-- ============================================================
-- 001_initial_schema.sql
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────────
-- Cities (multi-city ready; Paris seeded below)
-- ────────────────────────────────────────────────
create table cities (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  slug       text not null unique,
  country    text not null default 'FR',
  created_at timestamptz not null default now()
);

insert into cities (name, slug, country) values ('Paris', 'paris', 'FR');

-- ────────────────────────────────────────────────
-- Profiles (mirrors auth.users 1-to-1)
-- ────────────────────────────────────────────────
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ────────────────────────────────────────────────
-- Enums
-- ────────────────────────────────────────────────
create type listing_type as enum ('ganze_wohnung', 'wg_zimmer', 'zwischenmiete');
create type listing_status as enum ('draft', 'active', 'paused', 'removed');

-- ────────────────────────────────────────────────
-- Listings
-- ────────────────────────────────────────────────
create table listings (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  city_id        uuid not null references cities(id),
  type           listing_type not null,
  title          text not null,
  description    text not null,
  kaltmiete      integer not null,       -- euros, whole number
  nebenkosten    integer,
  kaution        integer,
  size_sqm       numeric(5,1),
  rooms          numeric(3,1),
  furnished      boolean not null default false,
  available_from date not null,
  available_to   date,
  arrondissement smallint not null check (arrondissement between 1 and 20),
  quartier       text,
  lat            double precision,
  lng            double precision,
  status         listing_status not null default 'draft',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ────────────────────────────────────────────────
-- Listing photos
-- ────────────────────────────────────────────────
create table listing_photos (
  id           uuid primary key default uuid_generate_v4(),
  listing_id   uuid not null references listings(id) on delete cascade,
  storage_path text not null,
  position     smallint not null default 0,
  created_at   timestamptz not null default now()
);

-- ────────────────────────────────────────────────
-- Threads (one per listing × sender pair)
-- ────────────────────────────────────────────────
create table threads (
  id           uuid primary key default uuid_generate_v4(),
  listing_id   uuid not null references listings(id) on delete cascade,
  sender_id    uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (listing_id, sender_id, recipient_id)
);

-- ────────────────────────────────────────────────
-- Messages
-- ────────────────────────────────────────────────
create table messages (
  id         uuid primary key default uuid_generate_v4(),
  thread_id  uuid not null references threads(id) on delete cascade,
  sender_id  uuid not null references auth.users(id) on delete cascade,
  body       text not null,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────
-- Reports
-- ────────────────────────────────────────────────
create table reports (
  id          uuid primary key default uuid_generate_v4(),
  listing_id  uuid not null references listings(id) on delete cascade,
  reporter_id uuid references auth.users(id) on delete set null,
  reason      text not null,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles      enable row level security;
alter table listings      enable row level security;
alter table listing_photos enable row level security;
alter table threads        enable row level security;
alter table messages       enable row level security;
alter table reports        enable row level security;

-- Cities: public read, no write via API
alter table cities enable row level security;
create policy "Cities are public" on cities for select using (true);

-- Profiles
create policy "Profiles viewable by everyone" on profiles
  for select using (true);

create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Listings
create policy "Active listings viewable by everyone" on listings
  for select using (status = 'active' or auth.uid() = user_id);

create policy "Authenticated users can create listings" on listings
  for insert with check (auth.uid() = user_id);

create policy "Users can update own listings" on listings
  for update using (auth.uid() = user_id);

create policy "Users can delete own listings" on listings
  for delete using (auth.uid() = user_id);

-- Listing photos
create policy "Photos of viewable listings are viewable" on listing_photos
  for select using (
    exists (
      select 1 from listings l
      where l.id = listing_id
        and (l.status = 'active' or l.user_id = auth.uid())
    )
  );

create policy "Users can add photos to own listings" on listing_photos
  for insert with check (
    exists (
      select 1 from listings l
      where l.id = listing_id and l.user_id = auth.uid()
    )
  );

create policy "Users can delete photos from own listings" on listing_photos
  for delete using (
    exists (
      select 1 from listings l
      where l.id = listing_id and l.user_id = auth.uid()
    )
  );

-- Threads
create policy "Users can view own threads" on threads
  for select using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "Authenticated users can start threads" on threads
  for insert with check (auth.uid() = sender_id);

-- Messages
create policy "Thread participants can read messages" on messages
  for select using (
    exists (
      select 1 from threads t
      where t.id = thread_id
        and (t.sender_id = auth.uid() or t.recipient_id = auth.uid())
    )
  );

create policy "Thread participants can send messages" on messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from threads t
      where t.id = thread_id
        and (t.sender_id = auth.uid() or t.recipient_id = auth.uid())
    )
  );

-- Reports
create policy "Authenticated users can submit reports" on reports
  for insert with check (auth.uid() = reporter_id);

-- ============================================================
-- Triggers
-- ============================================================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure public.set_updated_at();

create trigger listings_updated_at
  before update on listings
  for each row execute procedure public.set_updated_at();
