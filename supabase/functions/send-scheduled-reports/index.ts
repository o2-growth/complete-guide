import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Processa report_schedules vencidos:
 *  - executa run_report
 *  - monta um HTML simples com tabela
 *  - se RESEND_API_KEY estiver presente, envia por email aos recipients
 *  - atualiza last_run_at e next_run_at via compute_next_run
 * Sem RESEND configurado, ainda marca como executado (modo dry-run).
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
  const RESEND_KEY = Deno.env.get("RESEND_API_KEY");

  try {
    const { data: due, error } = await supabase.rpc("due_schedules");
    if (error) throw error;

    const results: Array<{ id: string; status: string; rows: number }> = [];

    for (const sch of (due ?? []) as Array<{ id: string; tenant_id: string; report_id: string; cadence: string; recipients: string[] }>) {
      try {
        const { data: rep } = await supabase.from("saved_reports").select("name, source").eq("id", sch.report_id).maybeSingle();
        const { data: result, error: rerr } = await supabase.rpc("run_report", { _report_id: sch.report_id });
        if (rerr) throw rerr;
        const rows = (result as { rows?: Array<Record<string, unknown>> })?.rows ?? [];

        if (RESEND_KEY && LOVABLE_KEY && sch.recipients.length > 0 && rows.length > 0) {
          const cols = Object.keys(rows[0]);
          const html = `
            <h2 style="font-family:sans-serif">${rep?.name ?? "Relatório"}</h2>
            <p style="font-family:sans-serif;color:#555">Cadência: ${sch.cadence} · ${rows.length} linhas</p>
            <table border="1" cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:13px">
              <tr>${cols.map((c) => `<th align="left" style="background:#f3f4f6">${c}</th>`).join("")}</tr>
              ${rows.slice(0, 200).map((r) => `<tr>${cols.map((c) => `<td>${String(r[c] ?? "")}</td>`).join("")}</tr>`).join("")}
            </table>
            <p style="font-family:sans-serif;color:#999;font-size:11px;margin-top:24px">Enviado por Oxy Growth OS</p>`;

          await fetch("https://connector-gateway.lovable.dev/resend/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${LOVABLE_KEY}`,
              "X-Connection-Api-Key": RESEND_KEY,
            },
            body: JSON.stringify({
              from: "Oxy Growth OS <onboarding@resend.dev>",
              to: sch.recipients,
              subject: `[Oxy] ${rep?.name ?? "Relatório agendado"}`,
              html,
            }),
          });
        }

        const { data: nextRun } = await supabase.rpc("compute_next_run", { _cadence: sch.cadence });
        await supabase.from("report_schedules").update({
          last_run_at: new Date().toISOString(),
          next_run_at: nextRun,
        }).eq("id", sch.id);

        results.push({ id: sch.id, status: RESEND_KEY ? "sent" : "dry_run", rows: rows.length });
      } catch (e) {
        results.push({ id: sch.id, status: "error:" + String(e), rows: 0 });
      }
    }

    return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});