ALTER TABLE public.tenant_members
  DROP CONSTRAINT IF EXISTS tenant_members_user_id_profiles_fkey;
ALTER TABLE public.tenant_members
  ADD CONSTRAINT tenant_members_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;