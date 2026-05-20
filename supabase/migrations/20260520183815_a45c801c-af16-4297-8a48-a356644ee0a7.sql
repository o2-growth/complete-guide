
-- Broadcast triggers para a árvore de projetos e tarefas (Fase D)
CREATE OR REPLACE FUNCTION public.tg_broadcast_projects()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_tenant uuid;
BEGIN
  v_tenant := COALESCE(NEW.tenant_id, OLD.tenant_id);
  IF v_tenant IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
  PERFORM realtime.send(
    jsonb_build_object('op', TG_OP, 'id', COALESCE(NEW.id, OLD.id)),
    'project_change',
    'tenant:' || v_tenant::text,
    false
  );
  RETURN COALESCE(NEW, OLD);
END;$$;

DROP TRIGGER IF EXISTS tg_broadcast_projects ON public.projects;
CREATE TRIGGER tg_broadcast_projects
AFTER INSERT OR UPDATE OR DELETE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.tg_broadcast_projects();

CREATE OR REPLACE FUNCTION public.tg_broadcast_tasks_tree()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_tenant uuid;
BEGIN
  v_tenant := COALESCE(NEW.tenant_id, OLD.tenant_id);
  IF v_tenant IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
  -- Só broadcast quando algo que afeta contagem mudar
  IF TG_OP = 'UPDATE'
     AND NEW.done_at IS NOT DISTINCT FROM OLD.done_at
     AND NEW.archived IS NOT DISTINCT FROM OLD.archived
     AND NEW.project_id IS NOT DISTINCT FROM OLD.project_id THEN
    RETURN NEW;
  END IF;
  PERFORM realtime.send(
    jsonb_build_object('op', TG_OP, 'project_id', COALESCE(NEW.project_id, OLD.project_id)),
    'task_tree_change',
    'tenant:' || v_tenant::text,
    false
  );
  RETURN COALESCE(NEW, OLD);
END;$$;

DROP TRIGGER IF EXISTS tg_broadcast_tasks_tree ON public.tasks;
CREATE TRIGGER tg_broadcast_tasks_tree
AFTER INSERT OR UPDATE OR DELETE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.tg_broadcast_tasks_tree();
