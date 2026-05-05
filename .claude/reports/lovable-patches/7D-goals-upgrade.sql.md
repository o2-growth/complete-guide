# 7D — Goals upgrade (Targets tipados + auto-progress)

> **Sub-fase 7D — Paridade ClickUp/Notion.** Estende `key_results` com
> `target_type` (numeric/monetary/tasks/boolean/percentage), `auto_update`
> e `linked_task_filter` (jsonb). Cria `refresh_kr_progress(_tenant)` que
> atualiza KRs do tipo `tasks` somando tarefas concluídas que casam com o
> filtro vinculado.
>
> **Aplicar no Lovable Cloud** (`project_id = dboftogzjobfvtjaoifh`).

## SQL

```sql
ALTER TABLE public.key_results
  ADD COLUMN IF NOT EXISTS target_type text NOT NULL DEFAULT 'numeric'
    CHECK (target_type IN ('numeric','monetary','tasks','boolean','percentage')),
  ADD COLUMN IF NOT EXISTS auto_update boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS linked_task_filter jsonb;

-- (unit já existe; mantido para idempotência semântica)

-- RPC: atualiza key_results com auto_update=true baseado em tasks vinculadas
CREATE OR REPLACE FUNCTION public.refresh_kr_progress(_tenant uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  kr record;
  v_value numeric;
BEGIN
  IF NOT (_tenant IN (SELECT public.user_tenant_ids())) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  FOR kr IN
    SELECT k.*
    FROM public.key_results k
    JOIN public.goals g ON g.id = k.goal_id
    WHERE g.tenant_id = _tenant
      AND k.auto_update = true
  LOOP
    IF kr.target_type = 'tasks' THEN
      SELECT COUNT(*)::numeric INTO v_value
      FROM public.tasks t
      WHERE t.tenant_id = _tenant
        AND t.done_at IS NOT NULL
        AND (
          kr.linked_task_filter IS NULL
          OR kr.linked_task_filter->>'project_id' IS NULL
          OR t.project_id::text = kr.linked_task_filter->>'project_id'
        )
        AND (
          kr.linked_task_filter IS NULL
          OR kr.linked_task_filter->>'tag_id' IS NULL
          OR EXISTS (
            SELECT 1 FROM public.task_tags tt
            WHERE tt.task_id = t.id
              AND tt.tag_id::text = kr.linked_task_filter->>'tag_id'
          )
        );

      UPDATE public.key_results
        SET current_value = COALESCE(v_value, 0),
            updated_at = now()
        WHERE id = kr.id;
    END IF;
    -- numeric/monetary/boolean/percentage permanecem manuais nesta fase
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_kr_progress(uuid) TO authenticated;
```

## Como aplicar

1. Cole no SQL Editor do Lovable Cloud (projeto `dboftogzjobfvtjaoifh`) e execute.
2. Regenere `src/integrations/supabase/types.ts`.
3. UI já consome via `useUpsertKR` (campos novos) e `useRefreshKrProgress`.

## Notas

- `kr_progress` (RPC pré-existente) continua usada pelo botão "Recalcular
  progresso" antigo; `refresh_kr_progress` é a versão tipada que respeita
  `auto_update` + `linked_task_filter`. A UI nova chama a nova; ambas
  coexistem até o backend consolidar.
- `linked_task_filter` aceita `{project_id?: uuid, tag_id?: uuid}`. Outras
  chaves serão ignoradas pela RPC atual (forward-compatible).
