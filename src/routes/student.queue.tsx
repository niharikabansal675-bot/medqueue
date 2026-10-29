
import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  CalendarDays,
  CalendarPlus,
  Siren,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
} from "@/components/med/ui";
import { apiRequest } from "@/lib/api";
import { DEPARTMENTS } from "@/lib/store";

export const Route = createFileRoute("/student/queue")({
  head: () => ({
    meta: [
      { title: "Home — MedQueue Student" },
      {
        name: "description",
        content: "Your clinic token, appointments and queue status.",
      },
      { property: "og:title", content: "Home — MedQueue Student" },
      {
        property: "og:description",
        content: "Your clinic token, appointments and queue status.",
      },
    ],
  }),
  component: StudentHome,
});

type ApiToken = {
  id: string;
  tokenNumber?: number;
  department: string;
  status: string;
};

type ApiAppointment = {
  id: string;
  department: string;
  date: string;
  status: string;
};

type TokenResponse = {
  tokens?: ApiToken[];
  data?: ApiToken[];
};

type AppointmentResponse = {
  appointments?: ApiAppointment[];
};

function StudentHome() {
  const nav = useNavigate();
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setError("");

    try {
      const [queueResult, appointmentResult] = await Promise.all([
        apiRequest<TokenResponse>("/queue/my"),
        apiRequest<AppointmentResponse>("/appointments/my"),
      ]);

      setTokens(queueResult.tokens ?? queueResult.data ?? []);
      setAppointments(appointmentResult.appointments ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard information.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const activeToken = tokens.find((token) =>
    ["WAITING", "IN_CONSULTATION"].includes(token.status.toUpperCase()),
  );

  const nextAppointment = appointments
    .filter((appointment) =>
      ["BOOKED", "CONFIRMED"].includes(appointment.status.toUpperCase()),
    )
    .filter((appointment) => new Date(appointment.date).getTime() >= Date.now())
    .sort(
      (a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    )[0];

  const waiting = tokens.filter(
    (token) => token.status.toUpperCase() === "WAITING",
  ).length;

  const inConsultation = tokens.find(
    (token) => token.status.toUpperCase() === "IN_CONSULTATION",
  );

  const generateQueueToken = async () => {
    setJoining(true);

    try {
      await apiRequest("/queue", {
        method: "POST",
        body: { department: "General Medicine" },
      });

      toast.success("Token generated successfully");
      await loadDashboard();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not generate token.",
      );
    } finally {
      setJoining(false);
    }
  };

  const hour = new Date().getHours();

  return (
    <>
      <PageHeader
        title={`Good ${hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"}`}
        subtitle={
          activeToken
            ? "You’re in the queue — we’ll keep your place."
            : "Here’s what’s happening at the campus clinic today."
        }
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

      <div className="grid gap-4 sm:grid-cols-3">
        <Button
          variant="teal"
          size="lg"
          className="h-14"
          disabled={!!activeToken || joining || loading}
          onClick={() => void generateQueueToken()}
        >
          <Ticket />
          {joining
            ? "Generating..."
            : activeToken
              ? "Token active"
              : "Generate Token"}
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="h-14"
          asChild
        >
          <Link to="/student/appointments">
            <CalendarPlus />
            Book Appointment
          </Link>
        </Button>

        <Button
          variant="destructive"
          size="lg"
          onClick={() => nav({ to: "/student/sos" })}
        >
          <Siren />
          Emergency SOS
        </Button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Virtual token">
          {loading ? (
            <p className="text-sm text-muted-foreground">
              Loading your token...
            </p>
          ) : activeToken ? (
            <>
              <p className="text-sm text-muted-foreground">
                Department: {activeToken.department}
              </p>
              <p className="mt-2 text-2xl font-bold">
                Token #{activeToken.tokenNumber ?? "—"}
              </p>
              <p className="mt-2 text-sm">
                Status: {activeToken.status.replaceAll("_", " ").toLowerCase()}
              </p>
              <Link
                to="/student/queue"
                className="mt-3 inline-block text-sm font-medium text-teal hover:underline"
              >
                View queue details
              </Link>
            </>
          ) : (
            <EmptyState
              icon={Ticket}
              title="No active token"
              text="Generate a token to join today’s walk-in queue."
            />
          )}
        </Panel>

        <Panel
          title="Next appointment"
          action={
            <Link
              to="/student/appointments"
              className="text-sm font-medium text-teal hover:underline"
            >
              View all
            </Link>
          }
        >
          {loading ? (
            <p className="text-sm text-muted-foreground">
              Loading appointments...
            </p>
          ) : nextAppointment ? (
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-secondary p-3 text-teal">
                <CalendarDays className="size-6" aria-hidden />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">
                  {nextAppointment.department}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(nextAppointment.date).toLocaleDateString([], {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                  {" · "}
                  {new Date(nextAppointment.date).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <div className="mt-2">
                  <StatusBadge
                    status={nextAppointment.status.toLowerCase() as
                      | "booked"
                      | "confirmed"
                      | "completed"
                      | "cancelled"}
                  />
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="Nothing booked"
              text="Book a slot with any clinic department."
            />
          )}
        </Panel>

        <Panel title="Queue status">
          {loading ? (
            <p className="text-sm text-muted-foreground">
              Loading queue status...
            </p>
          ) : (
            <dl className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-secondary p-4">
                <dt className="text-[13px] text-muted-foreground">
                  Your waiting tokens
                </dt>
                <dd className="text-2xl font-bold text-foreground">
                  {waiting}
                </dd>
              </div>
              <div className="rounded-xl bg-secondary p-4">
                <dt className="text-[13px] text-muted-foreground">
                  Your consultation
                </dt>
                <dd className="text-2xl font-bold text-foreground">
                  {inConsultation
                    ? `#${inConsultation.tokenNumber ?? "—"}`
                    : "—"}
                </dd>
              </div>
            </dl>
          )}
        </Panel>

        <Panel title="Recent activity">
          <EmptyState
            icon={Activity}
            title="Activity feed unavailable"
            text="Your recent activity is still stored locally. We'll connect it to real backend events in a later step."
          />
        </Panel>
      </div>
    </>
  );
}