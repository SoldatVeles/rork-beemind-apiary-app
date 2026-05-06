-- BeeMind Core MVP Schema
-- One migration to set up the core tables, RLS, and policies.
-- Safe to run on a fresh Supabase project. Idempotent where reasonable.

-- ─────────────────────────────────────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: updated_at trigger
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- profiles  (1:1 with auth.users)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create a profile row when a new auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', null))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- yards
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.yards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  address text,
  latitude double precision,
  longitude double precision,
  elevation_m double precision,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_yards_user_id on public.yards(user_id);

drop trigger if exists trg_yards_updated_at on public.yards;
create trigger trg_yards_updated_at
  before update on public.yards
  for each row execute function public.set_updated_at();

alter table public.yards enable row level security;
drop policy if exists "yards_owner_all" on public.yards;
create policy "yards_owner_all" on public.yards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- hives
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.hives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  yard_id uuid not null references public.yards(id) on delete cascade,
  label text not null,
  hive_type text not null default 'Langstroth',
  frames integer not null default 10,
  status text not null default 'Active' check (status in ('Active','Split','Deadout')),
  latitude double precision,
  longitude double precision,
  notes text,
  qr_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_hives_user_id on public.hives(user_id);
create index if not exists idx_hives_yard_id on public.hives(yard_id);

drop trigger if exists trg_hives_updated_at on public.hives;
create trigger trg_hives_updated_at
  before update on public.hives
  for each row execute function public.set_updated_at();

alter table public.hives enable row level security;
drop policy if exists "hives_owner_all" on public.hives;
create policy "hives_owner_all" on public.hives
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- queens
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.queens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hive_id uuid references public.hives(id) on delete set null,
  hatch_date date,
  origin text,
  mark_color text,
  temperament integer check (temperament between 1 and 5),
  status text not null default 'Active' check (status in ('Active','Superseded','Lost','Dead')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_queens_user_id on public.queens(user_id);
create index if not exists idx_queens_hive_id on public.queens(hive_id);

drop trigger if exists trg_queens_updated_at on public.queens;
create trigger trg_queens_updated_at
  before update on public.queens
  for each row execute function public.set_updated_at();

alter table public.queens enable row level security;
drop policy if exists "queens_owner_all" on public.queens;
create policy "queens_owner_all" on public.queens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- inspections
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.inspections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hive_id uuid not null references public.hives(id) on delete cascade,
  performed_at timestamptz not null default now(),
  brood_pattern text check (brood_pattern in ('solid','spotty','none')),
  eggs_seen boolean,
  larvae_seen boolean,
  stores_kg numeric,
  mites_per_100 numeric,
  temper integer check (temper between 1 and 5),
  supers_delta integer,
  notes text,
  weather_json jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_inspections_user_id on public.inspections(user_id);
create index if not exists idx_inspections_hive_id on public.inspections(hive_id);

drop trigger if exists trg_inspections_updated_at on public.inspections;
create trigger trg_inspections_updated_at
  before update on public.inspections
  for each row execute function public.set_updated_at();

alter table public.inspections enable row level security;
drop policy if exists "inspections_owner_all" on public.inspections;
create policy "inspections_owner_all" on public.inspections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- tasks
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null default 'org' check (scope in ('org','yard','hive')),
  yard_id uuid references public.yards(id) on delete cascade,
  hive_id uuid references public.hives(id) on delete cascade,
  title text not null,
  notes text,
  due_at timestamptz,
  recurrence text,
  priority smallint not null default 2 check (priority in (1,2,3)),
  assignee uuid references auth.users(id) on delete set null,
  is_done boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_tasks_hive_id on public.tasks(hive_id);
create index if not exists idx_tasks_yard_id on public.tasks(yard_id);

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

alter table public.tasks enable row level security;
drop policy if exists "tasks_owner_all" on public.tasks;
create policy "tasks_owner_all" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- harvests
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.harvests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  yard_id uuid references public.yards(id) on delete set null,
  hive_id uuid references public.hives(id) on delete set null,
  frames_spun integer not null default 0,
  weight_kg numeric not null default 0,
  moisture_pct numeric,
  lot_code text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_harvests_user_id on public.harvests(user_id);
create index if not exists idx_harvests_hive_id on public.harvests(hive_id);
create index if not exists idx_harvests_yard_id on public.harvests(yard_id);

drop trigger if exists trg_harvests_updated_at on public.harvests;
create trigger trg_harvests_updated_at
  before update on public.harvests
  for each row execute function public.set_updated_at();

alter table public.harvests enable row level security;
drop policy if exists "harvests_owner_all" on public.harvests;
create policy "harvests_owner_all" on public.harvests
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- inventory_items
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null default 'other'
    check (category in ('equipment','feed','medication','packaging','other')),
  quantity numeric not null default 0,
  unit text not null default 'pcs',
  min_quantity numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_inventory_user_id on public.inventory_items(user_id);

drop trigger if exists trg_inventory_updated_at on public.inventory_items;
create trigger trg_inventory_updated_at
  before update on public.inventory_items
  for each row execute function public.set_updated_at();

alter table public.inventory_items enable row level security;
drop policy if exists "inventory_owner_all" on public.inventory_items;
create policy "inventory_owner_all" on public.inventory_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- user_preferences  (1:1 per user — settings)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  experience_level text check (experience_level in ('beginner','intermediate','advanced')),
  has_completed_onboarding boolean not null default false,
  language text not null default 'en',
  unit_system text not null default 'metric' check (unit_system in ('metric','imperial')),
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_user_preferences_updated_at on public.user_preferences;
create trigger trg_user_preferences_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

alter table public.user_preferences enable row level security;
drop policy if exists "user_preferences_owner_all" on public.user_preferences;
create policy "user_preferences_owner_all" on public.user_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
