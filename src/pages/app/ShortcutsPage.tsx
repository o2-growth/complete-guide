import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Keyboard } from "lucide-react";
import SEO from "@/components/SEO";

const SECTIONS: { title: string; items: { keys: string[]; label: string }[] }[] = [
  {
    title: "Global",
    items: [
      { keys: ["⌘", "K"], label: "Abrir busca / paleta de comandos" },
      { keys: ["?"], label: "Mostrar esta página de atalhos" },
      { keys: ["Q"], label: "Quick Add — nova tarefa" },
      { keys: ["Esc"], label: "Fechar diálogo / cancelar" },
    ],
  },
  {
    title: "Navegação (G + tecla)",
    items: [
      { keys: ["G", "I"], label: "Ir para Inbox" },
      { keys: ["G", "H"], label: "Ir para Hoje" },
      { keys: ["G", "C"], label: "Ir para Calendário" },
      { keys: ["G", "K"], label: "Ir para Kanban" },
      { keys: ["G", "O"], label: "Ir para Copilot IA" },
      { keys: ["G", "E"], label: "Ir para Executive" },
      { keys: ["G", "N"], label: "Ir para Notificações" },
      { keys: ["G", "S"], label: "Ir para Configurações" },
    ],
  },
  {
    title: "Listas de tarefas",
    items: [
      { keys: ["J"], label: "Próxima tarefa" },
      { keys: ["K"], label: "Tarefa anterior" },
      { keys: ["X"], label: "Selecionar / marcar concluída" },
      { keys: ["E"], label: "Editar tarefa selecionada" },
      { keys: ["Enter"], label: "Abrir detalhe" },
    ],
  },
  {
    title: "Editor (TipTap)",
    items: [
      { keys: ["⌘", "B"], label: "Negrito" },
      { keys: ["⌘", "I"], label: "Itálico" },
      { keys: ["⌘", "K"], label: "Inserir link" },
      { keys: ["⌘", "Enter"], label: "Salvar comentário" },
    ],
  },
];

export default function ShortcutsPage() {
  return (
    <div className="container max-w-3xl py-8">
      <SEO title="Atalhos de teclado · Oxy" description="Lista completa de atalhos para operar o Oxy Growth OS na velocidade do teclado." noIndex />
      <header className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Keyboard className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Atalhos de teclado</h1>
          <p className="text-sm text-muted-foreground">Opere o Oxy sem tirar as mãos do teclado.</p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map(s => (
          <Card key={s.title} className="p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{s.title}</h2>
            <ul className="space-y-2">
              {s.items.map(it => (
                <li key={it.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-foreground">{it.label}</span>
                  <span className="flex items-center gap-1">
                    {it.keys.map((k, i) => (
                      <Badge key={i} variant="outline" className="font-mono text-[11px] px-1.5 py-0 h-5">{k}</Badge>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Dica: pressione <Badge variant="outline" className="mx-1 font-mono text-[10px]">⌘K</Badge> em qualquer tela pra abrir a busca global.
      </p>
    </div>
  );
}