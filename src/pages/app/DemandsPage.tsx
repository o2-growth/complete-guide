import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";
import { DemandFormDialog } from "./_components/demands/DemandFormDialog";
import { slugifyDemand } from "./_components/demands/DemandFormDialog.utils";
import { DemandFormsList } from "./_components/demands/DemandFormsList";
import { DemandSubmissionsList } from "./_components/demands/DemandSubmissionsList";

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
    const s = (slug.trim() || slugifyDemand(t)).slice(0, 50);
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
        <DemandFormDialog
          open={draftOpen}
          onOpenChange={setDraftOpen}
          title={title}
          slug={slug}
          description={description}
          onTitleChange={setTitle}
          onSlugChange={setSlug}
          onDescriptionChange={setDescription}
          onSubmit={createForm}
        />
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
          <DemandFormsList
            loading={forms.isLoading}
            forms={forms.data ?? []}
            onCopyLink={copyLink}
            onToggleActive={toggleActive}
            onRemove={removeForm}
          />
        </TabsContent>

        <TabsContent value="submissions" className="mt-4">
          <DemandSubmissionsList
            loading={submissions.isLoading}
            submissions={submissions.data ?? []}
            forms={forms.data ?? []}
            onCopyLink={copyLink}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
