import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type ICEValue = number | null;

export interface ICEScoreEditorProps {
  impact: ICEValue;
  confidence: ICEValue;
  ease: ICEValue;
  score: ICEValue;
  onChange: (patch: {
    ice_impact?: ICEValue;
    ice_confidence?: ICEValue;
    ice_ease?: ICEValue;
  }) => void;
  compact?: boolean;
}

function parse(raw: string): ICEValue {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return Math.max(1, Math.min(10, Math.round(n)));
}

function scoreTone(score: ICEValue): string {
  if (score == null) return "text-muted-foreground";
  if (score >= 600) return "text-emerald-500";
  if (score >= 300) return "text-amber-500";
  return "text-slate-500";
}

const FIELDS: Array<{
  key: "ice_impact" | "ice_confidence" | "ice_ease";
  label: string;
  hint: string;
}> = [
  { key: "ice_impact", label: "Impacto", hint: "Quanto move o ponteiro do objetivo (1 a 10)." },
  { key: "ice_confidence", label: "Confiança", hint: "Quão certo você está do impacto (1 a 10)." },
  { key: "ice_ease", label: "Facilidade", hint: "Quão fácil é executar (1 = difícil, 10 = trivial)." },
];

export function ICEScoreEditor({
  impact,
  confidence,
  ease,
  score,
  onChange,
  compact = false,
}: ICEScoreEditorProps) {
  const values: Record<string, ICEValue> = {
    ice_impact: impact,
    ice_confidence: confidence,
    ice_ease: ease,
  };

  return (
    <div className={cn("space-y-2", compact && "space-y-1")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          ICE Score
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="text-muted-foreground/60 hover:text-muted-foreground">
                <Info className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-xs">
              Score = Impacto × Confiança × Facilidade. Varia de 1 a 1000. Use pra priorizar o
              backlog — quanto maior, mais valor por esforço.
            </TooltipContent>
          </Tooltip>
        </div>
        <span className={cn("text-sm font-semibold tabular-nums", scoreTone(score))}>
          {score ?? "—"}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {FIELDS.map((f) => (
          <Tooltip key={f.key}>
            <TooltipTrigger asChild>
              <div>
                <label className="block text-[10px] text-muted-foreground mb-0.5">{f.label}</label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  step={1}
                  defaultValue={values[f.key] ?? ""}
                  placeholder="—"
                  className="h-8 text-center"
                  onBlur={(e) => {
                    const next = parse(e.target.value);
                    if (next === values[f.key]) return;
                    onChange({ [f.key]: next });
                  }}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {f.hint}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
