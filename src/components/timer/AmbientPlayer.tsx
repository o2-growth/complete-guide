import { useEffect, useRef, useState } from "react";
import {
  CloudRain,
  Trees,
  Waves,
  Coffee,
  Flame,
  Wind,
  Music,
  Radio,
  Pause,
  Play,
  Volume2,
  VolumeX,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { AMBIENT_SOUNDS } from "@/lib/ambient-sounds";

const ICON_MAP: Record<string, LucideIcon> = {
  CloudRain,
  Trees,
  Waves,
  Coffee,
  Flame,
  Wind,
  Music,
  Radio,
};

const LS_SOUND = "ambient.lastSoundId";
const LS_VOLUME = "ambient.volume";

interface AmbientPlayerProps {
  className?: string;
  compact?: boolean;
}

export function AmbientPlayer({ className, compact }: AmbientPlayerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(() => {
    if (typeof window === "undefined") return 0.5;
    const v = Number(localStorage.getItem(LS_VOLUME));
    return Number.isFinite(v) && v >= 0 && v <= 1 ? v : 0.5;
  });
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Restaura último som ao montar (mas não toca automaticamente — autoplay bloqueado).
  useEffect(() => {
    const last = localStorage.getItem(LS_SOUND);
    if (last && AMBIENT_SOUNDS.some((s) => s.id === last && s.url)) {
      // Apenas marca seleção; usuário precisa clicar play.
      setActiveId(null);
    }
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = muted ? 0 : volume;
    localStorage.setItem(LS_VOLUME, String(volume));
  }, [volume, muted]);

  const toggleSound = (id: string) => {
    const sound = AMBIENT_SOUNDS.find((s) => s.id === id);
    if (!sound || !sound.url) return;

    if (activeId === id) {
      audioRef.current?.pause();
      setActiveId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(sound.url);
    audio.loop = true;
    audio.volume = muted ? 0 : volume;
    audio.play().catch(() => {
      // Ignora bloqueio de autoplay quando navegador exige interação.
    });
    audioRef.current = audio;
    setActiveId(id);
    localStorage.setItem(LS_SOUND, id);
  };

  // Cleanup ao desmontar.
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  return (
    <div className={cn("space-y-3", className)} aria-label="Sons ambientes">
      <div className={cn("grid gap-2", compact ? "grid-cols-4" : "grid-cols-2 sm:grid-cols-4")}>
        {AMBIENT_SOUNDS.map((s) => {
          const Icon = ICON_MAP[s.icon] ?? Radio;
          const isActive = activeId === s.id;
          const disabled = !s.url;
          return (
            <button
              key={s.id}
              type="button"
              disabled={disabled}
              onClick={() => toggleSound(s.id)}
              className={cn(
                "group flex flex-col items-center justify-center gap-1 rounded-md border p-2 text-xs transition-colors",
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-muted",
                disabled && "cursor-not-allowed opacity-40",
              )}
              aria-pressed={isActive}
              title={disabled ? `${s.label} (em breve)` : s.label}
            >
              <Icon className="h-4 w-4" />
              <span className="leading-tight">{s.label}</span>
              {isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "Ativar som" : "Silenciar"}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
        <Slider
          min={0}
          max={1}
          step={0.05}
          value={[volume]}
          onValueChange={([v]) => setVolume(v)}
          aria-label="Volume"
          className="flex-1"
        />
        <span className="w-9 text-right text-[11px] text-muted-foreground tabular-nums">
          {Math.round(volume * 100)}%
        </span>
      </div>
    </div>
  );
}
