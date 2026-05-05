import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, UserCircle2, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useTenantMembers, useUserWorkload } from "@/hooks/useWorkload";
import { WorkloadBadge } from "@/components/workload/WorkloadBadge";

function initials(name?: string | null, email?: string | null) {
  const s = (name || email || "?").trim();
  return s
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

interface AssigneePickerProps {
  value: string | null;
  onChange: (userId: string | null) => void;
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
}

/**
 * Seletor de responsável com badge de carga ao lado de cada candidato.
 * O consumidor pode reagir à carga do escolhido via `useUserWorkload`
 * + `warnIfOverload` (em `assignee-utils.ts`).
 */
export function AssigneePicker({
  value,
  onChange,
  size = "sm",
  className,
  disabled,
}: AssigneePickerProps) {
  const { data: members = [], isLoading } = useTenantMembers();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = useMemo(
    () => members.find((m) => m.user_id === value) ?? null,
    [members, value],
  );

  // Pré-carrega a carga do candidato confirmado (para tooltip).
  const selectedWorkload = useUserWorkload(selected?.user_id ?? null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      const name = (m.display_name || m.full_name || m.email || "").toLowerCase();
      return name.includes(q);
    });
  }, [members, search]);

  const closePicker = () => {
    setOpen(false);
    setSearch("");
  };

  const handleClear = () => {
    onChange(null);
    closePicker();
  };

  const handlePick = (userId: string) => {
    onChange(userId);
    closePicker();
  };

  return (
    <Popover open={open} onOpenChange={(o) => !disabled && setOpen(o)}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-8 w-full justify-between font-normal",
            size === "md" && "h-9",
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            {selected ? (
              <>
                <Avatar className="h-5 w-5">
                  <AvatarImage src={selected.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[9px]">
                    {initials(selected.display_name ?? selected.full_name, selected.email)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">
                  {selected.display_name ?? selected.full_name ?? selected.email ?? "Sem nome"}
                </span>
                {selectedWorkload.data && (
                  <WorkloadBadge userId={selected.user_id} className="ml-1" />
                )}
              </>
            ) : (
              <>
                <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Sem responsável</span>
              </>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar pessoa…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Carregando…" : "Nenhuma pessoa encontrada"}
            </CommandEmpty>
            {value && (
              <CommandGroup>
                <CommandItem
                  value="__clear__"
                  onSelect={handleClear}
                  className="text-muted-foreground"
                >
                  <X className="mr-2 h-3.5 w-3.5" />
                  Remover responsável
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup heading="Pessoas do workspace">
              {filtered.map((m) => (
                <AssigneeRow
                  key={m.user_id}
                  userId={m.user_id}
                  name={m.display_name ?? m.full_name ?? m.email ?? "Sem nome"}
                  email={m.email}
                  avatarUrl={m.avatar_url}
                  selected={m.user_id === value}
                  onSelect={() => handlePick(m.user_id)}
                />
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function AssigneeRow({
  userId,
  name,
  email,
  avatarUrl,
  selected,
  onSelect,
}: {
  userId: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <CommandItem
      value={`${name} ${email ?? ""}`}
      onSelect={onSelect}
      className="flex items-center gap-2"
    >
      <Avatar className="h-6 w-6">
        <AvatarImage src={avatarUrl ?? undefined} />
        <AvatarFallback className="text-[10px]">{initials(name, email)}</AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1 truncate text-sm">{name}</span>
      <WorkloadBadge userId={userId} />
      {selected && <Check className="ml-1 h-3.5 w-3.5 text-primary" />}
    </CommandItem>
  );
}

