CREATE OR REPLACE FUNCTION public.tg_broadcast_pomodoros()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := COALESCE(NEW.user_id, OLD.user_id);
  v_task_id uuid := COALESCE(NEW.task_id, OLD.task_id);
  v_tenant uuid;
  v_channel text;
BEGIN
  IF v_task_id IS NOT NULL THEN
    SELECT tenant_id INTO v_tenant FROM public.tasks WHERE id = v_task_id;
  END IF;
  IF v_tenant IS NULL THEN
    SELECT tenant_id INTO v_tenant FROM public.tenant_members
      WHERE user_id = v_user
      ORDER BY created_at ASC NULLS LAST
      LIMIT 1;
  END IF;
  IF v_tenant IS NOT NULL THEN
    v_channel := 'tenant:' || v_tenant::text || ':pomodoro:' || v_user::text;
    PERFORM public.broadcast_table_change(
      v_channel, TG_OP, to_jsonb(COALESCE(NEW, OLD))
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;