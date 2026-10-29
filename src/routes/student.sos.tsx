
import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Phone, Siren } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/med/Confirm";
import {
  EmptyState,
  Field,
  PageHeader,
  Panel,
  StatusBadge,
  inputCls,
} from "@/components/med/ui";
import { fmtDateTime } from "@/lib/store";
import { apiRequest } from "@/lib/api";

export const Route = createFileRoute("/student/sos")({
  head: () => ({
    meta: [
      { title: "Emergency SOS — MedQueue Student" },
      {
        name: "description",
        content: "Request urgent help from clinic staff.",
      },
      { property: "og:title", content: "Emergency SOS — MedQueue Student" },
      {
        property: "og:description",
        content: "Request urgent help from clinic staff.",
      },
    ],
  }),
  component: Sos,
});

type SosAlertApi = {
  id: string;
  note?: string | null;
  status: string;
  createdAt: string;
  acknowledgedAt?: string | null;
  updatedAt?: string;
};

type SosResponse = {
  success: boolean;
  alerts?: SosAlertApi[];
  sos?: SosAlertApi[];
  data?: SosAlertApi[];
};

function Sos() {
  const [alerts, setAlerts] = useState<SosAlertApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState("");

  const loadAlerts = useCallback(async () => {
    try {
      const result = await apiRequest<SosResponse>("/sos/my");
      setAlerts(result.alerts ?? result.sos ?? result.data ?? []);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not load SOS history.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  const pending = alerts.find(
    (alert) => alert.status.toUpperCase() === "PENDING",
  );

  const sendSos = async () => {
    setSending(true);

    try {
      await apiRequest("/sos", {
        method: "POST",
        body: { note: note.trim() },
      });

      toast.success("SOS request recorded.");
      setNote("");
      await loadAlerts();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not send SOS request.",
      );
    } finally {
      setSending(false);
    }
  };

  const displayStatus = (status: string) => status.toLowerCase();

  return (
    <>
      <PageHeader
        title="Emergency SOS"
        subtitle="Alert clinic staff that you need urgent help."
      />

      <p className="mb-6 flex gap-2 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-foreground">
        <AlertTriangle
          className="size-5 shrink-0 text-warning"
          aria-hidden
        />
        <span>
          <strong>Important:</strong> This request is sent to the MedQueue
          backend, but it is not a substitute for emergency services. In a real
          emergency, call your local emergency number{" "}
          <Phone className="inline size-3.5" aria-hidden /> 112.
        </span>
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Send an SOS request">
          <div className="space-y-4">
            <Field id="note" label="What’s happening? (optional)">
              <input
                id="note"
                maxLength={200}
                className={inputCls}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Severe allergic reaction, Hostel B"
              />
            </Field>

            <Confirm
              title="Send emergency SOS?"
              description="This will create an SOS request for clinic staff in MedQueue."
              confirmLabel="Send SOS"
              onConfirm={() => void sendSos()}
              trigger={
                <Button
                  variant="destructive"
                  size="lg"
                  disabled={!!pending || sending}
                  className="sos-pulse h-16 w-full text-base"
                >
                  <Siren className="!size-6" />
                  {sending
                    ? "Sending..."
                    : pending
                      ? "SOS pending…"
                      : "Send Emergency SOS"}
                </Button>
              }
            />

            {pending && (
              <p role="status" className="text-sm text-muted-foreground">
                Your request is pending in MedQueue. This page does not
                guarantee that staff have seen or responded to it.
              </p>
            )}
          </div>
        </Panel>

        <Panel title="Request history">
          {loading ? (
            <p className="text-sm text-muted-foreground">
              Loading SOS history...
            </p>
          ) : alerts.length ? (
            <ul className="divide-y divide-border">
              {alerts.map((alert) => (
                <li
                  key={alert.id}
                  className="flex items-start justify-between gap-3 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {fmtDateTime(alert.createdAt)}
                    </p>
                    {alert.note && (
                      <p className="text-sm text-muted-foreground">
                        {alert.note}
                      </p>
                    )}
                    {alert.acknowledgedAt && (
                      <p className="text-xs text-muted-foreground">
                        Updated {fmtDateTime(alert.acknowledgedAt)}
                      </p>
                    )}
                    {alert.updatedAt &&
                      !alert.acknowledgedAt &&
                      alert.status.toUpperCase() !== "PENDING" && (
                        <p className="text-xs text-muted-foreground">
                          Last updated {fmtDateTime(alert.updatedAt)}
                        </p>
                      )}
                  </div>
                  <StatusBadge status={displayStatus(alert.status)} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Siren}
              title="No requests"
              text="Your SOS requests and their status will appear here."
            />
          )}
        </Panel>
      </div>
    </>
  );
}
