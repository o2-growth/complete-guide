-- Sub-fase 7I: Automations engine visual (campos descritivos + flag de template)

ALTER TABLE public.automation_rules
  ADD COLUMN IF NOT EXISTS icon text DEFAULT 'Zap',
  ADD COLUMN IF NOT EXISTS color text DEFAULT '#0EA5E9',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS is_template boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS template_category text;

-- Índice pra dispatcher excluir templates da fila de processamento
CREATE INDEX IF NOT EXISTS idx_automation_rules_active_no_template
  ON public.automation_rules(tenant_id, trigger_event)
  WHERE is_active = true AND is_template = false;
