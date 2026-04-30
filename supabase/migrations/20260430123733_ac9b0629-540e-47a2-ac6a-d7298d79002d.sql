-- Função para semear tipos default em um tenant
CREATE OR REPLACE FUNCTION public.seed_default_task_types(p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.task_types (tenant_id, name, slug, icon, color, default_estimate_minutes, checklist, workflow, description)
  VALUES
    (p_tenant_id, 'Post Feed Instagram', 'ig_feed', 'Image', '#E1306C', 90,
      '[{"label":"Briefing","done":false},{"label":"Copy","done":false},{"label":"Design","done":false},{"label":"Revisão","done":false},{"label":"Agendamento","done":false}]'::jsonb,
      '{"preview":"ig_feed","max_chars":2200,"aspect":"4:5","min_image_w":1080}'::jsonb,
      'Publicação de post estático ou carrossel no feed do Instagram'),
    (p_tenant_id, 'Post Story Instagram', 'ig_story', 'Camera', '#F77737', 30,
      '[{"label":"Conceito","done":false},{"label":"Arte/Vídeo","done":false},{"label":"Stickers/CTA","done":false},{"label":"Publicação","done":false}]'::jsonb,
      '{"preview":"ig_story","aspect":"9:16","duration_max_s":60}'::jsonb,
      'Story do Instagram (24h)'),
    (p_tenant_id, 'Post Reels Instagram', 'ig_reel', 'Video', '#833AB4', 180,
      '[{"label":"Roteiro","done":false},{"label":"Captação","done":false},{"label":"Edição","done":false},{"label":"Trilha/Áudio","done":false},{"label":"Capa","done":false},{"label":"Legenda","done":false},{"label":"Agendamento","done":false}]'::jsonb,
      '{"preview":"ig_reel","aspect":"9:16","duration_max_s":90}'::jsonb,
      'Vídeo curto (Reels) para o Instagram'),
    (p_tenant_id, 'Post LinkedIn', 'linkedin', 'Linkedin', '#0A66C2', 60,
      '[{"label":"Pesquisa","done":false},{"label":"Texto","done":false},{"label":"Mídia","done":false},{"label":"Hashtags","done":false},{"label":"Publicação","done":false}]'::jsonb,
      '{"preview":"linkedin","max_chars":3000,"aspect":"1.91:1"}'::jsonb,
      'Post para a página do LinkedIn'),
    (p_tenant_id, 'E-mail Marketing', 'email', 'Mail', '#3B82F6', 120,
      '[{"label":"Segmentação","done":false},{"label":"Subject + preheader","done":false},{"label":"Copy do corpo","done":false},{"label":"Design","done":false},{"label":"Teste A/B","done":false},{"label":"Disparo","done":false}]'::jsonb,
      '{"preview":"email","subject_max":78}'::jsonb,
      'Campanha de e-mail marketing'),
    (p_tenant_id, 'Automação n8n', 'n8n', 'Workflow', '#FF6D5A', 240,
      '[{"label":"Escopo","done":false},{"label":"Desenho do fluxo","done":false},{"label":"Implementação","done":false},{"label":"Testes","done":false},{"label":"Deploy","done":false},{"label":"Documentação","done":false}]'::jsonb,
      '{}'::jsonb,
      'Automação de workflow no n8n'),
    (p_tenant_id, 'Material de Franquia', 'franchise', 'Store', '#10B981', 180,
      '[{"label":"Briefing da unidade","done":false},{"label":"Adaptação do template","done":false},{"label":"Aprovação","done":false},{"label":"Entrega de assets","done":false}]'::jsonb,
      '{}'::jsonb,
      'Material gráfico/digital para franqueados'),
    (p_tenant_id, 'Relatório para liderança', 'leadership_report', 'BarChart3', '#8B5CF6', 120,
      '[{"label":"Coleta de dados","done":false},{"label":"Análise","done":false},{"label":"Insights","done":false},{"label":"Slides/PDF","done":false},{"label":"Envio","done":false}]'::jsonb,
      '{}'::jsonb,
      'Relatório executivo recorrente'),
    (p_tenant_id, 'Demanda externa', 'external_demand', 'Inbox', '#64748B', 60,
      '[{"label":"Triagem","done":false},{"label":"Atribuição","done":false},{"label":"Execução","done":false},{"label":"Devolutiva","done":false}]'::jsonb,
      '{}'::jsonb,
      'Solicitação recebida pelo Portal de Demandas')
  ON CONFLICT DO NOTHING;
END;
$$;

-- Garante uniqueness do slug por tenant
CREATE UNIQUE INDEX IF NOT EXISTS uniq_task_types_tenant_slug
  ON public.task_types (tenant_id, slug);

-- Seed retroativo em tenants existentes que ainda não têm tipos
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT id FROM public.tenants LOOP
    IF NOT EXISTS (SELECT 1 FROM public.task_types WHERE tenant_id = t.id) THEN
      PERFORM public.seed_default_task_types(t.id);
    END IF;
  END LOOP;
END $$;

-- Trigger para semear automaticamente em novos tenants
CREATE OR REPLACE FUNCTION public.tg_seed_tenant_task_types()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.seed_default_task_types(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_seed_task_types_on_tenant ON public.tenants;
CREATE TRIGGER tg_seed_task_types_on_tenant
AFTER INSERT ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.tg_seed_tenant_task_types();