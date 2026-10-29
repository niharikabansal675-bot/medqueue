
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
import { apiRequest, saveAuthToken } from "@/lib/api";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    role: search["role"] === "staff" ? ("staff" as const) : ("student" as const),
  }),
  head: () => ({
    meta: [
      { title: "Login — MedQueue" },
      {
        name: "description",
        content: "Sign in to MedQueue.",
      },
    ],
  }),
  component: Login,
});

type LoginResponse = {
  success: boolean;
  message: string;
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "STUDENT" | "STAFF";
  };
};

function Login() {
  const { role } = Route.useSearch();
  const navigate = useNavigate({ from: "/login" });

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isStaff = role === "staff";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (loading) return;

    setLoading(true);

    try {
      const result = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        authenticated: false,
        body: {
          email: userId.trim(),
          password,
        },
      });

      if (!result.success || !result.token || !result.user) {
        throw new Error("The server returned an invalid login response.");
      }

      if (
        (isStaff && result.user.role !== "STAFF") ||
        (!isStaff && result.user.role !== "STUDENT")
      ) {
        throw new Error(
          `This account is not registered as a ${isStaff ? "staff" : "student"} account.`,
        );
      }

      saveAuthToken(result.token);

      localStorage.setItem(
        "medqueue:auth-user",
        JSON.stringify({
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
        }),
      );

      await navigate({
        to: isStaff ? "/staff" : "/student",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setLoading(false);
    }
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
              MedQueue
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
                  Email
                </label>
                <input
                  id="userId"
                  type="email"
                  autoComplete="username"
                  required
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                  placeholder="Enter your email"
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
                disabled={loading}
                className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in to MedQueue"}
              </button>
            </form>

            <div className="mt-5 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-teal underline underline-offset-4 hover:opacity-80"
              >
                Create Account
              </Link>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}
