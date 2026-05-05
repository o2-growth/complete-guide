-- Sub-fase 7D: Goals upgrade com Targets tipados (numeric/monetary/tasks/boolean/percentage)

ALTER TABLE public.key_results
  ADD COLUMN IF NOT EXISTS target_type text NOT NULL DEFAULT 'numeric'
    CHECK (target_type IN ('numeric','monetary','tasks','boolean','percentage')),
  ADD COLUMN IF NOT EXISTS auto_update boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS linked_task_filter jsonb,
  ADD COLUMN IF NOT EXISTS unit text;

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
    SELECT k.* FROM public.key_results k
    JOIN public.goals g ON g.id = k.goal_id
    WHERE g.tenant_id = _tenant AND k.auto_update = true
  LOOP
    IF kr.target_type = 'tasks' THEN
      SELECT COUNT(*) INTO v_value FROM public.tasks t
      WHERE t.tenant_id = _tenant
        AND t.done_at IS NOT NULL
        AND (kr.linked_task_filter->>'project_id' IS NULL OR t.project_id::text = kr.linked_task_filter->>'project_id')
        AND (kr.linked_task_filter->>'tag_id' IS NULL OR EXISTS (
          SELECT 1 FROM public.task_tags tt
          WHERE tt.task_id = t.id AND tt.tag_id::text = kr.linked_task_filter->>'tag_id'
        ));
      UPDATE public.key_results
        SET current_value = v_value, updated_at = now()
        WHERE id = kr.id;
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_kr_progress(uuid) TO authenticated;
