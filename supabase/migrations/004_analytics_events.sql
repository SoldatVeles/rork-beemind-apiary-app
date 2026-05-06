-- BeeMind analytics_events table
-- Lightweight, first-party analytics. No third-party trackers.
-- Stores only meaningful product events (counts, ids, simple metadata).

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  event_name text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_analytics_events_user_id
  on public.analytics_events(user_id);
create index if not exists idx_analytics_events_event_name
  on public.analytics_events(event_name);
create index if not exists idx_analytics_events_created_at
  on public.analytics_events(created_at desc);

alter table public.analytics_events enable row level security;

-- A user can insert their own events. Anonymous events (user_id null)
-- such as user_signed_up are also allowed.
drop policy if exists "analytics_events_insert_own" on public.analytics_events;
create policy "analytics_events_insert_own" on public.analytics_events
  for insert
  with check (
    user_id is null
    or auth.uid() = user_id
  );

-- A user can read back their own events (useful for debugging).
drop policy if exists "analytics_events_select_own" on public.analytics_events;
create policy "analytics_events_select_own" on public.analytics_events
  for select
  using (auth.uid() = user_id);
