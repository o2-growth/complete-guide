import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import "@excalidraw/excalidraw/index.css";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/useTheme";
import {
  useWhiteboard,
  useUpdateWhiteboardSnapshot,
  type WhiteboardSnapshot,
} from "@/hooks/useWhiteboards";

// Lazy import — bundle do Excalidraw fica em chunk próprio (manualChunks).
const Excalidraw = lazy(() =>
  import("@excalidraw/excalidraw").then((m) => ({ default: m.Excalidraw })),
);

type ExcalidrawChangePayload = {
  elements: readonly unknown[];
  appState: Record<string, unknown>;
  files: Record<string, unknown>;
};

const SAVE_DEBOUNCE_MS = 2000;

export default function WhiteboardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { data: board, isLoading } = useWhiteboard(id);
  const updateSnapshot = useUpdateWhiteboardSnapshot();

  const [name, setName] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSnapshotRef = useRef<WhiteboardSnapshot | null>(null);
  const lastSerializedRef = useRef<string>("");

  useEffect(() => {
    if (board) {
      setName(board.name);
      lastSerializedRef.current = JSON.stringify(board.snapshot);
    }
  }, [board?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const flushSave = useCallback(() => {
    if (!id || !pendingSnapshotRef.current) return;
    const snap = pendingSnapshotRef.current;
    pendingSnapshotRef.current = null;
    updateSnapshot.mutate(
      { id, snapshot: snap },
      {
        onSuccess: () => setSavedAt(new Date()),
      },
    );
  }, [id, updateSnapshot]);

  // Persist pendência ao desmontar/sair.
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      if (pendingSnapshotRef.current && id) {
        const snap = pendingSnapshotRef.current;
        pendingSnapshotRef.current = null;
        updateSnapshot.mutate({ id, snapshot: snap });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = useCallback(
    (
      elements: ExcalidrawChangePayload["elements"],
      appState: ExcalidrawChangePayload["appState"],
      files: ExcalidrawChangePayload["files"],
    ) => {
      const snap: WhiteboardSnapshot = {
        elements: elements as unknown[],
        // appState do Excalidraw inclui flags voláteis (collaborators, cursores etc.) —
        // deixamos passar; a engine sabe ignorar ao restaurar.
        appState: appState as Record<string, unknown>,
        files: files as Record<string, unknown>,
      };
      const serialized = JSON.stringify(snap);
      if (serialized === lastSerializedRef.current) return;
      lastSerializedRef.current = serialized;
      pendingSnapshotRef.current = snap;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(flushSave, SAVE_DEBOUNCE_MS);
    },
    [flushSave],
  );

  const handleNameBlur = () => {
    if (!id) return;
    const trimmed = name.trim() || "Sem título";
    if (board && trimmed !== board.name) {
      const snap = pendingSnapshotRef.current ?? board.snapshot;
      updateSnapshot.mutate({ id, snapshot: snap, name: trimmed });
    }
  };

  const initialData = useMemo(() => {
    if (!board) return null;
    return {
      elements: board.snapshot.elements as never,
      appState: board.snapshot.appState as never,
      files: board.snapshot.files as never,
      scrollToContent: true,
    };
  }, [board?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="space-y-4 p-6">
        <SEO title="Whiteboard não encontrado" noIndex />
        <Button variant="ghost" onClick={() => navigate("/app/whiteboards")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <p className="text-muted-foreground">Whiteboard não encontrado ou sem acesso.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <SEO title={board.name} description="Canvas livre Oxy." noIndex />

      <header className="flex shrink-0 items-center gap-3 border-b bg-background px-4 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/app/whiteboards")}
          aria-label="Voltar"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleNameBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="h-8 max-w-md border-0 bg-transparent px-0 text-base font-semibold shadow-none focus-visible:ring-0"
          aria-label="Nome do whiteboard"
        />
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          {updateSnapshot.isPending ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando…
            </span>
          ) : savedAt ? (
            <span className="inline-flex items-center gap-1">
              <Save className="h-3.5 w-3.5" /> Salvo às{" "}
              {savedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          ) : (
            <span>Auto-save a cada 2s</span>
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          }
        >
          {initialData && (
            <Excalidraw
              initialData={initialData}
              // O onChange do Excalidraw expõe tipos internos (OrderedExcalidrawElement,
              // AppState, BinaryFiles); usamos um shape genérico equivalente — cast OK.
              onChange={handleChange as unknown as ComponentProps<typeof Excalidraw>["onChange"]}
              theme={theme === "dark" ? "dark" : "light"}
              langCode="pt-BR"
              name={board.name}
            />
          )}
        </Suspense>
      </div>
    </div>
  );
}
