import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAuth } from "@/hooks/useAuth";

export interface ImportJob {
  id: string;
  source: string;
  target: string;
  status: string;
  filename: string | null;
  created_count: number;
  error_count: number;
  errors: unknown;
  created_at: string;
  finished_at: string | null;
}

export interface ExportJob {
  id: string;
  format: string;
  status: string;
  download_url: string | null;
  size_bytes: number | null;
  expires_at: string | null;
  error_message: string | null;
  created_at: string;
  finished_at: string | null;
}

export function useImportJobs() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["import-jobs", tenantId],
    enabled: !!tenantId,
    queryFn: async (): Promise<ImportJob[]> => {
      const { data, error } = await supabase
        .from("import_jobs")
        .select("id, source, target, status, filename, created_count, error_count, errors, created_at, finished_at")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as ImportJob[];
    },
  });
}

export function useExportJobs() {
  const { tenantId } = useWorkspace();
  return useQuery({
    queryKey: ["export-jobs", tenantId],
    enabled: !!tenantId,
    queryFn: async (): Promise<ExportJob[]> => {
      const { data, error } = await supabase
        .from("export_jobs")
        .select("id, format, status, download_url, size_bytes, expires_at, error_message, created_at, finished_at")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as ExportJob[];
    },
  });
}

/** Parse CSV simples (1ª linha = headers, vírgulas, aspas duplas). */
function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return { headers: [], rows: [] };
  const splitLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (c === "," && !inQ) {
        out.push(cur); cur = "";
      } else cur += c;
    }
    out.push(cur);
    return out;
  };
  const headers = splitLine(lines[0]).map((h) => h.trim());
  const rows = lines.slice(1).map((l) => {
    const cols = splitLine(l);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = (cols[i] ?? "").trim(); });
    return obj;
  });
  return { headers, rows };
}

/** Importa tarefas de CSV. mapping: { csvColumn: 'title'|'description'|'priority'|'due_at' } */
export function useImportTasks() {
  const qc = useQueryClient();
  const { tenantId, inboxProjectId } = useWorkspace();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      csvText, mapping, projectId, filename,
    }: {
      csvText: string;
      mapping: Record<string, string>;
      projectId?: string;
      filename: string;
    }) => {
      if (!tenantId || !user) throw new Error("no workspace");
      const target = projectId || inboxProjectId;
      if (!target) throw new Error("no project");

      const { headers, rows } = parseCSV(csvText);

      // Cria job pending
      const { data: job, error: jobErr } = await supabase
        .from("import_jobs")
        .insert({
          tenant_id: tenantId,
          user_id: user.id,
          source: "csv",
          target: "tasks",
          project_id: target,
          status: "running",
          mapping: mapping as never,
          raw_sample: { headers, first_row: rows[0] ?? null } as never,
          filename,
        })
        .select()
        .single();
      if (jobErr) throw jobErr;

      let created = 0;
      let errors = 0;
      const errorList: Array<{ row: number; reason: string }> = [];

      // Insere tarefas em chunks de 50
      const CHUNK = 50;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK).map((row) => {
          const titleCol = Object.entries(mapping).find(([, v]) => v === "title")?.[0];
          const descCol = Object.entries(mapping).find(([, v]) => v === "description")?.[0];
          const prioCol = Object.entries(mapping).find(([, v]) => v === "priority")?.[0];
          const dueCol = Object.entries(mapping).find(([, v]) => v === "due_at")?.[0];

          const title = titleCol ? row[titleCol] : "";
          if (!title) return null;

          const prioRaw = prioCol ? row[prioCol]?.toLowerCase() : "";
          const priority = ["urgent", "high", "medium", "low", "none"].includes(prioRaw)
            ? prioRaw : "none";

          let due_at: string | null = null;
          if (dueCol && row[dueCol]) {
            const d = new Date(row[dueCol]);
            if (!isNaN(d.getTime())) due_at = d.toISOString();
          }

          return {
            tenant_id: tenantId,
            project_id: target,
            title: title.slice(0, 500),
            description: descCol ? row[descCol] || null : null,
            priority: priority as "urgent" | "high" | "medium" | "low" | "none",
            due_at,
            created_by: user.id,
          };
        }).filter(Boolean);

        if (chunk.length) {
          const { error } = await supabase.from("tasks").insert(chunk as never);
          if (error) {
            errors += chunk.length;
            errorList.push({ row: i, reason: error.message });
          } else {
            created += chunk.length;
          }
        }
      }

      await supabase.from("import_jobs").update({
        status: errors === rows.length ? "failed" : "done",
        created_count: created,
        error_count: errors,
        errors: errorList as never,
        finished_at: new Date().toISOString(),
      }).eq("id", job.id);

      return { created, errors, total: rows.length };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["import-jobs"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

/** Exporta tarefas+projetos como JSON, gera download direto. */
export function useExportWorkspace() {
  const qc = useQueryClient();
  const { tenantId } = useWorkspace();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (format: "json" | "csv") => {
      if (!tenantId || !user) throw new Error("no workspace");

      const { data: job, error: jobErr } = await supabase
        .from("export_jobs")
        .insert({
          tenant_id: tenantId,
          user_id: user.id,
          format,
          scope: { tasks: true, projects: true } as never,
          status: "running",
        })
        .select()
        .single();
      if (jobErr) throw jobErr;

      try {
        const { data: tasks } = await supabase
          .from("tasks")
          .select("id, code, title, description, priority, due_at, done_at, created_at, project_id")
          .eq("tenant_id", tenantId)
          .eq("archived", false)
          .limit(5000);
        const { data: projects } = await supabase
          .from("projects")
          .select("id, name, key, description, color, created_at")
          .eq("tenant_id", tenantId)
          .limit(1000);

        let blob: Blob;
        let ext: string;

        if (format === "json") {
          const payload = {
            exported_at: new Date().toISOString(),
            tenant_id: tenantId,
            projects: projects ?? [],
            tasks: tasks ?? [],
          };
          blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
          ext = "json";
        } else {
          const headers = ["code", "title", "priority", "due_at", "done_at", "project_id"];
          const rows = [headers.join(",")];
          (tasks ?? []).forEach((t) => {
            rows.push(headers.map((h) => {
              const v = (t as Record<string, unknown>)[h] ?? "";
              return `"${String(v).replace(/"/g, '""')}"`;
            }).join(","));
          });
          blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
          ext = "csv";
        }

        // Trigger download direto
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `oxy-export-${new Date().toISOString().slice(0, 10)}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);

        await supabase.from("export_jobs").update({
          status: "done",
          size_bytes: blob.size,
          finished_at: new Date().toISOString(),
        }).eq("id", job.id);

        return { size: blob.size, count: tasks?.length ?? 0 };
      } catch (e) {
        await supabase.from("export_jobs").update({
          status: "failed",
          error_message: e instanceof Error ? e.message : "unknown",
          finished_at: new Date().toISOString(),
        }).eq("id", job.id);
        throw e;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["export-jobs"] }),
  });
}

export { parseCSV };