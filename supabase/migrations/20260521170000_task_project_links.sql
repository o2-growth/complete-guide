-- Vínculos adicionais tarefa ↔ projeto (produto do pipe / projeto manual).
-- A tarefa continua com project_id como lista/projeto principal; aqui ficam relações extras.

create table if not exists public.task_project_links (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  link_kind text not null default 'related'
    check (link_kind in ('related', 'product')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  unique (task_id, project_id)
);

create index if not exists task_project_links_task_idx
  on public.task_project_links (task_id);

create index if not exists task_project_links_project_idx
  on public.task_project_links (tenant_id, project_id);

alter table public.task_project_links enable row level security;

drop policy if exists "task_project_links_select" on public.task_project_links;
create policy "task_project_links_select"
  on public.task_project_links for select
  using (tenant_id in (select public.user_tenant_ids()));

drop policy if exists "task_project_links_insert" on public.task_project_links;
create policy "task_project_links_insert"
  on public.task_project_links for insert
  with check (
    tenant_id in (select public.user_tenant_ids())
    and exists (
      select 1 from public.tasks t
      where t.id = task_id and t.tenant_id = task_project_links.tenant_id
    )
  );

drop policy if exists "task_project_links_delete" on public.task_project_links;
create policy "task_project_links_delete"
  on public.task_project_links for delete
  using (tenant_id in (select public.user_tenant_ids()));
