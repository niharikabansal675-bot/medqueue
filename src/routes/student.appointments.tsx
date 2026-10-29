
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/med/Confirm";
import {
  DataTable,
  EmptyState,
  Field,
  PageHeader,
  Panel,
  StatusBadge,
  inputCls,
} from "@/components/med/ui";
import { DEPARTMENTS, type ApptErrors } from "@/lib/store";
import { apiRequest } from "@/lib/api";

export const Route = createFileRoute("/student/appointments")({
  head: () => ({
    meta: [
      { title: "Appointments — MedQueue Student" },
      {
        name: "description",
        content: "Book and manage clinic appointments.",
      },
      { property: "og:title", content: "Appointments — MedQueue Student" },
      {
        property: "og:description",
        content: "Book and manage clinic appointments.",
      },
    ],
  }),
  component: Appts,
});

const TIME_SLOTS = Array.from({ length: 33 }, (_, i) => {
  const totalMinutes = 9 * 60 + i * 15;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}).filter((time) => time < "13:00" || time >= "14:00");

function formatTime(time: string): string {
  const [hourPart, minutePart] = time.split(":");
  const hours = Number(hourPart ?? 0);
  const minutes = Number(minutePart ?? 0);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
}

type AppointmentApi = {
  id: string;
  department: string;
  date: string;
  reason?: string | null;
  status: string;
  createdAt?: string;
};

type AppointmentResponse = {
  success: boolean;
  appointments?: AppointmentApi[];
  data?: AppointmentApi[];
};

function Appts() {
  const [appointments, setAppointments] = useState<AppointmentApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<ApptErrors>({});
  const [f, setF] = useState({
    department: "",
    date: "",
    time: "",
    reason: "",
  });

  const loadAppointments = useCallback(async () => {
    try {
      const result = await apiRequest<AppointmentResponse>(
        "/appointments/my",
      );

      setAppointments(result.appointments ?? result.data ?? []);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not load appointments.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  const mine = [...appointments].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nextErrors: ApptErrors = {};

    if (!f.department) nextErrors.department = "Select a department.";
    if (!f.date) nextErrors.date = "Select a date.";
    if (!f.time) nextErrors.time = "Select a time.";

    if (f.date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const selectedDate = new Date(`${f.date}T00:00:00`);
      if (selectedDate < today) {
        nextErrors.date = "Choose today or a future date.";
      } else if (
        selectedDate.getTime() === today.getTime() &&
        f.time &&
        new Date(`${f.date}T${f.time}:00`).getTime() <= Date.now()
      ) {
        nextErrors.time = "Choose a future time.";
      }
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);

    try {
      const appointmentDate = new Date(
        `${f.date}T${f.time}:00`,
      ).toISOString();

      await apiRequest("/appointments", {
        method: "POST",
        body: {
          department: f.department,
          date: appointmentDate,
          reason: f.reason.trim(),
        },
      });

      toast.success("Appointment booked successfully.");

      setF({
        department: "",
        date: "",
        time: "",
        reason: "",
      });
      setErrors({});

      await loadAppointments();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not book appointment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const cancelAppointment = async (id: string) => {
    try {
      await apiRequest(`/appointments/${id}/cancel`, {
        method: "PATCH",
      });

      toast.success("Appointment cancelled.");
      await loadAppointments();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not cancel appointment.",
      );
    }
  };

  const err = (key: keyof ApptErrors) => ({
    "aria-invalid": !!errors[key],
    "aria-describedby": errors[key] ? `${key}-err` : undefined,
  });

  const statusForBadge = (status: string) => {
    const normalized = status.toLowerCase();

    if (normalized === "booked") return "confirmed";

    return normalized;
  };

  return (
    <>
      <PageHeader
        title="Appointments"
        subtitle="Book a time with a clinic department."
      />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Panel title="Book appointment">
          <form onSubmit={submit} noValidate className="space-y-4">
            <Field
              id="department"
              label="Department"
              required
              error={errors.department}
            >
              <select
                id="department"
                className={inputCls}
                value={f.department}
                onChange={(e) => {
                  setF({ ...f, department: e.target.value });
                  setErrors((prev) => {
                    const { department: _removed, ...rest } = prev;
                    return rest;
                  });
                }}
                {...err("department")}
              >
                <option value="">Select…</option>
                {DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field
                id="date"
                label="Date"
                required
                error={errors.date}
              >
                <input
                  id="date"
                  type="date"
                  className={inputCls}
                  min={new Date().toLocaleDateString("en-CA")}
                  value={f.date}
                  onChange={(e) => {
                    setF({ ...f, date: e.target.value });
                    setErrors((prev) => {
                      const { date: _removed, ...rest } = prev;
                      return rest;
                    });
                  }}
                  {...err("date")}
                />
              </Field>

              <Field
                id="time"
                label="Time"
                required
                error={errors.time}
              >
                <select
                  id="time"
                  className={inputCls}
                  value={f.time}
                  onChange={(e) => {
                    setF({ ...f, time: e.target.value });
                    setErrors((prev) => {
                      const { time: _removed, ...rest } = prev;
                      return rest;
                    });
                  }}
                  {...err("time")}
                >
                  <option value="">Select a time</option>
                  {TIME_SLOTS.map((time) => (
                    <option key={time} value={time}>
                      {formatTime(time)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field id="reason" label="Reason (optional)">
              <textarea
                id="reason"
                maxLength={200}
                rows={3}
                className={`${inputCls} h-auto py-2`}
                value={f.reason}
                onChange={(e) =>
                  setF({ ...f, reason: e.target.value })
                }
              />
            </Field>

            <Button
              type="submit"
              variant="default"
              className="h-10 w-full"
              disabled={submitting}
            >
              <CalendarPlus />
              {submitting ? "Booking..." : "Book appointment"}
            </Button>
          </form>
        </Panel>

        <Panel title="My appointments">
          {loading ? (
            <p className="text-sm text-muted-foreground">
              Loading appointments...
            </p>
          ) : mine.length > 0 ? (
            <DataTable
              rows={mine}
              rowKey={(a) => a.id}
              cols={[
                {
                  h: "Date",
                  cell: (a) =>
                    new Date(a.date).toLocaleDateString([], {
                      dateStyle: "medium",
                    }),
                },
                {
                  h: "Time",
                  cell: (a) => {
                    const time = new Date(a.date).toLocaleTimeString(
                      "en-GB",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      },
                    );

                    return formatTime(time);
                  },
                },
                {
                  h: "Department",
                  cell: (a) => a.department,
                },
                {
                  h: "Status",
                  cell: (a) => (
                    <StatusBadge status={statusForBadge(a.status)} />
                  ),
                },
                {
                  h: "Action",
                  cell: (a) =>
                    ["booked", "confirmed", "scheduled"].includes(
                      a.status.toLowerCase(),
                    ) ? (
                      <Confirm
                        title="Cancel this appointment?"
                        description={`${a.department} on ${new Date(
                          a.date,
                        ).toLocaleString([], {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })} will be cancelled.`}
                        confirmLabel="Cancel appointment"
                        onConfirm={() => void cancelAppointment(a.id)}
                        trigger={
                          <Button size="sm" variant="outline">
                            Cancel
                          </Button>
                        }
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    ),
                },
              ]}
            />
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="No appointments"
              text="Use the form to book your first appointment."
            />
          )}
        </Panel>
      </div>
    </>
  );
}
