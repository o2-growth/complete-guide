# 7I — Automations engine visual (patch Lovable)

> Patch leve sobre `automation_rules` (já existente) para suportar
> Builder Visual + Galeria de Templates estilo ClickUp/Zapier-lite.
> A engine (Edge Function `process-automations`) **não muda**: ela continua
> consumindo a fila `automation_events`, só que o `conditions` agora aceita
> dois formatos para compatibilidade retroativa:
>
> - **legado** — array simples: `[{ field, op, value }]` (AND implícito)
> - **novo (visual builder)** — objeto: `{ all: [...] }` ou `{ any: [...] }`
>
> A Edge function vai precisar adaptar `evalCondition` para aceitar o objeto
> em uma rodada futura — registrar como `[lovable]` no backlog. Hoje a UI
> serializa o que o backend já entende (array) quando o usuário usa o modo
> simples; modo avançado AND/OR é gravado no formato `{all|any}` para o dia
> em que a edge function for atualizada.

---

## 1. ALTER TABLE — campos de UX visual

```sql
ALTER TABLE public.automation_rules
  ADD COLUMN IF NOT EXISTS icon text DEFAULT 'Zap',
  ADD COLUMN IF NOT EXISTS color text DEFAULT '#0EA5E9',
  ADD COLUMN IF NOT EXISTS is_template boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS template_category text;

COMMENT ON COLUMN public.automation_rules.icon IS
  'Nome do ícone lucide-react renderizado na UI (Zap, CheckCircle2, Bell, …)';
COMMENT ON COLUMN public.automation_rules.color IS
  'Cor hex (#RRGGBB) usada como accent do card visual.';
COMMENT ON COLUMN public.automation_rules.is_template IS
  'Quando true a regra aparece na galeria de templates e não dispara.';
COMMENT ON COLUMN public.automation_rules.template_category IS
  'notificacoes | sla | atribuicao | webhooks | ia | tickets';
```

> `description` já existe no schema atual (`Fase 5 — item 38`). Não recriar.

---

## 2. Garantia: regra template não dispara nunca

```sql
-- Regras marcadas como template não devem ser pegas pelo dispatcher.
DROP INDEX IF EXISTS public.idx_rules_tenant_event;
CREATE INDEX idx_rules_tenant_event
  ON public.automation_rules(tenant_id, trigger_event)
  WHERE active AND NOT is_template;
```

E no Edge function `process-automations` (futuro patch `[lovable]`):

```ts
.from("automation_rules")
.select("*")
.eq("tenant_id", ev.tenant_id)
.eq("trigger_event", ev.event)
.eq("active", true)
.eq("is_template", false)   // <— novo
```

---

## 3. Seed de templates pré-prontos (idempotente, por tenant)

> Roda apenas para tenants que ainda não têm um template equivalente.
> Inserts `is_template = true` e `active = false` (template é escolhido
> manualmente pelo usuário via "Usar template").

```sql
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT id FROM public.tenants LOOP
    -- 1. Notificar squad ao concluir tarefa urgente
    INSERT INTO public.automation_rules
      (tenant_id, name, description, trigger_event, conditions, actions,
       active, is_template, template_category, icon, color)
    SELECT t.id,
      'Notificar squad ao concluir tarefa urgente',
      'Quando uma tarefa de prioridade urgente é concluída, avisa o squad.',
      'task.completed',
      jsonb_build_object('all', jsonb_build_array(
        jsonb_build_object('field','priority','op','eq','value','urgent'))),
      jsonb_build_array(jsonb_build_object('kind','chat_notify',
        'params', jsonb_build_object('channel','squad','title','Tarefa urgente concluída'))),
      false, true, 'notificacoes', 'CheckCircle2', '#10B981'
    WHERE NOT EXISTS (SELECT 1 FROM public.automation_rules r
      WHERE r.tenant_id = t.id AND r.is_template
        AND r.name = 'Notificar squad ao concluir tarefa urgente');

    -- 2. Atribuir tarefa nova ao líder do squad
    INSERT INTO public.automation_rules
      (tenant_id, name, description, trigger_event, conditions, actions,
       active, is_template, template_category, icon, color)
    SELECT t.id,
      'Atribuir tarefa nova ao líder do squad',
      'Toda tarefa criada sem responsável vai para o líder do squad.',
      'task.created',
      jsonb_build_object('all', jsonb_build_array(
        jsonb_build_object('field','assignee_id','op','not_exists','value',null))),
      jsonb_build_array(jsonb_build_object('kind','assign_to',
        'params', jsonb_build_object('strategy','squad_lead'))),
      false, true, 'atribuicao', 'UserPlus', '#0EA5E9'
    WHERE NOT EXISTS (SELECT 1 FROM public.automation_rules r
      WHERE r.tenant_id = t.id AND r.is_template
        AND r.name = 'Atribuir tarefa nova ao líder do squad');

    -- 3. Notificar dono ao detectar atraso
    INSERT INTO public.automation_rules
      (tenant_id, name, description, trigger_event, conditions, actions,
       active, is_template, template_category, icon, color)
    SELECT t.id,
      'Avisar quando a tarefa atrasar',
      'Notifica o responsável quando uma tarefa entra em status atrasado.',
      'task.overdue', '[]'::jsonb,
      jsonb_build_array(jsonb_build_object('kind','notify',
        'params', jsonb_build_object('title','Tarefa atrasada',
          'body','A tarefa {{task.title}} passou do prazo.'))),
      false, true, 'sla', 'AlarmClock', '#EF4444'
    WHERE NOT EXISTS (SELECT 1 FROM public.automation_rules r
      WHERE r.tenant_id = t.id AND r.is_template
        AND r.name = 'Avisar quando a tarefa atrasar');

    -- 4. Webhook ao criar ticket
    INSERT INTO public.automation_rules
      (tenant_id, name, description, trigger_event, conditions, actions,
       active, is_template, template_category, icon, color)
    SELECT t.id,
      'Disparar webhook ao abrir ticket',
      'Encaminha cada ticket novo para um endpoint externo (Slack, n8n etc.).',
      'ticket.created', '[]'::jsonb,
      jsonb_build_array(jsonb_build_object('kind','webhook',
        'params', jsonb_build_object('url','https://exemplo.com/oxy-webhook',
          'payload', jsonb_build_object('event','ticket.created','data','{{payload}}')))),
      false, true, 'webhooks', 'Webhook', '#7C3AED'
    WHERE NOT EXISTS (SELECT 1 FROM public.automation_rules r
      WHERE r.tenant_id = t.id AND r.is_template
        AND r.name = 'Disparar webhook ao abrir ticket');

    -- 5. IA categoriza tarefa nova
    INSERT INTO public.automation_rules
      (tenant_id, name, description, trigger_event, conditions, actions,
       active, is_template, template_category, icon, color)
    SELECT t.id,
      'IA categoriza tarefa nova automaticamente',
      'Aplica uma tag e prioridade sugerida pela IA Gênio em cada tarefa criada.',
      'task.created', '[]'::jsonb,
      jsonb_build_array(jsonb_build_object('kind','update_field',
        'params', jsonb_build_object('field','meta','value','ai_categorize'))),
      false, true, 'ia', 'Sparkles', '#FCD34D'
    WHERE NOT EXISTS (SELECT 1 FROM public.automation_rules r
      WHERE r.tenant_id = t.id AND r.is_template
        AND r.name = 'IA categoriza tarefa nova automaticamente');

    -- 6. Resolver ticket cria card no kanban
    INSERT INTO public.automation_rules
      (tenant_id, name, description, trigger_event, conditions, actions,
       active, is_template, template_category, icon, color)
    SELECT t.id,
      'Ticket resolvido vira card de melhoria',
      'Cada ticket fechado abre uma tarefa de follow-up no projeto Suporte.',
      'ticket.created', '[]'::jsonb,
      jsonb_build_array(jsonb_build_object('kind','create_task',
        'params', jsonb_build_object('title','Follow-up: {{ticket.subject}}',
          'priority','low'))),
      false, true, 'tickets', 'TicketCheck', '#10B981'
    WHERE NOT EXISTS (SELECT 1 FROM public.automation_rules r
      WHERE r.tenant_id = t.id AND r.is_template
        AND r.name = 'Ticket resolvido vira card de melhoria');
  END LOOP;
END $$;
```

---

## 4. Edge function `process-automations` — patch futuro `[lovable]`

> A UI **já grava** `conditions` no formato novo `{all|any: [...]}` quando o
> usuário usa o builder AND/OR; e mantém o formato legado `[...]` quando
> nenhum agrupamento é necessário. Para a engine não pular nada, é preciso
> adaptar:

```ts
function evalConditions(raw: unknown, payload: Record<string, unknown>): boolean {
  if (!raw) return true;
  if (Array.isArray(raw)) {
    return (raw as Condition[]).every(c => evalCondition(c, payload));
  }
  const obj = raw as { all?: Condition[]; any?: Condition[] };
  if (obj.all) return obj.all.every(c => evalCondition(c, payload));
  if (obj.any) return obj.any.some(c => evalCondition(c, payload));
  return true;
}
```

E acrescentar handlers para os novos kinds: `add_tag`, `remove_tag`,
`update_field` (já listados na UI). Os handlers `create_task`, `set_status`,
`assign_to`, `notify`, `chat_notify`, `webhook` já existem.

---

## 5. Eventos novos a serem disparados pelos triggers

| Trigger DB                     | Evento emitido         |
|--------------------------------|------------------------|
| `tg_tasks_emit_automation`     | já emite `task.created`, `task.updated`, `task.completed` |
| `tg_tasks_assigned`            | adicionar `task.assigned` (ver patch 7A) |
| `tg_tasks_overdue` (cron)      | `task.overdue` (job hourly) |
| `tg_comments_emit`             | `comment.added` |
| `tg_attachments_emit`          | `attachment.added` |
| `tg_anomalies_emit`            | `anomaly.detected` |
| `tg_goals_at_risk`             | `goal.at_risk` (cron) |
| `tg_wiki_emit`                 | `wiki.updated` |
| `tg_tickets_emit`              | `ticket.created` |
| `gcal-sync` Edge function      | `gcal.synced` |
| Botão manual no UI             | `manual` |

> A maioria desses eventos já é dispatched em outros lugares; este patch só
> declara a lista canônica que a UI expõe no dropdown. Quando uma engine
> ainda não emite o evento, a regra fica salva mas dorme — o usuário
> consegue criar a regra desde já e ela passa a disparar quando o backend
> emitir o evento correspondente.
