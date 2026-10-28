
import { useState, type FormEvent } from "react";
import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  GraduationCap,
  HeartPulse,
  Stethoscope,
} from "lucide-react";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    role: search["role"] === "staff" ? ("staff" as const) : ("student" as const),
  }),
  head: () => ({
    meta: [
      { title: "Demo Login — MedQueue" },
      {
        name: "description",
        content: "Sign in to the MedQueue demonstration.",
      },
    ],
  }),
  component: Login,
});

function Login() {
  const { role } = Route.useSearch();
  const navigate = useNavigate({ from: "/login" });

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const isStaff = role === "staff";

  const demoId = isStaff
    ? "staff@medqueue.demo"
    : "student@medqueue.demo";

  const demoPassword = isStaff ? "Staff123!" : "Student123!";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (
      userId.trim().toLowerCase() !== demoId ||
      password !== demoPassword
    ) {
      setError("Invalid demo ID or password. Use the demo credentials below.");
      return;
    }

    void navigate({
      to: isStaff ? "/staff" : "/student",
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center gap-2 px-6 py-5 text-lg font-bold text-primary md:px-10">
        <span className="rounded-lg bg-primary p-1.5 text-primary-foreground">
          <HeartPulse className="size-5" aria-hidden />
        </span>
        MedQueue
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <section className="w-full max-w-md">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to home
          </Link>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
            <div className="mb-6 flex size-12 items-center justify-center rounded-xl bg-secondary text-teal">
              {isStaff ? (
                <Stethoscope className="size-6" aria-hidden />
              ) : (
                <GraduationCap className="size-6" aria-hidden />
              )}
            </div>

            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-teal">
              MedQueue demo
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {isStaff ? "Staff sign in" : "Student sign in"}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to continue to your{" "}
              {isStaff ? "staff" : "student"} dashboard.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="userId"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Email or demo ID
                </label>
                <input
                  id="userId"
                  type="text"
                  autoComplete="username"
                  required
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                  placeholder="Enter your demo ID"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 pr-11 text-sm text-foreground outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden />
                    ) : (
                      <Eye className="size-4" aria-hidden />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2"
              >
                Sign in to MedQueue
              </button>
            </form>

            <div className="mt-6 rounded-xl border border-border bg-secondary/50 p-4">
              <p className="text-sm font-semibold text-foreground">
                Demo credentials
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                {isStaff ? "Staff account" : "Student account"}
              </p>

              <p className="mt-1 break-all text-sm text-foreground">
                {demoId}
              </p>

              <p className="mt-1 text-sm text-foreground">
                Password: {demoPassword}
              </p>

              <button
                type="button"
                onClick={() => {
                  setUserId(demoId);
                  setPassword(demoPassword);
                  setError("");
                }}
                className="mt-3 text-sm font-semibold text-teal underline underline-offset-4 hover:opacity-80"
              >
                Fill demo credentials
              </button>
            </div>

            <p className="mt-5 text-center text-xs text-muted-foreground">
              Demo mode only. Do not enter real passwords or sensitive
              information.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
