-- Sub-fase 7F: Dashboards customizáveis (12 widget kinds)

CREATE TABLE IF NOT EXISTS public.dashboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_public boolean NOT NULL DEFAULT false,
  layout jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_dashboards_tenant ON public.dashboards(tenant_id);

CREATE TABLE IF NOT EXISTS public.dashboard_widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id uuid NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN (
    'kpi','chart_bar','chart_line','chart_donut','task_list','calendar_mini',
    'timesheet_snippet','recent_activity','goals_progress','workload_heatmap','embed','markdown'
  )),
  title text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  position int NOT NULL DEFAULT 0,
  width int NOT NULL DEFAULT 1 CHECK (width BETWEEN 1 AND 4),
  height int NOT NULL DEFAULT 1 CHECK (height BETWEEN 1 AND 4),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_dashboard ON public.dashboard_widgets(dashboard_id);

ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dashboards_select ON public.dashboards;
CREATE POLICY dashboards_select ON public.dashboards FOR SELECT
USING (tenant_id IN (SELECT public.user_tenant_ids()));

DROP POLICY IF EXISTS dashboards_all ON public.dashboards;
CREATE POLICY dashboards_all ON public.dashboards FOR ALL
USING (
  tenant_id IN (SELECT public.user_tenant_ids())
  AND public.user_role_in_tenant(tenant_id) IN ('admin','manager','specialist')
)
WITH CHECK (
  tenant_id IN (SELECT public.user_tenant_ids())
  AND public.user_role_in_tenant(tenant_id) IN ('admin','manager','specialist')
);

DROP POLICY IF EXISTS dw_all ON public.dashboard_widgets;
CREATE POLICY dw_all ON public.dashboard_widgets FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.dashboards d
    WHERE d.id = dashboard_widgets.dashboard_id
      AND d.tenant_id IN (SELECT public.user_tenant_ids()))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.dashboards d
    WHERE d.id = dashboard_widgets.dashboard_id
      AND d.tenant_id IN (SELECT public.user_tenant_ids()))
);

DROP TRIGGER IF EXISTS tg_dashboards_updated ON public.dashboards;
CREATE TRIGGER tg_dashboards_updated BEFORE UPDATE ON public.dashboards
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tg_dw_updated ON public.dashboard_widgets;
CREATE TRIGGER tg_dw_updated BEFORE UPDATE ON public.dashboard_widgets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
