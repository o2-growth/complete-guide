create table if not exists public.project_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  name text not null,
  description text,
  icon text,
  color text,
  suggested_squad_id uuid references public.squads(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_templates_tenant_idx on public.project_templates(tenant_id);

alter table public.project_templates enable row level security;

drop policy if exists pt_read on public.project_templates;
create policy pt_read on public.project_templates
  for select to authenticated
  using (tenant_id in (select user_tenant_ids()));

drop policy if exists pt_manage on public.project_templates;
create policy pt_manage on public.project_templates
  for all to authenticated
  using (has_tenant_role(tenant_id, 'admin'::tenant_role) or has_tenant_role(tenant_id, 'manager'::tenant_role))
  with check (has_tenant_role(tenant_id, 'admin'::tenant_role) or has_tenant_role(tenant_id, 'manager'::tenant_role));

drop trigger if exists tg_project_templates_updated on public.project_templates;
create trigger tg_project_templates_updated
  before update on public.project_templates
  for each row execute procedure extensions.moddatetime(updated_at);

-- Salva projeto + tarefas como template
create or replace function public.save_project_as_template(
  p_project_id uuid,
  p_name text,
  p_description text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant uuid;
  v_template_id uuid;
  v_payload jsonb;
  v_proj record;
begin
  select * into v_proj from public.projects where id = p_project_id;
  if not found then
    raise exception 'Projeto não encontrado';
  end if;

  v_tenant := v_proj.tenant_id;

  if not (public.has_tenant_role(v_tenant, 'admin'::public.tenant_role)
       or public.has_tenant_role(v_tenant, 'manager'::public.tenant_role)) then
    raise exception 'Sem permissão';
  end if;

  select jsonb_build_object(
    'tasks',
    coalesce(jsonb_agg(jsonb_build_object(
      'title', t.title,
      'description', t.description,
      'priority', t.priority,
      'type_id', t.type_id,
      'status_id', t.status_id,
      'estimate_minutes', t.estimate_minutes,
      'checklist', t.checklist,
      'position', t.position
    ) order by t.position) filter (where t.id is not null), '[]'::jsonb)
  ) into v_payload
  from public.tasks t
  where t.project_id = p_project_id
    and t.archived = false
    and t.parent_task_id is null;

  insert into public.project_templates (tenant_id, name, description, icon, color, suggested_squad_id, payload, created_by)
  values (v_tenant, p_name, coalesce(p_description, v_proj.description), v_proj.icon, v_proj.color, v_proj.squad_id, v_payload, auth.uid())
  returning id into v_template_id;

  return v_template_id;
end;
$$;

-- Cria projeto a partir de template (clone com 1 clique)
create or replace function public.apply_project_template(
  p_template_id uuid,
  p_name text,
  p_key text,
  p_squad_id uuid default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_template public.project_templates;
  v_project_id uuid;
  v_task jsonb;
begin
  select * into v_template from public.project_templates where id = p_template_id;
  if not found then
    raise exception 'Template não encontrado';
  end if;

  if not (v_template.tenant_id in (select public.user_tenant_ids())) then
    raise exception 'Sem acesso';
  end if;

  insert into public.projects (tenant_id, name, key, squad_id, description, color, icon, created_by)
  values (
    v_template.tenant_id,
    p_name,
    upper(p_key),
    coalesce(p_squad_id, v_template.suggested_squad_id),
    v_template.description,
    v_template.color,
    v_template.icon,
    auth.uid()
  )
  returning id into v_project_id;

  for v_task in select * from jsonb_array_elements(coalesce(v_template.payload->'tasks', '[]'::jsonb))
  loop
    insert into public.tasks (
      tenant_id, project_id, title, description, priority, type_id, status_id,
      estimate_minutes, checklist, position, created_by
    ) values (
      v_template.tenant_id,
      v_project_id,
      coalesce(v_task->>'title', 'Tarefa'),
      v_task->>'description',
      coalesce((v_task->>'priority')::public.task_priority, 'none'::public.task_priority),
      nullif(v_task->>'type_id','')::uuid,
      nullif(v_task->>'status_id','')::uuid,
      nullif(v_task->>'estimate_minutes','')::int,
      coalesce(v_task->'checklist','[]'::jsonb),
      coalesce((v_task->>'position')::numeric, 0),
      auth.uid()
    );
  end loop;

  return v_project_id;
end;
$$;
