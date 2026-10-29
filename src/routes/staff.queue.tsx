
import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Users } from "lucide-react";
import { toast } from "sonner";
import {
  DataTable,
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
  inputCls,
} from "@/components/med/ui";
import { fmtTime, label } from "@/lib/store";
import { apiRequest } from "@/lib/api";

export const Route = createFileRoute("/staff/queue")({
  head: () => ({
    meta: [
      { title: "Patient Queue — MedQueue Staff" },
      {
        name: "description",
        content: "Manage walk-in patient tokens.",
      },
      { property: "og:title", content: "Patient Queue — MedQueue Staff" },
      {
        property: "og:description",
        content: "Manage walk-in patient tokens.",
      },
    ],
  }),
  component: StaffQueue,
});

type QueueStatus = "WAITING" | "IN_CONSULTATION" | "COMPLETED" | "CANCELLED";

type QueueApiItem = {
  id: string;
  tokenNumber?: number;
  token?: number;
  studentId?: string;
  patientId?: string;
  status: QueueStatus | string;
  createdAt?: string;
  arrivedAt?: string;
  student?: {
    id?: string;
    name?: string;
    email?: string;
  };
};

type QueueResponse = {
  success: boolean;
  tokens?: QueueApiItem[];
  queue?: QueueApiItem[];
  data?: QueueApiItem[];
};

const STATUSES: QueueStatus[] = [
  "WAITING",
  "IN_CONSULTATION",
  "COMPLETED",
  "CANCELLED",
];

function normalizeStatus(status: string): QueueStatus {
  const normalized = status.toUpperCase();
  if (STATUSES.includes(normalized as QueueStatus)) {
    return normalized as QueueStatus;
  }
  return "WAITING";
}

function StaffQueue() {
  const [queue, setQueue] = useState<QueueApiItem[]>([]);
  const [q, setQ] = useState("");
  const [st, setSt] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    try {
      // Change this department if staff should manage another department.
      const result = await apiRequest<QueueResponse>(
        "/queue/department/General%20Medicine",
      );
      setQueue(result.tokens ?? result.queue ?? result.data ?? []);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not load patient queue.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const updateStatus = async (
    item: QueueApiItem,
    nextStatus: QueueStatus,
  ) => {
    const previousStatus = normalizeStatus(item.status);
    if (previousStatus === nextStatus) return;

    setUpdatingId(item.id);

    try {
      await apiRequest(`/queue/${item.id}/status`, {
        method: "PATCH",
        body: { status: nextStatus },
      });

      toast.success(`Token #${item.tokenNumber ?? item.token ?? "—"} updated.`);
      await loadQueue();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not update token status.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const waitingCount = queue.filter(
    (item) => normalizeStatus(item.status) === "WAITING",
  ).length;

  const rows = queue.filter((item) => {
    const status = normalizeStatus(item.status);
    const token = item.tokenNumber ?? item.token ?? "";
    const patient =
      item.student?.name ??
      item.student?.email ??
      item.studentId ??
      item.patientId ??
      "";

    return (
      (st === "all" || status.toLowerCase() === st) &&
      `#${token} ${patient}`.toLowerCase().includes(q.trim().toLowerCase())
    );
  });

  return (
    <>
      <PageHeader
        title="Patient queue"
        subtitle={`${waitingCount} waiting right now`}
      />

      <Panel>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search token or patient</span>
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              className={`${inputCls} pl-9`}
              placeholder="Search token or patient"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>

          <label className="sm:w-52">
            <span className="sr-only">Filter by status</span>
            <select
              className={`${inputCls} capitalize`}
              value={st}
              onChange={(e) => setSt(e.target.value)}
            >
              <option value="all">All statuses</option>
              {STATUSES.map((status) => (
                <option key={status} value={status.toLowerCase()}>
                  {label(status.toLowerCase() as Parameters<typeof label>[0])}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">
            Loading patient queue...
          </p>
        ) : rows.length ? (
          <DataTable
            rows={rows}
            rowKey={(item) => item.id}
            cols={[
              {
                h: "Token",
                cell: (item) => (
                  <span className="font-semibold">
                    #{item.tokenNumber ?? item.token ?? "—"}
                  </span>
                ),
              },
              {
                h: "Patient",
                cell: (item) => (
                  <span className="font-medium">
                    {item.student?.name ??
                      item.student?.email ??
                      item.studentId ??
                      item.patientId ??
                      "Unknown"}
                  </span>
                ),
              },
              {
                h: "Arrived",
                cell: (item) =>
                  fmtTime(item.createdAt ?? item.arrivedAt ?? ""),
              },
              {
                h: "Status",
                cell: (item) => (
                  <StatusBadge status={normalizeStatus(item.status).toLowerCase()} />
                ),
              },
              {
                h: "Update",
                cell: (item) => (
                  <select
                    aria-label={`Update status for token ${item.tokenNumber ?? item.token ?? ""}`}
                    className={`${inputCls} h-9 w-44 capitalize`}
                    value={normalizeStatus(item.status)}
                    disabled={updatingId === item.id}
                    onChange={(e) =>
                      void updateStatus(
                        item,
                        normalizeStatus(e.target.value),
                      )
                    }
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {label(status.toLowerCase() as Parameters<typeof label>[0])}
                      </option>
                    ))}
                  </select>
                ),
              },
            ]}
          />
        ) : (
          <EmptyState
            icon={Users}
            title={queue.length ? "No matches" : "No patients yet"}
            text={
              queue.length
                ? "Try a different search or filter."
                : "Tokens generated by students in General Medicine will appear here."
            }
          />
        )}
      </Panel>
    </>
  );
}
