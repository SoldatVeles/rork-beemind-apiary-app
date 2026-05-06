-- BeeMind MVP – inspection form extras
-- Adds the fields the simplified MVP inspection form needs:
--   • population_strength (weak / medium / strong)
--   • queen_seen          (boolean)
--   • honey_stores        (low / medium / high)
-- Also relaxes the brood_pattern check to accept the friendlier
-- vocabulary used by the form (none / poor / good / excellent)
-- alongside the legacy values (solid / spotty).
--
-- Safe to re-run.

alter table public.inspections
  add column if not exists population_strength text,
  add column if not exists queen_seen boolean,
  add column if not exists honey_stores text;

-- Enforce allowed values without breaking existing rows.
alter table public.inspections
  drop constraint if exists inspections_population_strength_check;
alter table public.inspections
  add constraint inspections_population_strength_check
  check (population_strength is null or population_strength in ('weak','medium','strong'));

alter table public.inspections
  drop constraint if exists inspections_honey_stores_check;
alter table public.inspections
  add constraint inspections_honey_stores_check
  check (honey_stores is null or honey_stores in ('low','medium','high'));

alter table public.inspections
  drop constraint if exists inspections_brood_pattern_check;
alter table public.inspections
  add constraint inspections_brood_pattern_check
  check (
    brood_pattern is null
    or brood_pattern in ('solid','spotty','none','poor','good','excellent')
  );
