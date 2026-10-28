import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, CheckCircle2, Clock, RotateCcw, Siren, Stethoscope, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/med/Confirm";
import { EmptyState, PageHeader, Panel, Stat, StatusBadge } from "@/components/med/ui";
import { fmtTime, resetDemo, useStore } from "@/lib/store";

export const Route = createFileRoute("/staff/")({
  head: () => ({ meta: [{ title: "Overview — MedQueue Staff" }, { name: "description", content: "Clinic overview: patients, alerts and appointments." }, { property: "og:title", content: "Overview — MedQueue Staff" }, { property: "og:description", content: "Clinic overview: patients, alerts and appointments." }] }),
  component: Overview,
});

function Overview() {
  const s = useStore((s) => s);
  const live = s.queue.filter((q) => q.status !== "cancelled");
  const count = (st: string) => s.queue.filter((q) => q.status === st).length;
  const pending = s.sos.filter((x) => x.status === "pending");
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = s.appointments.filter((a) => a.date >= today && (a.status === "booked" || a.status === "confirmed")).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).slice(0, 4);
  const nextUp = s.queue.filter((q) => q.status === "waiting").slice(0, 3);
  return (
    <>
      <PageHeader title="Clinic overview" subtitle={new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
        actions={<Confirm title="Reset demo data?" description="All tokens, appointments and SOS alerts in this browser will be replaced with sample data." confirmLabel="Reset" onConfirm={resetDemo} trigger={<Button variant="outline" size="sm"><RotateCcw />Reset demo</Button>} />} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Users} label="Total patients" value={live.length} tint="bg-secondary text-primary" />
        <Stat icon={Clock} label="Waiting" value={count("waiting")} tint="bg-warning/10 text-warning" />
        <Stat icon={Stethoscope} label="In consultation" value={count("in_consultation")} tint="bg-info/10 text-info" />
        <Stat icon={CheckCircle2} label="Completed" value={count("completed")} tint="bg-success/10 text-success" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Pending SOS" className={pending.length ? "border-destructive/40" : ""} action={<Link to="/staff/sos" className="text-sm font-medium text-teal hover:underline">All alerts</Link>}>
          {pending.length ? (
            <ul className="space-y-2">{pending.slice(0, 3).map((x) => (
              <li key={x.id} className="flex items-center gap-3 rounded-lg bg-destructive/10 p-3 text-sm"><Siren className="size-4 text-destructive" aria-hidden /><span className="flex-1 font-medium">{x.patientId}</span><span className="text-muted-foreground">{fmtTime(x.createdAt)}</span></li>
            ))}</ul>
          ) : <EmptyState icon={Siren} title="All clear" text="No pending emergency requests." />}
        </Panel>
        <Panel title="Next in queue" action={<Link to="/staff/queue" className="text-sm font-medium text-teal hover:underline">Manage</Link>}>
          {nextUp.length ? (
            <ul className="divide-y divide-border">{nextUp.map((q) => (
              <li key={q.id} className="flex items-center justify-between py-2.5 text-sm"><span className="font-semibold">#{q.token}</span><span className="text-muted-foreground">{q.patientId}</span><StatusBadge status={q.status} /></li>
            ))}</ul>
          ) : <EmptyState icon={Users} title="Queue empty" text="No patients waiting." />}
        </Panel>
        <Panel title="Upcoming appointments" action={<Link to="/staff/appointments" className="text-sm font-medium text-teal hover:underline">View all</Link>}>
          {upcoming.length ? (
            <ul className="divide-y divide-border">{upcoming.map((a) => (
              <li key={a.id} className="py-2.5 text-sm"><div className="flex justify-between"><span className="font-medium">{a.patientId}</span><span className="text-muted-foreground">{a.date === today ? "Today" : a.date} · {a.time}</span></div><p className="text-muted-foreground">{a.department}</p></li>
            ))}</ul>
          ) : <EmptyState icon={CalendarDays} title="Nothing upcoming" text="No booked appointments." />}
        </Panel>
      </div>
    </>
  );
}
