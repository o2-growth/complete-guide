
-- ============== Social integrations (OAuth tokens) ==============
CREATE TABLE public.social_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  provider text NOT NULL CHECK (provider IN ('meta','instagram','linkedin','tiktok','facebook','x')),
  account_id text NULL,
  account_name text NULL,
  account_avatar text NULL,
  access_token text NULL,
  refresh_token text NULL,
  expires_at timestamptz NULL,
  scopes text[] DEFAULT ARRAY[]::text[],
  status text NOT NULL DEFAULT 'mock' CHECK (status IN ('mock','active','expired','revoked','error')),
  last_error text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  connected_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, provider, account_id)
);
CREATE INDEX idx_social_integrations_tenant ON public.social_integrations(tenant_id);
ALTER TABLE public.social_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY si_read ON public.social_integrations FOR SELECT TO authenticated
USING (tenant_id IN (SELECT user_tenant_ids()));
CREATE POLICY si_manage ON public.social_integrations FOR ALL TO authenticated
USING (has_tenant_role(tenant_id, 'admin'::tenant_role) OR has_tenant_role(tenant_id, 'manager'::tenant_role))
WITH CHECK (has_tenant_role(tenant_id, 'admin'::tenant_role) OR has_tenant_role(tenant_id, 'manager'::tenant_role));

CREATE TRIGGER trg_social_integrations_updated BEFORE UPDATE ON public.social_integrations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============== Scheduled publishes (fila) ==============
CREATE TABLE public.scheduled_publishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  task_id uuid NOT NULL,
  integration_id uuid NULL REFERENCES public.social_integrations(id) ON DELETE SET NULL,
  channel social_channel NOT NULL,
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','published','failed','cancelled','mocked')),
  attempts integer NOT NULL DEFAULT 0,
  last_attempt_at timestamptz NULL,
  response jsonb NULL,
  external_id text NULL,
  external_url text NULL,
  error text NULL,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sched_pub_tenant ON public.scheduled_publishes(tenant_id);
CREATE INDEX idx_sched_pub_status_date ON public.scheduled_publishes(status, scheduled_at);
CREATE INDEX idx_sched_pub_task ON public.scheduled_publishes(task_id);
ALTER TABLE public.scheduled_publishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY sp_read ON public.scheduled_publishes FOR SELECT TO authenticated
USING (tenant_id IN (SELECT user_tenant_ids()));
CREATE POLICY sp_manage ON public.scheduled_publishes FOR ALL TO authenticated
USING (tenant_id IN (SELECT user_tenant_ids()))
WITH CHECK (tenant_id IN (SELECT user_tenant_ids()));

CREATE TRIGGER trg_sched_pub_updated BEFORE UPDATE ON public.scheduled_publishes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============== Content briefs (pautas IA) ==============
CREATE TABLE public.content_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  campaign_id uuid NULL,
  title text NOT NULL,
  objective text NULL,
  audience text NULL,
  tone text NULL,
  channels social_channel[] NOT NULL DEFAULT ARRAY['instagram']::social_channel[],
  angles jsonb NOT NULL DEFAULT '[]'::jsonb,
  hooks jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text NULL,
  generated_by_ai boolean NOT NULL DEFAULT false,
  used_count integer NOT NULL DEFAULT 0,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_content_briefs_tenant ON public.content_briefs(tenant_id);
ALTER TABLE public.content_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY cb_read ON public.content_briefs FOR SELECT TO authenticated
USING (tenant_id IN (SELECT user_tenant_ids()));
CREATE POLICY cb_manage ON public.content_briefs FOR ALL TO authenticated
USING (tenant_id IN (SELECT user_tenant_ids()))
WITH CHECK (tenant_id IN (SELECT user_tenant_ids()));

CREATE TRIGGER trg_content_briefs_updated BEFORE UPDATE ON public.content_briefs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============== Competitors ==============
CREATE TABLE public.competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  handle text NULL,
  channel social_channel NOT NULL DEFAULT 'instagram',
  url text NULL,
  notes text NULL,
  followers integer NULL,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_competitors_tenant ON public.competitors(tenant_id);
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY cp_read ON public.competitors FOR SELECT TO authenticated
USING (tenant_id IN (SELECT user_tenant_ids()));
CREATE POLICY cp_manage ON public.competitors FOR ALL TO authenticated
USING (tenant_id IN (SELECT user_tenant_ids()))
WITH CHECK (tenant_id IN (SELECT user_tenant_ids()));

CREATE TRIGGER trg_competitors_updated BEFORE UPDATE ON public.competitors
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.competitor_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  competitor_id uuid NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  posted_at timestamptz NULL,
  caption text NULL,
  url text NULL,
  thumbnail_url text NULL,
  likes integer NULL,
  comments integer NULL,
  shares integer NULL,
  notes text NULL,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_competitor_posts_tenant ON public.competitor_posts(tenant_id);
CREATE INDEX idx_competitor_posts_comp ON public.competitor_posts(competitor_id);
ALTER TABLE public.competitor_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY cpp_read ON public.competitor_posts FOR SELECT TO authenticated
USING (tenant_id IN (SELECT user_tenant_ids()));
CREATE POLICY cpp_manage ON public.competitor_posts FOR ALL TO authenticated
USING (tenant_id IN (SELECT user_tenant_ids()))
WITH CHECK (tenant_id IN (SELECT user_tenant_ids()));

CREATE TRIGGER trg_competitor_posts_updated BEFORE UPDATE ON public.competitor_posts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============== Trigger: criar scheduled_publish quando task vai pra "scheduled" ==============
CREATE OR REPLACE FUNCTION public.enqueue_scheduled_publish()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_integration_id uuid;
BEGIN
  IF NEW.publish_state = 'scheduled'
     AND NEW.scheduled_at IS NOT NULL
     AND NEW.social_channel IS NOT NULL
     AND (OLD.publish_state IS DISTINCT FROM 'scheduled' OR OLD.scheduled_at IS DISTINCT FROM NEW.scheduled_at) THEN

    SELECT id INTO v_integration_id
    FROM public.social_integrations
    WHERE tenant_id = NEW.tenant_id
      AND status IN ('active','mock')
      AND (provider = NEW.social_channel::text OR (NEW.social_channel = 'instagram' AND provider = 'meta'))
    ORDER BY (status = 'active') DESC, created_at DESC
    LIMIT 1;

    -- cancela pendentes anteriores dessa task
    UPDATE public.scheduled_publishes
       SET status = 'cancelled'
     WHERE task_id = NEW.id AND status = 'pending';

    INSERT INTO public.scheduled_publishes
      (tenant_id, task_id, integration_id, channel, scheduled_at, status, created_by)
    VALUES
      (NEW.tenant_id, NEW.id, v_integration_id, NEW.social_channel, NEW.scheduled_at, 'pending', auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_scheduled_publish ON public.tasks;
CREATE TRIGGER trg_enqueue_scheduled_publish
AFTER INSERT OR UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.enqueue_scheduled_publish();
