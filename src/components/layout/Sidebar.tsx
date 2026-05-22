import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSpaceTree } from "@/hooks/useSpaceTree";
import { useWorkspace } from "@/hooks/useWorkspace";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight, ChevronDown, Folder, FolderOpen, Hash, Home, Inbox, Plus, ListChecks } from "lucide-react";
import logoOxy from "@/assets/logo-oxy.png";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function Sidebar() {
  const { data: tree = [], refetch } = useSpaceTree();
  const { tenantId } = useWorkspace();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [openSpace, setOpenSpace] = useState<Record<string, boolean>>({});
  const [openFolder, setOpenFolder] = useState<Record<string, boolean>>({});

  async function addSpace() {
    if (!tenantId) return;
    const name = prompt("Nome do espaço");
    if (!name) return;
    const { error } = await supabase.from("spaces").insert({ tenant_id: tenantId, name });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["space-tree"] });
    refetch();
  }
  async function addList(space_id: string, folder_id: string | null) {
    if (!tenantId) return;
    const name = prompt("Nome da lista");
    if (!name) return;
    const { data, error } = await supabase
      .from("lists")
      .insert({ tenant_id: tenantId, space_id, folder_id, name })
      .select()
      .single();
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["space-tree"] });
    if (data) navigate(`/app/list/${data.id}`);
  }
  async function addFolder(space_id: string) {
    if (!tenantId) return;
    const name = prompt("Nome da pasta");
    if (!name) return;
    const { error } = await supabase.from("folders").insert({ tenant_id: tenantId, space_id, name });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["space-tree"] });
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <img src={logoOxy} alt="O2" className="h-7 w-7" />
        <span className="font-display text-lg font-bold tracking-tight">O2 Growth</span>
      </div>
      <nav className="space-y-1 p-2">
        <NavItem to="/app" icon={<Home className="h-4 w-4" />} label="Início" end />
        <NavItem to="/app/my" icon={<Inbox className="h-4 w-4" />} label="Minhas tarefas" />
      </nav>
      <div className="mt-2 flex items-center justify-between px-4 pb-1 pt-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Espaços</span>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={addSpace} title="Novo espaço">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
        {tree.map((s) => {
          const open = openSpace[s.id] ?? true;
          return (
            <div key={s.id}>
              <div className="group flex items-center gap-1 rounded-md px-2 py-1 text-sm hover:bg-accent">
                <button onClick={() => setOpenSpace((p) => ({ ...p, [s.id]: !open }))} className="flex flex-1 items-center gap-1.5 text-left">
                  {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color ?? "#63F161" }} />
                  <span className="truncate font-medium">{s.name}</span>
                </button>
                <Button size="icon" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => addList(s.id, null)} title="Nova lista">
                  <Plus className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => addFolder(s.id)} title="Nova pasta">
                  <Folder className="h-3 w-3" />
                </Button>
              </div>
              {open && (
                <div className="ml-3 border-l pl-2">
                  {s.folders.map((f) => {
                    const fo = openFolder[f.id] ?? true;
                    return (
                      <div key={f.id}>
                        <button
                          onClick={() => setOpenFolder((p) => ({ ...p, [f.id]: !fo }))}
                          className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-sm hover:bg-accent"
                        >
                          {fo ? <FolderOpen className="h-3.5 w-3.5" /> : <Folder className="h-3.5 w-3.5" />}
                          <span className="truncate">{f.name}</span>
                        </button>
                        {fo && (
                          <div className="ml-3 border-l pl-2">
                            {f.lists.map((l) => (
                              <ListLink key={l.id} id={l.id} name={l.name} />
                            ))}
                            <button onClick={() => addList(s.id, f.id)} className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent">
                              <Plus className="h-3 w-3" /> Nova lista
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {s.lists.map((l) => (
                    <ListLink key={l.id} id={l.id} name={l.name} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {tree.length === 0 && (
          <p className="px-3 py-2 text-xs text-muted-foreground">Nenhum espaço. Clique no <Plus className="inline h-3 w-3" /> acima para criar um.</p>
        )}
      </div>
    </aside>
  );
}

function NavItem({ to, icon, label, end }: { to: string; icon: React.ReactNode; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"}`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

function ListLink({ id, name }: { id: string; name: string }) {
  return (
    <NavLink
      to={`/app/list/${id}`}
      className={({ isActive }) =>
        `flex items-center gap-1.5 rounded-md px-2 py-1 text-sm ${isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"}`
      }
    >
      <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="truncate">{name}</span>
    </NavLink>
  );
}

// suppress unused warning
void Hash;