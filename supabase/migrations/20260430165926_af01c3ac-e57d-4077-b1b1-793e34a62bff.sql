create table if not exists public.sla_policies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  name text not null,
  type_id uuid references public.task_types(id) on delete cascade,
  priority public.task_priority,
  response_hours numeric not null default 4,
  resolution_hours numeric not null default 24,
  warning_threshold_pct integer not null default 75,
  business_hours_only boolean not null default false,
  active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sla_policies_tenant_idx on public.sla_policies(tenant_id);
create index if not exists sla_policies_type_idx on public.sla_policies(type_id) where type_id is not null;

alter table public.sla_policies enable row level security;

drop policy if exists sla_read on public.sla_policies;
create policy sla_read on public.sla_policies
  for select to authenticated
  using (tenant_id in (select user_tenant_ids()));

drop policy if exists sla_manage on public.sla_policies;
create policy sla_manage on public.sla_policies
  for all to authenticated
  using (has_tenant_role(tenant_id, 'admin'::tenant_role) or has_tenant_role(tenant_id, 'manager'::tenant_role))
  with check (has_tenant_role(tenant_id, 'admin'::tenant_role) or has_tenant_role(tenant_id, 'manager'::tenant_role));

drop trigger if exists tg_sla_policies_updated on public.sla_policies;
create trigger tg_sla_policies_updated
  before update on public.sla_policies
  for each row execute procedure extensions.moddatetime(updated_at);

create or replace function public.resolve_task_sla(p_task_id uuid)
returns public.sla_policies
language sql
stable
security definer
set search_path = public
as $$
  select sp.*
  from public.sla_policies sp
  join public.tasks t on t.tenant_id = sp.tenant_id
  where t.id = p_task_id
    and sp.active = true
    and (sp.type_id is null or sp.type_id = t.type_id)
    and (sp.priority is null or sp.priority = t.priority)
  order by
    (case when sp.type_id = t.type_id then 0 else 1 end),
    (case when sp.priority = t.priority then 0 else 1 end),
    sp.created_at desc
  limit 1
$$;
