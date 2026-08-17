# Production Deployment: Two-Service Architecture

This document describes the changes made to support deploying the Barbershop app as two independent services: a backend Express API and a frontend Vite/React SPA, each on its own host.

## Overview

```
┌─────────────────────┐         ┌─────────────────────────┐
│  Frontend (SPA)     │  HTTPS  │  Backend (Express API)  │
│  Vite build → dist/ │ ──────► │  index.ts → dist/       │
│  Static host        │         │  Port from env           │
└─────────────────────┘         └─────────────────────────┘
```

In development, Vite proxies API requests to `localhost:3001`. In production, the frontend sets `VITE_API_URL` to the backend's public URL, and `apiFetch` prepends it to every request.

---

## Changes

### 1. Frontend: Centralized API calls via `apiFetch`

**Files changed:** `src/FRONT/views/components/user/login.tsx`, `src/FRONT/views/components/user/AuthContext.tsx`

**What changed:**
- `login.tsx`: Two raw `fetch()` calls (login and email verification request) were replaced with `apiFetch` calls. The raw calls used bare relative paths (`/login`, `/usuarios/email-verification/request`) that would fail in production when the frontend and backend are on different origins.
- `AuthContext.tsx`: A raw `fetch()` call for session restoration was replaced with `apiFetch`. The file previously had its own `API_URL` variable which is now removed since `apiFetch` handles the base URL internally.

**Why:** All API calls must go through `apiFetch` (`src/FRONT/views/lib/apiFetch.ts`) so that:
1. `VITE_API_URL` is prepended to the request path.
2. The JWT `Authorization: Bearer` header is automatically injected.
3. 401 responses trigger session cleanup and redirect to `/login`.

**`apiFetch` already supported this** — it was reading `import.meta.env.VITE_API_URL` with an empty-string default. The issue was that `login.tsx` and `AuthContext.tsx` bypassed it entirely.

### 2. Backend: CORS supports multiple frontend origins

**File changed:** `index.ts`

**What changed:** The CORS middleware now accepts a comma-separated `FRONTEND_URL` environment variable and validates incoming origins against the parsed list.

```ts
// Before
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  ...
}));

// After
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  ...
}));
```

**Why:** When deploying to Render (or similar), you may have both a preview URL (e.g. `https://barbershop-api.onrender.com`) and a custom domain (e.g. `https://api.barbershop.com`). Both need to be allowed. The comma-separated format keeps it simple — no new env vars.

**Example `.env` for production:**
```
FRONTEND_URL=https://barbershop-frontend.onrender.com,https://barbershop.com
```

### 3. Removed dead code: `main.controller.ts` and `main.router.ts`

**Files deleted:** `src/BACK/main.controller.ts`, `src/BACK/main.router.ts`

**What was removed:**
- `main.controller.ts` exported a `privated` function that served `../../index.html` via `res.sendFile()`. This file was never imported by `index.ts`.
- `main.router.ts` imported `main.controller` and mounted the `privated` route at `GET /privada`. Also never imported by `index.ts`.

**Why it was removed:**
1. Both files are dead code — neither is referenced in `index.ts` or any other router.
2. The `path.resolve(__dirname, "../../index.html")` path would break under the `tsconfig.backend.json` build output structure (`outDir: ./dist`), resolving to a non-existent path.
3. In the two-service architecture, the backend is a pure JSON API — it does not serve HTML files. The frontend SPA is served by its own static host.

### 4. Build script: Prisma generate before backend compile

**File changed:** `package.json`

```json
// Before
"build:backend": "tsc -p tsconfig.backend.json"

// After
"build:backend": "pnpm exec prisma generate && tsc -p tsconfig.backend.json"
```

**Why:** The backend imports `@prisma/client` (which provides TypeScript types for database models). The `@prisma/client` package must be generated before `tsc` runs, otherwise the build fails with missing type errors. Previously this was a manual step (`pnpm exec prisma generate`) that could be forgotten.

### 5. Environment variable documentation

**File changed:** `.env.example`

Added a `VITE_API_URL` entry:

```
# Frontend-only: Full backend URL for API requests (leave empty for Vite dev proxy)
# In production: https://your-backend-domain.onrender.com
VITE_API_URL=
```

**Note:** `VITE_API_URL` is a **frontend-only** variable. It is read by Vite at build time and embedded in the frontend bundle. It does not need to be set on the backend host.

### 6. No hardcoded localhost references in frontend

Verified: no `localhost:3001` references exist in `src/FRONT/`. The `.env` file is in `.gitignore`. No secrets are hardcoded in source.

---

## Deployment checklist

### Backend host

1. Set environment variables:
   - `PORT` (e.g. `3001`)
   - `DATABASE_URL` (Prisma MySQL connection string)
   - `JWT_SECRET`
   - `FRONTEND_URL` (comma-separated: `https://frontend.onrender.com,https://barbershop.com`)
   - SMTP variables for email flow
   - AFIP/ARCA billing variables
2. Build command: `pnpm install && pnpm run build:backend`
3. Start command: `node dist/index.js`
4. Run `pnpm exec prisma migrate deploy` on first deploy or after schema changes

### Frontend host

1. Set environment variables:
   - `VITE_API_URL=https://your-backend-host.onrender.com` (the full backend URL)
2. Build command: `pnpm install && pnpm run build`
3. Serve the `dist/` directory as a static SPA (configure host to rewrite all routes to `index.html` for client-side routing)

### Local development (unchanged)

1. `.env` with `FRONTEND_URL=http://localhost:5173`
2. `VITE_API_URL` unset (empty string default) — Vite proxy handles routing to `localhost:3001`
3. `pnpm dev` + `pnpm dev:backend` in separate terminals
