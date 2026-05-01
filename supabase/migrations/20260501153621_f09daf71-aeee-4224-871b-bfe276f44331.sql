
-- error_events
CREATE TABLE IF NOT EXISTS public.error_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'react',
  level TEXT NOT NULL DEFAULT 'error',
  message TEXT NOT NULL,
  stack TEXT,
  url TEXT,
  user_agent TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_error_events_tenant_created ON public.error_events (tenant_id, created_at DESC);
ALTER TABLE public.error_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert own error events" ON public.error_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "admins read tenant errors" ON public.error_events
  FOR SELECT TO authenticated
  USING (
    tenant_id IS NULL OR EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.tenant_id = error_events.tenant_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('admin','manager')
    )
  );

-- perf_metrics
CREATE TABLE IF NOT EXISTS public.perf_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  route TEXT NOT NULL,
  metric TEXT NOT NULL,           -- LCP | FID | CLS | TTFB | INP
  value DOUBLE PRECISION NOT NULL,
  rating TEXT,                    -- good | needs-improvement | poor
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_perf_metrics_tenant_metric ON public.perf_metrics (tenant_id, metric, created_at DESC);
ALTER TABLE public.perf_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert own perf metrics" ON public.perf_metrics
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "admins read tenant perf" ON public.perf_metrics
  FOR SELECT TO authenticated
  USING (
    tenant_id IS NULL OR EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.tenant_id = perf_metrics.tenant_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('admin','manager')
    )
  );

-- health snapshot RPC
CREATE OR REPLACE FUNCTION public.health_snapshot(_tenant uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
  result jsonb;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = _tenant AND user_id = auth.uid() AND role IN ('admin','manager')
  ) INTO is_admin;
  IF NOT is_admin THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'webhook_pending', (SELECT COUNT(*) FROM public.webhook_deliveries wd
                        JOIN public.webhooks w ON w.id = wd.webhook_id
                        WHERE w.tenant_id = _tenant AND wd.status = 'pending'),
    'webhook_failed_24h', (SELECT COUNT(*) FROM public.webhook_deliveries wd
                           JOIN public.webhooks w ON w.id = wd.webhook_id
                           WHERE w.tenant_id = _tenant AND wd.status = 'failed'
                             AND wd.created_at > now() - interval '24 hours'),
    'automation_events_pending', (SELECT COUNT(*) FROM public.automation_events
                                  WHERE tenant_id = _tenant AND processed_at IS NULL),
    'errors_24h', (SELECT COUNT(*) FROM public.error_events
                   WHERE tenant_id = _tenant AND created_at > now() - interval '24 hours'),
    'errors_1h', (SELECT COUNT(*) FROM public.error_events
                  WHERE tenant_id = _tenant AND created_at > now() - interval '1 hour'),
    'scheduled_publishes_pending', (SELECT COUNT(*) FROM public.scheduled_publishes sp
                                    JOIN public.tasks t ON t.id = sp.task_id
                                    WHERE t.tenant_id = _tenant AND sp.status = 'pending'),
    'snapshot_at', now()
  ) INTO result;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.health_snapshot(uuid) TO authenticated;
