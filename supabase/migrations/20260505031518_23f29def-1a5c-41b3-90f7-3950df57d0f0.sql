-- Vinculação task ↔ evento GCal
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS gcal_event_id text,
  ADD COLUMN IF NOT EXISTS gcal_calendar_id text,
  ADD COLUMN IF NOT EXISTS gcal_etag text,
  ADD COLUMN IF NOT EXISTS gcal_last_synced_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_tasks_gcal_event
  ON public.tasks(gcal_event_id) WHERE gcal_event_id IS NOT NULL;

-- Configuração de sync por usuário
CREATE TABLE IF NOT EXISTS public.gcal_sync_config (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  oauth_connection_id uuid NOT NULL REFERENCES public.oauth_connections(id) ON DELETE CASCADE,
  target_calendar_id text NOT NULL DEFAULT 'primary',
  sync_pull_enabled boolean NOT NULL DEFAULT true,
  sync_push_enabled boolean NOT NULL DEFAULT true,
  last_pull_sync_token text,
  last_push_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gcal_sync_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user manages own gcal config" ON public.gcal_sync_config FOR ALL
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

CREATE TRIGGER tg_gcal_sync_config_updated
  BEFORE UPDATE ON public.gcal_sync_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();