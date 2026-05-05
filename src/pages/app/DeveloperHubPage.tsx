import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, Webhook, MessageSquare, Smartphone } from "lucide-react";
import { ApiTokensTab } from "./_components/developer-hub/ApiTokensTab";
import { WebhooksTab } from "./_components/developer-hub/WebhooksTab";
import { ChatIntegrationsTab } from "./_components/developer-hub/ChatIntegrationsTab";
import { MobileTab } from "./_components/developer-hub/MobileTab";

export default function DeveloperHubPage() {
  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Code2 className="h-6 w-6" />
          Developer Hub
        </h1>
        <p className="text-sm text-muted-foreground">
          API pública, webhooks, integrações de chat e app mobile.
        </p>
      </div>

      <Tabs defaultValue="api">
        <TabsList>
          <TabsTrigger value="api"><Code2 className="h-4 w-4 mr-1" />API</TabsTrigger>
          <TabsTrigger value="webhooks"><Webhook className="h-4 w-4 mr-1" />Webhooks</TabsTrigger>
          <TabsTrigger value="chat"><MessageSquare className="h-4 w-4 mr-1" />Chat</TabsTrigger>
          <TabsTrigger value="mobile"><Smartphone className="h-4 w-4 mr-1" />Mobile</TabsTrigger>
        </TabsList>
        <TabsContent value="api" className="mt-4"><ApiTokensTab /></TabsContent>
        <TabsContent value="webhooks" className="mt-4"><WebhooksTab /></TabsContent>
        <TabsContent value="chat" className="mt-4"><ChatIntegrationsTab /></TabsContent>
        <TabsContent value="mobile" className="mt-4"><MobileTab /></TabsContent>
      </Tabs>
    </div>
  );
}
