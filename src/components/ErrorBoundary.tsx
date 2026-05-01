import { Component, ErrorInfo, ReactNode } from "react";
import { reportError } from "@/hooks/useErrorTracking";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, { componentStack: info.componentStack });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center" role="alert">
          <AlertTriangle className="h-12 w-12 text-destructive" aria-hidden />
          <h2 className="text-xl font-semibold">Algo deu errado</h2>
          <p className="max-w-md text-sm text-muted-foreground">{this.state.error.message}</p>
          <Button onClick={() => { this.setState({ error: null }); window.location.reload(); }}>
            Recarregar
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
