-- Team invitations table (no RLS changes here); apply via Supabase SQL editor
create table if not exists public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  email text not null,
  role text not null check (role in ('owner','manager','technician','customer')),
  token uuid not null default gen_random_uuid(),
  invited_by uuid references public.profiles(id) on delete set null,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  is_revoked boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists team_invitations_token_key on public.team_invitations(token);
create index if not exists team_invitations_company_idx on public.team_invitations(company_id);
create index if not exists team_invitations_email_idx on public.team_invitations(email);






