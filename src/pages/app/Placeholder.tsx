import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction } from "lucide-react";

interface PlaceholderProps {
  title: string;
  description: string;
  step: number;
}

export default function Placeholder({ title, description, step }: PlaceholderProps) {
  return (
    <div className="container py-10">
      <div className="mx-auto max-w-3xl">
        <Badge variant="outline" className="mb-4 border-primary/30 bg-primary/5 text-primary">
          Em construção · Passo {step}/16
        </Badge>
        <h1 className="mb-2 text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mb-8 text-muted-foreground">{description}</p>

        <Card className="flex flex-col items-center justify-center gap-3 border-dashed p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Construction className="h-6 w-6" />
          </div>
          <p className="text-sm text-muted-foreground">
            Esta tela será entregue no Passo {step} do roadmap.
          </p>
        </Card>
      </div>
    </div>
  );
}