
import { useState, type FormEvent } from "react";
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
import {
  type ApptErrors,
  DEPARTMENTS,
  STUDENT_ID,
  bookAppointment,
  setApptStatus,
  useStore,
} from "@/lib/store";

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
  const parts = time.split(":");
  const hours = Number(parts[0] ?? 0);
  const minutes = Number(parts[1] ?? 0);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
}

function Appts() {
  const all = useStore((s) => s.appointments);

  const mine = all
    .filter((a) => a.patientId === STUDENT_ID)
    .sort((a, b) =>
      `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`),
    );

  const [f, setF] = useState({
    department: "",
    date: "",
    time: "",
    reason: "",
  });

  const [errors, setErrors] = useState<ApptErrors>({});

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = bookAppointment(f);
    setErrors(result.errors);

    if (result.ok) {
      toast.success("Appointment booked");
      setF({
        department: "",
        date: "",
        time: "",
        reason: "",
      });
      setErrors({});
    }
  };

  const err = (key: keyof ApptErrors) => ({
    "aria-invalid": !!errors[key],
    "aria-describedby": errors[key] ? `${key}-err` : undefined,
  });

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
            >
              <CalendarPlus />
              Book appointment
            </Button>
          </form>
        </Panel>

        <Panel title="My appointments">
          {mine.length ? (
            <DataTable
              rows={mine}
              rowKey={(a) => a.id}
              cols={[
                {
                  h: "Date",
                  cell: (a) =>
                    new Date(`${a.date}T00:00`).toLocaleDateString(
                      [],
                      { dateStyle: "medium" },
                    ),
                },
                {
                  h: "Time",
                  cell: (a) => formatTime(a.time),
                },
                {
                  h: "Department",
                  cell: (a) => a.department,
                },
                {
                  h: "Status",
                  cell: (a) => <StatusBadge status={a.status} />,
                },
                {
                  h: "Action",
                  cell: (a) =>
                    a.status === "booked" ||
                    a.status === "confirmed" ? (
                      <Confirm
                        title="Cancel this appointment?"
                        description={`${a.department} on ${a.date} at ${formatTime(a.time)} will be cancelled.`}
                        confirmLabel="Cancel appointment"
                        onConfirm={() => {
                          setApptStatus(a.id, "cancelled");
                          toast.success("Appointment cancelled");
                        }}
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
