import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Poll de inbox social. Modo mock por padrão (gera 3-6 mensagens fake por integration ativa).
 * Modo real (futuro): consome Meta Graph /me/conversations e LinkedIn Messages se tokens reais existirem.
 * Body: { tenantId: string, count?: number }
 */
const FAKE_NAMES = ["Ana", "Bruno", "Carla", "Diego", "Elisa", "Felipe", "Gabi", "Hugo", "Iara", "João"];
const FAKE_HANDLES = ["@anag", "@brunop", "@carla.m", "@d.santos", "@elisa", "@fe", "@gabriellla", "@hugzz", "@iara", "@jp"];
const FAKE_MSGS_POS = [
  "Adorei esse conteúdo, vocês são incríveis! 🔥",
  "Comprei aqui pelo link, chegou super rápido. Obrigada!",
  "Top demais, salvei para reler depois 🙌",
];
const FAKE_MSGS_NEG = [
  "Tô há 3 dias esperando resposta no atendimento, isso aí é jeito?",
  "Pedido errado de novo. Querem perder cliente?",
  "Cobrança duplicada no cartão. Resolvam.",
];
const FAKE_MSGS_QUE = [
  "Vocês têm tamanho M em estoque?",
  "Aceitam Pix parcelado? Como funciona o frete pro RS?",
  "Esse curso libera certificado MEC?",
];
const FAKE_MSGS_NEU = [
  "Bom dia, queria confirmar o horário do evento",
  "Onde fica a sede de vocês?",
  "Conferi o material, tudo ok por aqui.",
];

function pick<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const body = (await req.json().catch(() => ({}))) as { tenantId?: string; count?: number };
    if (!body.tenantId) {
      return new Response(JSON.stringify({ error: "tenantId obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const count = Math.min(20, Math.max(1, body.count ?? 5));

    const { data: integrations } = await supabase
      .from("social_integrations")
      .select("id, channel, provider, account_name, status")
      .eq("tenant_id", body.tenantId);

    const targets = integrations && integrations.length > 0
      ? integrations
      : [{ id: null, channel: "instagram", provider: "meta", account_name: "demo", status: "mock" }];

    const kinds = ["dm", "comment", "mention"] as const;
    const sentiments = ["positive", "negative", "question", "neutral"] as const;
    const msgsBy = {
      positive: FAKE_MSGS_POS, negative: FAKE_MSGS_NEG,
      question: FAKE_MSGS_QUE, neutral: FAKE_MSGS_NEU,
    };

    const rows: Record<string, unknown>[] = [];
    for (let i = 0; i < count; i++) {
      const integ = pick(targets);
      const sent = pick(sentiments as unknown as string[]) as keyof typeof msgsBy;
      const idx = Math.floor(Math.random() * FAKE_NAMES.length);
      const ch = (integ as { channel?: string }).channel ?? "instagram";
      rows.push({
        tenant_id: body.tenantId,
        integration_id: (integ as { id: string | null }).id,
        channel: ch,
        kind: pick(kinds as unknown as string[]),
        external_id: `mock-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
        author_name: FAKE_NAMES[idx],
        author_handle: FAKE_HANDLES[idx],
        message: pick(msgsBy[sent]),
        sentiment: sent,
        ai_summary: sent === "negative" ? "Reclamação — requer resposta rápida"
                  : sent === "question" ? "Pergunta — converter em atendimento"
                  : sent === "positive" ? "Elogio — engajar com curtida/resposta breve"
                  : "Mensagem neutra",
        received_at: new Date(Date.now() - Math.floor(Math.random() * 6 * 3600_000)).toISOString(),
      });
    }

    const { error, data } = await supabase.from("social_inbox_items").insert(rows).select("id");
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, inserted: data?.length ?? 0, mode: "mock" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});