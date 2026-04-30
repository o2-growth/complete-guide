import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Publica um item da fila scheduled_publishes.
 * Modo "mock": se a integration não tiver tokens reais, simula publicação e marca como 'mocked'.
 * Modo "real": tenta chamar a API correspondente (Meta Graph / LinkedIn) — só ativa quando os secrets estão presentes.
 * Body: { publishId: string }  (também aceita { taskId } para publicação imediata)
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const body = await req.json().catch(() => ({}));
    const { publishId, taskId } = body as { publishId?: string; taskId?: string };

    let pub;
    if (publishId) {
      const { data } = await supabase.from("scheduled_publishes").select("*").eq("id", publishId).maybeSingle();
      pub = data;
    } else if (taskId) {
      const { data } = await supabase
        .from("scheduled_publishes")
        .select("*")
        .eq("task_id", taskId)
        .eq("status", "pending")
        .order("scheduled_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      pub = data;
    } else {
      return new Response(JSON.stringify({ error: "publishId ou taskId obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pub) {
      return new Response(JSON.stringify({ error: "publish não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (pub.status !== "pending") {
      return new Response(JSON.stringify({ ok: true, skipped: true, status: pub.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase
      .from("scheduled_publishes")
      .update({ status: "running", attempts: pub.attempts + 1, last_attempt_at: new Date().toISOString() })
      .eq("id", pub.id);

    const { data: task } = await supabase
      .from("tasks")
      .select("id, title, social_caption, social_channel, tenant_id, project_id")
      .eq("id", pub.task_id)
      .maybeSingle();

    const { data: assetsRows } = await supabase
      .from("task_assets")
      .select("media_assets(bucket, path)")
      .eq("task_id", pub.task_id);
    const assetUrls = (assetsRows ?? [])
      .map((r) => {
        const a = r.media_assets as { bucket: string; path: string } | null;
        if (!a) return null;
        return supabase.storage.from(a.bucket).getPublicUrl(a.path).data.publicUrl;
      })
      .filter(Boolean) as string[];

    let integration = null;
    if (pub.integration_id) {
      const { data } = await supabase.from("social_integrations").select("*").eq("id", pub.integration_id).maybeSingle();
      integration = data;
    }

    // Determina se temos credenciais REAIS para o canal
    const hasMeta = !!Deno.env.get("META_APP_ID") && !!Deno.env.get("META_APP_SECRET");
    const hasLinkedIn = !!Deno.env.get("LINKEDIN_CLIENT_ID") && !!Deno.env.get("LINKEDIN_CLIENT_SECRET");

    const isReal =
      integration && integration.status === "active" && integration.access_token &&
      ((pub.channel === "instagram" && hasMeta) ||
        (pub.channel === "facebook" && hasMeta) ||
        (pub.channel === "linkedin" && hasLinkedIn));

    if (!isReal) {
      // MOCK: marca como publicado simulado
      const mockUrl = `https://example.com/${pub.channel}/mock/${pub.id}`;
      await supabase.from("scheduled_publishes").update({
        status: "mocked",
        external_id: `mock-${pub.id}`,
        external_url: mockUrl,
        response: { mode: "mock", reason: integration ? "missing_provider_secrets" : "no_integration_connected" },
      }).eq("id", pub.id);

      await supabase.from("tasks").update({
        publish_state: "published",
        published_at: new Date().toISOString(),
        published_url: mockUrl,
      }).eq("id", pub.task_id);

      return new Response(JSON.stringify({ ok: true, mode: "mock", url: mockUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // REAL — placeholders de chamada (estrutura pronta para expandir):
    let externalId = "";
    let externalUrl = "";
    let responseJson: Record<string, unknown> = {};

    try {
      if (pub.channel === "instagram" || pub.channel === "facebook") {
        // Meta Graph publish flow:
        // 1. POST /{ig-user-id}/media com image_url + caption -> creation_id
        // 2. POST /{ig-user-id}/media_publish com creation_id -> id
        const igUserId = (integration!.metadata as { ig_user_id?: string }).ig_user_id;
        const accessToken = integration!.access_token;
        if (!igUserId) throw new Error("ig_user_id ausente em metadata");
        if (assetUrls.length === 0) throw new Error("nenhum asset vinculado");

        const mediaResp = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_url: assetUrls[0],
            caption: task?.social_caption ?? task?.title ?? "",
            access_token: accessToken,
          }),
        });
        const mediaJson = await mediaResp.json();
        if (!mediaResp.ok) throw new Error(`meta media: ${JSON.stringify(mediaJson)}`);

        const publishResp = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media_publish`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creation_id: mediaJson.id, access_token: accessToken }),
        });
        const publishJson = await publishResp.json();
        if (!publishResp.ok) throw new Error(`meta publish: ${JSON.stringify(publishJson)}`);
        externalId = publishJson.id;
        externalUrl = `https://www.instagram.com/p/${publishJson.id}`;
        responseJson = { meta: publishJson };
      } else if (pub.channel === "linkedin") {
        const personUrn = (integration!.metadata as { person_urn?: string }).person_urn;
        const accessToken = integration!.access_token;
        if (!personUrn) throw new Error("person_urn ausente em metadata");

        const liResp = await fetch("https://api.linkedin.com/v2/ugcPosts", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            author: personUrn,
            lifecycleState: "PUBLISHED",
            specificContent: {
              "com.linkedin.ugc.ShareContent": {
                shareCommentary: { text: task?.social_caption ?? task?.title ?? "" },
                shareMediaCategory: "NONE",
              },
            },
            visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
          }),
        });
        const liJson = await liResp.json();
        if (!liResp.ok) throw new Error(`linkedin: ${JSON.stringify(liJson)}`);
        externalId = liJson.id;
        externalUrl = `https://www.linkedin.com/feed/update/${liJson.id}`;
        responseJson = { linkedin: liJson };
      } else {
        throw new Error(`canal ${pub.channel} ainda não suportado em modo real`);
      }

      await supabase.from("scheduled_publishes").update({
        status: "published", external_id: externalId, external_url: externalUrl, response: responseJson,
      }).eq("id", pub.id);

      await supabase.from("tasks").update({
        publish_state: "published", published_at: new Date().toISOString(), published_url: externalUrl,
      }).eq("id", pub.task_id);

      return new Response(JSON.stringify({ ok: true, mode: "real", url: externalUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "erro desconhecido";
      await supabase.from("scheduled_publishes").update({
        status: "failed", error: msg, response: { error: msg },
      }).eq("id", pub.id);
      return new Response(JSON.stringify({ ok: false, error: msg }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});