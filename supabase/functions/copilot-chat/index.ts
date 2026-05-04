import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { withErrorBoundary } from "../_shared/withErrorBoundary.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `Você é o Oxy Copilot, um assistente operacional sênior de marketing/growth em PT-BR.
Você tem acesso a ferramentas que leem dados reais do workspace (tarefas, posts, OKRs, anomalias, ROAS),
rodam simulações what-if e comparam o cliente contra benchmarks setoriais.

Regras:
- Sempre que o usuário pedir uma análise, USE as tools antes de responder.
- Seja direto, com bullets curtos e números concretos. Sem disclaimers genéricos.
- Quando rodar simulação, traduza o resultado em recomendação acionável (1-2 frases).
- Quando comparar com benchmark, destaque onde o cliente está top/good/avg/low.`;

const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_context",
      description: "Snapshot operacional: tarefas abertas/atrasadas/concluídas, anomalias, OKRs em risco, engajamento, ROAS.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "compare_benchmarks",
      description: "Compara métricas do workspace nos últimos 30d com percentis do setor (engagement, ROAS, on-time, ciclo).",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "simulate",
      description: "Roda cenário what-if. kind=boost_budget|team_capacity|cadence_change.",
      parameters: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["boost_budget", "team_capacity", "cadence_change"] },
          inputs: { type: "object", description: "Ex.: {budget_multiplier:2}, {extra_people:2,hours_per_week:30}, {posts_per_week_delta:3}" },
        },
        required: ["kind", "inputs"],
      },
    },
  },
];

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

    const { conversation_id, tenant_id, user_message } = await req.json();
    if (!tenant_id || !user_message) return new Response(JSON.stringify({ error: "tenant_id and user_message required" }), { status: 400, headers: corsHeaders });

    let convId = conversation_id;
    if (!convId) {
      const { data: c } = await supabase.from("copilot_conversations").insert({
        tenant_id, user_id: user.id, title: user_message.slice(0, 60),
      }).select().single();
      convId = c!.id;
    }

    // history
    const { data: history } = await supabase.from("copilot_messages")
      .select("role,content,tool_calls,tool_name,tool_result")
      .eq("conversation_id", convId).order("created_at");

    const messages: any[] = [{ role: "system", content: SYSTEM }];
    for (const m of history ?? []) {
      if (m.role === "tool") {
        messages.push({ role: "tool", name: m.tool_name, content: JSON.stringify(m.tool_result) });
      } else {
        const msg: any = { role: m.role, content: m.content };
        if (m.tool_calls) msg.tool_calls = m.tool_calls;
        messages.push(msg);
      }
    }
    messages.push({ role: "user", content: user_message });
    await supabase.from("copilot_messages").insert({ conversation_id: convId, tenant_id, role: "user", content: user_message });

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return new Response(JSON.stringify({ error: "AI not configured" }), { status: 500, headers: corsHeaders });

    // tool loop (max 4 rounds)
    let final = "";
    for (let round = 0; round < 4; round++) {
      let aiResp: Response;
      try {
        aiResp = await withErrorBoundary(
          (signal) => fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "google/gemini-2.5-flash", messages, tools: TOOLS }),
            signal,
          }),
          { source: "copilot-chat", timeoutMs: 25000, retries: 3 },
        );
      } catch {
        return new Response(JSON.stringify({ error: "Serviço de IA temporariamente indisponível. Tente novamente em alguns segundos." }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: corsHeaders });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: corsHeaders });
      if (!aiResp.ok) return new Response(JSON.stringify({ error: "AI error", detail: await aiResp.text() }), { status: 500, headers: corsHeaders });
      const ai = await aiResp.json();
      const choice = ai.choices?.[0]?.message;
      if (!choice) break;

      if (choice.tool_calls?.length) {
        await supabase.from("copilot_messages").insert({
          conversation_id: convId, tenant_id, role: "assistant", content: choice.content ?? "", tool_calls: choice.tool_calls,
        });
        messages.push(choice);

        for (const tc of choice.tool_calls) {
          const args = JSON.parse(tc.function.arguments || "{}");
          let result: any = {};
          try {
            if (tc.function.name === "get_context") {
              const { data } = await supabase.rpc("copilot_context", { _tenant: tenant_id });
              result = data;
            } else if (tc.function.name === "compare_benchmarks") {
              const { data } = await supabase.rpc("benchmark_compare", { _tenant: tenant_id });
              result = data;
            } else if (tc.function.name === "simulate") {
              const { data } = await supabase.rpc("run_simulation", { _tenant: tenant_id, _kind: args.kind, _inputs: args.inputs });
              result = data;
            }
          } catch (e) { result = { error: String(e) }; }

          await supabase.from("copilot_messages").insert({
            conversation_id: convId, tenant_id, role: "tool", tool_name: tc.function.name, tool_result: result, content: "",
          });
          messages.push({ role: "tool", tool_call_id: tc.id, name: tc.function.name, content: JSON.stringify(result) });
        }
        continue;
      }

      final = choice.content ?? "";
      await supabase.from("copilot_messages").insert({
        conversation_id: convId, tenant_id, role: "assistant", content: final,
      });
      await supabase.from("copilot_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
      break;
    }

    return new Response(JSON.stringify({ conversation_id: convId, message: final }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});