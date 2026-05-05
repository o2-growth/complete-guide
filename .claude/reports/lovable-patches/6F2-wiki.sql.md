# Lovable Patch — 6F.2 Wiki interna (Conhecimento)

> **Onde aplicar**: editor SQL do Lovable Cloud (project_id `dboftogzjobfvtjaoifh`).
> **Não aplicar localmente**. As pastas `supabase/migrations/` no repo são espelho de leitura.
> **Fase**: 6F.2 (Ekyte parity — EK-04, Conhecimento como wiki interna).

## Contexto

A sub-fase entrega uma wiki interna multi-tenant com:
- Hierarquia de páginas (até 4 níveis, anti-ciclo).
- Full-text search em português via `tsvector` GENERATED + GIN.
- Versionamento automático (snapshot a cada UPDATE de `body`/`title`).
- RLS por papel: `tenant_members` leem; `admin`/`manager`/`specialist` editam; `requester` não tem acesso.
- RPC `wiki_search` ordenada por `ts_rank` para o popover de busca.

## SQL

```sql
-- =============================================================================
-- 1. Tabelas
-- =============================================================================

CREATE TABLE public.wiki_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.wiki_pages(id) ON DELETE SET NULL,
  slug text NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '', -- HTML do TipTap (renderizado via dangerouslySetInnerHTML, mesma sanitização dos comentários)
  body_search tsvector GENERATED ALWAYS AS (
    to_tsvector('portuguese', coalesce(title, '') || ' ' || coalesce(body, ''))
  ) STORED,
  icon text DEFAULT 'FileText',
  cover_image text,
  is_published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id),
  updated_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

CREATE INDEX idx_wiki_pages_tenant ON public.wiki_pages(tenant_id);
CREATE INDEX idx_wiki_pages_parent ON public.wiki_pages(parent_id);
CREATE INDEX idx_wiki_pages_search ON public.wiki_pages USING gin(body_search);
CREATE INDEX idx_wiki_pages_tenant_parent_sort ON public.wiki_pages(tenant_id, parent_id, sort_order);

CREATE TABLE public.wiki_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.wiki_pages(id) ON DELETE CASCADE,
  body text NOT NULL,
  title text NOT NULL,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_wiki_versions_page_created ON public.wiki_versions(page_id, created_at DESC);

-- =============================================================================
-- 2. Triggers
-- =============================================================================

-- 2.1 updated_at automático
CREATE TRIGGER tg_set_updated_at_wiki_pages
  BEFORE UPDATE ON public.wiki_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 2.2 Snapshot de versão a cada UPDATE de body/title
CREATE OR REPLACE FUNCTION public.tg_save_wiki_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.body IS DISTINCT FROM OLD.body OR NEW.title IS DISTINCT FROM OLD.title) THEN
    INSERT INTO public.wiki_versions (page_id, body, title, created_by)
    VALUES (OLD.id, OLD.body, OLD.title, OLD.updated_by);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_save_wiki_version
  AFTER UPDATE ON public.wiki_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_save_wiki_version();

-- 2.3 Validação de profundidade (max 4 níveis) + anti-ciclo
CREATE OR REPLACE FUNCTION public.tg_validate_wiki_depth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_id uuid;
  depth int := 1;
  visited uuid[] := ARRAY[]::uuid[];
BEGIN
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.parent_id = NEW.id THEN
    RAISE EXCEPTION 'Página não pode ser pai de si mesma';
  END IF;

  current_id := NEW.parent_id;
  WHILE current_id IS NOT NULL LOOP
    -- Anti-ciclo: se encontrar a própria página subindo a árvore, é ciclo
    IF current_id = NEW.id THEN
      RAISE EXCEPTION 'Hierarquia em ciclo detectada';
    END IF;
    IF current_id = ANY(visited) THEN
      RAISE EXCEPTION 'Hierarquia em ciclo detectada';
    END IF;
    visited := visited || current_id;
    depth := depth + 1;
    IF depth > 4 THEN
      RAISE EXCEPTION 'Wiki suporta no máximo 4 níveis de hierarquia';
    END IF;
    SELECT parent_id INTO current_id FROM public.wiki_pages WHERE id = current_id;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER tg_validate_wiki_depth
  BEFORE INSERT OR UPDATE OF parent_id ON public.wiki_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_validate_wiki_depth();

-- =============================================================================
-- 3. RLS
-- =============================================================================

ALTER TABLE public.wiki_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wiki_versions ENABLE ROW LEVEL SECURITY;

-- 3.1 wiki_pages: leitura por qualquer membro do tenant (exceto requester)
CREATE POLICY wiki_pages_select_members
  ON public.wiki_pages
  FOR SELECT
  USING (
    tenant_id IN (SELECT public.user_tenant_ids())
    AND public.user_role_in_tenant(tenant_id) IN ('admin', 'manager', 'specialist')
  );

-- 3.2 wiki_pages: insert/update/delete por admin/manager/specialist
CREATE POLICY wiki_pages_insert_editors
  ON public.wiki_pages
  FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT public.user_tenant_ids())
    AND public.user_role_in_tenant(tenant_id) IN ('admin', 'manager', 'specialist')
  );

CREATE POLICY wiki_pages_update_editors
  ON public.wiki_pages
  FOR UPDATE
  USING (
    tenant_id IN (SELECT public.user_tenant_ids())
    AND public.user_role_in_tenant(tenant_id) IN ('admin', 'manager', 'specialist')
  )
  WITH CHECK (
    tenant_id IN (SELECT public.user_tenant_ids())
    AND public.user_role_in_tenant(tenant_id) IN ('admin', 'manager', 'specialist')
  );

CREATE POLICY wiki_pages_delete_admin_manager
  ON public.wiki_pages
  FOR DELETE
  USING (
    tenant_id IN (SELECT public.user_tenant_ids())
    AND public.user_role_in_tenant(tenant_id) IN ('admin', 'manager')
  );

-- 3.3 wiki_versions: leitura espelha permissão da página; sem update/delete (histórico imutável)
CREATE POLICY wiki_versions_select_via_page
  ON public.wiki_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wiki_pages p
      WHERE p.id = wiki_versions.page_id
        AND p.tenant_id IN (SELECT public.user_tenant_ids())
        AND public.user_role_in_tenant(p.tenant_id) IN ('admin', 'manager', 'specialist')
    )
  );

CREATE POLICY wiki_versions_insert_system
  ON public.wiki_versions
  FOR INSERT
  WITH CHECK (true); -- inserções vêm via SECURITY DEFINER do trigger

-- =============================================================================
-- 4. RPC de busca FTS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.wiki_search(_tenant uuid, _q text)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  parent_id uuid,
  icon text,
  rank real,
  snippet text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  query tsquery;
BEGIN
  IF _q IS NULL OR length(trim(_q)) = 0 THEN
    RETURN;
  END IF;

  -- Garante que o caller é membro do tenant
  IF NOT (_tenant IN (SELECT public.user_tenant_ids())) THEN
    RAISE EXCEPTION 'Acesso negado ao workspace';
  END IF;

  -- websearch_to_tsquery aceita aspas, AND/OR/NOT — boa UX padrão
  query := websearch_to_tsquery('portuguese', _q);

  RETURN QUERY
  SELECT
    p.id,
    p.slug,
    p.title,
    p.parent_id,
    p.icon,
    ts_rank(p.body_search, query) AS rank,
    ts_headline(
      'portuguese',
      coalesce(p.body, ''),
      query,
      'MaxFragments=1, MaxWords=18, MinWords=5, ShortWord=3, HighlightAll=false'
    ) AS snippet
  FROM public.wiki_pages p
  WHERE p.tenant_id = _tenant
    AND p.is_published = true
    AND p.body_search @@ query
  ORDER BY rank DESC, p.updated_at DESC
  LIMIT 20;
END;
$$;

GRANT EXECUTE ON FUNCTION public.wiki_search(uuid, text) TO authenticated;

-- =============================================================================
-- 5. Realtime (Broadcast — alinhado ao padrão Oxy)
-- =============================================================================

-- O frontend escuta canal `tenant:{id}`; trigger emite broadcast em INSERT/UPDATE/DELETE.
-- Reutiliza a função genérica do schema (public.broadcast_tenant_change), criada na Fase 2.
-- Se ainda não existir helper genérico, usar trigger inline:

CREATE OR REPLACE FUNCTION public.tg_broadcast_wiki_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload jsonb;
  tenant uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    tenant := OLD.tenant_id;
    payload := jsonb_build_object('op', 'delete', 'id', OLD.id);
  ELSE
    tenant := NEW.tenant_id;
    payload := jsonb_build_object('op', lower(TG_OP), 'id', NEW.id, 'parent_id', NEW.parent_id);
  END IF;

  PERFORM realtime.send(
    payload,
    'wiki:change',
    'tenant:' || tenant::text,
    true
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER tg_broadcast_wiki_change
  AFTER INSERT OR UPDATE OR DELETE ON public.wiki_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_broadcast_wiki_change();
```

## Critérios de aceite

- [ ] `INSERT` em `wiki_pages` com `parent_id` válido funciona; com 5º nível levanta exceção.
- [ ] `UPDATE` que troca `body` cria linha em `wiki_versions` com snapshot anterior.
- [ ] `wiki_search('<tenant>', 'foo bar')` retorna ordenado por `ts_rank`, com `snippet` destacado.
- [ ] `requester` não vê linhas em `wiki_pages`.
- [ ] Tentativa de criar ciclo (A pai de B, B pai de A) levanta `Hierarquia em ciclo detectada`.

## Pendências para o frontend

- O type generator do Lovable precisa rodar após aplicar este SQL para que `Database['public']['Tables']['wiki_pages']` apareça em `src/integrations/supabase/types.ts`. Enquanto isso, o frontend usa casts `as any`/`as never`.
