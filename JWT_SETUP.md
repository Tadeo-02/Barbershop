# JWT Authentication Setup Guide

## 🎯 Overview

Your barbershop application now uses **JWT (JSON Web Tokens)** with a dual-token system for secure authentication:

- **Access Token**: Short-lived (15 minutes) - Used for API requests
- **Refresh Token**: Long-lived (7 days) - Used to get new access tokens

## 📦 Installation

### 1. Install Dependencies

```bash
pnpm add jsonwebtoken
pnpm add -D @types/jsonwebtoken
```

### 2. Update Database Schema

The `RefreshToken` table should already be created in your database. If not, run:

```bash
npx prisma db push
```

or

```bash
npx prisma migrate dev --name add-refresh-tokens
```

### 3. Configure Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```env
# Generate strong secrets using:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

JWT_ACCESS_SECRET=<your-64-char-random-string>
JWT_REFRESH_SECRET=<your-different-64-char-random-string>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

**⚠️ CRITICAL: Never commit actual secrets to git!**

## 🔑 How It Works

### Login Flow

```
1. User sends email + password → POST /usuarios/login
2. Backend validates credentials
3. Backend generates Access Token (15min) + Refresh Token (7days)
4. Backend stores Refresh Token in database
5. Backend returns both tokens + user data
6. Frontend stores tokens (Refresh in localStorage, Access in memory)
```

### Making Authenticated Requests

```
1. Frontend sends request with Access Token in header
   Authorization: Bearer <access-token>
2. Backend middleware verifies token
3. If valid, request proceeds with req.user populated
4. If expired, frontend uses Refresh Token to get new Access Token
```

### Token Refresh Flow

```
1. Access Token expires (after 15 min)
2. Frontend detects 401 error
3. Frontend sends Refresh Token → POST /usuarios/refresh
4. Backend validates Refresh Token (checks DB + blacklist)
5. Backend returns new Access Token
6. Frontend retries original request with new token
```

### Logout Flow

```
1. User clicks logout
2. Frontend sends Refresh Token → POST /usuarios/logout
3. Backend blacklists the Refresh Token
4. Frontend clears all tokens
5. User can no longer refresh access tokens
```

## 📡 API Endpoints

### Public Endpoints (No Auth Required)

| Method | Endpoint                             | Description                 |
| ------ | ------------------------------------ | --------------------------- |
| POST   | `/usuarios/login`                    | Login with email + password |
| POST   | `/usuarios`                          | Register new user           |
| POST   | `/usuarios/refresh`                  | Get new access token        |
| POST   | `/usuarios/logout`                   | Blacklist refresh token     |
| GET    | `/usuarios/security-question/:email` | Get security question       |
| POST   | `/usuarios/verify-security-answer`   | Verify security answer      |

### Protected Endpoints (Auth Required)

All other endpoints require `Authorization: Bearer <access-token>` header.

| Method | Endpoint                           | Description             | Permission                              |
| ------ | ---------------------------------- | ----------------------- | --------------------------------------- |
| POST   | `/usuarios/logout-all`             | Logout from all devices | Self                                    |
| GET    | `/usuarios/branch/:codSucursal`    | Get barbers by branch   | Any authenticated                       |
| GET    | `/usuarios/profiles/:codUsuario`   | Get user profile        | Self or Admin                           |
| PATCH  | `/usuarios/:codUsuario/deactivate` | Deactivate user         | Admin                                   |
| PATCH  | `/usuarios/:codUsuario/reactivate` | Reactivate user         | Admin                                   |
| ALL    | `/turnos/*`                        | All appointment routes  | Authenticated                           |
| ALL    | `/sucursales/*`                    | All branch routes       | Authenticated (Admin for modifications) |
| ALL    | `/categorias/*`                    | All category routes     | Authenticated (Admin for modifications) |
| ALL    | `/tipoCortes/*`                    | All haircut type routes | Authenticated                           |

## 🔒 Middleware

### `authenticateToken`

Verifies access token and adds user info to `req.user`:

```typescript
import { authenticateToken } from "../middleware/auth";

router.get("/protected", authenticateToken, (req, res) => {
  // req.user.userId
  // req.user.userType ("client" | "barber" | "admin")
});
```

### `requireAdmin`

Requires admin privileges (must use after `authenticateToken`):

```typescript
import { authenticateToken, requireAdmin } from "../middleware/auth";

router.delete(
  "/admin-only",
  authenticateToken,
  requireAdmin,
  controller.delete,
);
```

### `requireBarberOrAdmin`

Requires barber or admin privileges:

```typescript
import { authenticateToken, requireBarberOrAdmin } from "../middleware/auth";

router.get(
  "/barber-data",
  authenticateToken,
  requireBarberOrAdmin,
  controller.getData,
);
```

### `requireSelfOrAdmin`

User can only access their own data (or admin can access any):

```typescript
import { authenticateToken, requireSelfOrAdmin } from "../middleware/auth";

router.get(
  "/users/:codUsuario",
  authenticateToken,
  requireSelfOrAdmin,
  controller.show,
);
```

## 💻 Frontend Integration

### Update AuthContext

```typescript
const login = async (email: string, password: string) => {
  const response = await fetch("/usuarios/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, contraseña: password }),
  });

  const { user, accessToken, refreshToken } = await response.json();

  setUser(user);
  setAccessToken(accessToken);

  // Store refresh token in localStorage
  localStorage.setItem("refreshToken", refreshToken);
};
```

### Making Authenticated Requests

```typescript
const accessToken = getAccessToken(); // From state or localStorage

fetch("/some-endpoint", {
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
});
```

### Auto-Refresh on Token Expiration

```typescript
// Intercept 401 errors and refresh token
const makeAuthRequest = async (url, options) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      // Token expired, refresh it
      const refreshToken = localStorage.getItem("refreshToken");
      const refreshResponse = await fetch("/usuarios/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      const { accessToken: newAccessToken } = await refreshResponse.json();
      setAccessToken(newAccessToken);

      // Retry original request with new token
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newAccessToken}`,
        },
      });
    }

    return response;
  } catch (error) {
    console.error("Request failed:", error);
    throw error;
  }
};
```

### Logout

```typescript
const logout = async () => {
  const refreshToken = localStorage.getItem("refreshToken");

  await fetch("/usuarios/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  setUser(null);
  setAccessToken(null);
  localStorage.removeItem("refreshToken");
};
```

## 🧹 Token Cleanup

Expired tokens should be cleaned from the database periodically. You can set up a cron job:

```typescript
import { cleanupExpiredTokens } from "./utils/blacklist";

// Run daily at 2 AM
setInterval(
  () => {
    cleanupExpiredTokens();
  },
  24 * 60 * 60 * 1000,
);
```

## 🔐 Security Best Practices

1. ✅ **Never store Access Token in localStorage** - Keep in memory (React state)
2. ✅ **Store Refresh Token in httpOnly cookie** (more secure) or localStorage
3. ✅ **Use HTTPS in production** - Prevent token interception
4. ✅ **Rotate secrets regularly** - Update JWT secrets periodically
5. ✅ **Implement token versioning** - Invalidate all tokens when needed
6. ✅ **Monitor blacklist size** - Clean up expired tokens
7. ✅ **Rate limit token endpoints** - Prevent brute force attacks
8. ✅ **Log security events** - Track login failures and token issues

## 🚀 Testing

Test the authentication flow:

```bash
# 1. Login
curl -X POST http://localhost:3001/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","contraseña":"password123"}'

# Response: { accessToken, refreshToken, user }

# 2. Use Access Token
curl http://localhost:3001/usuarios/profiles/123 \
  -H "Authorization: Bearer <access-token>"

# 3. Refresh Token
curl -X POST http://localhost:3001/usuarios/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refresh-token>"}'

# 4. Logout
curl -X POST http://localhost:3001/usuarios/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refresh-token>"}'
```

## 📊 Database Schema

The `RefreshToken` table stores active refresh tokens:

```prisma
model RefreshToken {
  id            String   @id @default(uuid())
  token         String   @unique
  codUsuario    String
  expiresAt     DateTime
  blacklisted   Boolean  @default(false)
  blacklistedAt DateTime?
  createdAt     DateTime @default(now())

  usuario       usuarios @relation(fields: [codUsuario], references: [codUsuario])

  @@index([codUsuario])
  @@index([expiresAt])
}
```

## ❓ Troubleshooting

### "Token expired" error

- Access tokens expire after 15 minutes
- Use the refresh endpoint to get a new access token

### "Token revoked" error

- User logged out or token was blacklisted
- User must login again

### "Invalid token" error

- Token signature doesn't match
- Token is malformed
- Check JWT_SECRET configuration

### User can't logout

- Ensure refresh token is being sent to logout endpoint
- Check database connection for blacklisting

## 📝 Migration Checklist

- [ ] Install jsonwebtoken dependency
- [ ] Update database schema (RefreshToken table)
- [ ] Configure environment variables (.env)
- [ ] Update frontend AuthContext
- [ ] Update all API calls to include Authorization header
- [ ] Implement token refresh logic
- [ ] Update logout functionality
- [ ] Test all authentication flows
- [ ] Set up token cleanup cron job
- [ ] Update API documentation

---

🎉 **Your barbershop app is now secured with JWT authentication!**
