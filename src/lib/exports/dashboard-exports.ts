import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DashboardTask } from "@/hooks/useDashboard";

interface Lookups {
  statuses: Array<{ id: string; name: string; slug: string; is_done: boolean }>;
  types: Array<{ id: string; name: string; slug: string }>;
  projects: Array<{ id: string; name: string; key: string }>;
  profiles: Array<{ id: string; full_name: string | null; display_name: string | null }>;
}

function tasksToRows(tasks: DashboardTask[], l: Lookups) {
  const sMap = new Map(l.statuses.map((s) => [s.id, s.name]));
  const tMap = new Map(l.types.map((t) => [t.id, t.name]));
  const pMap = new Map(l.projects.map((p) => [p.id, p.name]));
  const uMap = new Map(l.profiles.map((u) => [u.id, u.display_name || u.full_name || "—"]));

  return tasks.map((t) => ({
    Código: t.code ?? "",
    Título: t.title,
    Projeto: pMap.get(t.project_id) ?? "",
    Tipo: t.type_id ? tMap.get(t.type_id) ?? "" : "",
    Status: t.status_id ? sMap.get(t.status_id) ?? "" : "",
    Prioridade: t.priority,
    Responsável: t.assignee_id ? uMap.get(t.assignee_id) ?? "" : "",
    "Vence em": t.due_at ? format(new Date(t.due_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "",
    "Concluída em": t.done_at ? format(new Date(t.done_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "",
    "Estimativa (min)": t.estimate_minutes ?? "",
    "Tempo gasto (min)": t.spent_minutes,
  }));
}

export function exportTasksToExcel(tasks: DashboardTask[], l: Lookups, fileName = "relatorio-tarefas.xlsx") {
  const rows = tasksToRows(tasks, l);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tarefas");
  XLSX.writeFile(wb, fileName);
}

export function exportTasksToPDF(
  tasks: DashboardTask[],
  l: Lookups,
  meta: { tenantName?: string; rangeLabel: string },
  fileName = "relatorio-tarefas.pdf",
) {
  const rows = tasksToRows(tasks, l);
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(16);
  doc.text("Relatório de tarefas — Oxy Growth OS", 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`Período: ${meta.rangeLabel}`, 14, 23);
  doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 14, 28);
  if (meta.tenantName) doc.text(`Workspace: ${meta.tenantName}`, 14, 33);

  const total = tasks.length;
  const done = tasks.filter((t) => t.done_at).length;
  const overdue = tasks.filter((t) => !t.done_at && t.due_at && new Date(t.due_at) < new Date()).length;
  const totalMin = tasks.reduce((s, t) => s + (t.spent_minutes ?? 0), 0);

  doc.setFontSize(11);
  doc.setTextColor(20);
  doc.text(
    `Total: ${total}   •   Concluídas: ${done}   •   Atrasadas: ${overdue}   •   Tempo total: ${Math.round(totalMin / 60)}h`,
    14,
    42,
  );

  const headers = Object.keys(rows[0] ?? {
    Código: "", Título: "", Projeto: "", Tipo: "", Status: "",
    Prioridade: "", Responsável: "", "Vence em": "", "Concluída em": "",
    "Estimativa (min)": "", "Tempo gasto (min)": "",
  });

  autoTable(doc, {
    startY: 48,
    head: [headers],
    body: rows.map((r) => headers.map((h) => String((r as Record<string, unknown>)[h] ?? ""))),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [14, 165, 233], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 10, right: 10 },
  });

  doc.save(fileName);
}