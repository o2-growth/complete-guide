
REVOKE ALL ON FUNCTION public.start_timer(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.stop_timer() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.start_pomodoro(uuid, int, int, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.stop_pomodoro(boolean) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.start_timer(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.stop_timer() TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_pomodoro(uuid, int, int, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.stop_pomodoro(boolean) TO authenticated;
