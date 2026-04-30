REVOKE EXECUTE ON FUNCTION public.capacity_for_user(UUID, UUID, DATE, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.capacity_for_user(UUID, UUID, DATE, DATE) TO authenticated;