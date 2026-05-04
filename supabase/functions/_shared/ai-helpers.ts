import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RATE_LIMIT = 50;

export interface AuthedContext {
  user: { id: string; email?: string };
  tenantId: string;
  serviceClient: ReturnType<typeof createClient>;
}

/**
 * Valida o JWT, resolve tenant_id do usuário e devolve clientes prontos.
 * Lança Response 401/429 quando aplicável.
 */
export async function authenticate(req: Request): Promise<AuthedContext> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Response(JSON.stringify({ error: "missing auth" }), { status: 401, headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userRes, error: uErr } = await userClient.auth.getUser();
  if (uErr || !userRes.user) {
    throw new Response(JSON.stringify({ error: "invalid token" }), { status: 401, headers: corsHeaders });
  }
  const user = userRes.user;

  const serviceClient = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data: prof } = await serviceClient
    .from("profiles")
    .select("preferences")
    .eq("id", user.id)
    .maybeSingle();
  const tenantId = (prof?.preferences as { tenant_id?: string } | null)?.tenant_id;
  if (!tenantId) {
    throw new Response(JSON.stringify({ error: "tenant não encontrado" }), { status: 400, headers: corsHeaders });
  }

  // Rate limit 50/h
  const { data: count } = await serviceClient.rpc("check_ai_rate_limit", { _user_id: user.id });
  if ((count ?? 0) >= RATE_LIMIT) {
    throw new Response(
      JSON.stringify({ error: `Limite de ${RATE_LIMIT} chamadas de IA por hora atingido. Tente novamente em alguns minutos.` }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return { user: { id: user.id, email: user.email }, tenantId, serviceClient };
}

export async function logInteraction(
  ctx: AuthedContext,
  payload: {
    feature: string;
    model: string;
    tokensIn?: number;
    tokensOut?: number;
    latencyMs?: number;
    taskId?: string | null;
    promptSummary?: string;
    responseSummary?: string;
    status?: "success" | "error";
    error?: string;
  },
) {
  await ctx.serviceClient.from("ai_interactions").insert({
    tenant_id: ctx.tenantId,
    user_id: ctx.user.id,
    feature: payload.feature,
    model: payload.model,
    tokens_in: payload.tokensIn ?? 0,
    tokens_out: payload.tokensOut ?? 0,
    latency_ms: payload.latencyMs,
    task_id: payload.taskId ?? null,
    prompt_summary: payload.promptSummary?.slice(0, 500),
    response_summary: payload.responseSummary?.slice(0, 1000),
    status: payload.status ?? "success",
    error: payload.error?.slice(0, 500),
  });
}

export const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export async function callAI(body: Record<string, unknown>, signal?: AbortSignal): Promise<Response> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), { status: 500, headers: corsHeaders });
  return await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
}

export function aiUnavailableResponse(): Response {
  return new Response(
    JSON.stringify({ error: "Serviço de IA temporariamente indisponível. Tente novamente em alguns segundos." }),
    { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

export function aiErrorResponse(status: number): Response {
  if (status === 429) {
    return new Response(JSON.stringify({ error: "Limite de uso da IA atingido. Tente novamente em alguns instantes." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (status === 402) {
    return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione fundos no workspace Lovable." }), {
      status: 402,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
    status: 500,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export const SYSTEM_TONE =
  "Você é o Gênio Growth, assistente de IA da Oxy Growth OS, especialista em produtividade, marketing digital e gestão de tarefas. Responda sempre em português do Brasil, no tom de \"você\" (nunca \"tu\" nem \"vós\"). Seja direto, prático e específico. Nunca use a palavra \"consultoria\".";