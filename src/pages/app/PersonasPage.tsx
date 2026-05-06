import { useState } from "react";
import { Plus, Users, UserCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { SEO } from "@/components/SEO";
import {
  usePersonas,
  useDeletePersona,
  type Persona,
} from "@/hooks/usePersonas";
import {
  useAudiences,
  useDeleteAudience,
  type Audience,
} from "@/hooks/useAudiences";
import { PersonaCard } from "@/components/personas/PersonaCard";
import { PersonaDialog } from "@/components/personas/PersonaDialog";
import { AudienceCard } from "@/components/personas/AudienceCard";
import { AudienceDialog } from "@/components/personas/AudienceDialog";

export default function PersonasPage() {
  const personasQuery = usePersonas();
  const audiencesQuery = useAudiences();
  const deletePersona = useDeletePersona();
  const deleteAudience = useDeleteAudience();

  const [tab, setTab] = useState<"personas" | "audiences">("personas");

  const [personaDialogOpen, setPersonaDialogOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);

  const [audienceDialogOpen, setAudienceDialogOpen] = useState(false);
  const [editingAudience, setEditingAudience] = useState<Audience | null>(null);

  const personas = personasQuery.data ?? [];
  const audiences = audiencesQuery.data ?? [];

  const openNewPersona = () => {
    setEditingPersona(null);
    setPersonaDialogOpen(true);
  };
  const openEditPersona = (p: Persona) => {
    setEditingPersona(p);
    setPersonaDialogOpen(true);
  };
  const onDeletePersona = (p: Persona) => {
    if (confirm(`Remover persona "${p.name}"? Esta ação não pode ser desfeita.`)) {
      deletePersona.mutate(p.id);
    }
  };

  const openNewAudience = () => {
    setEditingAudience(null);
    setAudienceDialogOpen(true);
  };
  const openEditAudience = (a: Audience) => {
    setEditingAudience(a);
    setAudienceDialogOpen(true);
  };
  const onDeleteAudience = (a: Audience) => {
    if (confirm(`Remover público "${a.name}"?`)) {
      deleteAudience.mutate(a.id);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <SEO title="Personas | Oxy Growth OS" description="Personas e públicos do time de Growth" />

      <PageHeader
        icon={UserCircle}
        title="Personas e Públicos"
        description="Camada estratégica que vincula tarefas, posts e campanhas ao seu perfil-alvo."
        actions={
          tab === "personas" ? (
            <Button onClick={openNewPersona}>
              <Plus className="mr-2 h-4 w-4" /> Nova persona
            </Button>
          ) : (
            <Button onClick={openNewAudience}>
              <Plus className="mr-2 h-4 w-4" /> Novo público
            </Button>
          )
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as "personas" | "audiences")}>
        <TabsList>
          <TabsTrigger value="personas">
            <UserCircle className="mr-1.5 h-4 w-4" /> Personas
            <span className="ml-2 text-[10px] text-muted-foreground">{personas.length}</span>
          </TabsTrigger>
          <TabsTrigger value="audiences">
            <Users className="mr-1.5 h-4 w-4" /> Públicos
            <span className="ml-2 text-[10px] text-muted-foreground">{audiences.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personas" className="mt-4">
          {personasQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : personas.length === 0 ? (
            <EmptyState
              icon={UserCircle}
              title="Nenhuma persona ainda"
              description="Crie personas para representar quem o time de Growth está atendendo."
              action={{ label: "Criar primeira persona", onClick: openNewPersona, icon: Plus }}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {personas.map((p) => (
                <PersonaCard key={p.id} persona={p} onEdit={openEditPersona} onDelete={onDeletePersona} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="audiences" className="mt-4">
          {audiencesQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : audiences.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nenhum público ainda"
              description="Públicos agrupam personas em segmentos accionáveis para campanhas e conteúdo."
              action={{ label: "Criar primeiro público", onClick: openNewAudience, icon: Plus }}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {audiences.map((a) => (
                <AudienceCard
                  key={a.id}
                  audience={a}
                  personas={personas}
                  onEdit={openEditAudience}
                  onDelete={onDeleteAudience}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <PersonaDialog
        open={personaDialogOpen}
        onOpenChange={setPersonaDialogOpen}
        persona={editingPersona}
      />
      <AudienceDialog
        open={audienceDialogOpen}
        onOpenChange={setAudienceDialogOpen}
        audience={editingAudience}
        personas={personas}
      />
    </div>
  );
}
