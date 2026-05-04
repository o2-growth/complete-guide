CREATE OR REPLACE FUNCTION public.broadcast_table_change(_channel text, _event text, _payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    PERFORM realtime.send(_payload, _event, _channel, false);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'broadcast_table_change failed: % / channel=%', SQLERRM, _channel;
  END;
END;
$$;