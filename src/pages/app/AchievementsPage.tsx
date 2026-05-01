import { Trophy, Flame, Star, Sparkles, Lock, Award, Crown, CheckCircle, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAchievements, useMyAchievements, useMyXp, useLeaderboard } from "@/hooks/useGamification";
import { SEO } from "@/components/SEO";

const ICONS: Record<string, typeof Trophy> = { Trophy, Flame, Star, Sparkles, Award, Crown, CheckCircle, Zap };

const RARITY_COLOR: Record<string, string> = {
  common: "border-muted-foreground/30 bg-muted/30",
  rare: "border-primary/40 bg-primary/5",
  epic: "border-accent/50 bg-accent/10",
  legendary: "border-warning/60 bg-warning/10",
};

export default function AchievementsPage() {
  const { data: achievements = [] } = useAchievements();
  const { data: mine = [] } = useMyAchievements();
  const { data: xp } = useMyXp();
  const { data: leaderboard = [] } = useLeaderboard();

  const unlockedIds = new Set(mine.map((m) => m.achievement_id));
  const xpTotal = xp?.xp_total ?? 0;
  const level = xp?.level ?? 1;
  const nextLevelXp = level * 100;
  const progressPct = Math.min(100, (xpTotal % 100));

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl space-y-6">
      <SEO title="Conquistas e XP — Oxy" description="Acompanhe seu progresso, streaks e ranking" />
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Conquistas & Ranking</h1>
        <p className="text-muted-foreground mt-1">Suba de nível, mantenha streaks e desbloqueie badges.</p>
      </header>

      {/* Stats user */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Star className="h-3 w-3" /> Nível</div>
          <p className="text-3xl font-bold">{level}</p>
          <Progress value={progressPct} className="mt-2 h-1.5" />
          <p className="text-[10px] text-muted-foreground mt-1">{xpTotal} / {nextLevelXp} XP</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Sparkles className="h-3 w-3" /> XP Total</div>
          <p className="text-3xl font-bold">{xpTotal}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Flame className="h-3 w-3 text-warning" /> Streak atual</div>
          <p className="text-3xl font-bold">{xp?.current_streak ?? 0} <span className="text-base font-normal text-muted-foreground">dias</span></p>
          <p className="text-[10px] text-muted-foreground mt-1">Recorde: {xp?.longest_streak ?? 0}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Trophy className="h-3 w-3" /> Conquistas</div>
          <p className="text-3xl font-bold">{mine.length}<span className="text-base font-normal text-muted-foreground">/{achievements.length}</span></p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Achievements grid */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-lg font-semibold">Badges</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {achievements.map((a) => {
              const Icon = ICONS[a.icon ?? "Trophy"] ?? Trophy;
              const unlocked = unlockedIds.has(a.id);
              return (
                <Card key={a.id} className={`p-3 ${RARITY_COLOR[a.rarity]} ${unlocked ? "" : "opacity-60"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`rounded-lg p-2 ${unlocked ? "bg-primary/20" : "bg-muted"}`}>
                      {unlocked ? <Icon className="h-5 w-5 text-primary" /> : <Lock className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <p className="font-medium text-sm truncate">{a.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>
                      <div className="mt-1.5 flex items-center gap-1">
                        <Badge variant="outline" className="text-[10px] capitalize">{a.rarity}</Badge>
                        {a.xp_reward > 0 && <Badge variant="secondary" className="text-[10px]">+{a.xp_reward} XP</Badge>}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Leaderboard */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Ranking do workspace</h2>
          <Card className="p-3 space-y-2">
            {leaderboard.length === 0 && <p className="text-xs text-muted-foreground p-2">Ainda sem ranking — comece a ganhar XP!</p>}
            {leaderboard.map((u, i) => (
              <div key={u.user_id} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50">
                <span className="w-6 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
                <Avatar className="h-7 w-7"><AvatarImage src={u.avatar_url ?? undefined} /><AvatarFallback>{(u.display_name ?? "?")[0]}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.display_name ?? "Sem nome"}</p>
                  <p className="text-[10px] text-muted-foreground">Nv {u.level} • 🔥{u.current_streak}d • 🏆{u.achievements_count}</p>
                </div>
                <Badge variant="secondary" className="text-xs">{u.xp_total} XP</Badge>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}