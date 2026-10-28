import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, HeartPulse, LogOut, Menu, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem { to: string; label: string; icon: LucideIcon; badge?: number }

export function AppShell({ nav, user, role, notifications = 0, children }: {
  nav: NavItem[]; user: { name: string; id: string }; role: string; notifications?: number; children: ReactNode;
}) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const current = [...nav].sort((a, b) => b.to.length - a.to.length).find((n) => path === n.to || path.startsWith(n.to + "/"));

  const NavLinks = () => (
    <nav aria-label={`${role} navigation`} className="flex-1 space-y-1 px-3">
      {nav.map((n) => {
        const active = current?.to === n.to;
        return (
          <Link key={n.to} to={n.to} aria-current={active ? "page" : undefined}
            className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-border")}>
            <n.icon className={cn("size-[18px]", active && "text-teal")} aria-hidden />
            <span className="flex-1">{n.label}</span>
            {!!n.badge && <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">{n.badge}<span className="sr-only"> pending</span></span>}
          </Link>
        );
      })}
    </nav>
  );

  const Sidebar = () => (
    <div className="flex h-full flex-col bg-sidebar py-5">
      <Link to="/" className="mb-8 flex items-center gap-2 px-6 text-lg font-bold text-primary-foreground">
        <span className="rounded-lg bg-teal p-1.5"><HeartPulse className="size-5" aria-hidden /></span> MedQueue
      </Link>
      <p className="mb-2 px-6 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">{role}</p>
      <NavLinks />
      <div className="mx-3 mt-4 flex items-center gap-3 rounded-lg border border-sidebar-border p-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-teal text-sm font-semibold text-teal-foreground">{user.name[0]}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-primary-foreground">{user.name}</p>
          <p className="truncate text-xs text-sidebar-foreground/70">{user.id}</p>
        </div>
        <Link to="/" aria-label="Sign out" className="rounded-md p-1.5 text-sidebar-foreground hover:bg-sidebar-border"><LogOut className="size-4" /></Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-60 md:block"><Sidebar /></aside>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-foreground/40" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="relative h-full w-64"><Sidebar /></div>
        </div>
      )}
      <div className="md:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur md:px-8">
          <button className="rounded-md p-2 md:hidden" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((o) => !o)}>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <p className="text-sm text-muted-foreground"><span className="hidden sm:inline">{role} / </span><span className="font-medium text-foreground">{current?.label}</span></p>
          <div className="ml-auto flex items-center gap-3">
            <span className="relative rounded-full p-2 text-muted-foreground" aria-label={`${notifications} notifications`} role="status">
              <Bell className="size-5" aria-hidden />
              {notifications > 0 && <span className="absolute right-1 top-1 size-2.5 rounded-full bg-destructive" />}
            </span>
            <div className="flex size-8 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-primary">{user.name[0]}</div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-4 pb-24 md:p-8">{children}</main>
      </div>
      {/* Mobile bottom nav */}
      <nav aria-label="Quick navigation" className="fixed inset-x-0 bottom-0 z-30 grid border-t border-border bg-card md:hidden" style={{ gridTemplateColumns: `repeat(${nav.length}, 1fr)` }}>
        {nav.map((n) => (
          <Link key={n.to} to={n.to} className={cn("relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium", current?.to === n.to ? "text-teal" : "text-muted-foreground")}>
            <n.icon className="size-5" aria-hidden />{n.label.split(" ")[0]}
            {!!n.badge && <span className="absolute right-[30%] top-1 size-2 rounded-full bg-destructive" />}
          </Link>
        ))}
      </nav>
    </div>
  );
}

/** Plays a short beep loop while `active`; browser may block until user interacts. */
export function useAlarm(active: boolean, muted: boolean) {
  const ref = useRef<{ ctx: AudioContext; t: number } | null>(null);
  useEffect(() => {
    if (!active || muted) return;
    let ctx: AudioContext;
    try { ctx = new AudioContext(); } catch { return; }
    const beep = () => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = 880; g.gain.value = 0.08; o.connect(g).connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + 0.25);
    };
    beep();
    const t = window.setInterval(beep, 1500);
    ref.current = { ctx, t };
    return () => { clearInterval(t); ctx.close().catch(() => {}); };
  }, [active, muted]);
}
