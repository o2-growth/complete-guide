import { useMemo, useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useTenantMembers } from "@/hooks/useTenantMembers";
import {
  useAddProjectMember,
  useProjectMembers,
  useRemoveProjectMember,
  useUpdateProjectMemberRole,
  type ProjectRole,
} from "@/hooks/useProjectMembers";

const ROLE_LABEL: Record<ProjectRole, string> = {
  owner: "Owner",
  editor: "Editor",
  commenter: "Comentador",
  viewer: "Leitor",
};

interface Props {
  projectId: string;
  projectName: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function ProjectMembersDialog({ projectId, projectName, open, onOpenChange }: Props) {
  const { data: members = [], isLoading } = useProjectMembers(open ? projectId : undefined);
  const { data: tenantMembers = [] } = useTenantMembers();
  const addMember = useAddProjectMember();
  const updateRole = useUpdateProjectMemberRole();
  const removeMember = useRemoveProjectMember();

  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<ProjectRole>("editor");

  const availableUsers = useMemo(() => {
    const taken = new Set(members.map((m) => m.user_id));
    return tenantMembers.filter((u) => !taken.has(u.id));
  }, [tenantMembers, members]);

  const handleAdd = async () => {
    if (!selectedUser) return;
    await addMember.mutateAsync({ project_id: projectId, user_id: selectedUser, role: selectedRole });
    setSelectedUser("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Membros do projeto</DialogTitle>
          <DialogDescription>{projectName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Adicionar pessoa..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      Todos os membros já foram adicionados.
                    </div>
                  ) : (
                    availableUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.display_name || u.full_name || u.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as ProjectRole)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ROLE_LABEL) as ProjectRole[]).map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} disabled={!selectedUser || addMember.isPending}>
              <UserPlus className="mr-1.5 h-4 w-4" /> Adicionar
            </Button>
          </div>

          <div className="rounded-md border">
            {isLoading ? (
              <div className="space-y-2 p-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : members.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Sem membros explícitos. Por padrão, herda permissões do workspace.
              </div>
            ) : (
              <ul className="divide-y">
                {members.map((m) => {
                  const name = m.profile?.display_name || m.profile?.full_name || m.profile?.email || m.user_id.slice(0, 8);
                  const initials = (name ?? "?").slice(0, 2).toUpperCase();
                  return (
                    <li key={m.id} className="flex items-center gap-3 px-3 py-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={m.profile?.avatar_url ?? undefined} />
                        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{name}</p>
                        {m.profile?.email && (
                          <p className="truncate text-[11px] text-muted-foreground">{m.profile.email}</p>
                        )}
                      </div>
                      <Select
                        value={m.role}
                        onValueChange={(v) =>
                          updateRole.mutate({ id: m.id, project_id: projectId, role: v as ProjectRole })
                        }
                      >
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(ROLE_LABEL) as ProjectRole[]).map((r) => (
                            <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeMember.mutate({ id: m.id, project_id: projectId })}
                        aria-label="Remover"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}