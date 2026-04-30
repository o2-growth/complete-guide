import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Copy, Loader2, Plus, Trash2, Power, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}

export default function DemandsPage() {
  const { tenantId } = useWorkspace();
  const { user } = useAuth();
  const qc = useQueryClient();

  useEffect(() => {
    document.title = "Demandas — Oxy Growth OS";
  }, []);

  const forms = useQuery({
    queryKey: ["demand-forms", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("demand_forms")
        .select("id, slug, title, description, active, created_at")
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const submissions = useQuery({
    queryKey: ["demand-submissions", tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("demand_submissions")
        .select(
          "id, status, requester_name, requester_email, payload, created_at, task_id, form_id, approval_token"
        )
        .eq("tenant_id", tenantId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const [draftOpen, setDraftOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const createForm = async () => {
    if (!tenantId || !user) return;
    const t = title.trim();
    const s = (slug.trim() || slugify(t)).slice(0, 50);
    if (!t || !s) {
      toast.error("Título e slug são obrigatórios");
      return;
    }
    const { error } = await supabase.from("demand_forms").insert({
      tenant_id: tenantId,
      slug: s,
      title: t,
      description: description.trim() || null,
      created_by: user.id,
      schema: {},
      active: true,
    });
    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }
    toast.success("Formulário criado");
    setTitle("");
    setSlug("");
    setDescription("");
    setDraftOpen(false);
    qc.invalidateQueries({ queryKey: ["demand-forms"] });
  };

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase
      .from("demand_forms")
      .update({ active: !active })
      .eq("id", id);
    if (error) toast.error("Erro: " + error.message);
    else qc.invalidateQueries({ queryKey: ["demand-forms"] });
  };

  const removeForm = async (id: string) => {
    const { error } = await supabase.from("demand_forms").delete().eq("id", id);
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success("Formulário removido");
      qc.invalidateQueries({ queryKey: ["demand-forms"] });
    }
  };

  const copyLink = (path: string) => {
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado");
  };

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <ClipboardList className="h-3.5 w-3.5" /> Portal externo
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Demandas</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Crie formulários públicos para solicitações externas e aprove para virar tarefas.
          </p>
        </div>
        <Dialog open={draftOpen} onOpenChange={setDraftOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo formulário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo formulário público</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Título</Label>
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!slug) setSlug(slugify(e.target.value));
                  }}
                  placeholder="Ex: Solicitar post no Instagram"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Slug (URL pública)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">/solicitar/</span>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(slugify(e.target.value))}
                    placeholder="post-instagram"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Descrição</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Explique para quem está solicitando"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={createForm}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <Tabs defaultValue="forms">
        <TabsList>
          <TabsTrigger value="forms">Formulários</TabsTrigger>
          <TabsTrigger value="submissions">
            Submissões
            {submissions.data?.some((s) => s.status === "pending") && (
              <Badge variant="default" className="ml-2 h-4 px-1.5 text-[10px]">
                {submissions.data.filter((s) => s.status === "pending").length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="forms" className="mt-4">
          {forms.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (forms.data ?? []).length === 0 ? (
            <p className="rounded-lg border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
              Nenhum formulário ainda. Crie o primeiro acima.
            </p>
          ) : (
            <div className="space-y-2">
              {(forms.data ?? []).map((f) => (
                <div
                  key={f.id}
                  className="flex flex-col gap-2 rounded-lg border bg-card p-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold">{f.title}</h3>
                      {!f.active && (
                        <Badge variant="outline" className="text-[10px]">
                          inativo
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      <span className="font-mono">/solicitar/{f.slug}</span>
                      {f.description ? ` · ${f.description}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyLink(`/solicitar/${f.slug}`)}
                    >
                      <Copy className="mr-1.5 h-3.5 w-3.5" /> Link público
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleActive(f.id, f.active)}
                      title={f.active ? "Desativar" : "Ativar"}
                    >
                      <Power className={`h-4 w-4 ${f.active ? "text-primary" : "text-muted-foreground"}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeForm(f.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="submissions" className="mt-4">
          {submissions.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (submissions.data ?? []).length === 0 ? (
            <p className="rounded-lg border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
              Nenhuma submissão ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {(submissions.data ?? []).map((s) => {
                const form = forms.data?.find((f) => f.id === s.form_id);
                const title =
                  (s.payload as Record<string, unknown>)?.title?.toString() ??
                  form?.title ?? "Demanda";
                return (
                  <div
                    key={s.id}
                    className="flex items-start gap-3 rounded-lg border bg-card p-3"
                  >
                    <SubStatusDot status={s.status ?? "pending"} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{title}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.requester_name || s.requester_email || "anônimo"} ·{" "}
                        {formatDistanceToNow(new Date(s.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {s.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyLink(`/aprovar/${s.approval_token}`)}
                    >
                      <LinkIcon className="mr-1.5 h-3.5 w-3.5" /> Aprovação
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SubStatusDot({ status }: { status: string }) {
  const cls =
    status === "approved"
      ? "bg-primary"
      : status === "rejected"
        ? "bg-destructive"
        : "bg-[hsl(var(--prio-medium))]";
  return <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${cls}`} />;
}