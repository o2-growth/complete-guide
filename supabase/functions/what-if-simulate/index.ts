import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: corsHeaders });
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthenticated" }), { status: 401, headers: corsHeaders });

    const { tenant_id, kind, inputs, name, save } = await req.json();
    if (!tenant_id || !kind || !inputs) return new Response(JSON.stringify({ error: "tenant_id, kind, inputs required" }), { status: 400, headers: corsHeaders });

    const { data: result, error } = await supabase.rpc("run_simulation", { _tenant: tenant_id, _kind: kind, _inputs: inputs });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });

    let narrative = "";
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (apiKey) {
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "Você é um analista de growth. Em 3 frases curtas em PT-BR, explique o resultado da simulação, destaque o impacto principal e dê 1 recomendação acionável. Sem disclaimers." },
            { role: "user", content: `Simulação ${kind} — inputs: ${JSON.stringify(inputs)} — resultado: ${JSON.stringify(result)}` },
          ],
        }),
      });
      if (aiResp.ok) {
        const ai = await aiResp.json();
        narrative = ai.choices?.[0]?.message?.content ?? "";
      }
    }

    let saved_id: string | null = null;
    if (save) {
      const { data: s } = await supabase.from("simulation_scenarios").insert({
        tenant_id, created_by: user.id, name: name || `${kind} ${new Date().toISOString().slice(0,10)}`,
        kind, inputs, result, ai_narrative: narrative,
      }).select().single();
      saved_id = s?.id ?? null;
    }

    return new Response(JSON.stringify({ result, narrative, saved_id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});