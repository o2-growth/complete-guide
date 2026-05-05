import ReactMarkdown from "react-markdown";

interface Config {
  content?: string;
}

export function WidgetMarkdown({ config }: { config: Config }) {
  const content = config.content ?? "";
  if (!content.trim()) {
    return (
      <p className="text-xs text-muted-foreground text-center py-6">
        Edite o widget para adicionar conteúdo Markdown.
      </p>
    );
  }
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
