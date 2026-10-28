import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { DataTable, EmptyState, PageHeader, Panel, StatusBadge, inputCls } from "@/components/med/ui";
import { DEPARTMENTS, setApptStatus, useStore, type ApptStatus } from "@/lib/store";

export const Route = createFileRoute("/staff/appointments")({
  head: () => ({ meta: [{ title: "Appointments — MedQueue Staff" }, { name: "description", content: "Manage all clinic appointments." }, { property: "og:title", content: "Appointments — MedQueue Staff" }, { property: "og:description", content: "Manage all clinic appointments." }] }),
  component: StaffAppts,
});

const STATUSES: ApptStatus[] = ["booked", "confirmed", "completed", "cancelled"];

function StaffAppts() {
  const all = useStore((s) => s.appointments);
  const [st, setSt] = useState("all");
  const [dept, setDept] = useState("all");
  const rows = all.filter((a) => (st === "all" || a.status === st) && (dept === "all" || a.department === dept))
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  return (
    <>
      <PageHeader title="Appointments" subtitle={`${all.filter((a) => a.status === "booked").length} awaiting confirmation`} />
      <Panel>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <label className="sm:w-52"><span className="sr-only">Filter by status</span>
            <select className={`${inputCls} capitalize`} value={st} onChange={(e) => setSt(e.target.value)}><option value="all">All statuses</option>{STATUSES.map((x) => <option key={x}>{x}</option>)}</select>
          </label>
          <label className="sm:w-56"><span className="sr-only">Filter by department</span>
            <select className={inputCls} value={dept} onChange={(e) => setDept(e.target.value)}><option value="all">All departments</option>{DEPARTMENTS.map((x) => <option key={x}>{x}</option>)}</select>
          </label>
        </div>
        {rows.length ? (
          <DataTable rows={rows} rowKey={(a) => a.id} cols={[
            { h: "Patient", cell: (a) => <span className="font-medium">{a.patientId}</span> },
            { h: "Date", cell: (a) => a.date },
            { h: "Time", cell: (a) => a.time },
            { h: "Department", cell: (a) => a.department },
            { h: "Status", cell: (a) => <StatusBadge status={a.status} /> },
            { h: "Update", cell: (a) => (
              <select aria-label={`Update status for ${a.patientId} at ${a.time}`} className={`${inputCls} h-9 w-36 capitalize`} value={a.status} onChange={(e) => setApptStatus(a.id, e.target.value as ApptStatus)}>
                {STATUSES.map((x) => <option key={x}>{x}</option>)}
              </select>
            ) },
          ]} />
        ) : <EmptyState icon={CalendarDays} title="No appointments" text="Nothing matches these filters." />}
      </Panel>
    </>
  );
}
