# 7A — Trigger `task_assigned`

> **Sub-fase 7A — Coerência sistêmica.** Fecha o **G5** da auditoria
> (`coerencia-sistemica.md`): o enum `notification_kind` já tem o valor
> `task_assigned`, mas nenhum trigger criava a notificação. Sem isto, o
> assignee só descobria a tarefa ao abrir o app.
>
> **Aplicar no Lovable Cloud** (`project_id = dboftogzjobfvtjaoifh`).

## SQL

```sql
CREATE OR REPLACE FUNCTION public.tg_notify_task_assigned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.assignee_id IS NOT NULL THEN
    INSERT INTO public.notifications (tenant_id, user_id, kind, severity, title, body, link, payload)
    VALUES (
      NEW.tenant_id,
      NEW.assignee_id,
      'task_assigned',
      'info',
      'Nova tarefa atribuída a você',
      COALESCE(NEW.title, 'Sem título'),
      '/app/projetos/' || NEW.project_id::text || '?task=' || NEW.id::text,
      jsonb_build_object('task_id', NEW.id, 'task_code', NEW.code)
    );
  ELSIF TG_OP = 'UPDATE'
        AND NEW.assignee_id IS DISTINCT FROM OLD.assignee_id
        AND NEW.assignee_id IS NOT NULL THEN
    INSERT INTO public.notifications (tenant_id, user_id, kind, severity, title, body, link, payload)
    VALUES (
      NEW.tenant_id,
      NEW.assignee_id,
      'task_assigned',
      'info',
      'Tarefa atribuída a você',
      COALESCE(NEW.title, 'Sem título'),
      '/app/projetos/' || NEW.project_id::text || '?task=' || NEW.id::text,
      jsonb_build_object('task_id', NEW.id, 'task_code', NEW.code)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_tasks_notify_assigned ON public.tasks;
CREATE TRIGGER tg_tasks_notify_assigned
  AFTER INSERT OR UPDATE OF assignee_id ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_task_assigned();
```

## Validação

1. Aplique o SQL via SQL Editor do Lovable.
2. Crie uma task no app com um `assignee_id` diferente do seu user atual.
3. Acesse `/app/notificacoes` com o user assignee — deve aparecer item
   `kind = task_assigned`, severity `info`, link para o projeto/task.
4. Atualize o `assignee_id` da mesma task para outro user — nova
   notification deve ser criada.
5. Atualize qualquer outro campo (título, due_at, etc.) — **não** deve
   gerar novas notifications de `task_assigned` (idempotência via
   `IS DISTINCT FROM`).

## Notas

- Idempotente: só dispara quando `assignee_id` realmente muda
  (`IS DISTINCT FROM` cobre NULL→UUID, UUID→UUID, e UUID→NULL ignora).
- Não dispara em DELETE (não interessa notificar atribuição que foi
  desfeita por arquivamento).
- `SECURITY DEFINER + search_path` segue o padrão do produto
  (`CLAUDE.md §1.4`).
- Realtime: a tabela `notifications` já tem trigger
  `broadcast_table_change` ativo desde `BL-01`, então a notif chega
  automaticamente no canal `tenant:{id}:notifications`.
