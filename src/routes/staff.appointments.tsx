
import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import {
  DataTable,
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
  inputCls,
} from "@/components/med/ui";
import { apiRequest } from "@/lib/api";
import { DEPARTMENTS } from "@/lib/store";

export const Route = createFileRoute("/staff/appointments")({
  head: () => ({
    meta: [
      {
        title: "Appointments — MedQueue Staff",
      },
      {
        name: "description",
        content: "Manage all clinic appointments.",
      },
      {
        property: "og:title",
        content: "Appointments — MedQueue Staff",
      },
      {
        property: "og:description",
        content: "Manage all clinic appointments.",
      },
    ],
  }),
  component: StaffAppts,
});

type AppointmentStatus =
  | "BOOKED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

type DisplayStatus =
  | "booked"
  | "confirmed"
  | "completed"
  | "cancelled";

type ApiAppointment = {
  id: string;
  department: string;
  date: string;
  status: AppointmentStatus;
  student: {
    id: string;
    name: string;
    email: string;
  };
};

type AppointmentResponse = {
  success: boolean;
  appointments: ApiAppointment[];
};

const STATUSES: DisplayStatus[] = [
  "booked",
  "confirmed",
  "completed",
  "cancelled",
];

function displayStatus(status: AppointmentStatus): DisplayStatus {
  return status.toLowerCase() as DisplayStatus;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StaffAppts() {
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [st, setSt] = useState("all");
  const [dept, setDept] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result =
        await apiRequest<AppointmentResponse>("/appointments");

      setAppointments(result.appointments ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load appointments.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  const updateAppointmentStatus = async (
    id: string,
    status: DisplayStatus,
  ) => {
    const previousAppointment = appointments.find(
      (appointment) => appointment.id === id,
    );

    if (!previousAppointment) return;

    setUpdatingId(id);
    setError("");

    try {
      await apiRequest(`/appointments/${id}/status`, {
        method: "PATCH",
        body: { status: status.toUpperCase() },
      });

      await loadAppointments();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update appointment status.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const rows = appointments
    .map((appointment) => ({
      ...appointment,
      displayStatus: displayStatus(appointment.status),
    }))
    .filter(
      (appointment) =>
        (st === "all" || appointment.displayStatus === st) &&
        (dept === "all" || appointment.department === dept),
    )
    .sort(
      (a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

  const awaitingConfirmation = appointments.filter(
    (appointment) => appointment.status === "BOOKED",
  ).length;

  return (
    <>
      <PageHeader
        title="Appointments"
        subtitle={`${awaitingConfirmation} awaiting confirmation`}
      />

      <Panel>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <label className="sm:w-52">
            <span className="sr-only">Filter by status</span>
            <select
              className={`${inputCls} capitalize`}
              value={st}
              onChange={(e) => setSt(e.target.value)}
            >
              <option value="all">All statuses</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="sm:w-56">
            <span className="sr-only">Filter by department</span>
            <select
              className={inputCls}
              value={dept}
              onChange={(e) => setDept(e.target.value)}
            >
              <option value="all">All departments</option>
              {DEPARTMENTS.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Loading appointments...
          </p>
        ) : rows.length > 0 ? (
          <DataTable
            rows={rows}
            rowKey={(appointment) => appointment.id}
            cols={[
              {
                h: "Patient",
                cell: (appointment) => (
                  <div>
                    <p className="font-medium">
                      {appointment.student.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {appointment.student.email}
                    </p>
                  </div>
                ),
              },
              {
                h: "Date",
                cell: (appointment) => formatDate(appointment.date),
              },
              {
                h: "Time",
                cell: (appointment) => formatTime(appointment.date),
              },
              {
                h: "Department",
                cell: (appointment) => appointment.department,
              },
              {
                h: "Status",
                cell: (appointment) => (
                  <StatusBadge status={appointment.displayStatus} />
                ),
              },
              {
                h: "Update",
                cell: (appointment) => (
                  <select
                    aria-label={`Update status for ${appointment.student.name}`}
                    className={`${inputCls} h-9 w-36 capitalize`}
                    value={appointment.displayStatus}
                    disabled={updatingId === appointment.id}
                    onChange={(e) =>
                      void updateAppointmentStatus(
                        appointment.id,
                        e.target.value as DisplayStatus,
                      )
                    }
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                ),
              },
            ]}
          />
        ) : (
          <EmptyState
            icon={CalendarDays}
            title="No appointments"
            text="Nothing matches these filters."
          />
        )}
      </Panel>
    </>
  );
}
