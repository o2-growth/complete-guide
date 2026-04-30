-- Storage policies para o bucket "attachments" (privado)
-- Padrão de path: {tenant_id}/{task_id}/{filename}

-- Leitura: usuários autenticados membros do tenant
CREATE POLICY "attachments_read_tenant_members"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'attachments'
  AND (storage.foldername(name))[1]::uuid IN (SELECT public.user_tenant_ids())
);

-- Upload: membros do tenant podem subir em pastas do seu tenant
CREATE POLICY "attachments_insert_tenant_members"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'attachments'
  AND (storage.foldername(name))[1]::uuid IN (SELECT public.user_tenant_ids())
  AND owner = auth.uid()
);

-- Delete: dono do upload
CREATE POLICY "attachments_delete_owner"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'attachments'
  AND owner = auth.uid()
);

-- Trigger para updated_at em comments
DROP TRIGGER IF EXISTS tg_set_updated_at_comments ON public.comments;
CREATE TRIGGER tg_set_updated_at_comments
BEFORE UPDATE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();