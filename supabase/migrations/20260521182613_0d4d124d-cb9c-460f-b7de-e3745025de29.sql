create table if not exists public.task_project_links (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  link_kind text not null default 'product' check (link_kind in ('product','related')),
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (task_id, project_id, link_kind)
);

create index if not exists task_project_links_task_idx on public.task_project_links(task_id);
create index if not exists task_project_links_project_idx on public.task_project_links(project_id);

alter table public.task_project_links enable row level security;

drop policy if exists "tpl_select" on public.task_project_links;
create policy "tpl_select" on public.task_project_links for select
  using (tenant_id in (select public.user_tenant_ids()));

drop policy if exists "tpl_insert" on public.task_project_links;
create policy "tpl_insert" on public.task_project_links for insert
  with check (tenant_id in (select public.user_tenant_ids()));

drop policy if exists "tpl_delete" on public.task_project_links;
create policy "tpl_delete" on public.task_project_links for delete
  using (tenant_id in (select public.user_tenant_ids()));