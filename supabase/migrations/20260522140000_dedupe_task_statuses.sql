-- Limpa duplicados de task_statuses gerados por loop antigo de ensure_user_workspace.
-- Mantém um canônico por (tenant_id, slug) e migra tasks que apontavam pros duplicados.
-- Adiciona UNIQUE(tenant_id, slug) pra prevenir regressão.

set search_path = public;

-- 1) Identifica canônico (mais antigo por slug) e duplicatas.
create temporary table _ts_canonical as
select distinct on (tenant_id, slug)
  id as canonical_id,
  tenant_id,
  slug
from public.task_statuses
order by tenant_id, slug, created_at asc;

create temporary table _ts_duplicates as
select ts.id as dup_id, c.canonical_id, ts.tenant_id, ts.slug
from public.task_statuses ts
join _ts_canonical c on c.tenant_id = ts.tenant_id and c.slug = ts.slug
where ts.id <> c.canonical_id;

-- 2) Migra tarefas: aponta status_id duplicado pro canônico.
update public.tasks t
set status_id = d.canonical_id, updated_at = now()
from _ts_duplicates d
where t.status_id = d.dup_id;

-- 3) Migra task_status_transitions (audit/historico) se a tabela existir.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'task_status_transitions'
  ) then
    execute $exec$
      update public.task_status_transitions tst
      set from_status_id = d.canonical_id
      from _ts_duplicates d
      where tst.from_status_id = d.dup_id;

      update public.task_status_transitions tst
      set to_status_id = d.canonical_id
      from _ts_duplicates d
      where tst.to_status_id = d.dup_id;
    $exec$;
  end if;
end $$;

-- 4) Migra assignment_matrix se existir.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'assignment_matrix'
  ) then
    execute $exec$
      update public.assignment_matrix am
      set status_id = d.canonical_id
      from _ts_duplicates d
      where am.status_id = d.dup_id;
    $exec$;
  end if;
end $$;

-- 5) Deleta os duplicados.
delete from public.task_statuses ts
using _ts_duplicates d
where ts.id = d.dup_id;

-- 6) Constraint que previne regressão. Idempotente.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'task_statuses_tenant_slug_unique'
  ) then
    alter table public.task_statuses
      add constraint task_statuses_tenant_slug_unique unique (tenant_id, slug);
  end if;
end $$;

-- 7) Limpeza
drop table if exists _ts_canonical;
drop table if exists _ts_duplicates;
