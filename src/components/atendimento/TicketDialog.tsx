import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateTicket,
  type TicketPriority,
  type TicketChannel,
} from "@/hooks/useTickets";

interface TicketDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function TicketDialog({ open, onOpenChange }: TicketDialogProps) {
  const create = useCreateTicket();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [channel, setChannel] = useState<TicketChannel>("internal");
  const [slaResponse, setSlaResponse] = useState<string>("");
  const [slaResolution, setSlaResolution] = useState<string>("");

  const reset = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setChannel("internal");
    setSlaResponse("");
    setSlaResolution("");
  };

  const submit = () => {
    if (!title.trim()) return;
    create.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        channel,
        sla_response_minutes: slaResponse ? Number(slaResponse) : null,
        sla_resolution_minutes: slaResolution ? Number(slaResolution) : null,
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo ticket</DialogTitle>
          <DialogDescription>
            Crie um chamado de longo prazo. Tickets têm SLA próprio e ficam separados das tarefas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="ticket-title">Título</Label>
            <Input
              id="ticket-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Cliente reportou erro no agendamento"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ticket-desc">Descrição</Label>
            <Textarea
              id="ticket-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contexto, passos pra reproduzir, links…"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgente</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Canal</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as TicketChannel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Interno</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="form">Formulário</SelectItem>
                  <SelectItem value="chat">Chat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sla-response">SLA resposta (min)</Label>
              <Input
                id="sla-response"
                type="number"
                value={slaResponse}
                onChange={(e) => setSlaResponse(e.target.value)}
                placeholder="ex: 60"
                min={0}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sla-resolution">SLA resolução (min)</Label>
              <Input
                id="sla-resolution"
                type="number"
                value={slaResolution}
                onChange={(e) => setSlaResolution(e.target.value)}
                placeholder="ex: 480"
                min={0}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!title.trim() || create.isPending}>
            {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
