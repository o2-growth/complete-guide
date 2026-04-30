import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { IgFeedPreview } from "./IgFeedPreview";
import { IgStoryPreview } from "./IgStoryPreview";
import { IgReelPreview } from "./IgReelPreview";
import { LinkedInPreview } from "./LinkedInPreview";
import { EmailPreview } from "./EmailPreview";
import { PreviewContent, PreviewKind, PREVIEW_LABELS } from "./preview-utils";

interface Props {
  content: PreviewContent;
  defaultKind?: PreviewKind;
  showSwitcher?: boolean;
}

export function PreviewSwitcher({ content, defaultKind, showSwitcher = true }: Props) {
  const [kind, setKind] = useState<PreviewKind>(defaultKind ?? content.kind);
  const current: PreviewContent = { ...content, kind };

  return (
    <div className="flex flex-col items-center gap-4">
      {showSwitcher && (
        <ToggleGroup
          type="single"
          value={kind}
          onValueChange={(v) => v && setKind(v as PreviewKind)}
          className="flex-wrap justify-center"
        >
          {(Object.keys(PREVIEW_LABELS) as PreviewKind[]).map((k) => (
            <ToggleGroupItem key={k} value={k} className="text-xs">
              {PREVIEW_LABELS[k]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
      <div className="flex w-full justify-center">
        {kind === "ig_feed" && <IgFeedPreview content={current} />}
        {kind === "ig_story" && <IgStoryPreview content={current} />}
        {kind === "ig_reel" && <IgReelPreview content={current} />}
        {kind === "linkedin" && <LinkedInPreview content={current} />}
        {kind === "email" && <EmailPreview content={current} />}
      </div>
    </div>
  );
}
