import { Fragment, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { label } from "@/lib/store";

export function Panel({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card p-5 shadow-card md:p-6", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-lg font-semibold text-foreground md:text-xl">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-[30px]">{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] text-muted-foreground">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

const tone: Record<string, string> = {
  waiting: "bg-warning/10 text-warning border-warning/30",
  booked: "bg-info/10 text-info border-info/30",
  in_consultation: "bg-info/10 text-info border-info/30",
  confirmed: "bg-secondary text-teal-hover border-teal/30",
  acknowledged: "bg-info/10 text-info border-info/30",
  completed: "bg-success/10 text-success border-success/30",
  resolved: "bg-success/10 text-success border-success/30",
  cancelled: "bg-muted text-muted-foreground border-border",
  pending: "bg-destructive/10 text-destructive border-destructive/30",
};
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize", tone[status] ?? tone["cancelled"])}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {label(status)}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-10 text-center">
      <div className="mb-3 rounded-full bg-secondary p-3 text-teal"><Icon className="size-6" aria-hidden /></div>
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Stat({ icon: Icon, label, value, tint }: { icon: LucideIcon; label: string; value: number | string; tint: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className={cn("mb-3 inline-flex rounded-lg p-2", tint)}><Icon className="size-5" aria-hidden /></div>
      <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
}

export function Field({ id, label, required, error, children }: { id: string; label: string; required?: boolean; error?: string | undefined; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-destructive" aria-hidden>*</span>}
        {required && <span className="sr-only">(required)</span>}
      </label>
      {children}
      {error && <p id={`${id}-err`} role="alert" className="text-[13px] text-destructive">{error}</p>}
    </div>
  );
}

export const inputCls = "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring aria-[invalid=true]:border-destructive";

/** Table on desktop, stacked cards on mobile. */
export function DataTable<T>({ rows, cols, rowKey, highlight }: {
  rows: T[]; rowKey: (r: T) => string; highlight?: (r: T) => boolean;
  cols: { h: string; cell: (r: T) => ReactNode }[];
}) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-border text-[13px] text-muted-foreground">{cols.map((c) => <th key={c.h} scope="col" className="px-3 py-3 font-medium">{c.h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={rowKey(r)} className={cn("border-b border-border last:border-0", highlight?.(r) && "bg-destructive/5")}>
                {cols.map((c) => <td key={c.h} className="px-3 py-3 align-middle">{c.cell(r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-3 md:hidden">
        {rows.map((r) => (
          <li key={rowKey(r)} className={cn("rounded-xl border border-border p-4", highlight?.(r) && "border-destructive/40 bg-destructive/5")}>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              {cols.map((c) => (<Fragment key={c.h}><dt className="text-muted-foreground">{c.h}</dt><dd className="min-w-0 break-words">{c.cell(r)}</dd></Fragment>))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
