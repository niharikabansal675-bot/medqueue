
import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Siren,
  Stethoscope,
  Users,
} from "lucide-react";
import {
  EmptyState,
  PageHeader,
  Panel,
  Stat,
  StatusBadge,
} from "@/components/med/ui";
import { apiRequest } from "@/lib/api";

export const Route = createFileRoute("/staff/")({
  head: () => ({
    meta: [
      { title: "Overview — MedQueue Staff" },
      {
        name: "description",
        content: "Clinic overview: patients, alerts and appointments.",
      },
      { property: "og:title", content: "Overview — MedQueue Staff" },
      {
        property: "og:description",
        content: "Clinic overview: patients, alerts and appointments.",
      },
    ],
  }),
  component: Overview,
});

type QueueItem = {
  id: string;
  tokenNumber: number;
  department: string;
  status: string;
  createdAt: string;
  student: { id: string; name: string; email: string };
};

type Appointment = {
  id: string;
  department: string;
  date: string;
  status: string;
  student: { id: string; name: string; email: string };
};

type SosAlert = {
  id: string;
  note?: string | null;
  status: string;
  createdAt: string;
  student: { id: string; name: string; email: string };
};

type ListResponse<T> = {
  success: boolean;
  tokens?: T[];
  appointments?: T[];
  alerts?: T[];
  sosAlerts?: T[];
  data?: T[];
};

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAppointmentDate(value: string) {
  const date = new Date(value);
  const today = new Date();

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function Overview() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setError("");

    try {
      const [queueResult, appointmentResult, sosResult] =
        await Promise.all([
          apiRequest<ListResponse<QueueItem>>(
            "/queue/department/General%20Medicine",
          ),
          apiRequest<ListResponse<Appointment>>("/appointments"),
          apiRequest<ListResponse<SosAlert>>("/sos"),
        ]);

      setQueue(queueResult.tokens ?? queueResult.data ?? []);
      setAppointments(
        appointmentResult.appointments ?? appointmentResult.data ?? [],
      );
      setAlerts(
        sosResult.alerts ??
          sosResult.sosAlerts ??
          sosResult.data ??
          [],
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load clinic dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const activeQueue = queue.filter(
    (item) => !["CANCELLED", "COMPLETED"].includes(item.status.toUpperCase()),
  );

  const waiting = activeQueue.filter(
    (item) => item.status.toUpperCase() === "WAITING",
  );

  const inConsultation = activeQueue.filter(
    (item) => item.status.toUpperCase() === "IN_CONSULTATION",
  );

  const completed = queue.filter(
    (item) => item.status.toUpperCase() === "COMPLETED",
  );

  const pendingAlerts = alerts.filter(
    (alert) => alert.status.toUpperCase() === "PENDING",
  );

  const now = new Date();

  const upcoming = appointments
    .filter(
      (appointment) =>
        ["BOOKED", "CONFIRMED"].includes(
          appointment.status.toUpperCase(),
        ) &&
        new Date(appointment.date).getTime() >= now.getTime(),
    )
    .sort(
      (a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    )
    .slice(0, 4);

  return (
    <>
      <PageHeader
        title="Clinic overview"
        subtitle={new Date().toLocaleDateString([], {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      />

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
          <button
            className="ml-2 underline"
            onClick={() => void loadDashboard()}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <Panel>
          <p className="text-sm text-muted-foreground">
            Loading clinic data...
          </p>
        </Panel>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat
              icon={Users}
              label="Active queue"
              value={activeQueue.length}
              tint="bg-secondary text-primary"
            />
            <Stat
              icon={Clock}
              label="Waiting"
              value={waiting.length}
              tint="bg-warning/10 text-warning"
            />
            <Stat
              icon={Stethoscope}
              label="In consultation"
              value={inConsultation.length}
              tint="bg-info/10 text-info"
            />
            <Stat
              icon={CheckCircle2}
              label="Completed"
              value={completed.length}
              tint="bg-success/10 text-success"
            />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Panel
              title="Pending SOS"
              className={
                pendingAlerts.length ? "border-destructive/40" : ""
              }
              action={
                <Link
                  to="/staff/sos"
                  className="text-sm font-medium text-teal hover:underline"
                >
                  All alerts
                </Link>
              }
            >
              {pendingAlerts.length ? (
                <ul className="space-y-2">
                  {pendingAlerts.slice(0, 3).map((alert) => (
                    <li
                      key={alert.id}
                      className="flex items-center gap-3 rounded-lg bg-destructive/10 p-3 text-sm"
                    >
                      <Siren
                        className="size-4 text-destructive"
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 font-medium">
                        {alert.student.name}
                      </span>
                      <span className="text-muted-foreground">
                        {formatTime(alert.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={Siren}
                  title="All clear"
                  text="No pending emergency requests."
                />
              )}
            </Panel>

            <Panel
              title="Next in queue"
              action={
                <Link
                  to="/staff/queue"
                  className="text-sm font-medium text-teal hover:underline"
                >
                  Manage
                </Link>
              }
            >
              {waiting.length ? (
                <ul className="divide-y divide-border">
                  {waiting.slice(0, 3).map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-2 py-2.5 text-sm"
                    >
                      <span className="font-semibold">
                        #{item.tokenNumber}
                      </span>
                      <span className="flex-1 text-muted-foreground">
                        {item.student.name}
                      </span>
                      <StatusBadge status="waiting" />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={Users}
                  title="Queue empty"
                  text="No patients waiting."
                />
              )}
            </Panel>

            <Panel
              title="Upcoming appointments"
              action={
                <Link
                  to="/staff/appointments"
                  className="text-sm font-medium text-teal hover:underline"
                >
                  View all
                </Link>
              }
            >
              {upcoming.length ? (
                <ul className="divide-y divide-border">
                  {upcoming.map((appointment) => (
                    <li key={appointment.id} className="py-2.5 text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="font-medium">
                          {appointment.student.name}
                        </span>
                        <span className="text-muted-foreground">
                          {formatAppointmentDate(appointment.date)} ·{" "}
                          {formatTime(appointment.date)}
                        </span>
                      </div>
                      <p className="text-muted-foreground">
                        {appointment.department}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={CalendarDays}
                  title="Nothing upcoming"
                  text="No booked appointments."
                />
              )}
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
