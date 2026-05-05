import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePushSubscription } from "@/hooks/useDeveloperHub";
import { Smartphone, Bell } from "lucide-react";
import { toast } from "sonner";

export function MobileTab() {
  const { subscribe } = usePushSubscription();
  const [installable, setInstallable] = useState<{ prompt: () => void } | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallable(e as unknown as { prompt: () => void });
    };
    window.addEventListener("beforeinstallprompt", handler);
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Smartphone className="h-5 w-5" />Instalar como app</CardTitle>
          <CardDescription>
            O Oxy funciona como app instalável no seu celular ou desktop, com cache offline básico.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {installed ? (
            <Badge>App instalado neste dispositivo ✓</Badge>
          ) : installable ? (
            <Button onClick={() => installable.prompt()}>Instalar Oxy</Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              No iPhone: Compartilhar → "Adicionar à Tela Inicial". No Android/Chrome: menu → "Instalar app".
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Bell className="h-5 w-5" />Notificações push</CardTitle>
          <CardDescription>
            Receba notificações importantes mesmo quando o Oxy não estiver aberto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={async () => {
            const perm = await Notification.requestPermission();
            if (perm === "granted") subscribe.mutate();
            else toast.error("Permissão de notificação negada");
          }}>
            Ativar notificações neste dispositivo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
