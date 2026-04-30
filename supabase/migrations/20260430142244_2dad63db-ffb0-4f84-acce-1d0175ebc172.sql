-- ============================================================
-- Passo 17 — Skills Matrix
-- ============================================================

-- 1) Catálogo de skills por tenant
CREATE TABLE IF NOT EXISTS public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  description text,
  color text,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_skills_tenant ON public.skills(tenant_id);
CREATE INDEX IF NOT EXISTS idx_skills_category ON public.skills(tenant_id, category);

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY skills_read ON public.skills
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT user_tenant_ids()));

CREATE POLICY skills_manage ON public.skills
  FOR ALL TO authenticated
  USING (has_tenant_role(tenant_id, 'admin'::tenant_role) OR has_tenant_role(tenant_id, 'manager'::tenant_role))
  WITH CHECK (has_tenant_role(tenant_id, 'admin'::tenant_role) OR has_tenant_role(tenant_id, 'manager'::tenant_role));

CREATE TRIGGER trg_skills_updated_at
  BEFORE UPDATE ON public.skills
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) Nível de cada usuário em cada skill
CREATE TABLE IF NOT EXISTS public.user_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  level smallint NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 5),
  years_experience numeric(4,1) DEFAULT 0,
  endorsements_count integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_user_skills_user ON public.user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill ON public.user_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_tenant ON public.user_skills(tenant_id);

ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;

-- Toda a equipe enxerga a matriz (transparência)
CREATE POLICY user_skills_read ON public.user_skills
  FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT user_tenant_ids()));

-- Cada um gerencia o próprio nível
CREATE POLICY user_skills_manage_own ON public.user_skills
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND tenant_id IN (SELECT user_tenant_ids()));

-- Admins/managers podem corrigir níveis dos demais
CREATE POLICY user_skills_admin_manage ON public.user_skills
  FOR ALL TO authenticated
  USING (has_tenant_role(tenant_id, 'admin'::tenant_role) OR has_tenant_role(tenant_id, 'manager'::tenant_role))
  WITH CHECK (has_tenant_role(tenant_id, 'admin'::tenant_role) OR has_tenant_role(tenant_id, 'manager'::tenant_role));

CREATE TRIGGER trg_user_skills_updated_at
  BEFORE UPDATE ON public.user_skills
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) Função para endossar (incrementa endorsements_count, mas não permite auto-endosso)
CREATE OR REPLACE FUNCTION public.endorse_user_skill(_user_skill_id uuid)
RETURNS public.user_skills
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_us public.user_skills;
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO v_us FROM public.user_skills WHERE id = _user_skill_id;
  IF v_us.id IS NULL THEN
    RAISE EXCEPTION 'user_skill not found';
  END IF;
  IF v_us.user_id = v_caller THEN
    RAISE EXCEPTION 'cannot endorse yourself';
  END IF;
  IF v_us.tenant_id NOT IN (SELECT user_tenant_ids()) THEN
    RAISE EXCEPTION 'not authorized for this tenant';
  END IF;

  UPDATE public.user_skills
     SET endorsements_count = endorsements_count + 1
   WHERE id = _user_skill_id
   RETURNING * INTO v_us;

  RETURN v_us;
END;
$$;

-- 4) Seed de skills padrão alinhadas aos 3 squads
CREATE OR REPLACE FUNCTION public.seed_default_skills(p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.skills (tenant_id, name, slug, category, color, icon, description) VALUES
    -- Design / criação
    (p_tenant_id, 'Design Gráfico',          'design_grafico',     'design',     '#E1306C', 'Palette',  'Identidade visual, peças, layout, tipografia'),
    (p_tenant_id, 'Motion / Vídeo',          'motion',             'design',     '#8B5CF6', 'Video',    'Edição de vídeo, animação, motion graphics'),
    (p_tenant_id, 'Fotografia',              'fotografia',         'design',     '#F59E0B', 'Camera',   'Captação fotográfica e tratamento'),
    -- Copy / conteúdo
    (p_tenant_id, 'Copywriting',             'copywriting',        'copy',       '#3B82F6', 'PenTool',  'Textos persuasivos para anúncios e landing pages'),
    (p_tenant_id, 'Storytelling',            'storytelling',       'copy',       '#0EA5E9', 'BookOpen', 'Narrativa de marca e conteúdo editorial'),
    (p_tenant_id, 'Roteiro Reels/TikTok',    'roteiro_reels',      'copy',       '#EC4899', 'Film',     'Roteiros para vídeo curto'),
    -- Mídia / tráfego
    (p_tenant_id, 'Meta Ads',                'meta_ads',           'media',      '#1877F2', 'Target',   'Facebook e Instagram Ads'),
    (p_tenant_id, 'Google Ads',              'google_ads',         'media',      '#EA4335', 'Search',   'Search, Display, YouTube Ads'),
    (p_tenant_id, 'LinkedIn Ads',            'linkedin_ads',       'media',      '#0A66C2', 'Linkedin', 'Campanhas B2B no LinkedIn'),
    (p_tenant_id, 'SEO',                     'seo',                'media',      '#10B981', 'TrendingUp','Otimização orgânica para buscadores'),
    -- Tech / automação
    (p_tenant_id, 'n8n / Automação',         'n8n',                'tech',       '#FF6D5A', 'Workflow', 'Automação de fluxos com n8n'),
    (p_tenant_id, 'IA / Prompt Engineering', 'ia_prompt',          'tech',       '#7C3AED', 'Sparkles', 'Engenharia de prompts e workflows com LLMs'),
    (p_tenant_id, 'Desenvolvimento Web',     'dev_web',            'tech',       '#0EA5E9', 'Code',     'HTML, CSS, JS, React, integrações'),
    (p_tenant_id, 'Integrações / APIs',      'apis',               'tech',       '#06B6D4', 'Plug',     'Integração entre sistemas via APIs'),
    -- Dados
    (p_tenant_id, 'Análise de Dados',        'analise_dados',      'data',       '#8B5CF6', 'BarChart3','SQL, planilhas avançadas, BI'),
    (p_tenant_id, 'Google Analytics / GTM',  'ga_gtm',             'data',       '#F97316', 'LineChart','Analytics, GTM, eventos e conversões'),
    -- Gestão
    (p_tenant_id, 'Gestão de Projetos',      'gestao_projetos',    'management', '#64748B', 'KanbanSquare','Planejamento, prazos, escopo, equipe'),
    (p_tenant_id, 'Atendimento ao Cliente',  'atendimento',        'management', '#10B981', 'MessageCircle','Relacionamento e suporte a franqueados/clientes')
  ON CONFLICT (tenant_id, slug) DO NOTHING;
END;
$$;

-- 5) Trigger: novos tenants ganham skills automaticamente
CREATE OR REPLACE FUNCTION public.tg_seed_tenant_skills()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.seed_default_skills(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_tenant_skills ON public.tenants;
CREATE TRIGGER trg_seed_tenant_skills
  AFTER INSERT ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.tg_seed_tenant_skills();

-- 6) Popular skills nos tenants existentes
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.tenants LOOP
    PERFORM public.seed_default_skills(r.id);
  END LOOP;
END $$;