REVOKE EXECUTE ON FUNCTION public.convert_inbox_item_to_task(uuid, uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.inbox_summary(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.campaign_report(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.convert_inbox_item_to_task(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inbox_summary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.campaign_report(uuid) TO authenticated;