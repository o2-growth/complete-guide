import { cn } from "@/lib/utils";
import { PreviewContent } from "./preview-utils";

interface Props {
  content: PreviewContent;
  className?: string;
}

export function EmailPreview({ content, className }: Props) {
  const brand = content.brandName || "Oxy Growth";
  return (
    <div className={cn("w-full max-w-[600px] overflow-hidden rounded-lg border bg-background shadow-sm", className)}>
      <div className="border-b bg-muted/40 px-4 py-3 text-xs">
        <p className="font-semibold text-foreground">
          De: <span className="font-normal">{brand} &lt;hello@oxygrowth.co&gt;</span>
        </p>
        <p className="text-muted-foreground">Para: você @ exemplo.com</p>
        <p className="mt-1 text-sm font-semibold text-foreground">
          {content.subject || "Defina um assunto curto e direto (até 50 caracteres)"}
        </p>
        <p className="text-[11px] text-muted-foreground line-clamp-1">
          Preheader: {content.headline || "Texto de pré-visualização que aparece na caixa de entrada."}
        </p>
      </div>
      <div className="space-y-4 px-6 py-6">
        <div className="text-center">
          <p className="text-lg font-bold tracking-tight">{brand}</p>
        </div>
        {content.imageUrl && (
          <div className="aspect-[2/1] w-full overflow-hidden rounded bg-muted">
            <img src={content.imageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        {content.headline && (
          <h1 className="text-center text-2xl font-bold leading-tight">{content.headline}</h1>
        )}
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {content.caption ||
            "Olá!\n\nEste é o corpo do seu e-mail. Mantenha parágrafos curtos, escaneáveis e com uma chamada de ação clara no fim."}
        </div>
        {content.ctaLabel && (
          <div className="text-center">
            <button className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm">
              {content.ctaLabel}
            </button>
          </div>
        )}
        <p className="border-t pt-3 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} {brand} · você está recebendo porque assinou nossa lista ·
          <a className="ml-1 underline" href="#">descadastrar</a>
        </p>
      </div>
    </div>
  );
}
