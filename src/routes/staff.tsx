import { useState } from "react";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { BellOff, CalendarDays, LayoutDashboard, Siren, Users } from "lucide-react";
import { AppShell, useAlarm } from "@/components/med/AppShell";
import { Button } from "@/components/ui/button";
import { fmtTime, useStore } from "@/lib/store";

export const Route = createFileRoute("/staff")({ component: StaffLayout });

function StaffLayout() {
  const pending = useStore((s) => s.sos.filter((x) => x.status === "pending").length);
  const latest = useStore((s) => s.sos.find((x) => x.status === "pending"));
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const overlay = latest && latest.id !== dismissedId;
  useAlarm(pending > 0, muted);

  return (
    <AppShell role="Staff" user={{ name: "Dr. Meera Iyer", id: "STAFF-07" }} notifications={pending}
      nav={[
        { to: "/staff", label: "Overview", icon: LayoutDashboard },
        { to: "/staff/queue", label: "Patient Queue", icon: Users },
        { to: "/staff/appointments", label: "Appointments", icon: CalendarDays },
        { to: "/staff/sos", label: "SOS Alerts", icon: Siren, badge: pending },
      ]}>
      {pending > 0 && (
        <div role="alert" className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <Siren className="size-5" aria-hidden />
          <span className="font-semibold">{pending} pending SOS alert{pending > 1 ? "s" : ""}</span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setMuted((m) => !m)}><BellOff />{muted ? "Unmute alarm" : "Mute alarm"}</Button>
            <Button size="sm" variant="destructive" asChild><Link to="/staff/sos">View alerts</Link></Button>
          </div>
        </div>
      )}
      {overlay && latest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4" role="alertdialog" aria-modal="true" aria-labelledby="sos-title">
          <div className="sos-pulse w-full max-w-md rounded-2xl border-2 border-destructive bg-card p-6 text-center">
            <Siren className="mx-auto mb-3 size-10 text-destructive" aria-hidden />
            <h2 id="sos-title" className="text-xl font-bold text-destructive">Emergency SOS received</h2>
            <p className="mt-2 text-sm text-foreground">Patient <strong>{latest.patientId}</strong> at {fmtTime(latest.createdAt)}</p>
            {latest.note && <p className="mt-1 text-sm text-muted-foreground">“{latest.note}”</p>}
            <div className="mt-5 flex justify-center gap-2">
              <Button variant="outline" onClick={() => setDismissedId(latest.id)}>Dismiss</Button>
              <Button variant="destructive" asChild><Link to="/staff/sos" onClick={() => setDismissedId(latest.id)}>Open SOS Alerts</Link></Button>
            </div>
          </div>
        </div>
      )}
      <Outlet />
    </AppShell>
  );
}
