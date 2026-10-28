import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Phone, Siren } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/med/Confirm";
import { EmptyState, Field, PageHeader, Panel, StatusBadge, inputCls } from "@/components/med/ui";
import { STUDENT_ID, fmtDateTime, raiseSos, useStore } from "@/lib/store";

export const Route = createFileRoute("/student/sos")({
  head: () => ({ meta: [{ title: "Emergency SOS — MedQueue Student" }, { name: "description", content: "Request urgent help from clinic staff." }, { property: "og:title", content: "Emergency SOS — MedQueue Student" }, { property: "og:description", content: "Request urgent help from clinic staff." }] }),
  component: Sos,
});

function Sos() {
  const sos = useStore((s) => s.sos);
  const mine = sos.filter((x) => x.patientId === STUDENT_ID);
  const pending = mine.find((x) => x.status === "pending");
  const [note, setNote] = useState("");
  return (
    <>
      <PageHeader title="Emergency SOS" subtitle="Alert clinic staff that you need urgent help." />
      <p className="mb-6 flex gap-2 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-foreground">
        <AlertTriangle className="size-5 shrink-0 text-warning" aria-hidden />
        <span><strong>Demo only.</strong> These alerts are not connected to real emergency services. In a real emergency, call your local emergency number <Phone className="inline size-3.5" aria-hidden /> 112.</span>
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Send an SOS request">
          <div className="space-y-4">
            <Field id="note" label="What’s happening? (optional)">
              <input id="note" maxLength={200} className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Severe allergic reaction, Hostel B" />
            </Field>
            <Confirm title="Send emergency SOS?" description="Clinic staff will be alerted immediately with your student ID." confirmLabel="Send SOS"
              onConfirm={() => { const r = raiseSos(note); r.ok ? (toast.success("SOS sent to clinic staff"), setNote("")) : toast.error(r.error); }}
              trigger={<Button variant="destructive" size="lg" disabled={!!pending} className="sos-pulse h-16 w-full text-base"><Siren className="!size-6" />{pending ? "SOS pending…" : "Send Emergency SOS"}</Button>} />
            {pending && <p role="status" className="text-sm text-muted-foreground">Your request is pending. Staff have been alerted.</p>}
          </div>
        </Panel>
        <Panel title="Request history">
          {mine.length ? (
            <ul className="divide-y divide-border">{mine.map((x) => (
              <li key={x.id} className="flex items-start justify-between gap-3 py-3">
                <div><p className="text-sm font-medium text-foreground">{fmtDateTime(x.createdAt)}</p>{x.note && <p className="text-sm text-muted-foreground">{x.note}</p>}{x.acknowledgedAt && <p className="text-xs text-muted-foreground">Updated {fmtDateTime(x.acknowledgedAt)}</p>}</div>
                <StatusBadge status={x.status} />
              </li>
            ))}</ul>
          ) : <EmptyState icon={Siren} title="No requests" text="Your SOS requests and their status will appear here." />}
        </Panel>
      </div>
    </>
  );
}
