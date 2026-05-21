alter table public.projects add column if not exists pipefy_card_id text;
alter table public.projects add column if not exists pipefy_pipe_id text;
alter table public.projects add column if not exists pipefy_url text;
alter table public.projects add column if not exists pipefy_phase_name text;
alter table public.projects add column if not exists pipefy_last_synced_at timestamptz;
alter table public.projects add column if not exists pipefy_metadata jsonb;

create unique index if not exists projects_tenant_pipefy_card_idx
  on public.projects (tenant_id, pipefy_card_id) where pipefy_card_id is not null;
create index if not exists projects_pipefy_pipe_idx
  on public.projects (tenant_id, pipefy_pipe_id) where pipefy_pipe_id is not null;

create table if not exists public.pipefy_integrations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  pipe_id text not null,
  pipe_name text,
  enabled boolean not null default true,
  active_only boolean not null default true,
  last_sync_at timestamptz,
  last_sync_status text,
  last_sync_count integer,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, pipe_id)
);

alter table public.pipefy_integrations enable row level security;

drop policy if exists "pipefy_integrations_select" on public.pipefy_integrations;
create policy "pipefy_integrations_select" on public.pipefy_integrations for select
  using (tenant_id in (select public.user_tenant_ids()));

drop policy if exists "pipefy_integrations_insert" on public.pipefy_integrations;
create policy "pipefy_integrations_insert" on public.pipefy_integrations for insert
  with check (public.has_tenant_role(tenant_id, 'admin'::tenant_role));

drop policy if exists "pipefy_integrations_update" on public.pipefy_integrations;
create policy "pipefy_integrations_update" on public.pipefy_integrations for update
  using (public.has_tenant_role(tenant_id, 'admin'::tenant_role));

drop policy if exists "pipefy_integrations_delete" on public.pipefy_integrations;
create policy "pipefy_integrations_delete" on public.pipefy_integrations for delete
  using (public.has_tenant_role(tenant_id, 'admin'::tenant_role));

drop trigger if exists tg_pipefy_integrations_updated_at on public.pipefy_integrations;
create trigger tg_pipefy_integrations_updated_at
  before update on public.pipefy_integrations
  for each row execute function public.set_updated_at();