import { useContext } from "react";
import { RichEditorContext } from "./RichEditorContext";

export function useRichEditorContext() {
  return useContext(RichEditorContext);
}
