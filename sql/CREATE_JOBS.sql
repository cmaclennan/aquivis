-- Jobs table for repairs/installations/inspections and other one-off work

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  property_id uuid references properties(id) on delete set null,
  unit_id uuid references units(id) on delete set null,
  plant_room_id uuid references plant_rooms(id) on delete set null,
  external_contact jsonb, -- {name,email,phone,address}
  title text not null,
  job_type text not null check (job_type in ('repair','installation','inspection','other')),
  description text,
  status text not null default 'draft' check (status in ('draft','scheduled','in_progress','completed','cancelled')),
  scheduled_at timestamptz,
  completed_at timestamptz,
  materials jsonb, -- array of {name,qty,unit_cost_cents}
  labor_minutes int,
  price_cents int,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_jobs_company on jobs(company_id);
create index if not exists idx_jobs_customer on jobs(customer_id);
create index if not exists idx_jobs_property on jobs(property_id);
create index if not exists idx_jobs_unit on jobs(unit_id);
create index if not exists idx_jobs_plant_room on jobs(plant_room_id);
create index if not exists idx_jobs_status on jobs(status);
create index if not exists idx_jobs_scheduled_at on jobs(scheduled_at);




