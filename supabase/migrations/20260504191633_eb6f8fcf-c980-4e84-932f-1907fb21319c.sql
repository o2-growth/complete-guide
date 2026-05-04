CREATE OR REPLACE FUNCTION public.tasks_emit_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_done_status_id uuid;
  v_is_done_new boolean := false;
  v_is_done_old boolean := false;
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.enqueue_webhook(NEW.tenant_id, 'task.created',
      jsonb_build_object('id', NEW.id, 'title', NEW.title, 'status_id', NEW.status_id, 'project_id', NEW.project_id, 'assignee_id', NEW.assignee_id));
  ELSIF TG_OP = 'UPDATE' AND NEW.status_id IS DISTINCT FROM OLD.status_id THEN
    -- Only emit task.completed when transitioning into a done-state OR when done_at was just set
    IF NEW.done_at IS NOT NULL AND OLD.done_at IS NULL THEN
      PERFORM public.enqueue_webhook(NEW.tenant_id, 'task.completed',
        jsonb_build_object('id', NEW.id, 'title', NEW.title, 'status_id', NEW.status_id, 'completed_at', NEW.done_at));
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;