-- ============== Caption snippets ==============
CREATE TABLE public.caption_snippets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  body text NOT NULL,
  channel social_channel NULL,
  tags text[] DEFAULT ARRAY[]::text[],
  usage_count integer NOT NULL DEFAULT 0,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_caption_snippets_tenant ON public.caption_snippets(tenant_id);
ALTER TABLE public.caption_snippets ENABLE ROW LEVEL SECURITY;

CREATE POLICY cs_read ON public.caption_snippets FOR SELECT TO authenticated
USING (tenant_id IN (SELECT user_tenant_ids()));
CREATE POLICY cs_insert ON public.caption_snippets FOR INSERT TO authenticated
WITH CHECK (tenant_id IN (SELECT user_tenant_ids()) AND created_by = auth.uid());
CREATE POLICY cs_update ON public.caption_snippets FOR UPDATE TO authenticated
USING (tenant_id IN (SELECT user_tenant_ids()));
CREATE POLICY cs_delete ON public.caption_snippets FOR DELETE TO authenticated
USING (tenant_id IN (SELECT user_tenant_ids()) AND (created_by = auth.uid() OR has_tenant_role(tenant_id, 'admin'::tenant_role) OR has_tenant_role(tenant_id, 'manager'::tenant_role)));

CREATE TRIGGER trg_caption_snippets_updated BEFORE UPDATE ON public.caption_snippets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============== Hashtag groups ==============
CREATE TABLE public.hashtag_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  hashtags text[] NOT NULL DEFAULT ARRAY[]::text[],
  channel social_channel NULL,
  notes text NULL,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_hashtag_groups_tenant ON public.hashtag_groups(tenant_id);
ALTER TABLE public.hashtag_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY hg_read ON public.hashtag_groups FOR SELECT TO authenticated
USING (tenant_id IN (SELECT user_tenant_ids()));
CREATE POLICY hg_insert ON public.hashtag_groups FOR INSERT TO authenticated
WITH CHECK (tenant_id IN (SELECT user_tenant_ids()) AND created_by = auth.uid());
CREATE POLICY hg_update ON public.hashtag_groups FOR UPDATE TO authenticated
USING (tenant_id IN (SELECT user_tenant_ids()));
CREATE POLICY hg_delete ON public.hashtag_groups FOR DELETE TO authenticated
USING (tenant_id IN (SELECT user_tenant_ids()) AND (created_by = auth.uid() OR has_tenant_role(tenant_id, 'admin'::tenant_role) OR has_tenant_role(tenant_id, 'manager'::tenant_role)));

CREATE TRIGGER trg_hashtag_groups_updated BEFORE UPDATE ON public.hashtag_groups
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============== Post metrics ==============
CREATE TABLE public.post_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  task_id uuid NOT NULL,
  collected_at timestamptz NOT NULL DEFAULT now(),
  reach integer DEFAULT 0,
  impressions integer DEFAULT 0,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  saves integer DEFAULT 0,
  shares integer DEFAULT 0,
  clicks integer DEFAULT 0,
  followers_gained integer DEFAULT 0,
  notes text NULL,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_post_metrics_tenant ON public.post_metrics(tenant_id);
CREATE INDEX idx_post_metrics_task ON public.post_metrics(task_id);
CREATE INDEX idx_post_metrics_collected ON public.post_metrics(collected_at);
ALTER TABLE public.post_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY pm_read ON public.post_metrics FOR SELECT TO authenticated
USING (tenant_id IN (SELECT user_tenant_ids()));
CREATE POLICY pm_manage ON public.post_metrics FOR ALL TO authenticated
USING (tenant_id IN (SELECT user_tenant_ids()))
WITH CHECK (tenant_id IN (SELECT user_tenant_ids()));

CREATE TRIGGER trg_post_metrics_updated BEFORE UPDATE ON public.post_metrics
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============== Stage checklists em campanhas ==============
ALTER TABLE public.social_campaigns
ADD COLUMN IF NOT EXISTS stage_checklists jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ============== Trigger: aprovar via link público promove tarefa para 'approved' ==============
CREATE OR REPLACE FUNCTION public.auto_promote_task_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    UPDATE public.tasks
       SET publish_state = 'approved'
     WHERE id = NEW.task_id
       AND publish_state IN ('drafting','review');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_promote_task ON public.social_approval_requests;
CREATE TRIGGER trg_auto_promote_task
AFTER UPDATE ON public.social_approval_requests
FOR EACH ROW EXECUTE FUNCTION public.auto_promote_task_on_approval();

-- ============== Trigger: registrar atividade ao publicar ==============
CREATE OR REPLACE FUNCTION public.log_task_published()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.publish_state = 'published' AND (OLD.publish_state IS DISTINCT FROM 'published') THEN
    IF NEW.published_at IS NULL THEN
      NEW.published_at := now();
    END IF;
    INSERT INTO public.activities (tenant_id, kind, actor_id, project_id, task_id, payload)
    VALUES (
      NEW.tenant_id, 'task_updated'::activity_kind, auth.uid(), NEW.project_id, NEW.id,
      jsonb_build_object('event','published','channel', NEW.social_channel, 'url', NEW.published_url)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_task_published ON public.tasks;
CREATE TRIGGER trg_log_task_published
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.log_task_published();