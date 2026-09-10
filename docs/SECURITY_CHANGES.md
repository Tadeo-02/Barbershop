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

---

### SEC-08: Refresh tokens with server-side revocation + deactivation/ban invalidation (HIGH)

**Problem:** Two related security gaps shared a root cause (long-lived, unrevocable JWTs):
1. No refresh tokens existed — the single JWT lived for 8 hours. A captured/leaked token stayed usable for up to 8h post-logout.
2. Deactivating or banning ("Vetado") a user only blocked login — existing JWTs remained fully valid for up to 8h because `authMiddleware` only verified signature+expiration, never checked user status.

**Solution:** Short-lived access token (15 min) + rotating refresh token (7 days) + DB-backed revocation list. One coherent mechanism solves both problems.

**Changes:**

*Backend:*
- `prisma/schema.prisma`: Removed dead `token_blacklist` model and `token_blacklist_reason` enum (never migrated, never used, stored raw tokens). Added `refresh_tokens` model (SHA-256 hashed tokens, UUID id, cascade delete, indexed on userId/tokenHash/expiresAt).
- `prisma/migrations/20260820_refresh_tokens/migration.sql`: New migration that drops `token_blacklist` + enum and creates `refresh_tokens` table.
- `src/BACK/lib/cookieConfig.ts`: Added `REFRESH_COOKIE`, `refreshCookieOptions`, `clearRefreshCookieOptions` — same cross-site settings as access token (SameSite=None+Secure+Partitioned in production).
- `src/BACK/users/Users.ts`: Added `createRefreshToken`, `validateRefreshToken`, `revokeRefreshTokens`, `cleanupRefreshTokens` — follows the same SHA-256 hash pattern as email_verification_tokens and password_reset_tokens.
- `src/BACK/users/users.controller.ts`:
  - Access token TTL reduced from 8h to 15m.
  - Login now issues a refresh token (7-day HttpOnly cookie) alongside the access token.
  - Logout now revokes refresh tokens server-side + clears refresh cookie.
  - Deactivate now revokes refresh tokens immediately.
  - New `refresh` endpoint: validates refresh token, rotates it (revokes old, issues new), issues new access token, returns CSRF token in body. No authMiddleware or csrfProtection (refresh token possession IS the auth proof).
- `src/BACK/users/users.router.ts`: Added `POST /refresh` route (authLimiter, no csrfProtection).
- `src/BACK/middleware/authMiddleware.ts`: After JWT verification, now queries `usuarios.activo` to immediately reject tokens for deactivated users.
- `src/BACK/Appointments/Appointments.ts`: Both "Vetado" assignment paths (category downgrade on cancellation + no-show threshold) now call `revokeRefreshTokens` to immediately invalidate the user's session.

*Frontend:*
- `src/FRONT/views/lib/apiFetch.ts`: On 401 (excluding login/refresh endpoints), silently attempts `POST /usuarios/refresh` before giving up. Shared in-flight promise prevents concurrent refresh storms. If refresh succeeds, retries the original request once. If refresh fails, clears session and redirects to login.
- `src/FRONT/views/components/user/AuthContext.tsx`: Hydration now uses `apiFetch` instead of raw `fetch()`, benefiting from the same silent refresh logic.

**Security properties preserved:**
- All cookie security (SameSite, Secure, HttpOnly, Partitioned) unchanged for existing and new cookies.
- CSRF double-submit pattern unchanged.
- Rate limiting on /refresh via authLimiter.

**Files changed:**
- `prisma/schema.prisma`
- `prisma/migrations/20260820_refresh_tokens/migration.sql` (new)
- `src/BACK/lib/cookieConfig.ts`
- `src/BACK/users/Users.ts`
- `src/BACK/users/users.controller.ts`
- `src/BACK/users/users.router.ts`
- `src/BACK/middleware/authMiddleware.ts`
- `src/BACK/Appointments/Appointments.ts`
- `src/FRONT/views/lib/apiFetch.ts`
- `src/FRONT/views/components/user/AuthContext.tsx`
- `TODO.md`
- `docs/SECURITY_CHANGES.md`

---

## 2026-08-19 — Production fixes: trust proxy, CSRF on registration, login response fix

### FIX-B: Express `trust proxy` setting (HIGH)

**Problem:** Without `trust proxy`, `req.ip` returns the raw TCP connection IP (typically `127.0.0.1` behind Render's reverse proxy). All IP-based rate limiters (`generalLimiter`, `authLimiter`, `sensitiveLimiter`, `publicReadLimiter`, and the IP fallback in `userIdKeyGenerator`) share the same IP for every client, defeating rate limiting entirely.

**Changes:**
- `index.ts`: Added `app.set("trust proxy", 1)` immediately after `const app = express()`, before all middleware. Value `1` trusts the first proxy hop (correct for Render's architecture).

**Files changed:**
- `index.ts`

---

### FIX-C: CSRF protection on admin-only staff registration (MEDIUM)

**Problem:** `POST /usuarios/` (user registration) had no CSRF protection. Public self-registration (no `cuil`/`codSucursal` in body) is intentionally unauthenticated and should not require CSRF. But when an authenticated admin creates staff users (body contains `cuil` or `codSucursal`), the request is state-changing and authenticated — it needs CSRF protection like all other authenticated mutations.

**Changes:**
- `users.router.ts`: Modified `requireAdminForStaffUser` middleware to chain `csrfProtection` before the auth/role check when `cuil` or `codSucursal` is present. The `csrfProtection` middleware validates the double-submit cookie pattern (`csrf_token` cookie matches `X-CSRF-Token` header) and rejects requests from non-allowed origins. Public self-registration (no `cuil`/`codSucursal`) skips CSRF entirely via the existing early return.

**Files changed:**
- `src/BACK/users/users.router.ts`

---

### FIX-A: Frontend login response parsing (ALREADY FIXED)

**Problem:** The old login code checked `if (data.user && data.token)` to validate the login response. After SEC-01 moved the JWT to an HttpOnly cookie, the response changed from `{ message, user, token }` to `{ message, user, csrfToken }`. The `data.token` field no longer exists, so the check was always falsy even though `data.user` was populated — causing the "Datos de usuario no encontrados" error on every successful login.

**Status:** Already fixed in commit `6202a1c` (security update v3). The check was changed to `if (data.user)` and the role is now derived via `deriveRole(data.user.cuil)` instead of decoding the JWT token. No additional changes needed.

**Files changed (prior commit):**
- `src/FRONT/views/pages/Auth/login.tsx`

---

### FIX-E: CSRF 403 on /turnos — investigation and confirmation (INFORMATIONAL)

**Problem:** A 403 "CSRF token missing" was observed when booking appointments (`POST /turnos`). Investigation was needed to determine whether the cause was a raw `fetch()` bypassing CSRF or a timing/ordering issue.

**Investigation (grep audit of all raw `fetch()` calls in frontend):**

| File | URL | Method | CSRF needed? | Verdict |
|---|---|---|---|---|
| `login.tsx:25` | `/usuarios/login` | POST | No — unauthenticated endpoint | Intentional |
| `AuthContext.tsx:54` | `/usuarios/profiles/:codUsuario` | GET | No — GET skips CSRF | Intentional |
| `AuthContext.tsx:102` | `/usuarios/logout` | POST | No — no `csrfProtection` on route (best-effort) | Intentional |

All appointment-related code (`ScheduleByBranch.tsx`, `branchAppointments.tsx`, `ClientAppointments.tsx`, `barberAppointments.tsx`, `HomePageBarber.tsx`) uses `apiFetch`, which:
1. Reads the `csrf_token` cookie
2. Sends `X-CSRF-Token` header
3. Sets `credentials: "include"` for cross-site cookie flow

**Conclusion:** The 403 was already resolved. No raw `fetch()` calls bypass CSRF on state-changing authenticated endpoints. The current code is correct.

**Retrospective note:** This investigation correctly ruled out raw `fetch()` bypasses as the cause, but the conclusion that the issue was "already resolved" was premature — the actual root cause (cross-site `document.cookie` unable to read cookies set by a different domain) was not identified until FIX-F. The grep audit was necessary but not sufficient; validating against the live symptom would have caught the gap earlier.

**Preventive measure:** Added a warning comment to `apiFetch.ts` to prevent future developers from introducing raw `fetch()` calls for authenticated requests.

**Files changed:**
- `src/FRONT/views/lib/apiFetch.ts` (comment only)

---

### SEC-01 update: Authorization header fallback removed

**Problem:** The `Authorization: Bearer` fallback in `authMiddleware.ts` was added as a temporary migration aid when moving from header-based auth to cookie-based auth (SEC-01). After multiple successful deploys with cookie-only auth, confirmed that zero frontend files use the `Authorization` header (grep of `src/FRONT` for `Authorization|Bearer` returns empty).

**Changes:**
- `authMiddleware.ts`: Removed the 5-line `Authorization: Bearer` header fallback. Authentication now uses only the `access_token` HttpOnly cookie. This reduces attack surface and removes dead code.

**Files changed:**
- `src/BACK/middleware/authMiddleware.ts`

---

### FIX-F: CSRF double-submit cookie broken in cross-site deployment (HIGH)

**Problem:** `apiFetch` read the `csrf_token` value from `document.cookie` to send it as the `X-CSRF-Token` header. In the production cross-site deployment (frontend on `vercel.app`, backend on `onrender.com`), `document.cookie` on the frontend page **cannot** read cookies set by the backend — they are stored under the backend's domain, not the frontend's. This meant `csrfToken` was always `undefined` in production, the `X-CSRF-Token` header was never sent, and every authenticated state-changing request (POST/PUT/PATCH/DELETE) failed with `403 CSRF token missing`.

The pattern worked in local development because both frontend and backend run on `localhost` (same registrable domain, different ports), so `document.cookie` could read the cookie. This masked the bug until production deployment.

**Root cause:** The double-submit cookie pattern requires the frontend JavaScript to be able to read the cookie value. This only works when the cookie and the JavaScript share the same domain. In a cross-site architecture (different registrable domains), this is impossible via `document.cookie`.

**Changes:**
- `apiFetch.ts`: Added a module-level `csrfToken` variable with `setCsrfToken()` / `clearCsrfToken()` exports. `apiFetch` now uses the in-memory token (with `document.cookie` as a fallback for same-origin dev). This works because the backend already returns `csrfToken` in the login response body — we just weren't storing it.
- `login.tsx`: After successful login, extracts `csrfToken` from the parsed response body and calls `setCsrfToken()` to store it in the module-level variable.
- `AuthContext.tsx`: Calls `clearCsrfToken()` on logout to prevent stale token usage.

**Files changed:**
- `src/FRONT/views/lib/apiFetch.ts`
- `src/FRONT/views/pages/Auth/login.tsx`
- `src/FRONT/views/components/user/AuthContext.tsx`

---

### FIX-G: CSRF token loss on page refresh / new tab (HIGH)

**Problem:** FIX-F stored the CSRF token in a module-level JS variable. This variable is lost on page refresh, tab close/reopen, or hard navigation. The `access_token` HttpOnly cookie survives the refresh, so `AuthContext.tsx` successfully re-hydrates the session via `GET /usuarios/profiles/:codUsuario`. The user appears logged in with no error, but the in-memory `csrfToken` is `null` — the next mutation fails with `403 CSRF token missing`.

**Changes:**
- `users.router.ts`: The `GET /usuarios/profiles/:codUsuario` endpoint now reads the existing `csrf_token` cookie (already set, `httpOnly: false`) via `req.cookies` and returns it in the response body as `csrfToken`. No token regeneration — just echoes the existing value to keep the double-submit comparison valid.
- `AuthContext.tsx`: In `loadProfile()`, extracts `csrfToken` from the hydration response and calls `setCsrfToken()` to populate the in-memory variable.
- `types/user.ts`: Added `ProfileHydrationResponse` interface (separate from `UserProfile` to keep auth hydration concerns out of the canonical user type used by 7+ other callers).

**Files changed:**
- `src/BACK/users/users.router.ts`
- `src/FRONT/views/components/user/AuthContext.tsx`
- `src/FRONT/types/user.ts`
