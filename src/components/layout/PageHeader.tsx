import { Fragment, type ReactNode } from "react";
import { ChevronRight, MoreHorizontal, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export interface PageHeaderBreadcrumb {
  label: string;
  to?: string;
}

export interface PageHeaderProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Botões / ações alinhadas à direita. */
  actions?: ReactNode;
  /** Badge ou chip exibido ao lado do título. */
  badge?: ReactNode;
  breadcrumbs?: PageHeaderBreadcrumb[];
  className?: string;
}

/**
 * Cabeçalho único para páginas autenticadas. Padroniza tipografia, ícone,
 * descrição, breadcrumbs e ações para evitar drift visual entre páginas.
 *
 * Mobile: se houver mais de 2 ações, todas colapsam num menu "..." pra evitar
 * overflow horizontal. Em desktop, sempre renderiza inline.
 */
export function PageHeader({
  icon: Icon,
  title,
  description,
  actions,
  badge,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  const isMobile = useIsMobile();

  // Conta filhos válidos pra decidir se colapsa em dropdown no mobile.
  const actionChildren = (() => {
    if (!actions) return [] as ReactNode[];
    if (Array.isArray(actions)) return actions.filter(Boolean) as ReactNode[];
    if (typeof actions === "object" && actions !== null && "props" in actions) {
      const props = (actions as { props?: { children?: ReactNode } }).props;
      const c = props?.children;
      if (c) {
        return Array.isArray(c) ? (c.filter(Boolean) as ReactNode[]) : [c];
      }
    }
    return [actions];
  })();

  const collapseActions = isMobile && actionChildren.length > 2;

  return (
    <header
      className={cn(
        "flex flex-col gap-3 animate-fade-in",
        className,
      )}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Breadcrumbs"
          className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
        >
          {breadcrumbs.map((crumb, i) => {
            const last = i === breadcrumbs.length - 1;
            return (
              <Fragment key={`${crumb.label}-${i}`}>
                {crumb.to && !last ? (
                  <Link
                    to={crumb.to}
                    className="hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={cn(last && "text-foreground")}
                    aria-current={last ? "page" : undefined}
                  >
                    {crumb.label}
                  </span>
                )}
                {!last && (
                  <ChevronRight
                    className="h-3 w-3 text-muted-foreground/60"
                    aria-hidden
                  />
                )}
              </Fragment>
            );
          })}
        </nav>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3 sm:items-center">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
              aria-hidden
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
          )}
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-bold tracking-tight">
                {title}
              </h1>
              {badge}
            </div>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex shrink-0 items-center gap-2">
            {collapseActions ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Mais ações"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="flex flex-col gap-1 p-2">
                  {actionChildren.map((child, i) => (
                    <Fragment key={i}>{child}</Fragment>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              actions
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default PageHeader;
