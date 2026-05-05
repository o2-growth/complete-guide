import { useMemo } from "react";
import { Bell, Check, RefreshCw, Settings as SettingsIcon, AlertOctagon, Target, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import {
  useNotificationsInfinite,
  useMarkRead,
  useScanNotifications,
  useNotificationPrefs,
  useUpdatePrefs,
  type Notification,
} from "@/hooks/useNotifications";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<string, typeof Bell> = {
  anomaly_critical: AlertOctagon,
  kr_at_risk: Target,
  deadline_near: Clock,
};

const SEV: Record<Notification["severity"], string> = {
  info: "border-l-sky-500 bg-sky-500/5",
  warning: "border-l-amber-500 bg-amber-500/5",
  critical: "border-l-red-500 bg-red-500/5",
};

export default function NotificationsPage() {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotificationsInfinite();
  const { data: prefs } = useNotificationPrefs();
  const markRead = useMarkRead();
  const scan = useScanNotifications();
  const updatePrefs = useUpdatePrefs();

  const list = useMemo<Notification[]>(
    () => data?.pages.flatMap((p) => p.rows) ?? [],
    [data],
  );

  const unread = list.filter((n) => !n.read_at);
  const read = list.filter((n) => n.read_at);

  const renderLoadMore = (label: string) =>
    hasNextPage ? (
      <div className="flex justify-center pt-2">
        <Button
          variant="outline"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          aria-label={label}
        >
          {isFetchingNextPage ? (
            <span role="status" aria-live="polite">Carregando...</span>
          ) : (
            "Carregar mais"
          )}
        </Button>
      </div>
    ) : null;

  const renderCard = (n: Notification) => {
    const Icon = KIND_ICON[n.kind] ?? Bell;
    return (
      <Card key={n.id} className={cn("p-4 border-l-4", SEV[n.severity], n.read_at && "opacity-60")}>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-background">
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm">{n.title}</h3>
              <Badge variant="outline" className="text-[10px] uppercase">{n.severity}</Badge>
              <span className="text-xs text-muted-foreground ml-auto">
                {format(new Date(n.created_at), "dd/MM HH:mm", { locale: ptBR })}
              </span>
            </div>
            {n.body && <p className="text-sm mt-1 text-muted-foreground">{n.body}</p>}
            <div className="flex items-center gap-2 mt-2">
              {n.link && (
                <Button variant="outline" size="sm" asChild>
                  <Link to={n.link}>Abrir</Link>
                </Button>
              )}
              {!n.read_at && (
                <Button variant="ghost" size="sm" onClick={() => markRead.mutate([n.id])}>
                  <Check className="h-3 w-3 mr-1" /> Marcar como lida
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" /> Notificações
          </h1>
          <p className="text-sm text-muted-foreground">Alertas inteligentes do seu workspace.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => markRead.mutate(undefined)}>
            <Check className="h-4 w-4 mr-2" /> Marcar todas
          </Button>
          <Button onClick={() => scan.mutate()} disabled={scan.isPending}>
            <RefreshCw className={cn("h-4 w-4 mr-2", scan.isPending && "animate-spin")} /> Atualizar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="unread">
        <TabsList>
          <TabsTrigger value="unread">Não lidas ({unread.length})</TabsTrigger>
          <TabsTrigger value="read">Lidas ({read.length})</TabsTrigger>
          <TabsTrigger value="prefs"><SettingsIcon className="h-3 w-3 mr-1" /> Preferências</TabsTrigger>
        </TabsList>

        <TabsContent value="unread" className="space-y-2 mt-4">
          {isLoading ? (
            <ListSkeleton rows={5} />
          ) : unread.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Tudo em dia.</p>
          ) : (
            <>
              {unread.map(renderCard)}
              {renderLoadMore("Carregar mais notificações não lidas")}
            </>
          )}
        </TabsContent>

        <TabsContent value="read" className="space-y-2 mt-4">
          {isLoading ? (
            <ListSkeleton rows={5} />
          ) : read.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nada por aqui ainda.</p>
          ) : (
            <>
              {read.map(renderCard)}
              {renderLoadMore("Carregar mais notificações lidas")}
            </>
          )}
        </TabsContent>

        <TabsContent value="prefs" className="mt-4">
          <Card className="p-6 max-w-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-semibold">Notificações in-app</Label>
                <p className="text-xs text-muted-foreground">Mostrar alertas dentro do produto</p>
              </div>
              <Switch
                checked={prefs?.in_app_enabled ?? true}
                onCheckedChange={(v) => updatePrefs.mutate({ in_app_enabled: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-semibold">Digest por email</Label>
                <p className="text-xs text-muted-foreground">Resumo enviado por email</p>
              </div>
              <Select
                value={prefs?.email_digest ?? "daily"}
                onValueChange={(v) => updatePrefs.mutate({ email_digest: v as "off" | "daily" | "weekly" })}
              >
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">Desligado</SelectItem>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}