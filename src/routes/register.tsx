
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
import { apiRequest } from "@/lib/api";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create Account — MedQueue" },
      {
        name: "description",
        content: "Create your MedQueue account.",
      },
    ],
  }),
  component: Register,
});

type RegisterResponse = {
  success: boolean;
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: "STUDENT" | "STAFF";
  };
};

function Register() {
  const navigate = useNavigate({ from: "/register" });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"STUDENT" | "STAFF">("STAFF");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      const result = await apiRequest<RegisterResponse>("/auth/register", {
        method: "POST",
        authenticated: false,
        body: {
          name: name.trim(),
          email: email.trim(),
          password,
          role,
        },
      });

      if (!result.success || !result.user) {
        throw new Error("The server returned an invalid registration response.");
      }

      setSuccess("Account created successfully! Redirecting to login...");

      window.setTimeout(() => {
        void navigate({
          to: "/login",
          search: { role: role === "STAFF" ? "staff" : "student" },
        });
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your account. Please try again.",
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
              {role === "STUDENT" ? (
                <GraduationCap className="size-6" aria-hidden />
              ) : (
                <Stethoscope className="size-6" aria-hidden />
              )}
            </div>

            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-teal">
              Join MedQueue
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Create your account
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Enter your details to get started.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-foreground">
                  Full name
                </label>
                <input
                  id="name"
                  autoComplete="name"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
                />
              </div>

              <div>
                <label htmlFor="role" className="mb-2 block text-sm font-medium text-foreground">
                  Account type
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(event) => setRole(event.target.value as "STUDENT" | "STAFF")}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
                >
                  <option value="STUDENT">Student</option>
                  <option value="STAFF">Staff</option>
                </select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Staff registration is currently enabled in the development backend and must be restricted before production.
                </p>
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 pr-11 text-sm text-foreground outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
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

              <div>
                <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-foreground">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
                />
              </div>

              {error && (
                <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </p>
              )}

              {success && (
                <p role="status" className="rounded-lg border border-teal/30 bg-teal/10 p-3 text-sm text-foreground">
                  {success}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                search={{ role: role === "STAFF" ? "staff" : "student" }}
                className="font-semibold text-teal underline underline-offset-4"
              >
                Sign in
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}