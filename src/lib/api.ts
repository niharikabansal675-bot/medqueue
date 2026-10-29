
const API_BASE_URL =
  import.meta.env["VITE_API_URL"] || "http://localhost:5000/api";

export function saveAuthToken(token: string) {
  localStorage.setItem("medqueue:auth-token", token);
}

export function getAuthToken(): string | null {
  return localStorage.getItem("medqueue:auth-token");
}

export function clearAuthToken() {
  localStorage.removeItem("medqueue:auth-token");
}

type ApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  authenticated?: boolean;
};

export async function apiRequest<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.authenticated !== false) {
    const token = getAuthToken();

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    ...(options.body !== undefined
      ? { body: JSON.stringify(options.body) }
      : {}),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.message || `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}
