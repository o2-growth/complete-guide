-- Fix search_path nas funções restantes
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.set_task_number()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_key TEXT; v_next INTEGER;
BEGIN
  IF NEW.number IS NULL OR NEW.number = 0 THEN
    UPDATE public.projects SET task_seq = task_seq + 1
      WHERE id = NEW.project_id RETURNING task_seq, key INTO v_next, v_key;
    NEW.number := v_next;
    NEW.code := COALESCE(v_key,'TASK') || '-' || v_next;
  END IF;
  RETURN NEW;
END;
$$;

-- Revogar EXECUTE público em todas funções SECURITY DEFINER
REVOKE EXECUTE ON FUNCTION public.user_tenant_ids() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_role_in_tenant(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_tenant_role(uuid, public.tenant_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_project_member(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.auto_assign_on_status_change() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.audit_task_change() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.user_tenant_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_role_in_tenant(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_tenant_role(uuid, public.tenant_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_project_member(uuid) TO authenticated;

-- Revogar API access da materialized view
REVOKE ALL ON public.mv_workload_by_user FROM PUBLIC, anon, authenticated;