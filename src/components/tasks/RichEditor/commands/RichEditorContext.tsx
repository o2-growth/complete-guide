import { createContext } from "react";
import type { TaskRow } from "@/hooks/useTasks";

export interface RichEditorContextValue {
  task: TaskRow | null;
}

// eslint-disable-next-line react-refresh/only-export-components -- Context + Provider em um único arquivo seguindo padrão dos outros providers do projeto.
export const RichEditorContext = createContext<RichEditorContextValue>({ task: null });

export const RichEditorContextProvider = RichEditorContext.Provider;
