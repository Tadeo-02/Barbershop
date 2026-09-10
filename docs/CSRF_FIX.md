# CSRF Double-Submit Cookie Fix

## Summary

The CSRF double-submit cookie pattern was **silently broken in production** since its introduction. Every authenticated state-changing request (POST/PUT/PATCH/DELETE) was missing the `X-CSRF-Token` header, causing `403 CSRF token missing` responses.

## Root Cause

`apiFetch.ts` read the `csrf_token` value from `document.cookie` to send it as the `X-CSRF-Token` header:

```typescript
const csrfToken = document.cookie
  .split("; ")
  .find((c) => c.startsWith("csrf_token="))
  ?.split("=")[1];
```

In the production cross-site deployment:
- Frontend: `barbershop-frontend-six.vercel.app`
- Backend: `barbershop-backend-xlc8.onrender.com`

These are **different registrable domains**. When the backend sets `Set-Cookie: csrf_token=xxx; SameSite=None; Secure`, the cookie is stored under `onrender.com`. `document.cookie` on `vercel.app` can only see cookies for `vercel.app` — it **cannot** read cookies from a different domain.

Result: `csrfToken` was always `undefined` in production. The `X-CSRF-Token` header was never sent.

## Why It Wasn't Caught

Local development runs both frontend and backend on `localhost` (different ports, same registrable domain). `document.cookie` on `localhost:5173` **can** read cookies set by `localhost:3000`. The pattern worked perfectly in dev, masking the production bug.

## The Fix (FIX-F)

### 1. `src/FRONT/views/lib/apiFetch.ts`

Added a module-level `csrfToken` variable stored in JS memory:

```typescript
let csrfToken: string | null = null;

export function setCsrfToken(token: string) {
  csrfToken = token;
}

export function clearCsrfToken() {
  csrfToken = null;
}
```

`apiFetch` now uses the in-memory token first, falling back to `document.cookie` for same-origin dev:

```typescript
const token = csrfToken ?? document.cookie
  .split("; ")
  .find((c) => c.startsWith("csrf_token="))
  ?.split("=")[1] ?? null;
```

### 2. `src/FRONT/views/pages/Auth/login.tsx`

After successful login, extracts `csrfToken` from the response body (the backend already returns it) and stores it:

```typescript
if (parsed.data?.csrfToken) {
  setCsrfToken(parsed.data.csrfToken);
}
```

### 3. `src/FRONT/views/components/user/AuthContext.tsx`

Clears the stored token on logout:

```typescript
clearCsrfToken();
```

## Why This Works

The backend login response already returns `csrfToken` in the JSON body:

```json
{
  "message": "Login exitoso",
  "user": { ... },
  "csrfToken": "a1b2c3d4..."
}
```

JavaScript **can** read the response body regardless of domain (CORS allows it). So we store the token in a module-level variable and use it for all subsequent `apiFetch` calls.

## Security Properties Preserved

- The CSRF token is **never persisted** to `localStorage`, `sessionStorage`, or any storage that survives page reloads. It lives only in JS memory and is lost on page refresh (requiring re-login, which re-sets the token).
- The double-submit pattern still works: the token value matches the `csrf_token` HttpOnly cookie sent by the browser, so the backend's `csrfProtection` middleware validates correctly.
- On logout, the token is explicitly cleared to prevent stale usage.
- `document.cookie` fallback is kept for same-origin development environments.

## Relationship to Prior Fixes

| Fix | What it solved | Relationship |
|-----|---------------|--------------|
| SEC-01 (SameSite=None) | Cookies not sent cross-site at all | Prerequisite — cookies must be sent for CSRF to work |
| FIX-D (Partitioned) | Browser rejecting unpartitioned third-party cookies (CHIPS) | Complementary — prevents future browser rejection |
| **FIX-F (this fix)** | Frontend can't read the cookie value to send as header | **The actual root cause of the 403** |
| **FIX-G (below)** | CSRF token lost on page refresh / new tab | **Closes the gap in FIX-F** |

## Verification

After deploying, in a fresh incognito window:

1. Open DevTools Network tab
2. Log in → confirm `POST /usuarios/login` returns `csrfToken` in response body
3. Navigate to any page that requires auth
4. Book an appointment or perform any mutation
5. Confirm the `POST /turnos` request has an `X-CSRF-Token` header
6. Confirm the response is `200` (not `403`)

## Separate Issue: Security Monitor Path Logging

The security monitor logs `'/' ` instead of `'/turnos'` because `securityMonitor.ts:34` uses `req.path` (router-relative) instead of `req.originalUrl` (full path). This is a cosmetic logging quirk, not a routing bug. The `/turnos` router is mounted at `/turnos` in `index.ts:106`, so `req.path` is `/` for requests to that router.

To fix: change `req.path` to `req.originalUrl` in `securityMonitor.ts:34` if clearer logs are desired.

---

## FIX-G: CSRF token loss on page refresh / new tab

### The gap

FIX-F stored the CSRF token in a module-level JS variable (`apiFetch.ts:12`). This variable is lost on any full page reload, tab close/reopen, or hard navigation. However, the `access_token` HttpOnly cookie survives, so `AuthContext.tsx` successfully re-hydrates the session via `GET /usuarios/profiles/:codUsuario`. The user appears logged in, but the in-memory `csrfToken` is `null` — the next mutation fails with `403 CSRF token missing`.

### The fix

**Backend** (`users.router.ts`): The `GET /usuarios/profiles/:codUsuario` endpoint now reads the existing `csrf_token` cookie value (already set, `httpOnly: false` so readable via `req.cookies`) and includes it in the response body as `csrfToken`. No token regeneration or rotation — just echoes the existing value.

**Frontend** (`AuthContext.tsx`): In the same `loadProfile()` function that hydrates the session, after a successful response, extracts `csrfToken` and calls `setCsrfToken()` to populate the in-memory variable.

A dedicated `ProfileHydrationResponse` type (in `types/user.ts`) is used instead of adding `csrfToken` to the canonical `UserProfile` type, keeping the auth hydration concern separate from the user profile data used by 7+ other callers.

### Files changed

- `src/BACK/users/users.router.ts` — Added `csrfToken` to profile response, imported `CSRF_COOKIE`
- `src/FRONT/views/components/user/AuthContext.tsx` — Added `setCsrfToken` import, extracts `csrfToken` from hydration response
- `src/FRONT/types/user.ts` — Added `ProfileHydrationResponse` interface

### Verification

1. Fresh incognito → login → book appointment → works (FIX-F)
2. After step 1, F5 refresh → book appointment → works (FIX-G)
3. Second tab while logged in → book appointment → works (hydration path)
4. Logout → login as different user → no stale token
