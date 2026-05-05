import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2, Star, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  useCustomFieldsForTask,
  useUpsertFieldValue,
  type CustomFieldDefinition,
  type ResolvedCustomField,
} from "@/hooks/useCustomFields";
import { useTenantMembers } from "@/hooks/useWorkload";

interface PanelProps {
  taskId: string;
  taskTypeId: string | null | undefined;
  projectId: string | null | undefined;
}

export function CustomFieldsPanel({ taskId, taskTypeId, projectId }: PanelProps) {
  const { fields, isLoading } = useCustomFieldsForTask(taskId, taskTypeId, projectId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!fields.length) {
    return (
      <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        Nenhum campo customizado configurado para esta tarefa.{" "}
        <a href="/app/configuracoes/custom-fields" className="underline">
          Configurar campos
        </a>
        .
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {fields.map((f) => (
        <FieldRow key={f.definition.id} taskId={taskId} field={f} />
      ))}
    </div>
  );
}

interface FieldRowProps {
  taskId: string;
  field: ResolvedCustomField;
}

function FieldRow({ taskId, field }: FieldRowProps) {
  const { definition } = field;
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center gap-2">
        <Label className="text-sm">
          {definition.label}
          {definition.required && <span className="ml-1 text-destructive">*</span>}
        </Label>
        <Badge variant="outline" className="text-[10px]">
          {definition.field_type}
        </Badge>
      </div>
      <FieldRenderer taskId={taskId} field={field} />
      {definition.help_text && (
        <p className="text-xs text-muted-foreground">{definition.help_text}</p>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Renderizador
// ----------------------------------------------------------------------------

interface RendererProps {
  taskId: string;
  field: ResolvedCustomField;
}

export function FieldRenderer({ taskId, field }: RendererProps) {
  const { definition, value } = field;
  const upsert = useUpsertFieldValue();

  // Estado local com debounce de 500ms para inputs livres
  const [local, setLocal] = useState<unknown>(value ?? "");
  const lastSavedRef = useRef<unknown>(value ?? null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocal(value ?? "");
    lastSavedRef.current = value ?? null;
  }, [value]);

  const save = (next: unknown, immediate = false) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const fire = () => {
      if (JSON.stringify(next ?? null) === JSON.stringify(lastSavedRef.current ?? null)) return;
      lastSavedRef.current = next ?? null;
      upsert.mutate({ taskId, definitionId: definition.id, value: next });
    };
    if (immediate) {
      fire();
    } else {
      timeoutRef.current = setTimeout(fire, 500);
    }
  };

  switch (definition.field_type) {
    case "text":
    case "url":
    case "email":
    case "phone": {
      const inputType =
        definition.field_type === "email"
          ? "email"
          : definition.field_type === "url"
            ? "url"
            : definition.field_type === "phone"
              ? "tel"
              : "text";
      return (
        <Input
          type={inputType}
          value={(local as string) ?? ""}
          onChange={(e) => {
            setLocal(e.target.value);
            save(e.target.value);
          }}
          onBlur={() => save(local, true)}
        />
      );
    }

    case "textarea":
      return (
        <Textarea
          rows={3}
          value={(local as string) ?? ""}
          onChange={(e) => {
            setLocal(e.target.value);
            save(e.target.value);
          }}
          onBlur={() => save(local, true)}
        />
      );

    case "number":
    case "currency": {
      const isCurrency = definition.field_type === "currency";
      return (
        <Input
          type="number"
          step={isCurrency ? "0.01" : "any"}
          value={(local as number | string) ?? ""}
          onChange={(e) => {
            const raw = e.target.value;
            const next = raw === "" ? null : Number(raw);
            setLocal(next);
            save(next);
          }}
          onBlur={() => save(local, true)}
        />
      );
    }

    case "date":
    case "datetime": {
      const date = local ? new Date(local as string) : null;
      const fmt = definition.field_type === "datetime" ? "Pp" : "PP";
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, fmt, { locale: ptBR }) : "Selecionar data"}
              {date && (
                <X
                  className="ml-auto h-4 w-4 opacity-60 hover:opacity-100"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setLocal(null);
                    save(null, true);
                  }}
                />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date ?? undefined}
              onSelect={(d) => {
                if (!d) {
                  setLocal(null);
                  save(null, true);
                  return;
                }
                const iso = d.toISOString();
                setLocal(iso);
                save(iso, true);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      );
    }

    case "select": {
      const opts = definition.options ?? [];
      return (
        <Select
          value={(local as string) ?? ""}
          onValueChange={(v) => {
            setLocal(v);
            save(v, true);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {opts.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    case "multi_select":
      return (
        <MultiSelect
          options={definition.options ?? []}
          value={Array.isArray(local) ? (local as string[]) : []}
          onChange={(arr) => {
            setLocal(arr);
            save(arr, true);
          }}
        />
      );

    case "checkbox":
      return (
        <Switch
          checked={Boolean(local)}
          onCheckedChange={(v) => {
            setLocal(v);
            save(v, true);
          }}
        />
      );

    case "rating": {
      const n = Number(local) || 0;
      return (
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                const next = i === n ? 0 : i;
                setLocal(next);
                save(next, true);
              }}
              className="text-muted-foreground hover:text-amber-500"
              aria-label={`${i} estrelas`}
            >
              <Star
                className={cn(
                  "h-5 w-5 transition-colors",
                  i <= n && "fill-amber-400 text-amber-400",
                )}
              />
            </button>
          ))}
        </div>
      );
    }

    case "user":
      return (
        <UserPicker
          value={(local as string | null) ?? null}
          onChange={(v) => {
            setLocal(v);
            save(v, true);
          }}
        />
      );

    case "tag":
      // MVP: campo de texto livre com lista por vírgula. TODO: integrar com tabela `tags`.
      return (
        <Input
          placeholder="Tags separadas por vírgula"
          value={Array.isArray(local) ? (local as string[]).join(", ") : ((local as string) ?? "")}
          onChange={(e) => {
            const arr = e.target.value
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean);
            setLocal(arr);
            save(arr);
          }}
          onBlur={() => save(local, true)}
        />
      );

    case "file":
      // TODO: upload pra storage bucket `attachments`. MVP exibe input desativado.
      return (
        <Button variant="outline" disabled className="w-full justify-start">
          <Upload className="mr-2 h-4 w-4" />
          Upload (em breve)
        </Button>
      );

    case "formula":
      // MVP: readonly. Engine de fórmulas é um TODO separado.
      return (
        <Input
          readOnly
          value={typeof local === "string" || typeof local === "number" ? String(local) : ""}
          placeholder="Fórmula calculada (em breve)"
          className="bg-muted/40"
        />
      );

    default:
      return (
        <Input
          value={typeof local === "string" ? local : JSON.stringify(local ?? "")}
          onChange={(e) => {
            setLocal(e.target.value);
            save(e.target.value);
          }}
          onBlur={() => save(local, true)}
        />
      );
  }
}

// ----------------------------------------------------------------------------
// MultiSelect simples (combobox + badges)
// ----------------------------------------------------------------------------

interface MultiSelectProps {
  options: { value: string; label: string }[];
  value: string[];
  onChange: (next: string[]) => void;
}

function MultiSelect({ options, value, onChange }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => new Set(value), [value]);
  const toggle = (v: string) => {
    const next = new Set(selected);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange(Array.from(next));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start">
            {value.length > 0 ? `${value.length} selecionado(s)` : "Selecionar..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[260px] p-0">
          <Command>
            <CommandInput placeholder="Buscar..." />
            <CommandList>
              <CommandEmpty>Nenhuma opção</CommandEmpty>
              <CommandGroup>
                {options.map((o) => (
                  <CommandItem key={o.value} onSelect={() => toggle(o.value)}>
                    <input
                      type="checkbox"
                      checked={selected.has(o.value)}
                      readOnly
                      className="mr-2"
                    />
                    {o.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((v) => {
            const opt = options.find((o) => o.value === v);
            return (
              <Badge key={v} variant="secondary" className="text-xs">
                {opt?.label ?? v}
                <button
                  type="button"
                  className="ml-1 opacity-60 hover:opacity-100"
                  onClick={() => toggle(v)}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// UserPicker
// ----------------------------------------------------------------------------

interface UserPickerProps {
  value: string | null;
  onChange: (v: string | null) => void;
}

function UserPicker({ value, onChange }: UserPickerProps) {
  const { data: members = [], isLoading } = useTenantMembers();
  const selected = members.find((m) => m.user_id === value);

  if (isLoading) return <Skeleton className="h-9 w-full" />;

  return (
    <Select
      value={value ?? ""}
      onValueChange={(v) => onChange(v || null)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Selecionar usuário">
          {selected ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={selected.avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {(selected.display_name ?? selected.email ?? "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>{selected.display_name ?? selected.email}</span>
            </div>
          ) : null}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {members.map((m) => (
          <SelectItem key={m.user_id} value={m.user_id}>
            {m.display_name ?? m.full_name ?? m.email}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export type { CustomFieldDefinition };
