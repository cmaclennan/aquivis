-- Link portal users to customers (many users per customer)
create table if not exists public.customer_user_links (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(customer_id, user_id)
);

-- Extend team_invitations to capture intended customer
alter table public.team_invitations
  add column if not exists customer_id uuid references public.customers(id) on delete set null;






