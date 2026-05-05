# 6F.3 — Personas + Públicos (patch SQL para Lovable)

> Backend é Lovable Cloud. Este arquivo é apenas o esquema esperado a ser aplicado pelo CTO no editor Lovable.
> Origem: feature gap EK-03 (`feature-gap-analysis.md`).

## Tabelas

```sql
-- =========================================================
-- PERSONAS
-- =========================================================
CREATE TABLE public.personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  age_range text,                            -- '18-24','25-34','35-44','45-54','55-64','65+'
  occupation text,
  pain_points jsonb NOT NULL DEFAULT '[]'::jsonb, -- string[]
  goals jsonb NOT NULL DEFAULT '[]'::jsonb,       -- string[]
  channels text[] NOT NULL DEFAULT '{}',     -- 'instagram','linkedin','email','tiktok','youtube','x','whatsapp'
  bio text,
  avatar_url text,
  color text NOT NULL DEFAULT '#0EA5E9',
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE INDEX idx_personas_tenant ON public.personas(tenant_id);

-- =========================================================
-- AUDIENCES (Públicos)
-- =========================================================
CREATE TABLE public.audiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  persona_ids uuid[] NOT NULL DEFAULT '{}',  -- referência array (sem tabela junction)
  channels text[] NOT NULL DEFAULT '{}',
  size_estimate int,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE INDEX idx_audiences_tenant ON public.audiences(tenant_id);
CREATE INDEX idx_audiences_persona_ids ON public.audiences USING gin (persona_ids);

-- =========================================================
-- Vincular tasks a persona/audience (camada estratégica)
-- =========================================================
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS persona_id uuid REFERENCES public.personas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS audience_id uuid REFERENCES public.audiences(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_persona_id ON public.tasks(persona_id) WHERE persona_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_audience_id ON public.tasks(audience_id) WHERE audience_id IS NOT NULL;

-- (Opcional: também em social_campaigns/posts quando a tabela existir)
-- ALTER TABLE public.social_campaigns ADD COLUMN IF NOT EXISTS persona_id uuid REFERENCES public.personas(id) ON DELETE SET NULL;
-- ALTER TABLE public.social_campaigns ADD COLUMN IF NOT EXISTS audience_id uuid REFERENCES public.audiences(id) ON DELETE SET NULL;
```

## Triggers

```sql
CREATE TRIGGER tg_personas_updated_at
  BEFORE UPDATE ON public.personas
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER tg_audiences_updated_at
  BEFORE UPDATE ON public.audiences
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
```

## RLS

```sql
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audiences ENABLE ROW LEVEL SECURITY;

-- PERSONAS: leitura por qualquer membro do tenant; escrita por admin/manager/specialist
CREATE POLICY "personas_select_tenant"
  ON public.personas FOR SELECT
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

CREATE POLICY "personas_insert_team"
  ON public.personas FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT public.user_tenant_ids())
    AND public.user_role_in_tenant(tenant_id) IN ('admin','manager','specialist')
  );

CREATE POLICY "personas_update_team"
  ON public.personas FOR UPDATE
  USING (
    tenant_id IN (SELECT public.user_tenant_ids())
    AND public.user_role_in_tenant(tenant_id) IN ('admin','manager','specialist')
  );

CREATE POLICY "personas_delete_team"
  ON public.personas FOR DELETE
  USING (
    tenant_id IN (SELECT public.user_tenant_ids())
    AND public.user_role_in_tenant(tenant_id) IN ('admin','manager')
  );

-- AUDIENCES: idem
CREATE POLICY "audiences_select_tenant"
  ON public.audiences FOR SELECT
  USING (tenant_id IN (SELECT public.user_tenant_ids()));

CREATE POLICY "audiences_insert_team"
  ON public.audiences FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT public.user_tenant_ids())
    AND public.user_role_in_tenant(tenant_id) IN ('admin','manager','specialist')
  );

CREATE POLICY "audiences_update_team"
  ON public.audiences FOR UPDATE
  USING (
    tenant_id IN (SELECT public.user_tenant_ids())
    AND public.user_role_in_tenant(tenant_id) IN ('admin','manager','specialist')
  );

CREATE POLICY "audiences_delete_team"
  ON public.audiences FOR DELETE
  USING (
    tenant_id IN (SELECT public.user_tenant_ids())
    AND public.user_role_in_tenant(tenant_id) IN ('admin','manager')
  );
```

## Realtime

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.personas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audiences;
```

## Notas

- `requester` (sem licença) **não** acessa `/personas` — apenas papéis com acesso ao app.
- Optei por `uuid[]` em `audiences.persona_ids` em vez de tabela junction `audience_personas` — economiza um JOIN, já indexado via GIN. Se um dia precisar de metadados por vínculo (ex.: peso), basta migrar para junction sem perder backward-compat.
- Após apply, regenerar `src/integrations/supabase/types.ts` para remover os casts `as never` no frontend.
