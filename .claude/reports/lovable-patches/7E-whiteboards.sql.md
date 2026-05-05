# Lovable Patch — 7E Whiteboards (Excalidraw)

> **Onde aplicar**: editor SQL do Lovable Cloud (project_id `dboftogzjobfvtjaoifh`).
> **Não aplicar localmente**. As pastas `supabase/migrations/` no repo são espelho de leitura.
> **Fase**: 7E (Whiteboard / canvas livre).

## Contexto

Sub-fase entrega canvas livre por workspace usando **Excalidraw** (MIT). O snapshot é um JSON
serializável com `elements`, `appState` e `files` — permanece lib-agnostic, então se um dia trocarmos
de engine basta mapear para outro formato. Whiteboards podem opcionalmente ser vinculados a `projects`
ou `tasks`.

Permissões idênticas às de `wiki_pages`: `admin`/`manager`/`specialist` editam; delete só
`admin`/`manager`. `requester` fica de fora.

## SQL

```sql
CREATE TABLE public.whiteboards (
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

CREATE INDEX idx_whiteboards_tenant ON public.whiteboards(tenant_id);
CREATE INDEX idx_whiteboards_project ON public.whiteboards(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_whiteboards_task ON public.whiteboards(task_id) WHERE task_id IS NOT NULL;

CREATE TRIGGER tg_set_updated_at_whiteboards
  BEFORE UPDATE ON public.whiteboards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.whiteboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY whiteboards_select ON public.whiteboards FOR SELECT
USING (tenant_id IN (SELECT public.user_tenant_ids()));
CREATE POLICY whiteboards_insert ON public.whiteboards FOR INSERT
WITH CHECK (
  tenant_id IN (SELECT public.user_tenant_ids())
  AND public.user_role_in_tenant(tenant_id) IN ('admin','manager','specialist')
);
CREATE POLICY whiteboards_update ON public.whiteboards FOR UPDATE
USING (
  tenant_id IN (SELECT public.user_tenant_ids())
  AND public.user_role_in_tenant(tenant_id) IN ('admin','manager','specialist')
);
CREATE POLICY whiteboards_delete ON public.whiteboards FOR DELETE
USING (
  tenant_id IN (SELECT public.user_tenant_ids())
  AND public.user_role_in_tenant(tenant_id) IN ('admin','manager')
);
```

## Critérios de aceite

- [ ] `INSERT` com `tenant_id` válido funciona para `admin`/`manager`/`specialist`.
- [ ] `requester` não enxerga linhas via `SELECT`.
- [ ] `UPDATE` em `snapshot` é refletido por `updated_at`.
- [ ] Deletar projeto vinculado mantém a whiteboard com `project_id = NULL`.
- [ ] Deletar tarefa vinculada mantém a whiteboard com `task_id = NULL`.

## Pendências para o frontend

- Após aplicar este SQL no Lovable, regerar `src/integrations/supabase/types.ts` para que
  `Database['public']['Tables']['whiteboards']` apareça tipado. Enquanto não rodar o gen, o
  frontend usa casts pontuais (`as never` no insert/update e `as` no select).
