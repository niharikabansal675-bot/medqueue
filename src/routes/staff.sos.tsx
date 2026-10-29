
import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Siren } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
} from "@/components/med/ui";
import { fmtDateTime } from "@/lib/store";
import { apiRequest } from "@/lib/api";

export const Route = createFileRoute("/staff/sos")({
  head: () => ({
    meta: [
      { title: "SOS Alerts — MedQueue Staff" },
      {
        name: "description",
        content: "Respond to emergency requests.",
      },
      { property: "og:title", content: "SOS Alerts — MedQueue Staff" },
      {
        property: "og:description",
        content: "Respond to emergency requests.",
      },
    ],
  }),
  component: StaffSos,
});

type SosAlert = {
  id: string;
  studentId: string;
  note?: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string;
  student?: {
    name?: string;
    email?: string;
  };
};

type SosResponse = {
  success: boolean;
  alerts?: SosAlert[];
  sos?: SosAlert[];
  data?: SosAlert[];
};

function StaffSos() {
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    try {
      const result = await apiRequest<SosResponse>("/sos");
      setAlerts(result.alerts ?? result.sos ?? result.data ?? []);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not load SOS alerts.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  const updateStatus = async (
    alert: SosAlert,
    status: "ACKNOWLEDGED" | "RESOLVED",
  ) => {
    setUpdatingId(alert.id);

    try {
      await apiRequest(`/sos/${alert.id}/status`, {
        method: "PATCH",
        body: { status },
      });

      toast.success(
        status === "ACKNOWLEDGED"
          ? "SOS alert acknowledged."
          : "SOS alert marked as resolved.",
      );

      await loadAlerts();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not update SOS status.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = alerts.filter(
    (alert) => alert.status.toUpperCase() === "PENDING",
  ).length;

  const rows = [...alerts].sort(
    (a, b) =>
      Number(b.status.toUpperCase() === "PENDING") -
        Number(a.status.toUpperCase() === "PENDING") ||
      b.createdAt.localeCompare(a.createdAt),
  );

  return (
    <>
      <PageHeader
        title="SOS alerts"
        subtitle={`${pendingCount} pending`}
      />

      <Panel>
        {loading ? (
          <p className="text-sm text-muted-foreground">
            Loading emergency alerts...
          </p>
        ) : rows.length ? (
          <DataTable
            rows={rows}
            rowKey={(alert) => alert.id}
            highlight={(alert) =>
              alert.status.toUpperCase() === "PENDING"
            }
            cols={[
              {
                h: "Received",
                cell: (alert) => (
                  <span className="flex items-center gap-2">
                    {alert.status.toUpperCase() === "PENDING" && (
                      <Siren
                        className="size-4 text-destructive"
                        aria-hidden
                      />
                    )}
                    {fmtDateTime(alert.createdAt)}
                  </span>
                ),
              },
              {
                h: "Patient",
                cell: (alert) => (
                  <span className="font-medium">
                    {alert.student?.name || alert.studentId}
                    {alert.student?.email && (
                      <span className="block text-xs text-muted-foreground">
                        {alert.student.email}
                      </span>
                    )}
                  </span>
                ),
              },
              {
                h: "Details",
                cell: (alert) =>
                  alert.note || (
                    <span className="text-muted-foreground">—</span>
                  ),
              },
              {
                h: "Status",
                cell: (alert) => (
                  <StatusBadge status={alert.status.toLowerCase()} />
                ),
              },
              {
                h: "Action",
                cell: (alert) => {
                  const status = alert.status.toUpperCase();
                  const updating = updatingId === alert.id;

                  if (status === "PENDING") {
                    return (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={updating}
                        onClick={() =>
                          void updateStatus(alert, "ACKNOWLEDGED")
                        }
                      >
                        {updating ? "Updating..." : "Acknowledge"}
                      </Button>
                    );
                  }

                  if (status === "ACKNOWLEDGED") {
                    return (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updating}
                        onClick={() =>
                          void updateStatus(alert, "RESOLVED")
                        }
                      >
                        {updating ? "Updating..." : "Mark resolved"}
                      </Button>
                    );
                  }

                  return (
                    <span className="text-muted-foreground">—</span>
                  );
                },
              },
            ]}
          />
        ) : (
          <EmptyState
            icon={Siren}
            title="No alerts"
            text="Emergency requests from students will appear here."
          />
        )}
      </Panel>
    </>
  );
}
