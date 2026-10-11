import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  ApiError,
  authenticate,
  createApplication,
  deleteApplication,
  getStats,
  listApplications,
  tokenStore,
  updateStatus,
} from "./api";
import { STATUSES, type ApplicationStatus, type JobApplication, type Page, type Stats } from "./types";

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Something went wrong";
}

function AuthForm({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await authenticate(mode, email, password);
      onAuthenticated();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card auth" onSubmit={submit}>
      <h1>Job Tracker</h1>
      <p className="muted">{mode === "login" ? "Log in to your account" : "Create an account"}</p>
      <label>
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
      </label>
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={busy}>
        {busy ? "Please wait..." : mode === "login" ? "Log in" : "Register"}
      </button>
      <button
        type="button"
        className="link"
        onClick={() => {
          setMode(mode === "login" ? "register" : "login");
          setError(null);
        }}
      >
        {mode === "login" ? "Need an account? Register" : "Have an account? Log in"}
      </button>
    </form>
  );
}

function AddApplicationForm({ onCreated }: { onCreated: () => void }) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createApplication({
        company,
        role,
        location: location || undefined,
        jobUrl: jobUrl || undefined,
      });
      setCompany("");
      setRole("");
      setLocation("");
      setJobUrl("");
      onCreated();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <form className="card add" onSubmit={submit}>
      <h2>Add application</h2>
      <div className="row">
        <input placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} required />
        <input placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} required />
        <input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <input placeholder="Job URL" value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} />
        <button type="submit">Add</button>
      </div>
      {error && <p className="error">{error}</p>}
    </form>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [filter, setFilter] = useState<ApplicationStatus | "">("");
  const [pageNumber, setPageNumber] = useState(0);
  const [page, setPage] = useState<Page<JobApplication> | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([listApplications(filter, pageNumber), getStats()]);
      setPage(p);
      setStats(s);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onLogout();
        return;
      }
      setError(errorMessage(err));
    }
  }, [filter, pageNumber, onLogout]);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeStatus(id: number, status: ApplicationStatus) {
    try {
      await updateStatus(id, status);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function remove(id: number) {
    try {
      await deleteApplication(id);
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <main>
      <header>
        <h1>Job Tracker</h1>
        <button className="link" onClick={onLogout}>
          Log out
        </button>
      </header>

      {stats && (
        <section className="stats">
          <div className="chip">
            <strong>{stats.total}</strong> total
          </div>
          {STATUSES.map((s) => (
            <div className="chip" key={s}>
              <strong>{stats.byStatus[s] ?? 0}</strong> {s.toLowerCase()}
            </div>
          ))}
        </section>
      )}

      <AddApplicationForm onCreated={() => void load()} />

      <section className="card">
        <div className="toolbar">
          <h2>Applications</h2>
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as ApplicationStatus | "");
              setPageNumber(0);
            }}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="error">{error}</p>}

        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Role</th>
              <th>Location</th>
              <th>Applied</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {page?.content.map((a) => (
              <tr key={a.id}>
                <td>
                  {a.jobUrl ? (
                    <a href={a.jobUrl} target="_blank" rel="noreferrer">
                      {a.company}
                    </a>
                  ) : (
                    a.company
                  )}
                </td>
                <td>{a.role}</td>
                <td>{a.location ?? "-"}</td>
                <td>{a.appliedOn}</td>
                <td>
                  <select
                    value={a.status}
                    onChange={(e) => void changeStatus(a.id, e.target.value as ApplicationStatus)}
                    aria-label={`Status for ${a.company}`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button className="danger" onClick={() => void remove(a.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {page && page.content.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  No applications yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {page && page.totalPages > 1 && (
          <div className="pager">
            <button disabled={pageNumber === 0} onClick={() => setPageNumber((n) => n - 1)}>
              Previous
            </button>
            <span>
              Page {page.number + 1} of {page.totalPages}
            </span>
            <button disabled={pageNumber + 1 >= page.totalPages} onClick={() => setPageNumber((n) => n + 1)}>
              Next
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean>(() => tokenStore.get() !== null);

  const logout = useCallback(() => {
    tokenStore.clear();
    setAuthenticated(false);
  }, []);

  return authenticated ? (
    <Dashboard onLogout={logout} />
  ) : (
    <AuthForm onAuthenticated={() => setAuthenticated(true)} />
  );
}
