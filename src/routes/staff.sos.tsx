import { createFileRoute } from "@tanstack/react-router";
import { Siren } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable, EmptyState, PageHeader, Panel, StatusBadge } from "@/components/med/ui";
import { fmtDateTime, setSosStatus, useStore } from "@/lib/store";

export const Route = createFileRoute("/staff/sos")({
  head: () => ({ meta: [{ title: "SOS Alerts — MedQueue Staff" }, { name: "description", content: "Respond to emergency requests." }, { property: "og:title", content: "SOS Alerts — MedQueue Staff" }, { property: "og:description", content: "Respond to emergency requests." }] }),
  component: StaffSos,
});

function StaffSos() {
  const sos = useStore((s) => s.sos);
  const rows = [...sos].sort((a, b) => (a.status === "pending" ? -1 : 0) - (b.status === "pending" ? -1 : 0) || b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <PageHeader title="SOS alerts" subtitle={`${sos.filter((x) => x.status === "pending").length} pending`} />
      <Panel>
        {rows.length ? (
          <DataTable rows={rows} rowKey={(x) => x.id} highlight={(x) => x.status === "pending"} cols={[
            { h: "Received", cell: (x) => <span className="flex items-center gap-2">{x.status === "pending" && <Siren className="size-4 text-destructive" aria-hidden />}{fmtDateTime(x.createdAt)}</span> },
            { h: "Patient", cell: (x) => <span className="font-medium">{x.patientId}</span> },
            { h: "Details", cell: (x) => x.note || <span className="text-muted-foreground">—</span> },
            { h: "Status", cell: (x) => <StatusBadge status={x.status} /> },
            { h: "Action", cell: (x) => x.status === "pending"
              ? <Button size="sm" variant="destructive" onClick={() => { setSosStatus(x.id, "acknowledged"); toast.success(`Acknowledged ${x.patientId}`); }}>Acknowledge</Button>
              : x.status === "acknowledged"
                ? <Button size="sm" variant="outline" onClick={() => setSosStatus(x.id, "resolved")}>Mark resolved</Button>
                : <span className="text-muted-foreground">—</span> },
          ]} />
        ) : <EmptyState icon={Siren} title="No alerts" text="Emergency requests from students will appear here instantly." />}
      </Panel>
    </>
  );
}
