import { useMemo, useState } from "react";
import { Image as ImageIcon, Linkedin, Mail, Loader2, Instagram } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useKanbanTasks } from "@/hooks/useTasks";
import { IgGrid } from "@/components/previews/IgGrid";
import { LinkedInPreview } from "@/components/previews/LinkedInPreview";
import { EmailPreview } from "@/components/previews/EmailPreview";
import { getTaskPreview } from "@/components/previews/preview-utils";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import type { TaskRow } from "@/hooks/useTasks";

type TaskWithFields = TaskRow & { custom_fields?: Record<string, unknown> };

export default function MediaPage() {
  const { data, isLoading } = useKanbanTasks(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  // useMemo evita recriar o array vazio a cada render enquanto data é undefined.
  const tasks = useMemo(() => (data ?? []) as TaskWithFields[], [data]);

  const linkedinTasks = useMemo(
    () => tasks.filter((t) => getTaskPreview(t.custom_fields).kind === "linkedin"),
    [tasks],
  );
  const emailTasks = useMemo(
    () => tasks.filter((t) => getTaskPreview(t.custom_fields).kind === "email"),
    [tasks],
  );

  return (
    <div className="space-y-6 p-6">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-orange-400 text-white">
          <ImageIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mídias</h1>
          <p className="text-sm text-muted-foreground">
            Pré-visualize criativos como aparecerão no feed, story, reel, LinkedIn e e-mail.
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="ig">
          <TabsList>
            <TabsTrigger value="ig">
              <Instagram className="mr-1.5 h-3.5 w-3.5" />
              Instagram
            </TabsTrigger>
            <TabsTrigger value="linkedin">
              <Linkedin className="mr-1.5 h-3.5 w-3.5" />
              LinkedIn ({linkedinTasks.length})
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="mr-1.5 h-3.5 w-3.5" />
              E-mail ({emailTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ig" className="mt-6">
            <Card className="overflow-hidden p-3 sm:p-4">
              <p className="mb-3 text-xs text-muted-foreground">
                Grid no estilo perfil do Instagram — clique em um post para abrir os detalhes.
              </p>
              <IgGrid tasks={tasks} onSelect={setOpenTaskId} />
            </Card>
          </TabsContent>

          <TabsContent value="linkedin" className="mt-6">
            {linkedinTasks.length === 0 ? (
              <EmptyState text="Nenhum post de LinkedIn ainda." />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {linkedinTasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setOpenTaskId(t.id)}
                    className="text-left transition hover:-translate-y-0.5"
                  >
                    <LinkedInPreview content={getTaskPreview(t.custom_fields)} />
                    <p className="mt-2 text-xs text-muted-foreground">{t.code} · {t.title}</p>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="email" className="mt-6">
            {emailTasks.length === 0 ? (
              <EmptyState text="Nenhum e-mail ainda." />
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                {emailTasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setOpenTaskId(t.id)}
                    className="text-left transition hover:-translate-y-0.5"
                  >
                    <EmailPreview content={getTaskPreview(t.custom_fields)} />
                    <p className="mt-2 text-xs text-muted-foreground">{t.code} · {t.title}</p>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <TaskDetailSheet
        taskId={openTaskId}
        onOpenChange={(open) => !open && setOpenTaskId(null)}
      />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-sm text-muted-foreground">
      {text}
    </div>
  );
}
