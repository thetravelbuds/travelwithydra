-- Per-country government visa fee and travelwithydra service fee for supported eVisa destinations.

create table if not exists public.evisa_country_fees (
  country_code text primary key,
  country_name text not null,
  visa_fee_gbp numeric(10, 2) not null check (visa_fee_gbp >= 0),
  service_fee_gbp numeric(10, 2) not null check (service_fee_gbp >= 0),
  updated_at timestamptz not null default now()
);

create index if not exists evisa_country_fees_updated_at_idx
  on public.evisa_country_fees (updated_at desc);

alter table public.evisa_country_fees enable row level security;

drop policy if exists "Public read evisa country fees" on public.evisa_country_fees;
create policy "Public read evisa country fees"
  on public.evisa_country_fees
  for select
  using (true);

comment on table public.evisa_country_fees is
  'Admin-managed visa and service fees for eVisa destinations offered on travelwithydra.';
