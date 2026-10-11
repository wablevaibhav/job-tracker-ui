import type { ApplicationInput, ApplicationStatus, JobApplication, Page, Stats } from "./types";

const TOKEN_KEY = "jt_token";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const tokenStore = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable: session lasts until reload */
    }
  },
  clear: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const token = tokenStore.get();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(path, { ...init, headers });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const body = text ? JSON.parse(text) : null;

  if (!res.ok) {
    if (res.status === 401 && token) tokenStore.clear();
    const detail =
      body?.errors ? Object.values(body.errors as Record<string, string>).join(", ") : body?.detail;
    throw new ApiError(res.status, detail ?? `Request failed (${res.status})`);
  }
  return body as T;
}

export async function authenticate(mode: "login" | "register", email: string, password: string): Promise<void> {
  const { token } = await request<{ token: string }>(`/api/auth/${mode}`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  tokenStore.set(token);
}

export function listApplications(status: ApplicationStatus | "", page: number, size = 10) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (status) params.set("status", status);
  return request<Page<JobApplication>>(`/api/applications?${params.toString()}`);
}

export function createApplication(input: ApplicationInput) {
  return request<JobApplication>("/api/applications", { method: "POST", body: JSON.stringify(input) });
}

export function updateStatus(id: number, status: ApplicationStatus) {
  return request<JobApplication>(`/api/applications/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function deleteApplication(id: number) {
  return request<void>(`/api/applications/${id}`, { method: "DELETE" });
}

export function getStats() {
  return request<Stats>("/api/applications/stats");
}
