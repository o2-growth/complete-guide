
-- Garantir uniqueness de timer ativo por usuário
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_timer_per_user
  ON public.time_entries(user_id) WHERE ended_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_pomo_per_user
  ON public.pomodoros(user_id) WHERE ended_at IS NULL;

-- start_timer: para qualquer timer ativo do usuário e inicia um novo na tarefa
CREATE OR REPLACE FUNCTION public.start_timer(_task_id uuid, _note text DEFAULT NULL)
RETURNS public.time_entries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant uuid;
  v_user uuid := auth.uid();
  v_entry public.time_entries;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT tenant_id INTO v_tenant FROM public.tasks WHERE id = _task_id;
  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'task not found';
  END IF;
  IF v_tenant NOT IN (SELECT user_tenant_ids()) THEN
    RAISE EXCEPTION 'not authorized for this tenant';
  END IF;

  -- Para timers ativos do mesmo usuário (calcula minutes)
  UPDATE public.time_entries
     SET ended_at = now(),
         minutes = GREATEST(1, CEIL(EXTRACT(EPOCH FROM (now() - started_at))/60.0)::int)
   WHERE user_id = v_user AND ended_at IS NULL;

  INSERT INTO public.time_entries (user_id, tenant_id, task_id, started_at, note, source)
  VALUES (v_user, v_tenant, _task_id, now(), _note, 'timer')
  RETURNING * INTO v_entry;

  RETURN v_entry;
END;
$$;

-- stop_timer: para o timer ativo do usuário (qualquer tarefa) e atualiza spent_minutes
CREATE OR REPLACE FUNCTION public.stop_timer()
RETURNS public.time_entries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_entry public.time_entries;
  v_minutes int;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  UPDATE public.time_entries
     SET ended_at = now(),
         minutes = GREATEST(1, CEIL(EXTRACT(EPOCH FROM (now() - started_at))/60.0)::int)
   WHERE user_id = v_user AND ended_at IS NULL
   RETURNING * INTO v_entry;

  IF v_entry.id IS NULL THEN
    RETURN NULL;
  END IF;

  v_minutes := COALESCE(v_entry.minutes, 0);
  UPDATE public.tasks
     SET spent_minutes = COALESCE(spent_minutes, 0) + v_minutes
   WHERE id = v_entry.task_id;

  RETURN v_entry;
END;
$$;

-- start_pomodoro
CREATE OR REPLACE FUNCTION public.start_pomodoro(
  _task_id uuid DEFAULT NULL,
  _planned_minutes int DEFAULT 25,
  _break_minutes int DEFAULT 5,
  _ambient text DEFAULT NULL
)
RETURNS public.pomodoros
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_pomo public.pomodoros;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- finaliza pomodoro ativo (sem marcar completed)
  UPDATE public.pomodoros
     SET ended_at = now()
   WHERE user_id = v_user AND ended_at IS NULL;

  INSERT INTO public.pomodoros (user_id, task_id, planned_minutes, break_minutes, ambient, started_at)
  VALUES (v_user, _task_id, COALESCE(_planned_minutes,25), COALESCE(_break_minutes,5), _ambient, now())
  RETURNING * INTO v_pomo;

  RETURN v_pomo;
END;
$$;

-- stop_pomodoro
CREATE OR REPLACE FUNCTION public.stop_pomodoro(_completed boolean DEFAULT false)
RETURNS public.pomodoros
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_pomo public.pomodoros;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  UPDATE public.pomodoros
     SET ended_at = now(),
         completed = COALESCE(_completed, false)
   WHERE user_id = v_user AND ended_at IS NULL
   RETURNING * INTO v_pomo;

  RETURN v_pomo;
END;
$$;

-- Realtime
ALTER TABLE public.time_entries REPLICA IDENTITY FULL;
ALTER TABLE public.pomodoros REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.time_entries;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pomodoros;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
