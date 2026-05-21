// Pipefy Sync — READ-ONLY
// Lê cards do Pipefy via GraphQL e faz upsert como projects no Oxy.
// NUNCA executa mutations no Pipefy. Toda query é estática neste arquivo.
//
// Disparo:
//   - pg_cron a cada 15min (body vazio → processa todas as integrações ativas)
//   - manual via POST { tenant_id } → processa só aquele tenant
//   - manual via POST { tenant_id, pipe_id } → processa um pipe específico
//
// Token: lido de Deno.env.get("PIPEFY_TOKEN"). Configurar como secret no Lovable.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PIPEFY_GQL = "https://api.pipefy.com/graphql";

interface PipefyField {
  name: string;
  field: { id: string; label: string; type: string };
  value: string | null;
  array_value: string[] | null;
  report_value: string | null;
}

interface PipefyCard {
  id: string;
  title: string;
  url: string;
  due_date: string | null;
  createdAt: string;
  updated_at: string;
  current_phase: { id: string; name: string } | null;
  assignees: Array<{ id: string; name: string; email: string }>;
  labels: Array<{ id: string; name: string; color: string }>;
  fields: PipefyField[];
}

interface PipefyPipe {
  id: string;
  name: string;
}

interface CardsResponse {
  cards: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    edges: Array<{ node: PipefyCard }>;
  };
}

// Use o tipo retornado por createClient — não vale a pena re-tipar o cliente.
type AnyClient = ReturnType<typeof createClient>;

const ACTIVE_PHASE_FILTER = (phaseName: string) => {
  const lower = phaseName.toLowerCase();
  return (
    !lower.includes("conclu") &&
    !lower.includes("arquiv") &&
    !lower.includes("não realizad") &&
    !lower.includes("nao realizad")
  );
};

async function pipefyGraphQL<T>(token: string, query: string, variables?: Record<string, unknown>): Promise<T> {
  // Sanity guard: hard-fail if query string contains a mutation keyword.
  // Belt-and-suspenders — todas as queries deste arquivo são estáticas e read-only.
  if (/\bmutation\b/i.test(query)) {
    throw new Error("pipefy-sync: mutations are forbidden");
  }
  const res = await fetch(PIPEFY_GQL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pipefy HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  if (json.errors) {
    throw new Error(`Pipefy GraphQL error: ${JSON.stringify(json.errors).slice(0, 300)}`);
  }
  return json.data as T;
}

const PIPE_QUERY = `
  query Pipe($id: ID!) {
    pipe(id: $id) {
      id
      name
    }
  }
`;

const CARDS_QUERY = `
  query Cards($pipe_id: ID!, $cursor: String) {
    cards(pipe_id: $pipe_id, first: 50, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id
          title
          url
          due_date
          createdAt
          updated_at
          current_phase { id name }
          assignees { id name email }
          labels { id name color }
          fields {
            name
            field { id label type }
            value
            array_value
            report_value
          }
        }
      }
    }
  }
`;

function fieldsToObject(fields: PipefyField[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    out[f.field.id] = {
      label: f.field.label,
      type: f.field.type,
      value: f.value,
      array_value: f.array_value,
      report_value: f.report_value,
    };
  }
  return out;
}

function buildProjectKey(card: PipefyCard): string {
  return `PIPE-${card.id}`.slice(0, 32);
}

function pickColor(card: PipefyCard): string | null {
  return card.labels?.[0]?.color ?? null;
}

function pickPriority(card: PipefyCard): string | null {
  const labelName = card.labels?.find((l) => /^(alta|m[eé]dia|baixa)$/i.test(l.name))?.name;
  if (!labelName) return null;
  const lower = labelName.toLowerCase();
  if (lower.startsWith("alta")) return "high";
  if (lower.startsWith("m")) return "medium";
  return "low";
}

function pickIceImpact(card: PipefyCard): number | null {
  // O pipe tem campo "0 - 10 de Urgência" — já é praticamente o Impacto.
  const field = card.fields.find((f) => /urg[eê]ncia/i.test(f.field.label));
  if (!field?.value) return null;
  const n = Math.round(Number(field.value));
  if (!Number.isFinite(n)) return null;
  return Math.max(1, Math.min(10, n));
}

async function resolveBancoSquadId(supabase: AnyClient, tenantId: string): Promise<string | null> {
  const { data } = await supabase
    .from("squads")
    .select("id")
    .eq("tenant_id", tenantId)
    .ilike("name", "Banco de Projetos%")
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

// Cada card do Pipefy entra como Lista (kind='list') dentro do Espaço "Team IA & Automação".
// Se o Espaço não existir ainda (seed pendente), o sync segue como root (parent_id null).
async function resolveSpaceIaId(supabase: AnyClient, tenantId: string): Promise<string | null> {
  const { data } = await supabase
    .from("projects")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("kind", "space_root")
    .eq("key", "IA")
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

function cardToProjectPayload(
  card: PipefyCard,
  integration: { tenant_id: string; pipe_id: string },
  pipeName: string,
  syncedAt: string,
  squadId: string | null,
  parentId: string | null,
) {
  return {
    tenant_id: integration.tenant_id,
    squad_id: squadId,
    parent_id: parentId,
    key: buildProjectKey(card),
    name: card.title || `Card ${card.id}`,
    description: (card.fields.find((f) => f.field.id === "escopo_do_projeto")?.value as string | null) ?? null,
    color: pickColor(card),
    kind: "list",
    pipefy_card_id: card.id,
    pipefy_pipe_id: integration.pipe_id,
    pipefy_url: card.url,
    pipefy_phase_name: card.current_phase?.name ?? "",
    pipefy_last_synced_at: syncedAt,
    pipefy_metadata: {
      pipe_name: pipeName,
      due_date: card.due_date,
      labels: card.labels,
      assignees: card.assignees,
      priority_label: pickPriority(card),
      ice_impact_hint: pickIceImpact(card),
      fields: fieldsToObject(card.fields),
    } as Record<string, unknown>,
  };
}

async function syncIntegration(supabase: AnyClient, token: string, integration: {
  id: string;
  tenant_id: string;
  pipe_id: string;
  active_only: boolean;
}) {
  let count = 0;
  let error: string | null = null;
  try {
    const pipeData = await pipefyGraphQL<{ pipe: PipefyPipe }>(token, PIPE_QUERY, { id: integration.pipe_id });
    const pipeName = pipeData.pipe.name;
    const squadId = await resolveBancoSquadId(supabase, integration.tenant_id);
    const parentId = await resolveSpaceIaId(supabase, integration.tenant_id);

    let cursor: string | null = null;
    let hasNext = true;
    while (hasNext) {
      const data = await pipefyGraphQL<CardsResponse>(token, CARDS_QUERY, {
        pipe_id: integration.pipe_id,
        cursor,
      });
      const edges = data.cards.edges;
      hasNext = data.cards.pageInfo.hasNextPage;
      cursor = data.cards.pageInfo.endCursor;

      const syncedAt = new Date().toISOString();
      const payloads = edges
        .map((e) => e.node)
        .filter((card) => {
          if (!integration.active_only) return true;
          return ACTIVE_PHASE_FILTER(card.current_phase?.name ?? "");
        })
        .map((card) => cardToProjectPayload(card, integration, pipeName, syncedAt, squadId, parentId));

      if (payloads.length > 0) {
        const { error: upErr } = await supabase
          .from("projects")
          .upsert(payloads, { onConflict: "tenant_id,pipefy_card_id" });
        if (upErr) throw new Error(`upsert error: ${JSON.stringify(upErr)}`);
        count += payloads.length;
      }
    }

    await supabase
      .from("pipefy_integrations")
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: "ok",
        last_sync_count: count,
        last_error: null,
        pipe_name: pipeName,
      })
      .eq("id", integration.id);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    await supabase
      .from("pipefy_integrations")
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: "error",
        last_error: error,
      })
      .eq("id", integration.id);
  }
  return { tenant_id: integration.tenant_id, pipe_id: integration.pipe_id, count, error };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const token = Deno.env.get("PIPEFY_TOKEN");
    if (!token) {
      return new Response(
        JSON.stringify({ ok: false, error: "PIPEFY_TOKEN secret not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const requestedTenant = body?.tenant_id as string | undefined;
    const requestedPipe = body?.pipe_id as string | undefined;

    // Defesa contra cross-tenant: se vier um filtro de tenant_id no body,
    // exigimos um JWT válido cujo user pertence àquele tenant.
    // O cron chama sem Authorization e sem filtro de tenant — esse fluxo continua aberto.
    if (requestedTenant) {
      const authHeader = req.headers.get("Authorization") ?? "";
      const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
      if (!jwt) {
        return new Response(
          JSON.stringify({ ok: false, error: "tenant_id filter requires authenticated request" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
      if (userErr || !userData?.user) {
        return new Response(
          JSON.stringify({ ok: false, error: "invalid token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const { data: membership } = await supabase
        .from("tenant_members")
        .select("tenant_id")
        .eq("user_id", userData.user.id)
        .eq("tenant_id", requestedTenant)
        .maybeSingle();
      if (!membership) {
        return new Response(
          JSON.stringify({ ok: false, error: "forbidden: user not member of tenant" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    let q = supabase.from("pipefy_integrations").select("id,tenant_id,pipe_id,active_only").eq("enabled", true);
    if (requestedTenant) q = q.eq("tenant_id", requestedTenant);
    if (requestedPipe) q = q.eq("pipe_id", requestedPipe);

    const { data: integrations, error } = await q;
    if (error) throw new Error(`select integrations: ${JSON.stringify(error)}`);

    const results: unknown[] = [];
    for (const integ of integrations ?? []) {
      results.push(await syncIntegration(supabase, token, integ));
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
