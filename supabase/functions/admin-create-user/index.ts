import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
  const body = await req.json();
  const { email, password, action } = body;
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  if (action === "update_password") {
    const { data: listData, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (listError) return new Response(JSON.stringify({ step: "listUsers", error: listError }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    const user = listData.users.find((u: { email?: string }) => u.email === email);
    if (!user) return new Response(JSON.stringify({ step: "find", error: { message: "User not found" }, total: listData.users.length }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    const { data, error } = await admin.auth.admin.updateUserById(user.id, { password });
    return new Response(JSON.stringify({ step: "updateUserById", userId: user.id, data, error }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }

  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  return new Response(JSON.stringify({ data, error }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
});
