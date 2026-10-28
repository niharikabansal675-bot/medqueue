
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  GraduationCap,
  HeartPulse,
  Stethoscope,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MedQueue — Campus clinic queue & appointments" },
      {
        name: "description",
        content:
          "Virtual tokens, appointments and emergency SOS for your campus clinic.",
      },
      { property: "og:title", content: "MedQueue — Campus clinic queue & appointments" },
      {
        property: "og:description",
        content:
          "Virtual tokens, appointments and emergency SOS for your campus clinic.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center gap-2 px-6 py-5 text-lg font-bold text-primary md:px-10">
        <span className="rounded-lg bg-primary p-1.5 text-primary-foreground">
          <HeartPulse className="size-5" aria-hidden />
        </span>
        MedQueue
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-10">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-teal">
          Campus clinic
        </p>

        <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-foreground md:text-5xl">
          Skip the waiting room. Keep your place in line.
        </h1>

        <p className="mt-4 max-w-xl text-base text-muted-foreground">
          Choose how you're signing in to this demo. Data is saved in this
          browser only.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {[
            {
              to: "/login" as const,
              search: { role: "student" as const },
              icon: GraduationCap,
              title: "Continue as Student",
              description:
                "Sign in to get a token, book appointments, and request help.",
            },
            {
              to: "/login" as const,
              search: { role: "staff" as const },
              icon: Stethoscope,
              title: "Continue as Staff",
              description:
                "Sign in to manage the queue, appointments, and SOS alerts.",
            },
          ].map((card) => (
            <Link
              key={card.search.role}
              to={card.to}
              search={card.search}
              className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-colors hover:border-teal"
            >
              <div className="mb-4 inline-flex rounded-xl bg-secondary p-3 text-teal">
                <card.icon className="size-6" aria-hidden />
              </div>

              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                {card.title}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {card.description}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
