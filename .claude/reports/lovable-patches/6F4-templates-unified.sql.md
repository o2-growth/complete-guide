# Patch SQL — 6F.4 Templates unificados

**Status:** [lovable] aguardando aplicação no Supabase Cloud (`dboftogzjobfvtjaoifh`).
**Escopo:** cria a entidade unificada `templates_unified` com filtro por `kind`. NÃO migra nem deprecata `templates`/`caption_snippets`/`demand_forms` — convivência intencional.
**Frontend:** já usa `templates_unified` via hooks `useUnifiedTemplates*` em `/app/modelos` e nos pickers reutilizáveis.

## Schema do `body` por `kind`

`body jsonb` carrega o payload específico — cada `kind` tem sua estrutura. Documentado para consumo no frontend:

| `kind`            | Estrutura esperada de `body`                                                                 |
|-------------------|----------------------------------------------------------------------------------------------|
| `project`         | `{ name, description, sections: [{ name, tasks: [...] }] }`                                  |
| `task_checklist`  | `{ items: [{ text: string, required: boolean }] }`                                           |
| `message`         | `{ subject?: string, body: string, variables?: [{ key: string, default?: string }] }` (Mustache `{{first_name}}`) |
| `form`            | `{ fields: [{ name: string, type: 'text'\|'textarea'\|'select'\|'number'\|'date', required: boolean, options?: string[] }] }` |
| `brief`           | `{ context: string, target: string, deliverables: string, deadline_template: string }`       |
| `content_caption` | `{ text: string, channels: ('instagram'\|'linkedin'\|'tiktok'\|'facebook'\|'youtube'\|'twitter'\|'email'\|'other')[] }` |
| `hashtag_group`   | `{ tags: string[] }`                                                                         |

## SQL

```sql
-- =============================================================================
-- 6F.4 — Templates unificados
-- =============================================================================

create table if not exists public.templates_unified (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  kind text not null check (kind in (
    'project',
    'task_checklist',
    'message',
    'form',
    'brief',
    'content_caption',
    'hashtag_group'
  )),
  name text not null,
  description text,
  body jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}',
  is_pinned boolean not null default false,
  use_count int not null default 0,
  last_used_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, kind, name)
);

create index if not exists idx_templates_unified_tenant_kind
  on public.templates_unified (tenant_id, kind);

create index if not exists idx_templates_unified_pinned
  on public.templates_unified (tenant_id, is_pinned)
  where is_pinned;

create index if not exists idx_templates_unified_tags
  on public.templates_unified using gin (tags);

-- updated_at trigger (assume helper genérico tg_set_updated_at já existe)
drop trigger if exists tg_templates_unified_updated_at on public.templates_unified;
create trigger tg_templates_unified_updated_at
  before update on public.templates_unified
  for each row execute function public.tg_set_updated_at();

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.templates_unified enable row level security;

drop policy if exists "templates_unified_select" on public.templates_unified;
create policy "templates_unified_select"
  on public.templates_unified
  for select
  using (tenant_id in (select public.user_tenant_ids()));

drop policy if exists "templates_unified_insert" on public.templates_unified;
create policy "templates_unified_insert"
  on public.templates_unified
  for insert
  with check (
    tenant_id in (select public.user_tenant_ids())
    and (created_by = (select auth.uid()) or created_by is null)
  );

drop policy if exists "templates_unified_update" on public.templates_unified;
create policy "templates_unified_update"
  on public.templates_unified
  for update
  using (tenant_id in (select public.user_tenant_ids()))
  with check (tenant_id in (select public.user_tenant_ids()));

drop policy if exists "templates_unified_delete" on public.templates_unified;
create policy "templates_unified_delete"
  on public.templates_unified
  for delete
  using (
    tenant_id in (select public.user_tenant_ids())
    and (
      public.has_tenant_role('admin', tenant_id)
      or public.has_tenant_role('manager', tenant_id)
      or created_by = (select auth.uid())
    )
  );

-- =============================================================================
-- RPC: use_unified_template
-- Incrementa use_count + last_used_at e devolve o body para o cliente aplicar.
-- =============================================================================
create or replace function public.use_unified_template(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_body jsonb;
  v_tenant uuid;
begin
  select tenant_id, body into v_tenant, v_body
  from public.templates_unified
  where id = p_id;

  if v_tenant is null then
    raise exception 'Template não encontrado';
  end if;

  if v_tenant not in (select public.user_tenant_ids()) then
    raise exception 'Sem permissão para este template';
  end if;

  update public.templates_unified
  set use_count = use_count + 1,
      last_used_at = now()
  where id = p_id;

  return v_body;
end;
$$;

revoke all on function public.use_unified_template(uuid) from public;
grant execute on function public.use_unified_template(uuid) to authenticated;
```

## Notas

- Sem migração de `templates`, `caption_snippets`, `demand_forms` — todas seguem operando.
- `unique (tenant_id, kind, name)` evita duplicatas dentro do mesmo `kind` por tenant.
- `tg_set_updated_at`, `user_tenant_ids()` e `has_tenant_role(...)` já existem (CLAUDE.md §4 — helpers RLS).
- Após aplicar, regenerar `src/integrations/supabase/types.ts` no Lovable e remover os casts `as never`/`as unknown` dos hooks.
