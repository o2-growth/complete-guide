CREATE OR REPLACE FUNCTION public.tg_tasks_emit_automation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_payload jsonb;
BEGIN
  v_payload := jsonb_build_object(
    'task_id', NEW.id, 'project_id', NEW.project_id, 'title', NEW.title,
    'priority', NEW.priority, 'assignee_id', NEW.assignee_id, 'due_at', NEW.due_at,
    'type_id', NEW.type_id, 'status_id', NEW.status_id
  );
  IF TG_OP = 'INSERT' THEN
    PERFORM public.enqueue_automation_event(NEW.tenant_id, 'task.created', v_payload);
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status_id IS DISTINCT FROM OLD.status_id THEN
      PERFORM public.enqueue_automation_event(NEW.tenant_id, 'task.updated',
        v_payload || jsonb_build_object('old_status_id', OLD.status_id));
    END IF;
    IF NEW.done_at IS NOT NULL AND OLD.done_at IS NULL THEN
      PERFORM public.enqueue_automation_event(NEW.tenant_id, 'task.completed', v_payload);
    END IF;
  END IF;
  RETURN NEW;
END $function$;