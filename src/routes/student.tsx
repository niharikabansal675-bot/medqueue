import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CalendarDays, Home, Siren, Ticket } from "lucide-react";
import { AppShell } from "@/components/med/AppShell";
import { STUDENT_ID, useStore } from "@/lib/store";

export const Route = createFileRoute("/student")({ component: StudentLayout });

function StudentLayout() {
  const notes = useStore((s) => s.activity.length > 0 ? 1 : 0);
  return (
    <AppShell role="Student" user={{ name: "Aarav Sharma", id: STUDENT_ID }} notifications={notes}
      nav={[
        { to: "/student", label: "Home", icon: Home },
        { to: "/student/queue", label: "Queue", icon: Ticket },
        { to: "/student/appointments", label: "Appointments", icon: CalendarDays },
        { to: "/student/sos", label: "Emergency SOS", icon: Siren },
      ]}>
      <Outlet />
    </AppShell>
  );
}
