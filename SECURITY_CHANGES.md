# Security Changes Log

## 2026-08-19 — Cross-site cookie fix (HOTFIX)

**Problem:** In deployed environments, frontend (`barbershop-frontend-six.vercel.app`) and backend are on different origins. With `SameSite=Strict`, the browser **never sends** the `access_token` cookie in cross-site requests, breaking all authenticated flows after login.

**Changes:**
- `cookieConfig.ts`: Changed `sameSite` from `"strict"` to `"none"` in production (`NODE_ENV=production`), `"lax"` in development. `SameSite=None` requires `Secure=true`, which was already gated by `isProduction`.
- `index.ts`: Added CORS error handler middleware that returns 403 JSON (`{ message: "Origen no permitido por CORS" }`) instead of crashing into the generic 500 handler.

**Prerequisites for cross-site cookies to work:**
- `FRONTEND_URL` env var on backend must be set to the exact deployed frontend origin (e.g. `https://barbershop-frontend-six.vercel.app`)
- CORS config already has `credentials: true` and specific `origin` check (not `*`) — confirmed correct.

---

## 2026-08-19 — Remaining Security Issues Resolution

### SEC-01: JWT moved to HttpOnly cookie (HIGH)

**Problem:** JWT was stored in `sessionStorage`, readable by any injected JavaScript (XSS exposure).

**Changes:**
- Backend now sets JWT in an `HttpOnly`, `Secure` (in production), `SameSite=None` (production) / `SameSite=Lax` (development) cookie (`access_token`) on login.
- A separate readable `csrf_token` cookie is set for double-submit CSRF protection.
- Login response no longer returns the JWT in the body; returns `user` + `csrfToken` instead.
- New `POST /usuarios/logout` endpoint clears both cookies.
- `authMiddleware.ts` reads token from cookie first, falls back to `Authorization: Bearer` header (migration support).
- `apiFetch.ts` now uses `credentials: 'include'` and attaches `X-CSRF-Token` header from the readable cookie. No more manual `Authorization` header.
- `authStorage.ts` simplified: stores only `{codUsuario, codSucursal, rol}` in `sessionStorage` for UI rendering. No JWT storage functions remain.
- `AuthContext.tsx` updated: `login(user, role)` signature, `logout()` calls backend endpoint. Hydration uses `GET /usuarios/profiles/:codUsuario` with cookie auth.
- `login.tsx` updated: derives role via `deriveRole()` from user data instead of decoding JWT.
- CSRF protection (`csrfProtection` middleware) added to all authenticated state-changing routes (POST/PUT/PATCH/DELETE) across all routers.
- `cookie-parser` added as dependency.
- `cookieConfig.ts` created for centralized cookie settings.

**Files changed:**
- `src/BACK/lib/cookieConfig.ts` (new)
- `src/BACK/middleware/csrf.ts` (new)
- `src/BACK/middleware/authMiddleware.ts`
- `src/BACK/middleware/rateLimiter.ts` (no changes needed, already correct)
- `src/BACK/users/users.controller.ts`
- `src/BACK/users/users.router.ts`
- `src/BACK/Appointments/appointments.router.ts`
- `src/BACK/Admin/categories/categories.router.ts`
- `src/BACK/Admin/branches/branches.router.ts`
- `src/BACK/Admin/typeOfHaircut/typeOfHaircut.router.ts`
- `src/BACK/Availability/availability.router.ts`
- `src/BACK/billing/billing.router.ts`
- `src/FRONT/views/lib/apiFetch.ts`
- `src/FRONT/views/lib/authStorage.ts`
- `src/FRONT/views/components/user/AuthContext.tsx`
- `src/FRONT/views/pages/Auth/login.tsx`
- `index.ts`

---

### SEC-02: Auth rate limiter verified (HIGH)

**Status:** Already in place. `authLimiter` (5 req/15min per IP, skips successful) is applied to `/usuarios/login` and user registration. No changes needed.

---

### SEC-03: JWT algorithm pinned, startup secret check (HIGH)

**Problem:** No explicit algorithm pinning on `jwt.verify()` — vulnerable to algorithm confusion attacks. No fail-fast check for missing `JWT_SECRET`.

**Changes:**
- `jwt.verify()` in `authMiddleware.ts` now explicitly specifies `{ algorithms: ["HS256"] }`.
- `jwt.sign()` in `users.controller.ts` now explicitly specifies `{ algorithm: "HS256" }`.
- `index.ts` throws immediately if `JWT_SECRET` is not set.

**Files changed:**
- `src/BACK/middleware/authMiddleware.ts`
- `src/BACK/users/users.controller.ts`
- `index.ts`

---

### SEC-04: CORS tightened, debug log removed (MEDIUM)

**Problem:** Debug `console.log` of every incoming Origin leaks request metadata to server logs. CORS `allowedHeaders` didn't include `X-CSRF-Token`.

**Changes:**
- Removed the per-request `console.log("Incoming Origin:...")` middleware.
- Added `"X-CSRF-Token"` to CORS `allowedHeaders`.
- Removed commented-out debug `console.log` lines from `index.ts`.

**Files changed:**
- `index.ts`

---

### SEC-05: bcrypt cost factor configurable (LOW)

**Problem:** `saltRounds` was a hardcoded magic number `12`.

**Changes:**
- `saltRounds` renamed to `BCRYPT_SALT_ROUNDS`, loaded from env var with fallback to `12`.
- Removed `console.error` from `hashPassword` and `comparePassword` (information leak).

**Files changed:**
- `src/BACK/users/bcrypt.ts`

---

### SEC-06: Frontend/backend route audit (INFORMATIONAL)

**Problem:** Some backend endpoints had stricter or mismatched role requirements vs. frontend `ProtectedRoute`.

**Fixes:**
- `GET /turnos/user/:codUsuario/next`: added `"barber"` to `requireRole` (was rejecting barbers).
- `GET /turnos/user/:codUsuario`: added `"barber"` to `requireRole` (was rejecting barbers).
- `GET /facturacion/datos-turno/:codTurno`: added `"client"` to `requireRole` (was rejecting clients viewing their own receipts).

**Remaining note:** Read-only endpoints (`GET /sucursales`, `GET /categorias`, `GET /usuarios/profiles/:codUsuario`) are intentionally more permissive than frontend routes — public data or shared by design.

**Files changed:**
- `src/BACK/Appointments/appointments.router.ts`
- `src/BACK/billing/billing.router.ts`

---

### SEC-07: TODO backlog updated (MEDIUM)

Items checked off in `TODO.md`:
- JWT cookie HttpOnly storage — DONE
- CSRF protection — DONE
- JWT algorithm pinning — DONE
- Startup secret check — DONE

**Remaining backlog** (tracked in `TODO.md`):
- Refresh tokens with server-side revocation
- JWT invalidation when user is deactivated/banned
- Email-based verification for security question changes
