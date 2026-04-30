DO $$ BEGIN CREATE TYPE public.inbox_item_kind AS ENUM ('dm','comment','mention','review','reply');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.inbox_item_status AS ENUM ('new','reading','replied','ignored','task_created','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.inbox_sentiment AS ENUM ('positive','neutral','negative','question');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.social_inbox_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  integration_id uuid REFERENCES public.social_integrations(id) ON DELETE SET NULL,
  channel social_channel NOT NULL,
  kind inbox_item_kind NOT NULL DEFAULT 'comment',
  external_id text, external_url text,
  author_name text, author_handle text, author_avatar text,
  message text NOT NULL,
  parent_post_external_id text,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  status inbox_item_status NOT NULL DEFAULT 'new',
  sentiment inbox_sentiment,
  ai_summary text, ai_suggested_reply text,
  received_at timestamptz NOT NULL DEFAULT now(),
  handled_by uuid, handled_at timestamptz, reply_text text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inbox_tenant_status ON public.social_inbox_items(tenant_id, status, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_inbox_tenant_channel ON public.social_inbox_items(tenant_id, channel);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_inbox_external ON public.social_inbox_items(integration_id, external_id) WHERE external_id IS NOT NULL;
ALTER TABLE public.social_inbox_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ibx_read" ON public.social_inbox_items FOR SELECT TO authenticated USING (tenant_id IN (SELECT user_tenant_ids()));
CREATE POLICY "ibx_manage" ON public.social_inbox_items FOR ALL TO authenticated USING (tenant_id IN (SELECT user_tenant_ids())) WITH CHECK (tenant_id IN (SELECT user_tenant_ids()));
CREATE TRIGGER trg_inbox_touch BEFORE UPDATE ON public.social_inbox_items FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.posting_cadence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  channel social_channel NOT NULL,
  dow smallint NOT NULL CHECK (dow BETWEEN 0 AND 6),
  hour smallint NOT NULL CHECK (hour BETWEEN 0 AND 23),
  target_posts integer NOT NULL DEFAULT 1,
  enabled boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, channel, dow, hour)
);
CREATE INDEX IF NOT EXISTS idx_cadence_tenant ON public.posting_cadence(tenant_id, channel, dow);
ALTER TABLE public.posting_cadence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pc_read" ON public.posting_cadence FOR SELECT TO authenticated USING (tenant_id IN (SELECT user_tenant_ids()));
CREATE POLICY "pc_manage" ON public.posting_cadence FOR ALL TO authenticated USING (tenant_id IN (SELECT user_tenant_ids())) WITH CHECK (tenant_id IN (SELECT user_tenant_ids()));
CREATE TRIGGER trg_cadence_touch BEFORE UPDATE ON public.posting_cadence FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.convert_inbox_item_to_task(
  _inbox_id uuid, _project_id uuid DEFAULT NULL, _assignee_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_item social_inbox_items%ROWTYPE; v_tenant uuid; v_task_id uuid; v_title text;
BEGIN
  SELECT * INTO v_item FROM social_inbox_items WHERE id = _inbox_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'inbox item não encontrado'; END IF;
  v_tenant := v_item.tenant_id;
  IF NOT (v_tenant = ANY (SELECT user_tenant_ids())) THEN RAISE EXCEPTION 'sem permissão'; END IF;
  v_title := concat('Responder ', coalesce(v_item.author_handle, v_item.author_name, 'inbox'), ' (', v_item.channel, ')');
  INSERT INTO tasks (tenant_id, project_id, title, description, assignee_id, created_by, priority, source)
  VALUES (v_tenant, _project_id, v_title, coalesce('Mensagem original: ' || v_item.message, ''),
          coalesce(_assignee_id, auth.uid()), auth.uid(), 'high', 'inbox')
  RETURNING id INTO v_task_id;
  UPDATE social_inbox_items SET status = 'task_created', task_id = v_task_id,
         handled_by = auth.uid(), handled_at = now() WHERE id = _inbox_id;
  RETURN v_task_id;
END $$;

CREATE OR REPLACE FUNCTION public.inbox_summary(_tenant uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r jsonb;
BEGIN
  IF NOT (_tenant = ANY (SELECT user_tenant_ids())) THEN RAISE EXCEPTION 'sem permissão'; END IF;
  SELECT jsonb_build_object(
    'total', count(*),
    'new', count(*) FILTER (WHERE status = 'new'),
    'replied', count(*) FILTER (WHERE status = 'replied'),
    'task', count(*) FILTER (WHERE status = 'task_created'),
    'negative', count(*) FILTER (WHERE sentiment = 'negative'),
    'question', count(*) FILTER (WHERE sentiment = 'question'),
    'by_channel', (SELECT jsonb_object_agg(channel, c) FROM (
        SELECT channel::text as channel, count(*) c FROM social_inbox_items
        WHERE tenant_id = _tenant GROUP BY channel) x)
  ) INTO r FROM social_inbox_items WHERE tenant_id = _tenant;
  RETURN coalesce(r, '{}'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION public.campaign_report(_campaign_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_tenant uuid; r jsonb;
BEGIN
  SELECT tenant_id INTO v_tenant FROM social_campaigns WHERE id = _campaign_id;
  IF NOT FOUND OR NOT (v_tenant = ANY (SELECT user_tenant_ids())) THEN RAISE EXCEPTION 'sem permissão'; END IF;
  SELECT jsonb_build_object(
    'totals', (SELECT jsonb_build_object(
        'posts', count(DISTINCT t.id),
        'reach', coalesce(sum(m.reach),0),
        'impressions', coalesce(sum(m.impressions),0),
        'likes', coalesce(sum(m.likes),0),
        'comments', coalesce(sum(m.comments),0),
        'shares', coalesce(sum(m.shares),0),
        'saves', coalesce(sum(m.saves),0),
        'clicks', coalesce(sum(m.clicks),0),
        'followers_gained', coalesce(sum(m.followers_gained),0))
      FROM tasks t LEFT JOIN post_metrics m ON m.task_id = t.id
      WHERE t.social_campaign_id = _campaign_id),
    'by_channel', (SELECT coalesce(jsonb_agg(row_to_json(x)), '[]'::jsonb) FROM (
        SELECT t.social_channel as channel, count(DISTINCT t.id) as posts,
          coalesce(sum(m.reach),0) as reach, coalesce(sum(m.likes),0) as likes,
          coalesce(sum(m.comments),0) as comments, coalesce(sum(m.shares),0) as shares
        FROM tasks t LEFT JOIN post_metrics m ON m.task_id = t.id
        WHERE t.social_campaign_id = _campaign_id GROUP BY t.social_channel) x),
    'top_posts', (SELECT coalesce(jsonb_agg(row_to_json(x)), '[]'::jsonb) FROM (
        SELECT t.id, t.title, t.social_channel as channel,
          coalesce(sum(m.reach),0) as reach, coalesce(sum(m.likes),0) as likes,
          coalesce(sum(m.comments),0) as comments
        FROM tasks t LEFT JOIN post_metrics m ON m.task_id = t.id
        WHERE t.social_campaign_id = _campaign_id
        GROUP BY t.id, t.title, t.social_channel
        ORDER BY (coalesce(sum(m.reach),0) + coalesce(sum(m.likes),0)*5) DESC LIMIT 10) x)
  ) INTO r;
  RETURN coalesce(r, '{}'::jsonb);
END $$;