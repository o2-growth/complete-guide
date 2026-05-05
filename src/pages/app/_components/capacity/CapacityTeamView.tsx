import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import type { MemberLite } from "@/hooks/useCapacity";
import { initials } from "./constants";

export interface ProjectionItem {
  member: MemberLite;
  cap: { hours_per_week: number; daily_hours: number } | undefined;
  calc: { availableHours: number; offDays: number; workdays: number };
  fullHours: number;
  utilization: number;
}

export function CapacityTeamView({ projection }: { projection: ProjectionItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Disponibilidade — próximos 30 dias</CardTitle>
      </CardHeader>
      <CardContent className="divide-y">
        {projection.map(({ member, cap, calc, fullHours, utilization }) => (
          <div key={member.id} className="flex items-center gap-4 py-3">
            <Avatar className="h-9 w-9">
              {member.avatar_url && <AvatarImage src={member.avatar_url} alt="" />}
              <AvatarFallback className="bg-primary/10 text-xs text-primary">{initials(member)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-medium">{member.display_name || member.full_name || member.email}</p>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {calc.availableHours.toFixed(0)}h / {fullHours.toFixed(0)}h
                  {calc.offDays > 0 && <span className="ml-2 text-amber-600 dark:text-amber-400">· {calc.offDays}d fora</span>}
                </span>
              </div>
              <Progress value={utilization} className="mt-1.5 h-1.5" />
              <p className="mt-1 text-[10px] text-muted-foreground">
                {cap ? `${cap.hours_per_week}h/sem · ${cap.daily_hours}h/dia` : "Sem configuração — usando padrão 40h/sem"}
              </p>
            </div>
          </div>
        ))}
        {projection.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhum membro ainda no workspace.</p>
        )}
      </CardContent>
    </Card>
  );
}
