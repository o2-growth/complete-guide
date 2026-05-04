-- Generic broadcast helper
CREATE OR REPLACE FUNCTION public.broadcast_table_change(
  _channel text,
  _event text,
  _payload jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM realtime.send(_payload, _event, _channel, false);
EXCEPTION WHEN OTHERS THEN
  -- Never block the originating DML on broadcast failures
  RAISE WARNING 'broadcast_table_change failed channel=% event=% err=%', _channel, _event, SQLERRM;
END;
$$;

-- time_entries trigger
CREATE OR REPLACE FUNCTION public.tg_broadcast_time_entries()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant uuid := COALESCE(NEW.tenant_id, OLD.tenant_id);
  v_user uuid := COALESCE(NEW.user_id, OLD.user_id);
  v_channel text;
BEGIN
  v_channel := 'tenant:' || v_tenant::text || ':timer:' || v_user::text;
  PERFORM public.broadcast_table_change(
    v_channel, TG_OP, to_jsonb(COALESCE(NEW, OLD))
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS tg_broadcast_time_entries ON public.time_entries;
CREATE TRIGGER tg_broadcast_time_entries
AFTER INSERT OR UPDATE OR DELETE ON public.time_entries
FOR EACH ROW EXECUTE FUNCTION public.tg_broadcast_time_entries();

-- pomodoros trigger
CREATE OR REPLACE FUNCTION public.tg_broadcast_pomodoros()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant uuid := COALESCE(NEW.tenant_id, OLD.tenant_id);
  v_user uuid := COALESCE(NEW.user_id, OLD.user_id);
  v_channel text;
BEGIN
  v_channel := 'tenant:' || v_tenant::text || ':pomodoro:' || v_user::text;
  PERFORM public.broadcast_table_change(
    v_channel, TG_OP, to_jsonb(COALESCE(NEW, OLD))
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS tg_broadcast_pomodoros ON public.pomodoros;
CREATE TRIGGER tg_broadcast_pomodoros
AFTER INSERT OR UPDATE OR DELETE ON public.pomodoros
FOR EACH ROW EXECUTE FUNCTION public.tg_broadcast_pomodoros();

-- notifications trigger
CREATE OR REPLACE FUNCTION public.tg_broadcast_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant uuid := COALESCE(NEW.tenant_id, OLD.tenant_id);
  v_user uuid := COALESCE(NEW.user_id, OLD.user_id);
  v_channel text;
BEGIN
  v_channel := 'tenant:' || v_tenant::text || ':notifications-' || v_user::text;
  PERFORM public.broadcast_table_change(
    v_channel, TG_OP, to_jsonb(COALESCE(NEW, OLD))
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS tg_broadcast_notifications ON public.notifications;
CREATE TRIGGER tg_broadcast_notifications
AFTER INSERT OR UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.tg_broadcast_notifications();