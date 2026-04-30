import { useMemo, useState } from "react";
import { Award, Sparkles, ThumbsUp, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useSkillsMatrix,
  useUpsertUserSkill,
  useRemoveUserSkill,
  useEndorseSkill,
  Skill,
  UserSkill,
  MemberProfile,
} from "@/hooks/useSkills";
import { useAuth } from "@/hooks/useAuth";
import { SkillLevelDots } from "@/components/skills/SkillLevelDots";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  design: "Design & Criação",
  copy: "Copy & Conteúdo",
  media: "Mídia & Tráfego",
  tech: "Tech & Automação",
  data: "Dados & Analytics",
  management: "Gestão",
  other: "Outros",
};

const CATEGORY_ORDER = ["design", "copy", "media", "tech", "data", "management", "other"];

function initials(p: MemberProfile) {
  const base = p.display_name || p.full_name || p.email || "?";
  return base
    .split(/[\s.@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

export default function SkillsPage() {
  const { data, isLoading } = useSkillsMatrix();
  const { user } = useAuth();
  const upsert = useUpsertUserSkill();
  const remove = useRemoveUserSkill();
  const endorse = useEndorseSkill();
  const [tab, setTab] = useState("matrix");

  const grouped = useMemo(() => {
    if (!data) return [];
    const map: Record<string, Skill[]> = {};
    for (const s of data.skills) {
      (map[s.category] ??= []).push(s);
    }
    return CATEGORY_ORDER.filter((c) => map[c]?.length).map((c) => ({
      category: c,
      label: CATEGORY_LABELS[c] ?? c,
      skills: map[c],
    }));
  }, [data]);

  const usByUserSkill = useMemo(() => {
    const m = new Map<string, UserSkill>();
    data?.userSkills.forEach((us) => m.set(`${us.user_id}:${us.skill_id}`, us));
    return m;
  }, [data]);

  const mySkills = useMemo(() => {
    if (!data || !user) return [];
    return data.userSkills
      .filter((us) => us.user_id === user.id)
      .map((us) => ({ us, skill: data.skills.find((s) => s.id === us.skill_id)! }))
      .filter((x) => x.skill);
  }, [data, user]);

  if (isLoading) {
    return (
      <div className="container py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      <header>
        <Badge variant="outline" className="mb-3 border-primary/30 bg-primary/5 text-primary">
          <Award className="mr-1.5 h-3 w-3" /> Skills Matrix · Fase 2 · Passo 17
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">Matriz de Competências</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mapeie quem domina o quê. Use níveis 1–5 e endossos para descobrir o melhor responsável a cada tarefa.
        </p>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="matrix">Matriz da equipe</TabsTrigger>
          <TabsTrigger value="me">Minhas skills</TabsTrigger>
        </TabsList>

        {/* MATRIZ */}
        <TabsContent value="matrix" className="mt-4 space-y-6">
          {grouped.map((group) => (
            <Card key={group.category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{group.label}</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="sticky left-0 z-10 bg-muted/30 px-4 py-2 text-left font-medium text-muted-foreground">
                        Skill
                      </th>
                      {data.members.map((m) => (
                        <th key={m.id} className="px-2 py-2 text-center font-medium">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="mx-auto flex flex-col items-center gap-1">
                                <Avatar className="h-8 w-8">
                                  {m.avatar_url && <AvatarImage src={m.avatar_url} alt={m.display_name ?? ""} />}
                                  <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                                    {initials(m)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="max-w-[80px] truncate text-[10px] text-muted-foreground">
                                  {m.display_name || m.full_name || "—"}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>{m.full_name || m.email}</TooltipContent>
                          </Tooltip>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {group.skills.map((skill) => (
                      <tr key={skill.id} className="border-b transition-colors hover:bg-muted/20">
                        <td className="sticky left-0 z-10 bg-background px-4 py-2 font-medium">
                          <div className="flex items-center gap-2">
                            {skill.color && (
                              <span
                                aria-hidden
                                className="inline-block h-2 w-2 rounded-full"
                                style={{ backgroundColor: skill.color }}
                              />
                            )}
                            <span>{skill.name}</span>
                          </div>
                        </td>
                        {data.members.map((m) => {
                          const us = usByUserSkill.get(`${m.id}:${skill.id}`);
                          const isMe = user?.id === m.id;
                          return (
                            <td key={m.id} className="px-2 py-2 text-center">
                              {us ? (
                                <div className="flex flex-col items-center gap-1">
                                  <SkillLevelDots level={us.level} size="sm" />
                                  {us.endorsements_count > 0 && (
                                    <span className="text-[10px] text-muted-foreground">
                                      👍 {us.endorsements_count}
                                    </span>
                                  )}
                                  {!isMe && (
                                    <button
                                      onClick={() => endorse.mutate(us.id)}
                                      className="text-[10px] text-primary opacity-0 transition hover:underline group-hover:opacity-100"
                                    >
                                      endossar
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className={cn("text-xs", isMe ? "text-primary" : "text-muted-foreground/30")}>
                                  {isMe ? "+ adicionar" : "—"}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* MINHAS SKILLS */}
        <TabsContent value="me" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-primary" /> Auto-avaliação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {grouped.map((group) => (
                <div key={group.category}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </h3>
                  <div className="grid gap-2">
                    {group.skills.map((skill) => {
                      const my = mySkills.find((x) => x.skill.id === skill.id)?.us;
                      return (
                        <div
                          key={skill.id}
                          className="flex items-center justify-between rounded-md border bg-card px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            {skill.color && (
                              <span
                                aria-hidden
                                className="inline-block h-2 w-2 rounded-full"
                                style={{ backgroundColor: skill.color }}
                              />
                            )}
                            <span className="text-sm font-medium">{skill.name}</span>
                            {my && my.endorsements_count > 0 && (
                              <Badge variant="outline" className="ml-1 text-[10px]">
                                <ThumbsUp className="mr-1 h-3 w-3" /> {my.endorsements_count}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <SkillLevelDots
                              level={my?.level ?? 0}
                              interactive
                              onChange={(level) =>
                                upsert.mutate({ skillId: skill.id, level })
                              }
                            />
                            {my && (
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Remover skill"
                                onClick={() => remove.mutate(my.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}