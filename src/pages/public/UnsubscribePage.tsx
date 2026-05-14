import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type State = "loading" | "valid" | "already" | "invalid" | "submitting" | "done" | "error";

export default function UnsubscribePage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [state, setState] = useState<State>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const r = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: ANON } },
        );
        const data = await r.json();
        if (!r.ok) {
          setState("invalid");
          return;
        }
        if (data.valid === false && data.reason === "already_unsubscribed") {
          setState("already");
        } else if (data.valid) {
          setState("valid");
        } else {
          setState("invalid");
        }
      } catch (e) {
        setState("error");
        setErrorMsg(e instanceof Error ? e.message : "Erro");
      }
    })();
  }, [token]);

  const confirm = async () => {
    setState("submitting");
    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
      body: { token },
    });
    if (error) {
      setState("error");
      setErrorMsg(error.message);
      return;
    }
    if (data?.success || data?.reason === "already_unsubscribed") setState("done");
    else setState("error");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Cancelar inscrição de e-mails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {state === "loading" && <p>Validando link…</p>}
          {state === "invalid" && <p className="text-destructive">Link inválido ou expirado.</p>}
          {state === "already" && <p>Você já está com a inscrição cancelada.</p>}
          {state === "valid" && (
            <>
              <p>Confirme para parar de receber e-mails deste app.</p>
              <Button onClick={confirm} className="w-full">Confirmar cancelamento</Button>
            </>
          )}
          {state === "submitting" && <p>Processando…</p>}
          {state === "done" && <p>Pronto! Você não receberá mais e-mails.</p>}
          {state === "error" && <p className="text-destructive">Erro: {errorMsg}</p>}
        </CardContent>
      </Card>
    </div>
  );
}