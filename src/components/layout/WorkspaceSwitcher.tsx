import { useNavigate } from "react-router-dom";
import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMyWorkspaces, useSwitchWorkspace } from "@/hooks/useWorkspaces";
import { useWorkspace } from "@/hooks/useWorkspace";

export function WorkspaceSwitcher() {
  const { tenantId } = useWorkspace();
  const { data: ws = [] } = useMyWorkspaces();
  const switchWs = useSwitchWorkspace();
  const navigate = useNavigate();
  const current = ws.find((w) => w.tenant_id === tenantId);

  if (ws.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 max-w-[180px]" aria-label="Trocar workspace">
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="truncate text-sm">{current?.tenant.name ?? "Workspace"}</span>
          <ChevronsUpDown className="h-3 w-3 opacity-60 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Seus workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ws.map((w) => (
          <DropdownMenuItem
            key={w.tenant_id}
            onClick={() => w.tenant_id !== tenantId && switchWs.mutate(w.tenant_id)}
            className="gap-2"
          >
            <div
              className="h-6 w-6 rounded flex items-center justify-center text-white text-xs font-semibold"
              style={{ background: w.tenant.primary_color || "#0ea5e9" }}
            >
              {w.tenant.name.charAt(0).toUpperCase()}
            </div>
            <span className="flex-1 truncate">{w.tenant.name}</span>
            {w.tenant_id === tenantId && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/app/workspaces")}>
          <Plus className="h-4 w-4 mr-2" /> Gerenciar workspaces
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
