# Lovable Patch — 7F Dashboards customizáveis

> **Onde aplicar**: editor SQL do Lovable Cloud (project_id `dboftogzjobfvtjaoifh`).
> **Não aplicar localmente**. As pastas `supabase/migrations/` no repo são espelho de leitura.
> **Fase**: 7F (Dashboards customizáveis com canvas drag-drop, paridade ClickUp).

## Contexto

Sub-fase entrega múltiplos dashboards por tenant, cada um com widgets configuráveis
(`kpi`, `chart_bar`, `chart_line`, `chart_donut`, `task_list`, `calendar_mini`,
`timesheet_snippet`, `recent_activity`, `goals_progress`, `workload_heatmap`,
`embed`, `markdown`). Layout em grid 12 colunas com width/height por widget e
ordenação por `position`.

Permissões: leitura para qualquer membro do tenant; escrita para
`admin` / `manager` / `specialist` (igual a wiki / whiteboards).

## SQL

```sql
CREATE TABLE public.dashboards (
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
CREATE INDEX idx_dashboards_tenant ON public.dashboards(tenant_id);

CREATE TABLE public.dashboard_widgets (
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
CREATE INDEX idx_dashboard_widgets_dashboard ON public.dashboard_widgets(dashboard_id);

ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY dashboards_select ON public.dashboards FOR SELECT
USING (tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY dashboards_all ON public.dashboards FOR ALL
USING (tenant_id IN (SELECT public.user_tenant_ids())
  AND public.user_role_in_tenant(tenant_id) IN ('admin','manager','specialist'))
WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids())
  AND public.user_role_in_tenant(tenant_id) IN ('admin','manager','specialist'));

CREATE POLICY dw_all ON public.dashboard_widgets FOR ALL
USING (EXISTS (SELECT 1 FROM public.dashboards d
  WHERE d.id = dashboard_widgets.dashboard_id AND d.tenant_id IN (SELECT public.user_tenant_ids())))
WITH CHECK (EXISTS (SELECT 1 FROM public.dashboards d
  WHERE d.id = dashboard_widgets.dashboard_id AND d.tenant_id IN (SELECT public.user_tenant_ids())));

CREATE TRIGGER tg_dashboards_updated BEFORE UPDATE ON public.dashboards
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tg_dw_updated BEFORE UPDATE ON public.dashboard_widgets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

## Validação esperada

- `select count(*) from public.dashboards` retorna 0.
- `select count(*) from public.dashboard_widgets` retorna 0.
- Tentar inserir `dashboards` como `requester` deve falhar via RLS.
- `admin/manager/specialist` consegue criar dashboard + widgets.

## Pós-aplicação

Depois que o Lovable confirmar, regenerar `src/integrations/supabase/types.ts`
no editor Lovable e fazer pull no repo (já cobrimos casts defensivos no front
até os types regenerarem).
