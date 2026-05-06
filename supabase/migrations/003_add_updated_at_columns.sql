-- Fix: add missing updated_at columns and (re)attach the set_updated_at trigger
-- to all core tables. Older instances of the schema may have created tables
-- without the updated_at column, which causes:
--   ERROR: record "new" has no field "updated_at"
-- on UPDATE.

-- Helper (idempotent)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Add updated_at to every core table if missing
alter table if exists public.profiles         add column if not exists updated_at timestamptz not null default now();
alter table if exists public.yards            add column if not exists updated_at timestamptz not null default now();
alter table if exists public.hives            add column if not exists updated_at timestamptz not null default now();
alter table if exists public.queens           add column if not exists updated_at timestamptz not null default now();
alter table if exists public.inspections      add column if not exists updated_at timestamptz not null default now();
alter table if exists public.tasks            add column if not exists updated_at timestamptz not null default now();
alter table if exists public.harvests         add column if not exists updated_at timestamptz not null default now();
alter table if exists public.inventory_items  add column if not exists updated_at timestamptz not null default now();
alter table if exists public.user_preferences add column if not exists updated_at timestamptz not null default now();

-- Re-attach triggers (drop+create makes it idempotent)
do $$
declare
  t text;
  tables text[] := array[
    'profiles','yards','hives','queens','inspections',
    'tasks','harvests','inventory_items','user_preferences'
  ];
begin
  foreach t in array tables loop
    if to_regclass(format('public.%I', t)) is not null then
      execute format('drop trigger if exists trg_%I_updated_at on public.%I;', t, t);
      execute format(
        'create trigger trg_%I_updated_at before update on public.%I
         for each row execute function public.set_updated_at();',
        t, t
      );
    end if;
  end loop;
end $$;
