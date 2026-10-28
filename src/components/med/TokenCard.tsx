import { Clock, Ticket, Users } from "lucide-react";
import { activeToken, estimatedWait, queuePosition, useStore } from "@/lib/store";
import { StatusBadge } from "./ui";

export function TokenCard() {
  const s = useStore((s) => s);
  const t = activeToken(s);
  if (!t) return null;
  const pos = queuePosition(s, t);
  const wait = estimatedWait(s, t);
  return (
    <section aria-label="Your virtual token" className="rounded-2xl bg-primary p-6 text-primary-foreground shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm text-primary-foreground/75"><Ticket className="size-4" aria-hidden />Virtual token</p>
          <p className="mt-1 text-5xl font-bold tracking-tight">#{t.token}</p>
        </div>
        <span className="rounded-full bg-card px-1 py-0.5"><StatusBadge status={t.status} /></span>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-primary-foreground/15 pt-4 text-sm">
        <div><dt className="flex items-center gap-1.5 text-primary-foreground/75"><Users className="size-4" aria-hidden />Position</dt><dd className="text-2xl font-semibold">{t.status === "waiting" ? pos : "Now"}</dd></div>
        <div><dt className="flex items-center gap-1.5 text-primary-foreground/75"><Clock className="size-4" aria-hidden />Est. wait</dt><dd className="text-2xl font-semibold">{t.status === "waiting" ? `${wait} min` : "—"}</dd></div>
      </dl>
    </section>
  );
}
