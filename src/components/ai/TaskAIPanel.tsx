import { useState } from "react";
import { Loader2, Sparkles, Wand2, Tags, ListTree, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { TaskRow } from "@/hooks/useTasks";

interface Props {
  task: TaskRow;
}

const PLATFORMS = [
  { value: "ig_feed", label: "Instagram Feed" },
  { value: "ig_story", label: "Instagram Story" },
  { value: "ig_reel", label: "Instagram Reel" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "email", label: "E-mail" },
];

export function TaskAIPanel({ task }: Props) {
  const qc = useQueryClient();
  const [loadingCopy, setLoadingCopy] = useState(false);
  const [loadingCat, setLoadingCat] = useState(false);
  const [loadingBreak, setLoadingBreak] = useState(false);
  const [platform, setPlatform] = useState("ig_feed");
  const [generated, setGenerated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [categorized, setCategorized] = useState<{ type_slug: string; priority: string; estimate_minutes: number; tags: string[]; reasoning: string } | null>(null);
  const [subtasks, setSubtasks] = useState<{ title: string; estimate_minutes: number }[] | null>(null);

  const generateCopy = async () => {
    setLoadingCopy(true);
    setGenerated(null);
    try {
      const brief = `${task.title}\n\n${task.description ?? ""}`;
      const { data, error } = await supabase.functions.invoke("ai-generate-copy", {
        body: { brief, platform, tone: "profissional", taskId: task.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setGenerated(data.text);
      toast.success("Copy gerada");
    } catch (e) {
      toast.error("Erro: " + (e as Error).message);
    } finally {
      setLoadingCopy(false);
    }
  };

  const applyAsDescription = async () => {
    if (!generated) return;
    const { error } = await supabase.from("tasks").update({ description: generated }).eq("id", task.id);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Aplicado como descrição");
    qc.invalidateQueries({ queryKey: ["task", task.id] });
  };

  const categorize = async () => {
    setLoadingCat(true);
    setCategorized(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-categorize-task", { body: { taskId: task.id } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setCategorized(data.suggestion);
    } catch (e) {
      toast.error("Erro: " + (e as Error).message);
    } finally {
      setLoadingCat(false);
    }
  };

  const applyCategory = async () => {
    if (!categorized) return;
    const { data: types } = await supabase.from("task_types").select("id, slug").eq("tenant_id", task.tenant_id);
    const matched = types?.find((t) => t.slug === categorized.type_slug);
    const patch = {
      priority: categorized.priority as TaskRow["priority"],
      estimate_minutes: categorized.estimate_minutes,
      ...(matched ? { type_id: matched.id } : {}),
    };
    const { error } = await supabase.from("tasks").update(patch as never).eq("id", task.id);
    if (error) return toast.error(error.message);
    toast.success("Aplicado");
    qc.invalidateQueries({ queryKey: ["task", task.id] });
    qc.invalidateQueries({ queryKey: ["tasks"] });
  };

  const breakdown = async () => {
    setLoadingBreak(true);
    setSubtasks(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-breakdown", { body: { taskId: task.id } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSubtasks(data.subtasks ?? []);
    } catch (e) {
      toast.error("Erro: " + (e as Error).message);
    } finally {
      setLoadingBreak(false);
    }
  };

  const createSubtasks = async () => {
    if (!subtasks?.length) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const rows = subtasks.map((s) => ({
      tenant_id: task.tenant_id,
      project_id: task.project_id,
      parent_task_id: task.id,
      title: s.title,
      estimate_minutes: s.estimate_minutes,
      priority: "none" as const,
      reporter_id: user.id,
      created_by: user.id,
      number: 0,
    }));
    const { error } = await supabase.from("tasks").insert(rows);
    if (error) return toast.error(error.message);
    toast.success(`${rows.length} subtarefas criadas`);
    qc.invalidateQueries({ queryKey: ["subtasks", task.id] });
    setSubtasks(null);
  };

  const copyText = () => {
    if (!generated) return;
    navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-4">
      {/* Generate Copy */}
      <Card className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold">Gerar copy</h4>
        </div>
        <div className="flex gap-2">
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="h-9 flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PLATFORMS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={generateCopy} disabled={loadingCopy} size="sm">
            {loadingCopy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Gerar
          </Button>
        </div>
        {generated && (
          <div className="space-y-2">
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-xs leading-relaxed">{generated}</pre>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={copyText}>
                {copied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />} Copiar
              </Button>
              <Button size="sm" variant="secondary" onClick={applyAsDescription}>Aplicar como descrição</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Categorize */}
      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tags className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold">Sugerir tipo, prioridade e estimativa</h4>
          </div>
          <Button onClick={categorize} disabled={loadingCat} size="sm" variant="outline">
            {loadingCat ? <Loader2 className="h-4 w-4 animate-spin" /> : "Analisar"}
          </Button>
        </div>
        {categorized && (
          <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{categorized.type_slug}</Badge>
              <Badge variant="outline">prio: {categorized.priority}</Badge>
              <Badge variant="outline">{categorized.estimate_minutes} min</Badge>
              {categorized.tags?.map((t) => <Badge key={t} variant="outline" className="text-[10px]">#{t}</Badge>)}
            </div>
            <p className="text-muted-foreground italic">{categorized.reasoning}</p>
            <Button size="sm" variant="secondary" onClick={applyCategory}>Aplicar à tarefa</Button>
          </div>
        )}
      </Card>

      {/* Breakdown */}
      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListTree className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold">Quebrar em subtarefas</h4>
          </div>
          <Button onClick={breakdown} disabled={loadingBreak} size="sm" variant="outline">
            {loadingBreak ? <Loader2 className="h-4 w-4 animate-spin" /> : "Quebrar"}
          </Button>
        </div>
        {subtasks && subtasks.length > 0 && (
          <div className="space-y-2">
            <ul className="space-y-1 rounded-md border bg-muted/30 p-3 text-xs">
              {subtasks.map((s, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span>{i + 1}. {s.title}</span>
                  <Badge variant="outline" className="text-[10px]">{s.estimate_minutes} min</Badge>
                </li>
              ))}
            </ul>
            <Button size="sm" variant="secondary" onClick={createSubtasks}>Criar {subtasks.length} subtarefas</Button>
          </div>
        )}
      </Card>
    </div>
  );
}