import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Activity, CalendarDays, CalendarPlus, Siren, Ticket } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Panel, StatusBadge } from "@/components/med/ui";
import { TokenCard } from "@/components/med/TokenCard";
import { STUDENT_ID, activeToken, fmtDateTime, generateToken, useStore } from "@/lib/store";

export const Route = createFileRoute("/student/")({
  head: () => ({ meta: [{ title: "Home — MedQueue Student" }, { name: "description", content: "Your clinic token, appointments and queue status." }, { property: "og:title", content: "Home — MedQueue Student" }, { property: "og:description", content: "Your clinic token, appointments and queue status." }] }),
  component: StudentHome,
});

function StudentHome() {
  const s = useStore((s) => s);
  const nav = useNavigate();
  const token = activeToken(s);
  const now = new Date().toISOString().slice(0, 16);
  const next = s.appointments
    .filter((a) => a.patientId === STUDENT_ID && (a.status === "booked" || a.status === "confirmed") && `${a.date}T${a.time}` >= now)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0];
  const waiting = s.queue.filter((q) => q.status === "waiting").length;
  const inConsult = s.queue.find((q) => q.status === "in_consultation");
  const hour = new Date().getHours();

  return (
    <>
      <PageHeader title={`Good ${hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"}, Aarav`} subtitle={token ? "You’re in the queue — we’ll keep your place." : "Here’s what’s happening at the campus clinic today."} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Button variant="teal" size="lg" className="h-14" disabled={!!token} onClick={() => { const r = generateToken(); r.ok ? toast.success("Token generated") : toast.error(r.error); }}>
          <Ticket />{token ? "Token active" : "Generate Token"}
        </Button>
        <Button variant="outline" size="lg" className="h-14" asChild><Link to="/student/appointments"><CalendarPlus />Book Appointment</Link></Button>
        <Button variant="destructive" size="lg" className="h-14" onClick={() => nav({ to: "/student/sos" })}><Siren />Emergency SOS</Button>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {token ? <TokenCard /> : (
          <Panel title="Virtual token"><EmptyState icon={Ticket} title="No active token" text="Generate a token to join today’s walk-in queue." /></Panel>
        )}
        <Panel title="Next appointment" action={<Link to="/student/appointments" className="text-sm font-medium text-teal hover:underline">View all</Link>}>
          {next ? (
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-secondary p-3 text-teal"><CalendarDays className="size-6" aria-hidden /></div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{next.department}</p>
                <p className="text-sm text-muted-foreground">{new Date(`${next.date}T${next.time}`).toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })} · {next.time}</p>
                <div className="mt-2"><StatusBadge status={next.status} /></div>
              </div>
            </div>
          ) : <EmptyState icon={CalendarDays} title="Nothing booked" text="Book a slot with any clinic department." />}
        </Panel>
        <Panel title="Queue status">
          <dl className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-secondary p-4"><dt className="text-[13px] text-muted-foreground">People waiting</dt><dd className="text-2xl font-bold text-foreground">{waiting}</dd></div>
            <div className="rounded-xl bg-secondary p-4"><dt className="text-[13px] text-muted-foreground">Now serving</dt><dd className="text-2xl font-bold text-foreground">{inConsult ? `#${inConsult.token}` : "—"}</dd></div>
          </dl>
        </Panel>
        <Panel title="Recent activity">
          {s.activity.length ? (
            <ul className="space-y-3">{s.activity.slice(0, 5).map((a) => (
              <li key={a.id} className="flex gap-3 text-sm"><span className="mt-1.5 size-2 shrink-0 rounded-full bg-teal" aria-hidden /><div><p className="text-foreground">{a.text}</p><p className="text-xs text-muted-foreground">{fmtDateTime(a.at)}</p></div></li>
            ))}</ul>
          ) : <EmptyState icon={Activity} title="No activity yet" text="Your tokens, bookings and requests will appear here." />}
        </Panel>
      </div>
    </>
  );
}
