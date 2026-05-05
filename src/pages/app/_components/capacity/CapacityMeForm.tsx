import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { DAY_LABELS } from "./constants";

interface Props {
  hoursWeek: number;
  dailyHours: number;
  workdays: number[];
  notes: string;
  saving: boolean;
  onChangeHoursWeek: (v: number) => void;
  onChangeDailyHours: (v: number) => void;
  onToggleDay: (d: number) => void;
  onChangeNotes: (v: string) => void;
  onSave: () => void;
}

export function CapacityMeForm({
  hoursWeek,
  dailyHours,
  workdays,
  notes,
  saving,
  onChangeHoursWeek,
  onChangeDailyHours,
  onToggleDay,
  onChangeNotes,
  onSave,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Minha capacidade semanal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="hpw">Horas por semana</Label>
            <Input
              id="hpw"
              type="number"
              min={0}
              max={168}
              value={hoursWeek}
              onChange={(e) => onChangeHoursWeek(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dh">Horas por dia útil</Label>
            <Input
              id="dh"
              type="number"
              min={0}
              max={24}
              step={0.5}
              value={dailyHours}
              onChange={(e) => onChangeDailyHours(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Dias de trabalho</Label>
          <div className="flex gap-1.5">
            {DAY_LABELS.map((lbl, idx) => {
              const active = workdays.includes(idx);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onToggleDay(idx)}
                  className={cn(
                    "h-9 w-9 rounded-md border text-xs font-medium transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-muted",
                  )}
                  aria-pressed={active}
                  aria-label={`Dia ${idx}`}
                >
                  {lbl}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground">D=Domingo · S=Sábado</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            placeholder="Ex: trabalho remoto às sextas, evitar reuniões antes das 10h..."
            value={notes}
            onChange={(e) => onChangeNotes(e.target.value)}
            rows={3}
          />
        </div>

        <Button onClick={onSave} disabled={saving}>
          Salvar capacidade
        </Button>
      </CardContent>
    </Card>
  );
}
