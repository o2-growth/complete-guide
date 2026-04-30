-- =========================================================
-- PASSO 25 — Fase 3 Mídias Sociais (parte 1: schema)
-- =========================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE public.social_channel AS ENUM ('instagram','linkedin','tiktok','facebook','youtube','twitter','email','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.publish_state AS ENUM ('idea','drafting','review','approved','scheduled','published','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.media_kind AS ENUM ('image','video','document','audio','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.social_approval_status AS ENUM ('pending','approved','rejected','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1) Campanhas
CREATE TABLE IF NOT EXISTS public.social_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  objective text,
  color text DEFAULT '#0EA5E9',
  channels public.social_channel[] NOT NULL DEFAULT ARRAY['instagram']::public.social_channel[],
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_social_campaigns_tenant ON public.social_campaigns(tenant_id);

ALTER TABLE public.social_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sc_read" ON public.social_campaigns
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

CREATE POLICY "sc_manage" ON public.social_campaigns
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));

CREATE TRIGGER trg_social_campaigns_updated
  BEFORE UPDATE ON public.social_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) Biblioteca de assets de mídia
CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  campaign_id uuid REFERENCES public.social_campaigns(id) ON DELETE SET NULL,
  name text NOT NULL,
  kind public.media_kind NOT NULL DEFAULT 'image',
  bucket text NOT NULL DEFAULT 'media-assets',
  path text NOT NULL,
  mime_type text,
  size_bytes bigint,
  width int,
  height int,
  duration_seconds numeric,
  tags text[] DEFAULT ARRAY[]::text[],
  notes text,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_media_assets_tenant ON public.media_assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_tags ON public.media_assets USING GIN(tags);

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ma_read" ON public.media_assets
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

CREATE POLICY "ma_insert" ON public.media_assets
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()) AND uploaded_by = auth.uid());

CREATE POLICY "ma_update" ON public.media_assets
  FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

CREATE POLICY "ma_delete" ON public.media_assets
  FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids())
         AND (uploaded_by = auth.uid()
              OR public.has_tenant_role(tenant_id,'admin'::public.tenant_role)
              OR public.has_tenant_role(tenant_id,'manager'::public.tenant_role)));

CREATE TRIGGER trg_media_assets_updated
  BEFORE UPDATE ON public.media_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) N:N tarefa <-> assets
CREATE TABLE IF NOT EXISTS public.task_assets (
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  position numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, asset_id)
);

ALTER TABLE public.task_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ta_read" ON public.task_assets
  FOR SELECT TO authenticated
  USING (task_id IN (SELECT id FROM public.tasks WHERE tenant_id IN (SELECT public.user_tenant_ids())));

CREATE POLICY "ta_manage" ON public.task_assets
  FOR ALL TO authenticated
  USING (task_id IN (SELECT id FROM public.tasks WHERE tenant_id IN (SELECT public.user_tenant_ids())))
  WITH CHECK (task_id IN (SELECT id FROM public.tasks WHERE tenant_id IN (SELECT public.user_tenant_ids())));

-- 4) Campos extras em tasks (idempotente) para mídia social
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.social_campaigns(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS social_channel public.social_channel;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS publish_state public.publish_state;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS published_url text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS social_caption text;

CREATE INDEX IF NOT EXISTS idx_tasks_campaign ON public.tasks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled ON public.tasks(scheduled_at);

-- 5) Solicitações de aprovação públicas (token)
CREATE TABLE IF NOT EXISTS public.social_approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  client_name text,
  client_email text,
  message text,
  status public.social_approval_status NOT NULL DEFAULT 'pending',
  decided_at timestamptz,
  decided_by_name text,
  decision_comment text,
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sar_tenant ON public.social_approval_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sar_task ON public.social_approval_requests(task_id);

ALTER TABLE public.social_approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sar_read_internal" ON public.social_approval_requests
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

CREATE POLICY "sar_manage_internal" ON public.social_approval_requests
  FOR ALL TO authenticated
  USING (tenant_id IN (SELECT public.user_tenant_ids()))
  WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));

CREATE TRIGGER trg_sar_updated
  BEFORE UPDATE ON public.social_approval_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6) RPC pública para buscar dados pelo token (anon)
CREATE OR REPLACE FUNCTION public.get_social_approval_by_token(_token uuid)
RETURNS TABLE (
  id uuid,
  task_id uuid,
  status public.social_approval_status,
  message text,
  client_name text,
  client_email text,
  expires_at timestamptz,
  decided_at timestamptz,
  decision_comment text,
  task_title text,
  task_caption text,
  task_channel public.social_channel,
  task_scheduled_at timestamptz,
  task_publish_state public.publish_state,
  asset_paths text[],
  asset_buckets text[],
  asset_kinds public.media_kind[]
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id, s.task_id, s.status, s.message, s.client_name, s.client_email,
    s.expires_at, s.decided_at, s.decision_comment,
    t.title, t.social_caption, t.social_channel, t.scheduled_at, t.publish_state,
    COALESCE(array_agg(ma.path ORDER BY ta.position) FILTER (WHERE ma.id IS NOT NULL), ARRAY[]::text[]),
    COALESCE(array_agg(ma.bucket ORDER BY ta.position) FILTER (WHERE ma.id IS NOT NULL), ARRAY[]::text[]),
    COALESCE(array_agg(ma.kind ORDER BY ta.position) FILTER (WHERE ma.id IS NOT NULL), ARRAY[]::media_kind[])
  FROM public.social_approval_requests s
  JOIN public.tasks t ON t.id = s.task_id
  LEFT JOIN public.task_assets ta ON ta.task_id = t.id
  LEFT JOIN public.media_assets ma ON ma.id = ta.asset_id
  WHERE s.token = _token
  GROUP BY s.id, t.id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_social_approval_by_token(uuid) TO anon, authenticated;

-- 7) RPC pública para registrar decisão (anon)
CREATE OR REPLACE FUNCTION public.decide_social_approval(
  _token uuid,
  _decision public.social_approval_status,
  _name text,
  _comment text
)
RETURNS public.social_approval_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.social_approval_requests;
BEGIN
  IF _decision NOT IN ('approved','rejected') THEN
    RAISE EXCEPTION 'invalid decision';
  END IF;

  SELECT * INTO v_req FROM public.social_approval_requests WHERE token = _token;
  IF v_req.id IS NULL THEN
    RAISE EXCEPTION 'approval request not found';
  END IF;
  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'approval already decided';
  END IF;
  IF v_req.expires_at IS NOT NULL AND v_req.expires_at < now() THEN
    UPDATE public.social_approval_requests SET status='expired' WHERE id=v_req.id;
    RAISE EXCEPTION 'approval link expired';
  END IF;

  UPDATE public.social_approval_requests
    SET status = _decision,
        decided_at = now(),
        decided_by_name = _name,
        decision_comment = _comment
    WHERE id = v_req.id
    RETURNING * INTO v_req;

  -- Refletir no estado do post
  IF _decision = 'approved' THEN
    UPDATE public.tasks SET publish_state = 'approved' WHERE id = v_req.task_id;
  ELSE
    UPDATE public.tasks SET publish_state = 'review' WHERE id = v_req.task_id;
  END IF;

  RETURN v_req;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decide_social_approval(uuid, public.social_approval_status, text, text) TO anon, authenticated;

-- 8) Storage bucket público para assets de mídia
INSERT INTO storage.buckets (id, name, public)
VALUES ('media-assets','media-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policies do bucket (idempotentes via DROP)
DROP POLICY IF EXISTS "media_assets_public_read" ON storage.objects;
CREATE POLICY "media_assets_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'media-assets');

DROP POLICY IF EXISTS "media_assets_auth_insert" ON storage.objects;
CREATE POLICY "media_assets_auth_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "media_assets_auth_update" ON storage.objects;
CREATE POLICY "media_assets_auth_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'media-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "media_assets_auth_delete" ON storage.objects;
CREATE POLICY "media_assets_auth_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'media-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
