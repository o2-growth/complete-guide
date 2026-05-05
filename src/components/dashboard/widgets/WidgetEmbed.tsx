interface Config {
  url?: string;
}

export function WidgetEmbed({ config }: { config: Config }) {
  const url = (config.url ?? "").trim();
  // Whitelist defensiva: só protocolo https.
  if (!url || !url.startsWith("https://")) {
    return (
      <p className="text-xs text-muted-foreground text-center py-6">
        Configure uma URL https para embed.
      </p>
    );
  }
  return (
    <iframe
      src={url}
      title="Embed"
      className="w-full h-full min-h-[200px] border-0 rounded"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      referrerPolicy="no-referrer"
    />
  );
}
