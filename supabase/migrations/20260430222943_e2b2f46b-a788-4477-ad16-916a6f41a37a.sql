-- ============= Passo 33: Public API + webhooks + chat integrations + PWA push =============

CREATE TABLE public.api_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  name text NOT NULL,
  token_prefix text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  scopes text[] NOT NULL DEFAULT ARRAY['read']::text[],
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_api_tokens_tenant ON public.api_tokens(tenant_id);
ALTER TABLE public.api_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant admins manage api tokens"
ON public.api_tokens FOR ALL
USING (EXISTS (SELECT 1 FROM public.tenant_members tm
  WHERE tm.tenant_id = api_tokens.tenant_id AND tm.user_id = auth.uid()
    AND tm.role IN ('admin','manager')))
WITH CHECK (EXISTS (SELECT 1 FROM public.tenant_members tm
  WHERE tm.tenant_id = api_tokens.tenant_id AND tm.user_id = auth.uid()
    AND tm.role IN ('admin','manager')));

CREATE TABLE public.webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  secret text NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  events text[] NOT NULL DEFAULT ARRAY['task.created','task.completed']::text[],
  active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_delivery_at timestamptz,
  last_status int
);
CREATE INDEX idx_webhooks_tenant ON public.webhooks(tenant_id);
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant admins manage webhooks"
ON public.webhooks FOR ALL
USING (EXISTS (SELECT 1 FROM public.tenant_members tm
  WHERE tm.tenant_id = webhooks.tenant_id AND tm.user_id = auth.uid()
    AND tm.role IN ('admin','manager')))
WITH CHECK (EXISTS (SELECT 1 FROM public.tenant_members tm
  WHERE tm.tenant_id = webhooks.tenant_id AND tm.user_id = auth.uid()
    AND tm.role IN ('admin','manager')));

CREATE TABLE public.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  event text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  http_status int,
  response_body text,
  attempts int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz
);
CREATE INDEX idx_webhook_deliveries_pending ON public.webhook_deliveries(status, created_at) WHERE status = 'pending';
CREATE INDEX idx_webhook_deliveries_tenant ON public.webhook_deliveries(tenant_id, created_at DESC);
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant admins read deliveries"
ON public.webhook_deliveries FOR SELECT
USING (EXISTS (SELECT 1 FROM public.tenant_members tm
  WHERE tm.tenant_id = webhook_deliveries.tenant_id AND tm.user_id = auth.uid()
    AND tm.role IN ('admin','manager')));

CREATE TABLE public.chat_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('slack','teams','discord')),
  name text NOT NULL,
  webhook_url text NOT NULL,
  channel text,
  active boolean NOT NULL DEFAULT true,
  events text[] NOT NULL DEFAULT ARRAY['notification.critical','anomaly.created','task.overdue']::text[],
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_sent_at timestamptz
);
CREATE INDEX idx_chat_integrations_tenant ON public.chat_integrations(tenant_id);
ALTER TABLE public.chat_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant admins manage chat integrations"
ON public.chat_integrations FOR ALL
USING (EXISTS (SELECT 1 FROM public.tenant_members tm
  WHERE tm.tenant_id = chat_integrations.tenant_id AND tm.user_id = auth.uid()
    AND tm.role IN ('admin','manager')))
WITH CHECK (EXISTS (SELECT 1 FROM public.tenant_members tm
  WHERE tm.tenant_id = chat_integrations.tenant_id AND tm.user_id = auth.uid()
    AND tm.role IN ('admin','manager')));

CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);
CREATE INDEX idx_push_subs_user ON public.push_subscriptions(user_id);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own push subs"
ON public.push_subscriptions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.enqueue_webhook(_tenant uuid, _event text, _payload jsonb)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _count int := 0;
BEGIN
  INSERT INTO public.webhook_deliveries (webhook_id, tenant_id, event, payload)
  SELECT w.id, w.tenant_id, _event, _payload
  FROM public.webhooks w
  WHERE w.tenant_id = _tenant AND w.active = true AND _event = ANY(w.events);
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

CREATE OR REPLACE FUNCTION public.tasks_emit_webhook()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.enqueue_webhook(NEW.tenant_id, 'task.created',
      jsonb_build_object('id', NEW.id, 'title', NEW.title, 'status', NEW.status, 'project_id', NEW.project_id, 'assignee_id', NEW.assignee_id));
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'done' THEN
    PERFORM public.enqueue_webhook(NEW.tenant_id, 'task.completed',
      jsonb_build_object('id', NEW.id, 'title', NEW.title, 'status', NEW.status, 'completed_at', now()));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tasks_emit_webhook ON public.tasks;
CREATE TRIGGER trg_tasks_emit_webhook
AFTER INSERT OR UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.tasks_emit_webhook();

CREATE OR REPLACE FUNCTION public.anomalies_emit_webhook()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.enqueue_webhook(NEW.tenant_id, 'anomaly.created',
    jsonb_build_object('id', NEW.id, 'metric', NEW.metric, 'severity', NEW.severity, 'delta_pct', NEW.delta_pct, 'expected', NEW.expected, 'observed', NEW.observed));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_anomalies_emit_webhook ON public.metric_anomalies;
CREATE TRIGGER trg_anomalies_emit_webhook
AFTER INSERT ON public.metric_anomalies
FOR EACH ROW EXECUTE FUNCTION public.anomalies_emit_webhook();

CREATE OR REPLACE FUNCTION public.pending_webhook_deliveries(_limit int DEFAULT 50)
RETURNS TABLE (delivery_id uuid, webhook_id uuid, url text, secret text, event text, payload jsonb, attempts int)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT d.id, d.webhook_id, w.url, w.secret, d.event, d.payload, d.attempts
  FROM public.webhook_deliveries d
  JOIN public.webhooks w ON w.id = d.webhook_id
  WHERE d.status = 'pending' AND d.attempts < 5 AND w.active = true
  ORDER BY d.created_at ASC LIMIT _limit;
$$;

SELECT cron.schedule(
  'webhook-dispatcher',
  '*/2 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://dboftogzjobfvtjaoifh.supabase.co/functions/v1/webhook-dispatcher',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
