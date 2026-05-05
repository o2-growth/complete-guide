CREATE TABLE IF NOT EXISTS public.templates_unified (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN (
    'project','task_checklist','message','form','brief','content_caption','hashtag_group'
  )),
  name text NOT NULL,
  description text,
  body jsonb NOT NULL DEFAULT '{}'::jsonb,
  tags text[] NOT NULL DEFAULT '{}',
  is_pinned boolean NOT NULL DEFAULT false,
  use_count int NOT NULL DEFAULT 0,
  last_used_at timestamptz,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, kind, name)
);

CREATE INDEX IF NOT EXISTS idx_templates_unified_tenant_kind ON public.templates_unified (tenant_id, kind);
CREATE INDEX IF NOT EXISTS idx_templates_unified_pinned ON public.templates_unified (tenant_id, is_pinned) WHERE is_pinned;
CREATE INDEX IF NOT EXISTS idx_templates_unified_tags ON public.templates_unified USING gin (tags);

DROP TRIGGER IF EXISTS tg_templates_unified_updated_at ON public.templates_unified;
CREATE TRIGGER tg_templates_unified_updated_at
  BEFORE UPDATE ON public.templates_unified
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.templates_unified ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "templates_unified_select" ON public.templates_unified;
CREATE POLICY "templates_unified_select" ON public.templates_unified FOR SELECT
USING (tenant_id IN (SELECT public.user_tenant_ids()));

DROP POLICY IF EXISTS "templates_unified_insert" ON public.templates_unified;
CREATE POLICY "templates_unified_insert" ON public.templates_unified FOR INSERT
WITH CHECK (
  tenant_id IN (SELECT public.user_tenant_ids())
  AND (created_by = (select auth.uid()) OR created_by IS NULL)
);

DROP POLICY IF EXISTS "templates_unified_update" ON public.templates_unified;
CREATE POLICY "templates_unified_update" ON public.templates_unified FOR UPDATE
USING (tenant_id IN (SELECT public.user_tenant_ids()))
WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));

DROP POLICY IF EXISTS "templates_unified_delete" ON public.templates_unified;
CREATE POLICY "templates_unified_delete" ON public.templates_unified FOR DELETE
USING (
  tenant_id IN (SELECT public.user_tenant_ids())
  AND (
    public.user_role_in_tenant(tenant_id) IN ('admin','manager')
    OR created_by = (select auth.uid())
  )
);

CREATE OR REPLACE FUNCTION public.use_unified_template(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_body jsonb; v_tenant uuid;
BEGIN
  SELECT tenant_id, body INTO v_tenant, v_body
  FROM public.templates_unified WHERE id = p_id;
  IF v_tenant IS NULL THEN RAISE EXCEPTION 'Template não encontrado'; END IF;
  IF v_tenant NOT IN (SELECT public.user_tenant_ids()) THEN
    RAISE EXCEPTION 'Sem permissão para este template';
  END IF;
  UPDATE public.templates_unified
  SET use_count = use_count + 1, last_used_at = now()
  WHERE id = p_id;
  RETURN v_body;
END; $$;

REVOKE ALL ON FUNCTION public.use_unified_template(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.use_unified_template(uuid) TO authenticated;