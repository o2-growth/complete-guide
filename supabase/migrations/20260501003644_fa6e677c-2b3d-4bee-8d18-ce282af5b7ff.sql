-- ============= 1. saved_views =============
CREATE TABLE public.saved_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('tasks','projects','posts','comments')),
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  icon TEXT,
  color TEXT,
  pinned BOOLEAN NOT NULL DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_saved_views_user ON public.saved_views(user_id, tenant_id, position);

ALTER TABLE public.saved_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_views_owner_all" ON public.saved_views
FOR ALL TO authenticated
USING (user_id = auth.uid() AND tenant_id IN (SELECT user_tenant_ids()))
WITH CHECK (user_id = auth.uid() AND tenant_id IN (SELECT user_tenant_ids()));

CREATE TRIGGER tg_saved_views_updated BEFORE UPDATE ON public.saved_views
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============= 2. search_history =============
CREATE TABLE public.search_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  result_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_search_history_user_recent ON public.search_history(user_id, created_at DESC);

ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "search_history_owner_all" ON public.search_history
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() AND tenant_id IN (SELECT user_tenant_ids()));

-- ============= 3. import_jobs =============
CREATE TABLE public.import_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('csv','trello','asana','notion','clickup')),
  target TEXT NOT NULL CHECK (target IN ('tasks','projects')),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','done','failed')),
  mapping JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw_sample JSONB,
  created_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  filename TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX idx_import_jobs_tenant ON public.import_jobs(tenant_id, created_at DESC);

ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "import_jobs_member_read" ON public.import_jobs
FOR SELECT TO authenticated
USING (tenant_id IN (SELECT user_tenant_ids()));

CREATE POLICY "import_jobs_owner_write" ON public.import_jobs
FOR ALL TO authenticated
USING (user_id = auth.uid() AND tenant_id IN (SELECT user_tenant_ids()))
WITH CHECK (user_id = auth.uid() AND tenant_id IN (SELECT user_tenant_ids()));

-- ============= 4. export_jobs =============
CREATE TABLE public.export_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  format TEXT NOT NULL CHECK (format IN ('json','csv','zip')),
  scope JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','done','failed')),
  download_url TEXT,
  size_bytes BIGINT,
  expires_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX idx_export_jobs_tenant ON public.export_jobs(tenant_id, created_at DESC);

ALTER TABLE public.export_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "export_jobs_member_read" ON public.export_jobs
FOR SELECT TO authenticated
USING (tenant_id IN (SELECT user_tenant_ids()));

CREATE POLICY "export_jobs_owner_write" ON public.export_jobs
FOR ALL TO authenticated
USING (user_id = auth.uid() AND tenant_id IN (SELECT user_tenant_ids()))
WITH CHECK (user_id = auth.uid() AND tenant_id IN (SELECT user_tenant_ids()));

-- ============= 5. trigger: notificações de menção em comentários =============
CREATE OR REPLACE FUNCTION public.notify_comment_mentions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant uuid;
  v_project uuid;
  v_task_title text;
  v_user uuid;
BEGIN
  IF NEW.mentions IS NULL OR array_length(NEW.mentions, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT t.tenant_id, t.project_id, t.title
    INTO v_tenant, v_project, v_task_title
    FROM public.tasks t WHERE t.id = NEW.task_id;

  IF v_tenant IS NULL THEN RETURN NEW; END IF;

  FOREACH v_user IN ARRAY NEW.mentions LOOP
    IF v_user = NEW.author_id THEN CONTINUE; END IF;
    INSERT INTO public.notifications (tenant_id, user_id, kind, severity, title, body, link, payload)
    VALUES (
      v_tenant, v_user, 'mention'::notification_kind, 'info',
      'Você foi mencionado',
      COALESCE(left(NEW.body, 140), ''),
      '/app/projetos/' || v_project::text || '?task=' || NEW.task_id::text,
      jsonb_build_object('task_id', NEW.task_id, 'comment_id', NEW.id, 'task_title', v_task_title)
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- só cria o trigger se o enum tiver o valor 'mention'; senão, adiciona
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'notification_kind' AND e.enumlabel = 'mention'
  ) THEN
    ALTER TYPE public.notification_kind ADD VALUE IF NOT EXISTS 'mention';
  END IF;
END $$;

CREATE TRIGGER tg_notify_comment_mentions
AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.notify_comment_mentions();

-- ============= 6. RPC: global_search (FTS via pg_trgm) =============
CREATE OR REPLACE FUNCTION public.global_search(_tenant uuid, _q text, _limit int DEFAULT 30)
RETURNS TABLE(
  kind text,
  id uuid,
  title text,
  subtitle text,
  url text,
  rank real
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _tenant NOT IN (SELECT user_tenant_ids()) THEN
    RAISE EXCEPTION 'access denied';
  END IF;
  IF _q IS NULL OR length(trim(_q)) < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH tasks_match AS (
    SELECT 'task'::text AS kind, t.id, t.title,
           COALESCE(p.name, '') AS subtitle,
           ('/app/projetos/' || t.project_id::text || '?task=' || t.id::text) AS url,
           GREATEST(similarity(t.title, _q), similarity(COALESCE(t.description,''), _q)) AS rank
      FROM public.tasks t
      LEFT JOIN public.projects p ON p.id = t.project_id
     WHERE t.tenant_id = _tenant AND t.archived = false
       AND (t.title ILIKE '%'||_q||'%' OR COALESCE(t.description,'') ILIKE '%'||_q||'%' OR t.code ILIKE '%'||_q||'%')
  ),
  projects_match AS (
    SELECT 'project'::text AS kind, p.id, p.name AS title,
           COALESCE(p.description,'') AS subtitle,
           ('/app/projetos/' || p.id::text) AS url,
           similarity(p.name, _q) AS rank
      FROM public.projects p
     WHERE p.tenant_id = _tenant AND COALESCE(p.archived, false) = false
       AND (p.name ILIKE '%'||_q||'%' OR COALESCE(p.description,'') ILIKE '%'||_q||'%')
  ),
  comments_match AS (
    SELECT 'comment'::text AS kind, c.id, left(c.body, 80) AS title,
           ('em: ' || COALESCE(t.title,'')) AS subtitle,
           ('/app/projetos/' || t.project_id::text || '?task=' || c.task_id::text) AS url,
           similarity(c.body, _q) AS rank
      FROM public.comments c
      JOIN public.tasks t ON t.id = c.task_id
     WHERE t.tenant_id = _tenant AND c.body ILIKE '%'||_q||'%'
  ),
  attachments_match AS (
    SELECT 'attachment'::text AS kind, a.id, a.filename AS title,
           COALESCE(a.mime_type,'arquivo') AS subtitle,
           ('/app/projetos/' || COALESCE(t.project_id::text,'') || '?task=' || COALESCE(a.task_id::text,'')) AS url,
           similarity(a.filename, _q) AS rank
      FROM public.attachments a
      LEFT JOIN public.tasks t ON t.id = a.task_id
     WHERE a.tenant_id = _tenant AND a.filename ILIKE '%'||_q||'%'
  )
  SELECT * FROM tasks_match
  UNION ALL SELECT * FROM projects_match
  UNION ALL SELECT * FROM comments_match
  UNION ALL SELECT * FROM attachments_match
  ORDER BY rank DESC NULLS LAST
  LIMIT _limit;
END;
$$;

-- ============= 7. Bucket de exports (privado) =============
INSERT INTO storage.buckets (id, name, public)
VALUES ('exports', 'exports', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "exports_member_read" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'exports'
  AND (storage.foldername(name))[1] IN (SELECT user_tenant_ids()::text)
);

CREATE POLICY "exports_member_write" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'exports'
  AND (storage.foldername(name))[1] IN (SELECT user_tenant_ids()::text)
);