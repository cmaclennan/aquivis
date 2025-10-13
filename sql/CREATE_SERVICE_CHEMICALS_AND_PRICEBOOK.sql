-- Company pricebook for chemicals (minimal v1)
create table if not exists public.company_chemical_prices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  chemical_code text not null,
  unit text not null,
  price_per_unit numeric(12,4) not null check (price_per_unit >= 0),
  effective_at timestamptz not null default now(),
  property_id uuid references public.properties(id) on delete cascade,
  created_at timestamptz default now()
);

create index if not exists idx_company_prices_company on public.company_chemical_prices(company_id);
create index if not exists idx_company_prices_code on public.company_chemical_prices(chemical_code);
create index if not exists idx_company_prices_property on public.company_chemical_prices(property_id);


