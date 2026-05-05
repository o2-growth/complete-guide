-- Sub-fase 7E: Whiteboards (snapshot lib-agnostic — usado com Excalidraw MIT)

CREATE TABLE IF NOT EXISTS public.whiteboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  snapshot jsonb NOT NULL DEFAULT '{"elements": [], "appState": {}, "files": {}}'::jsonb,
  thumbnail_url text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whiteboards_tenant ON public.whiteboards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whiteboards_project ON public.whiteboards(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_whiteboards_task ON public.whiteboards(task_id) WHERE task_id IS NOT NULL;

DROP TRIGGER IF EXISTS tg_set_updated_at_whiteboards ON public.whiteboards;
CREATE TRIGGER tg_set_updated_at_whiteboards
  BEFORE UPDATE ON public.whiteboards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.whiteboards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS whiteboards_select ON public.whiteboards;
CREATE POLICY whiteboards_select ON public.whiteboards FOR SELECT
USING (tenant_id IN (SELECT public.user_tenant_ids()));

DROP POLICY IF EXISTS whiteboards_insert ON public.whiteboards;
CREATE POLICY whiteboards_insert ON public.whiteboards FOR INSERT
WITH CHECK (
  tenant_id IN (SELECT public.user_tenant_ids())
  AND public.user_role_in_tenant(tenant_id) IN ('admin','manager','specialist')
);

DROP POLICY IF EXISTS whiteboards_update ON public.whiteboards;
CREATE POLICY whiteboards_update ON public.whiteboards FOR UPDATE
USING (
  tenant_id IN (SELECT public.user_tenant_ids())
  AND public.user_role_in_tenant(tenant_id) IN ('admin','manager','specialist')
);

DROP POLICY IF EXISTS whiteboards_delete ON public.whiteboards;
CREATE POLICY whiteboards_delete ON public.whiteboards FOR DELETE
USING (
  tenant_id IN (SELECT public.user_tenant_ids())
  AND public.user_role_in_tenant(tenant_id) IN ('admin','manager')
);
