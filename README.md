# Job Tracker UI

React 18 + TypeScript (Vite) dashboard for the [job-tracker-api](https://github.com/wablevaibhav/job-tracker-api)
Spring Boot backend.

## Features

- Register / log in (JWT stored in `localStorage`, sent as a Bearer token)
- Add, list, delete job applications; change status inline
- Filter by status, paginated table
- Live counts per status
- Automatic logout when the token expires (HTTP 401)

## Run

1. Start the backend on port 8080 (see the job-tracker-api README: `docker compose up --build`).
2. Start the UI:

```bash
npm install
npm run dev
```

Open http://localhost:5173. In development, `/api` requests are proxied to `http://localhost:8080`
(change the proxy target in `vite.config.ts` to use a different backend).

## Build

```bash
npm run build   # type-checks with tsc, then bundles to dist/
```

For production, serve `dist/` behind the same origin as the API (for example a reverse proxy routing `/api` to the backend),
or add CORS configuration to the backend.
