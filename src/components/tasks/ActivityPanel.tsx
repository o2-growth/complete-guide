import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Star, MessageSquare, Send, ThumbsUp, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import {
  useComments,
  useAddComment,
  useDeleteComment,
  type CommentRow,
} from "@/hooks/useTaskDetail";
import { useTaskActivity, type TaskActivityEvent } from "@/hooks/useTaskActivity";
import { cn } from "@/lib/utils";

interface ActivityPanelProps {
  taskId: string;
}

interface FeedItem {
  id: string;
  kind: "event" | "comment";
  createdAt: string;
  event?: TaskActivityEvent;
  comment?: CommentRow;
}

function initials(name?: string | null, email?: string | null) {
  const s = (name || email || "?").trim();
  return s
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function timeAgo(iso: string) {
  return formatDistanceToNow(new Date(iso), { locale: ptBR, addSuffix: false });
}

export function ActivityPanel({ taskId }: ActivityPanelProps) {
  const { user } = useAuth();
  const { data: events = [], isLoading: eventsLoading } = useTaskActivity(taskId);
  const { data: comments = [], isLoading: commentsLoading } = useComments(taskId);
  const addComment = useAddComment(taskId);
  const deleteComment = useDeleteComment(taskId);
  const [draft, setDraft] = useState("");

  // Feed unificado: events + comments, ordenado por created_at desc.
  const feed: FeedItem[] = useMemo(() => {
    const eventItems: FeedItem[] = events
      .filter((e) => e.kind !== "commented") // comentários já vêm pela tabela comments
      .map((e) => ({ id: `e-${e.id}`, kind: "event" as const, createdAt: e.createdAt, event: e }));
    const commentItems: FeedItem[] = comments.map((c) => ({
      id: `c-${c.id}`,
      kind: "comment" as const,
      createdAt: c.created_at,
      comment: c,
    }));
    return [...eventItems, ...commentItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [events, comments]);

  const submit = async () => {
    const body = draft.trim();
    if (!body) return;
    await addComment.mutateAsync(body);
    setDraft("");
  };

  const loading = eventsLoading || commentsLoading;

  return (
    <div className="flex h-full flex-col border-l bg-card/40">
      <Tabs defaultValue="activity" className="flex h-full flex-col">
        <TabsList className="m-2 grid h-8 grid-cols-2 bg-transparent p-0">
          <TabsTrigger
            value="related"
            className="rounded-none border-b-2 border-transparent text-xs text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            <Star className="mr-1.5 h-3.5 w-3.5" /> Itens relacionados
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="rounded-none border-b-2 border-transparent text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
          >
            Atividade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="related" className="m-0 flex-1 overflow-y-auto px-3 pb-2">
          <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <Star className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-xs">
              Vincule tarefas, documentos ou cards pra ver aqui. Em breve.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="m-0 flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-3 overflow-y-auto px-3 pb-2">
            {loading && (
              <p className="py-6 text-center text-xs text-muted-foreground">Carregando…</p>
            )}
            {!loading && feed.length === 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground">
                Sem atividade ainda. Seja o primeiro a comentar.
              </p>
            )}
            {feed.map((item) =>
              item.kind === "event" && item.event ? (
                <EventLine key={item.id} event={item.event} />
              ) : item.kind === "comment" && item.comment ? (
                <CommentLine
                  key={item.id}
                  comment={item.comment}
                  canDelete={item.comment.author_id === user?.id}
                  onDelete={() => deleteComment.mutate(item.comment!.id)}
                />
              ) : null,
            )}
          </div>

          {/* Composer */}
          <div className="border-t bg-background/70 px-3 py-2">
            <div className="flex items-start gap-2">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="text-[10px]">
                  {initials(user?.user_metadata?.full_name as string | undefined, user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Escreva um comentário…"
                  className="min-h-[60px] resize-none border-0 bg-transparent px-2 py-1 text-sm shadow-none focus-visible:ring-0"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      void submit();
                    }
                  }}
                />
                <div className="flex items-center justify-between border-t pt-1.5">
                  <span className="text-[10px] text-muted-foreground">⌘/Ctrl+Enter pra enviar</span>
                  <Button
                    size="sm"
                    onClick={submit}
                    disabled={!draft.trim() || addComment.isPending}
                    className="h-7 gap-1"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Comentar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EventLine({ event }: { event: TaskActivityEvent }) {
  return (
    <div className="flex items-start gap-2 text-xs text-muted-foreground">
      <Avatar className="mt-0.5 h-5 w-5 shrink-0">
        <AvatarFallback className="text-[9px]">
          {initials(event.actorName, event.actorEmail)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="leading-snug">
          <strong className="font-medium text-foreground">{event.actorName}</strong>{" "}
          {event.label}
        </p>
        <p className="text-[10px] text-muted-foreground/70">{timeAgo(event.createdAt)} atrás</p>
      </div>
    </div>
  );
}

function CommentLine({
  comment,
  canDelete,
  onDelete,
}: {
  comment: CommentRow;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const authorName =
    comment.author?.display_name || comment.author?.email || "Usuário";
  return (
    <div className="rounded-md border bg-background/60 p-2">
      <div className="flex items-start gap-2">
        <Avatar className="h-6 w-6 shrink-0">
          {comment.author?.avatar_url && <AvatarImage src={comment.author.avatar_url} />}
          <AvatarFallback className="text-[10px]">
            {initials(comment.author?.display_name, comment.author?.email)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium">{authorName}</span>
            <span className="text-[10px] text-muted-foreground">
              {timeAgo(comment.created_at)} atrás
            </span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-snug">{comment.body}</p>
          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded px-1 py-0.5 hover:bg-accent"
            >
              <ThumbsUp className="h-3 w-3" /> 0
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded px-1 py-0.5 hover:bg-accent"
            >
              <MessageSquare className="h-3 w-3" /> Responder
            </button>
            {canDelete && (
              <button
                type="button"
                onClick={onDelete}
                className={cn(
                  "ml-auto inline-flex items-center rounded px-1 py-0.5",
                  "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
                )}
                aria-label="Excluir comentário"
              >
                <MoreHorizontal className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
