# Refresh Tokens & Session Revocation

This document describes the refresh token architecture, how it solves the two TODO security items, the database migration required, and how to verify everything works.

## 1. Problem Statement

Two security gaps shared a root cause — long-lived, unrevocable JWTs:

1. **No refresh tokens.** The single access token (JWT) lived for 8 hours. A captured or leaked token stayed usable for up to 8 hours after logout because the JWT itself was never invalidated — logout only cleared the cookie.

2. **No invalidation on deactivation/ban.** Setting `activo: false` or assigning the "Vetado" category only blocked future logins. The `authMiddleware` only verified JWT signature and expiration — it never queried the user's current status. A deactivated user's existing JWT remained fully valid for up to 8 hours.

## 2. Solution: Short-Lived Access Token + Rotating Refresh Token

One coherent mechanism solves both problems:

| Property | Before | After |
|---|---|---|
| Access token TTL | 8 hours | 15 minutes |
| Refresh token | None | 7 days, rotating on each use |
| Server-side revocation | None | DB-backed (`refresh_tokens` table) |
| Logout invalidation | Cookie clear only | Refresh tokens revoked + cookies cleared |
| Deactivation invalidation | Login-only check | Refresh tokens revoked + middleware checks `activo` |
| Ban ("Vetado") invalidation | Login-only check | Refresh tokens revoked at assignment point |

### How it works end-to-end

```
Login
  |
  v
Backend sets 3 cookies:
  access_token  (HttpOnly, 15 min)
  refresh_token (HttpOnly, 7 days)
  csrf_token    (readable, 15 min)
  |
  v
Frontend stores csrfToken in memory (for X-CSRF-Token header)
  |
  v
Every request goes through apiFetch() → includes credentials + CSRF header
  |
  v
When access_token expires (401):
  apiFetch silently calls POST /usuarios/refresh
  Backend validates refresh token, rotates it, issues new access + refresh tokens
  Original request is retried once
  |
  v
On logout / deactivate / ban:
  All refresh tokens for that user are revoked in the DB
  Cookies are cleared
  User cannot get new access tokens even if they have an old cookie
```

## 3. Database Changes

### New table: `refresh_tokens`

| Column | Type | Description |
|---|---|---|
| id | VARCHAR(36) UUID | Primary key |
| userId | VARCHAR(36) FK | References `usuarios.codUsuario`, CASCADE delete |
| tokenHash | VARCHAR(64) | SHA-256 hash of the raw refresh token |
| expiresAt | DATETIME | Token expiration (issued_at + 7 days) |
| revokedAt | DATETIME nullable | NULL = active, non-NULL = revoked |
| createdAt | DATETIME | Insertion timestamp |

Indexes: `userId`, `tokenHash`, `expiresAt`.

### Removed: `token_blacklist` + `token_blacklist_reason`

The old `token_blacklist` model was never migrated to the database, never referenced in any TypeScript file, and stored raw JWT values (not hashed). It is removed entirely.

### Migration file

```
prisma/migrations/20260820_refresh_tokens/migration.sql
```

This file:
1. Drops `token_blacklist` table (IF EXISTS) and `token_blacklist_reason` enum (IF EXISTS)
2. Creates `refresh_tokens` table with indexes and foreign key

## 4. Migration Guide

### Dev environment

```bash
# Apply migration (creates refresh_tokens, drops token_blacklist)
pnpm exec prisma migrate dev --name refresh_tokens

# Or apply the hand-written SQL directly:
mysql -u <user> -p <database> < prisma/migrations/20260820_refresh_tokens/migration.sql

# Regenerate Prisma Client
pnpm exec prisma generate

# Verify backend builds
pnpm build:backend
```

### Staging / Production

```bash
# Apply migration
pnpm exec prisma migrate deploy

# Or run SQL manually (see fallback below)
# Regenerate client if your pipeline requires it
pnpm exec prisma generate
```

### Manual SQL fallback

```bash
mysql -u <user> -p <database> < prisma/migrations/20260820_refresh_tokens/migration.sql
pnpm exec prisma generate
pnpm build:backend
```

The migration is safe to run multiple times (`DROP TABLE IF EXISTS` is idempotent for `token_blacklist`; `CREATE TABLE` will fail if `refresh_tokens` already exists — adjust if needed).

## 5. Backend Changes

### Cookie configuration (`src/BACK/lib/cookieConfig.ts`)

New constants and functions:
- `REFRESH_COOKIE = "refresh_token"` — cookie name
- `refreshCookieOptions(maxAgeMs)` — HttpOnly, Secure, SameSite=None+Partitioned (production), SameSite=Lax (dev)
- `clearRefreshCookieOptions` — same shape as `clearCookieOptions`, maxAge=0

Refresh token cookies use the same cross-site settings as access token cookies because the frontend and backend are on different origins in production (Vercel + Render).

### Refresh token CRUD (`src/BACK/users/Users.ts`)

Four new exported functions:

- **`createRefreshToken(codUsuario)`** — generates a random 32-byte hex token, hashes it with SHA-256, stores the hash + 7-day expiry in `refresh_tokens`, returns the raw token (for the cookie) and the expiry date.

- **`validateRefreshToken(rawToken)`** — hashes the raw token, looks up a matching row where `revokedAt IS NULL` and `expiresAt > now()`. Returns `{ codUsuario }` if valid, `null` otherwise.

- **`revokeRefreshTokens(codUsuario)`** — sets `revokedAt = now()` on all active (un-revoked) refresh tokens for the user. Used by logout, deactivate, and ban flows.

- **`cleanupRefreshTokens()`** — deletes expired and revoked rows. Called lazily to prevent unbounded table growth.

### Login (`src/BACK/users/users.controller.ts`)

- Access token TTL reduced from `'8h'` to `'15m'`
- After signing the access token, a refresh token is created and set as a separate `refresh_token` HttpOnly cookie (7-day maxAge)
- Three cookies are now set on login: `access_token`, `refresh_token`, `csrf_token`

### New endpoint: `POST /usuarios/refresh`

Rate-limited via `authLimiter`. No `authMiddleware` or `csrfProtection` — the refresh token possession IS the authentication proof.

**Flow:**
1. Read `refresh_token` cookie
2. Validate the token (hash lookup, check not expired, check not revoked)
3. If invalid: clear refresh cookie, return 401
4. If valid: revoke the old refresh token (rotation), create a new one, sign a new 15-minute access token, set all three cookies, return 200 with new `csrfToken` in the body

**Why rotate?** Each refresh call issues a new refresh token and revokes the old one. This limits the replay window if a refresh token is stolen — it can only be used once before it becomes invalid.

### Logout (`src/BACK/users/users.controller.ts`)

Now performs three actions:
1. Reads the `refresh_token` cookie, validates it, and revokes all refresh tokens for that user in the DB
2. Clears all three cookies (access_token, csrf_token, refresh_token)
3. Returns 200

### Deactivate (`src/BACK/users/users.controller.ts`)

After setting `activo: false` in the DB, also calls `revokeRefreshTokens()` for that user. The user's active session is terminated at the next access token expiry (15 min max) because:
- `authMiddleware` now checks `activo` and returns 401 if false
- Any refresh attempt will fail because the refresh tokens are revoked

### Ban ("Vetado") (`src/BACK/Appointments/Appointments.ts`)

Both places that assign the "Vetado" category now call `revokeRefreshTokens()`:
- Category downgrade path (Inicial → Vetado on appointment cancellation)
- No-show threshold path (3+ no-shows in a semester)

### Auth middleware (`src/BACK/middleware/authMiddleware.ts`)

After JWT signature+expiration verification, now queries `usuarios.activo`:
- If `activo === false`, returns 401 immediately
- This closes the gap where a deactivated user's JWT was valid until natural expiration
- The query hits the primary key on a small table — sub-millisecond on MySQL

## 6. Frontend Changes

### Silent refresh (`src/FRONT/views/lib/apiFetch.ts`)

On receiving a 401 response (except for `/usuarios/login` and `/usuarios/refresh`):
1. Attempts `POST /usuarios/refresh`
2. If refresh succeeds: retries the original request once with the new access token
3. If refresh fails: clears session storage and redirects to `/login`

**Race condition guard:** A module-level `refreshPromise` variable ensures only one refresh call is in-flight at a time. If multiple concurrent requests all hit 401, they share the same refresh promise instead of triggering a storm.

### Auth context hydration (`src/Front/views/components/user/AuthContext.tsx`)

The hydration `useEffect` now uses `apiFetch` instead of raw `fetch()`, so it also benefits from the silent refresh logic. If the access token expired while the user has the app open, hydration will trigger a refresh before failing.

## 7. Required Environment Variables

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | (required) | Already required — no change |
| `REFRESH_TOKEN_TTL_DAYS` | `7` | Refresh token lifetime in days |

No new environment variables are required beyond `REFRESH_TOKEN_TTL_DAYS` (optional, defaults to 7).

## 8. Security Properties

### Preserved from before

- Cookie security: HttpOnly, Secure, SameSite=None+Partitioned (production) on all three cookies
- CSRF double-submit pattern: `csrf_token` readable cookie + `X-CSRF-Token` header
- Rate limiting: `authLimiter` on `/login` and `/refresh`
- JWT algorithm pinning: HS256 explicitly specified
- Cookie clearing on logout

### Added by this change

- Access token exposure window reduced from 8h to 15 min
- Refresh tokens are SHA-256 hashed in the DB (raw values never stored)
- Refresh token rotation limits replay window to a single use
- Server-side revocation on logout, deactivation, and ban
- Immediate 401 for deactivated users via middleware `activo` check
- Lazy cleanup of expired/revoked tokens prevents unbounded table growth

### Design decisions

- **No DB hit on every request.** The `activo` check in `authMiddleware` is one primary-key query per request. If this becomes a performance concern, a short-lived in-memory cache (e.g., 30s TTL) can be added later. For the current app scale, the direct query is simpler and always correct.

- **No "Vetado" check in middleware.** The veto check involves a join with `categoria_vigente` + string comparison — heavier than a simple boolean. Since refresh tokens are revoked when "Vetado" is assigned, the user cannot get new access tokens anyway. The 15-minute max exposure window is acceptable.

- **`/refresh` is unauthenticated by design.** CSRF protection is not applied because the refresh token possession itself is the authentication proof. The `authLimiter` provides brute-force protection.

## 9. Verification Checklist

1. **Login** — confirm three cookies are set: `access_token` (maxAge ~900s), `refresh_token` (maxAge ~604800s), `csrf_token` (maxAge ~900s)

2. **Session persistence** — wait past the 15-minute access token TTL without manual intervention; confirm `apiFetch` silently refreshes and the user experience is uninterrupted

3. **Logout** — after logout, manually call `POST /usuarios/refresh` with the old refresh cookie (e.g., via curl/Postman); confirm it returns 401

4. **Deactivation** — admin deactivates a user while they have an active session:
   - Their current access token is rejected by `authMiddleware` within 15 min (activo check)
   - Any refresh attempt returns 401 (tokens revoked)

5. **Ban ("Vetado")** — same as step 4, but triggered by category assignment (appointment cancellation or no-show threshold)

6. **CSRF** — confirm all existing CSRF-protected endpoints still work with the new cookie set

7. **Rate limiting** — confirm `POST /usuarios/refresh` is subject to `authLimiter` (5 req/15min per IP)

8. **Cookie security** — confirm `refresh_token` cookie has HttpOnly, Secure (production), SameSite=None+Partitioned (production) properties

## 10. Files Changed

| File | Change |
|---|---|
| `prisma/schema.prisma` | Removed `token_blacklist` + enum; added `refresh_tokens` model |
| `prisma/migrations/20260820_refresh_tokens/migration.sql` | New migration |
| `src/BACK/lib/cookieConfig.ts` | Added `REFRESH_COOKIE`, `refreshCookieOptions`, `clearRefreshCookieOptions` |
| `src/BACK/users/Users.ts` | Added `createRefreshToken`, `validateRefreshToken`, `revokeRefreshTokens`, `cleanupRefreshTokens` |
| `src/BACK/users/users.controller.ts` | Shortened JWT to 15m; login issues refresh token; new `refresh` method; logout/deactivate revoke tokens |
| `src/BACK/users/users.router.ts` | Added `POST /refresh` route |
| `src/BACK/middleware/authMiddleware.ts` | Checks `usuarios.activo` after JWT verification |
| `src/BACK/Appointments/Appointments.ts` | Both "Vetado" paths call `revokeRefreshTokens` |
| `src/Front/views/lib/apiFetch.ts` | Silent refresh on 401 with race-condition guard |
| `src/Front/views/components/user/AuthContext.tsx` | Hydration uses `apiFetch` |
| `TODO.md` | Both security items marked done |
| `docs/SECURITY_CHANGES.md` | Added SEC-08 entry |
