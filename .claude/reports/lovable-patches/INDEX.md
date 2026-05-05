# Lovable Patches — Índice consolidado

> Este arquivo lista TODOS os patches que ainda precisam ser aplicados no Lovable Cloud (project_id `dboftogzjobfvtjaoifh`).
>
> **Como usar**: abra cada arquivo abaixo, copie o SQL/instruções, cola no chat do Lovable. Cada arquivo é independente — pode aplicar em qualquer ordem dentro do mesmo bloco.

## Status

- ✅ **Aplicados** (você colou e Lovable confirmou)
  - LV-03 — secret AI Gateway
  - BL-01 — Realtime Broadcast com triggers
  - BL-06 — `SET search_path` em SECURITY DEFINER funcs
  - BL-05 — wrapper `withErrorBoundary` nas 14 funcs IA
  - LV-04 — FK `tenant_members → profiles`
  - Hotfix — `broadcast_table_change` defensivo

- ⏳ **Pendentes** (precisam ser colados — Fase 6 completa)

## Bloco A — Migrations simples (rápidas)

Cole cada SQL abaixo no SQL Editor do Lovable, em qualquer ordem.

### A1 — projects.parent_id (Sub-fase 6B)

```sql
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_projects_parent ON public.projects(parent_id);
CREATE INDEX IF NOT EXISTS idx_projects_tenant_parent_sort ON public.projects(tenant_id, parent_id, sort_order);

CREATE OR REPLACE FUNCTION public.validate_project_depth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_depth integer := 1;
  v_current uuid := NEW.parent_id;
BEGIN
  IF NEW.parent_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.parent_id = NEW.id THEN RAISE EXCEPTION 'project cannot be parent of itself'; END IF;
  WHILE v_current IS NOT NULL LOOP
    v_depth := v_depth + 1;
    IF v_depth > 3 THEN RAISE EXCEPTION 'project hierarchy depth cannot exceed 3 levels'; END IF;
    SELECT parent_id INTO v_current FROM public.projects WHERE id = v_current;
    IF v_current = NEW.id THEN RAISE EXCEPTION 'cyclic project hierarchy detected'; END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_validate_project_depth
  BEFORE INSERT OR UPDATE OF parent_id ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.validate_project_depth();
```

### A2 — tasks.progress_pct (Sub-fase 6D)

```sql
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS progress_pct smallint NOT NULL DEFAULT 0
    CHECK (progress_pct >= 0 AND progress_pct <= 100);

COMMENT ON COLUMN public.tasks.progress_pct IS
  'Progresso manual 0-100. Independente de subtarefas.';
```

## Bloco D — Fase 7 (Coerência sistêmica + Notion+ClickUp parity)

| Sub-fase | Arquivo | O que faz |
|----------|---------|-----------|
| 7A.5 — Notificação de atribuição | [7A-task-assigned-trigger.sql.md](./7A-task-assigned-trigger.sql.md) | Cria `tg_notify_task_assigned` para inserir em `notifications` quando `tasks.assignee_id` muda |
| 7B — Custom Fields | [7B-custom-fields.sql.md](./7B-custom-fields.sql.md) | `custom_field_definitions` + `task_custom_field_values` (17 tipos: text, number, date, select, multi_select, checkbox, currency, rating, user, tag, file, formula, etc) com escopo global/task_type/project |
| 7C — Time Tracking | [7C-time-tracking.sql.md](./7C-time-tracking.sql.md) | Adiciona `billable`/`hourly_rate`/`tags` em `time_entries` + RPC `user_timesheet` (agregado dia a dia com receita) |
| 7D — Goals upgrade | [7D-goals-upgrade.sql.md](./7D-goals-upgrade.sql.md) | Adiciona `target_type`/`auto_update`/`linked_task_filter` em `key_results` + RPC `refresh_kr_progress(_tenant)` |
| 7E — Whiteboards | [7E-whiteboards.sql.md](./7E-whiteboards.sql.md) | Tabela `whiteboards` com snapshot JSON lib-agnostic (Excalidraw — MIT) |
| 7F — Dashboards customizáveis | [7F-dashboards.sql.md](./7F-dashboards.sql.md) | `dashboards` + `dashboard_widgets` (12 kinds) — canvas drag-drop com KPI/charts/listas/embeds |
| 7I — Automations upgrade | [7I-automations-upgrade.sql.md](./7I-automations-upgrade.sql.md) | ALTER `automation_rules` (icon/color/is_template/category) + 6 templates seeded |

## Bloco B — Schemas grandes (Fase 6F)

Cada um tem arquivo dedicado com SQL completo. Abra, copie inteiro, cola no Lovable.

| Sub-fase | Arquivo | Tabelas criadas |
|----------|---------|----------------|
| 6F.1 — Atendimento | [6F1-atendimento.sql.md](./6F1-atendimento.sql.md) | `tickets`, `ticket_messages`, `ticket_events` |
| 6F.2 — Wiki | [6F2-wiki.sql.md](./6F2-wiki.sql.md) | `wiki_pages`, `wiki_versions` + RPC `wiki_search` |
| 6F.3 — Personas | [6F3-personas.sql.md](./6F3-personas.sql.md) | `personas`, `audiences` + colunas em `tasks` |
| 6F.4 — Templates unificados | [6F4-templates-unified.sql.md](./6F4-templates-unified.sql.md) | `templates_unified` + RPC `use_unified_template` |

Aplicar em qualquer ordem (são independentes).

## Bloco C — Edge Functions

### C1 — Edge `ai-suggest-daily` (Sub-fase 6E)

Prompt pro Lovable:

> Criar Edge Function `ai-suggest-daily` (verify_jwt=true) que:
> - Recebe `{ tenant_id, user_id }`
> - Coleta tasks abertas do user (10 mais prioritárias), overdue count, conclusões últimos 30d, padrões por dia da semana
> - Chama Lovable AI Gateway (`google/gemini-2.5-flash`) com prompt PT-BR pedindo 3 recomendações + 1 padrão observado
> - Aplica `withErrorBoundary` (já existe em `_shared/`) com timeout 25s, retry 3x, fallback PT-BR
> - Persiste em `ai_interactions` (source="ai-suggest-daily")
> - Retorna `{ recommendations: [{ task_id, title, reason }], pattern: string, generated_at }`
>
> Tom: direto, motivador sem ser piegas, "você", proibido "consultoria".
>
> Adicionar ao `cron-tick`: `job=ai_suggest_daily` agendado às 06:00 diário pra pré-gerar pra cada user ativo (limit 100/exec).

### C2 — Google Calendar sync (Sub-fase 6G)

Prompt pro Lovable:

> Implementar two-way sync com Google Calendar. Aplicar:
>
> ```sql
> ALTER TABLE public.tasks
>   ADD COLUMN IF NOT EXISTS gcal_event_id text,
>   ADD COLUMN IF NOT EXISTS gcal_calendar_id text,
>   ADD COLUMN IF NOT EXISTS gcal_etag text,
>   ADD COLUMN IF NOT EXISTS gcal_last_synced_at timestamptz;
>
> CREATE INDEX IF NOT EXISTS idx_tasks_gcal_event ON public.tasks(gcal_event_id) WHERE gcal_event_id IS NOT NULL;
>
> CREATE TABLE IF NOT EXISTS public.gcal_sync_config (
>   user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
>   tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
>   oauth_connection_id uuid NOT NULL REFERENCES public.oauth_connections(id) ON DELETE CASCADE,
>   target_calendar_id text NOT NULL DEFAULT 'primary',
>   sync_pull_enabled boolean NOT NULL DEFAULT true,
>   sync_push_enabled boolean NOT NULL DEFAULT true,
>   last_pull_sync_token text,
>   last_push_at timestamptz,
>   created_at timestamptz NOT NULL DEFAULT now(),
>   updated_at timestamptz NOT NULL DEFAULT now()
> );
> ALTER TABLE public.gcal_sync_config ENABLE ROW LEVEL SECURITY;
> CREATE POLICY "user manages own gcal config" ON public.gcal_sync_config FOR ALL USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
> CREATE TRIGGER tg_gcal_sync_config_updated BEFORE UPDATE ON public.gcal_sync_config FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
> ```
>
> Edge Functions:
> - `gcal-sync-pull` (cron 15min): usa OAuth refresh token de `oauth_connections`, chama Calendar API com `syncToken`, UPSERT em `tasks` por `gcal_event_id`. Eventos cancelled → archived=true.
> - `gcal-sync-push` (cron 5min): tasks atualizadas desde `last_push_at` com `due_at` definido → POST/PATCH/DELETE no Calendar API. Salva `gcal_event_id` e `gcal_etag`.
> - `gcal-list-calendars`: GET simples retornando lista de calendars do user.
>
> Ambas com `withErrorBoundary` + structured logging.
> Adicionar ao `cron-tick`: `job=gcal_pull` (15min) e `job=gcal_push` (5min).
> Confirmar que escopo `https://www.googleapis.com/auth/calendar.events` está incluído na conexão OAuth Google.

## Validação final (após todos os patches)

Rodar:
1. Inserir 1 ticket de teste — confere se aparece no `/app/atendimento`.
2. Criar 1 wiki page — confere se a busca encontra.
3. Criar 1 persona — confere se aparece no seletor de "Estratégia" do TaskDetailSheet.
4. Aplicar 1 template unificado — confere se o picker abre e copia.
5. Conectar Google Calendar — após 5min, evento de uma task com due_at deve aparecer no GCal.
6. Chamar `/app/comecar` — DailyFocusCard deve gerar 3 recomendações.

Reportar no chat: confirmação de cada um dos 6 testes acima.
