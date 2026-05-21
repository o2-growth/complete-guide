import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plug,
  RefreshCw,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Plus,
} from "lucide-react";
import SEO from "@/components/SEO";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { EmptyState } from "@/components/EmptyState";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  usePipefyIntegrations,
  useUpsertPipefyIntegration,
  useDeletePipefyIntegration,
  useSyncPipefyNow,
  type PipefyIntegration,
} from "@/hooks/usePipefyIntegration";

function extractPipeId(input: string): string {
  // Aceita URL completa "https://app.pipefy.com/pipes/306922389" ou só o ID.
  const m = input.match(/pipes\/(\d+)/);
  return m ? m[1] : input.trim();
}

function StatusBadge({ integration }: { integration: PipefyIntegration }) {
  if (!integration.last_sync_at) {
    return <Badge variant="secondary">Aguardando primeira sync</Badge>;
  }
  if (integration.last_sync_status === "ok") {
    return (
      <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        {integration.last_sync_count ?? 0} cards · {formatDistanceToNow(new Date(integration.last_sync_at), { locale: ptBR, addSuffix: true })}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="bg-red-500/15 text-red-600">
      <AlertTriangle className="mr-1 h-3 w-3" />
      Erro: {(integration.last_error ?? "").slice(0, 80)}
    </Badge>
  );
}

export default function PipefyIntegrationPage() {
  const { data: integrations, isLoading } = usePipefyIntegrations();
  const upsert = useUpsertPipefyIntegration();
  const remove = useDeletePipefyIntegration();
  const sync = useSyncPipefyNow();
  const [newPipe, setNewPipe] = useState("");

  const handleAdd = async () => {
    const pipe_id = extractPipeId(newPipe);
    if (!pipe_id) return;
    await upsert.mutateAsync({ pipe_id, enabled: true, active_only: true });
    setNewPipe("");
  };

  return (
    <div className="container mx-auto max-w-4xl py-6">
      <SEO title="Integração Pipefy" />
      <PageHeader
        title="Integração Pipefy"
        description="Conecte um pipe pra trazer os cards como projetos. Read-only: o Oxy nunca modifica dados no Pipefy."
        icon={Plug}
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Adicionar pipe</CardTitle>
          <CardDescription>
            Cole o link do pipe (ex: <code>https://app.pipefy.com/pipes/306922389</code>) ou só o ID.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            placeholder="https://app.pipefy.com/pipes/..."
            value={newPipe}
            onChange={(e) => setNewPipe(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleAdd} disabled={!newPipe.trim() || upsert.isPending}>
            <Plus className="mr-1 h-4 w-4" /> Adicionar
          </Button>
        </CardContent>
      </Card>

      <div className="mt-6 space-y-3">
        <h3 className="text-sm font-medium">Pipes conectados</h3>
        {isLoading ? (
          <ListSkeleton rows={2} />
        ) : (integrations ?? []).length === 0 ? (
          <EmptyState
            icon={Plug}
            title="Nenhum pipe conectado"
            description="Adicione um pipe acima pra começar a sincronizar projetos."
          />
        ) : (
          (integrations ?? []).map((integ) => (
            <Card key={integ.id}>
              <CardContent className="flex flex-wrap items-center gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {integ.pipe_name ?? `Pipe ${integ.pipe_id}`}
                    </span>
                    <a
                      href={`https://app.pipefy.com/pipes/${integ.pipe_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">ID: {integ.pipe_id}</div>
                  <div className="mt-2">
                    <StatusBadge integration={integ} />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`active-only-${integ.id}`}
                      checked={integ.active_only}
                      onCheckedChange={(v) =>
                        upsert.mutate({ id: integ.id, pipe_id: integ.pipe_id, active_only: v, enabled: integ.enabled })
                      }
                    />
                    <Label htmlFor={`active-only-${integ.id}`} className="text-xs">
                      Só ativos
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`enabled-${integ.id}`}
                      checked={integ.enabled}
                      onCheckedChange={(v) =>
                        upsert.mutate({ id: integ.id, pipe_id: integ.pipe_id, enabled: v, active_only: integ.active_only })
                      }
                    />
                    <Label htmlFor={`enabled-${integ.id}`} className="text-xs">
                      Ativo
                    </Label>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => sync.mutate(integ.pipe_id)}
                    disabled={sync.isPending}
                  >
                    <RefreshCw className={sync.isPending ? "mr-1 h-3.5 w-3.5 animate-spin" : "mr-1 h-3.5 w-3.5"} />
                    Sincronizar agora
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Remover integração com pipe ${integ.pipe_id}? Os projetos já sincronizados ficam no Oxy.`)) {
                        remove.mutate(integ.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="mt-8 rounded-lg border bg-muted/30 p-4 text-sm">
        <p className="font-medium">Como funciona</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Sincronização automática a cada <strong>15 minutos</strong>.</li>
          <li>Cada card do Pipefy vira um <strong>projeto</strong> no Oxy (kind: <code>pipefy</code>).</li>
          <li>Quando "Só ativos" está ligado, ignoramos fases "Concluído", "Arquivado" e "Não Realizados".</li>
          <li>O Oxy <strong>nunca</strong> escreve no Pipefy. É leitura pura.</li>
          <li>O token de API fica como secret <code>PIPEFY_TOKEN</code> no Lovable, fora do banco.</li>
        </ul>
      </div>
    </div>
  );
}
