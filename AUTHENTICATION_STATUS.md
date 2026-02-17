# 🔐 Authentication Implementation Status

## ✅ Completed Implementation

All backend routes now require JWT authentication via the `authenticateToken` middleware.

### 🎯 Protected Routes Summary

| Router              | All Routes Protected | Admin Only Routes                              | Notes                                                |
| ------------------- | -------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| **Users**           | ✅ Yes               | Deactivate, Reactivate                         | Login/Register are public                            |
| **Appointments**    | ✅ Yes               | None                                           | All users can manage appointments                    |
| **Branches**        | ✅ Yes               | Create, Update, Delete, Deactivate, Reactivate | Read operations available to all authenticated users |
| **Categories**      | ✅ Yes               | Create, Update, Delete                         | Read operations available to all authenticated users |
| **Type of Haircut** | ✅ Yes               | Create, Update, Delete                         | Read operations available to all authenticated users |

---

## 📋 Route-by-Route Details

### Users Router (`/usuarios`)

#### Public Routes (No Authentication)

- `POST /login` - User login
- `POST /` - User registration
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout (blacklist token)
- `GET /security-question/:email` - Get security question
- `POST /verify-security-answer` - Verify security answer

#### Protected Routes (Requires Authentication)

- `POST /logout-all` - Logout from all devices
- `GET /branch/:codSucursal` - Get barbers by branch
- `GET /schedule/:codSucursal/:fechaTurno/:horaDesde` - Get available barbers
- `GET /profiles/:codUsuario` - Get user profile with category
- `PATCH /:codUsuario/deactivate` - Deactivate user (Admin)
- `PATCH /:codUsuario/reactivate` - Reactivate user (Admin)
- `PATCH /:codUsuario/security-question` - Update security question
- All base CRUD routes (GET, POST, PUT, DELETE)

---

### Appointments Router (`/turnos`)

**All routes require authentication**

#### Read Operations

- `GET /` - List all appointments
- `GET /create` - Get create form
- `GET /:codTurno` - Get appointment by ID
- `GET /:codTurno/update` - Get update form
- `GET /available/:fechaTurno/:codSucursal` - Get available time slots
- `GET /barber/:codBarbero/:fechaTurno` - Get barber appointments by date
- `GET /user/:codUsuario` - Get user appointments
- `GET /branch/:codSucursal` - Get branch appointments
- `GET /pending/barber/:codBarbero` - Get pending appointments for barber
- `GET /pending/branch/:codSucursal` - Get pending appointments for branch

#### Modification Operations

- `POST /` - Create appointment
- `PUT /:codTurno` - Update appointment
- `PUT /:codTurno/cancel` - Cancel appointment
- `PUT /:codTurno/checkout` - Checkout appointment
- `PUT /:codTurno/update` - Update appointment details
- `PUT /:codTurno/no-show` - Mark appointment as no-show
- `DELETE /:codTurno` - Delete appointment

---

### Branches Router (`/sucursales`)

**All routes require authentication**

#### Read Operations

- `GET /` - List all branches
- `GET /all` - List all branches (including inactive)
- `GET /create` - Get create form
- `GET /:codSucursal` - Get branch by ID
- `GET /:codSucursal/update` - Get update form

#### Modification Operations (Admin Only)

- `POST /` - Create branch
- `PUT /:codSucursal` - Update branch
- `PATCH /:codSucursal/deactivate` - Deactivate branch
- `PATCH /:codSucursal/reactivate` - Reactivate branch
- `DELETE /:codSucursal` - Delete branch

---

### Categories Router (`/categorias`)

**All routes require authentication**

#### Read Operations

- `GET /` - List all categories
- `GET /create` - Get create form
- `GET /:codCategoria` - Get category by ID
- `GET /:codCategoria/update` - Get update form
- `GET /:codCategoria/clients` - List clients in category

#### Modification Operations (Admin Only)

- `POST /` - Create category
- `PUT /:codCategoria` - Update category
- `DELETE /:codCategoria` - Delete category

---

### Type of Haircut Router (`/tipoCortes`)

**All routes require authentication**

#### Read Operations

- `GET /` - List all haircut types
- `GET /create` - Get create form
- `GET /:codCorte` - Get haircut type by ID
- `GET /:codCorte/update` - Get update form

#### Modification Operations (Admin Only)

- `POST /` - Create haircut type
- `PUT /:codCorte` - Update haircut type
- `DELETE /:codCorte` - Delete haircut type

---

## 🔑 Middleware Stack

Each protected route uses the following middleware in order:

1. **authenticateToken** - Verifies JWT and populates `req.user`
2. **Rate Limiter** - User-based rate limiting (100 req/15min for reads, 30 req/5min for modifications)
3. **Deduplication** (for POST/PUT/PATCH) - Prevents duplicate submissions
4. **Controller** - Handles the actual business logic

Example:

```typescript
router.post(
  "/",
  authenticateToken, // 1. Verify JWT
  userModificationLimiter, // 2. Rate limit
  strictDeduplication, // 3. Prevent duplicates
  controller.store, // 4. Execute
);
```

---

## 🛡️ Security Layers

### Layer 1: Authentication

- **Access Token** (15 minutes) - Required in `Authorization: Bearer <token>` header
- **Refresh Token** (7 days) - Used to obtain new access tokens

### Layer 2: Rate Limiting

- **User-based** - Tracks by user ID from JWT
- **IP-based** - Fallback for public routes
- Different limits for read vs. modification operations

### Layer 3: Deduplication

- Prevents duplicate submissions within time windows
- Based on request body + IP hash
- Different strictness levels (1s, 3s, 5s)

### Layer 4: Security Monitoring

- Tracks failed requests per IP
- Logs suspicious activity
- Automatic blacklisting for excessive failures

---

## 🚨 Breaking Changes

### Frontend Must Update

All API requests now require an `Authorization` header:

```typescript
// Before (insecure)
fetch("/turnos/user/123", {
  headers: {
    "x-user-id": "123", // ❌ No longer works
  },
});

// After (secure)
fetch("/turnos/user/123", {
  headers: {
    Authorization: `Bearer ${accessToken}`, // ✅ Required
  },
});
```

### Login Response Changed

Login now returns tokens:

```typescript
// New login response
{
  "success": true,
  "message": "Login exitoso",
  "user": { ... },
  "accessToken": "eyJhbGc...",    // NEW
  "refreshToken": "eyJhbGc..."    // NEW
}
```

---

## 📱 Frontend Migration Guide

### 1. Update AuthContext

```typescript
const [accessToken, setAccessToken] = useState<string | null>(null);
const [refreshToken, setRefreshToken] = useState<string | null>(null);

const login = async (email, password) => {
  const response = await fetch("/usuarios/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, contraseña: password }),
  });

  const { user, accessToken, refreshToken } = await response.json();

  setUser(user);
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);

  localStorage.setItem("refreshToken", refreshToken);
};
```

### 2. Create API Request Helper

```typescript
const makeAuthRequest = async (url: string, options: RequestInit = {}) => {
  const token = getAccessToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  // Handle token expiration
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    // Retry with new token
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${newToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  return response;
};
```

### 3. Update All API Calls

Replace all `fetch` calls with the authenticated version:

```typescript
// Old
const data = await fetch("/turnos/user/123").then((r) => r.json());

// New
const data = await makeAuthRequest("/turnos/user/123").then((r) => r.json());
```

---

## ✅ Security Checklist

- [x] JWT authentication on all protected routes
- [x] Token blacklisting for logout
- [x] Dual-token system (access + refresh)
- [x] User-based rate limiting
- [x] Deduplication middleware
- [x] Security event monitoring
- [x] Role-based access (admin, barber, client)
- [x] Password encryption (bcrypt)
- [x] Input validation (Zod schemas)
- [x] SQL injection protection (Prisma ORM)
- [x] Helmet security headers
- [x] CORS configuration

---

## 🔄 Next Steps for Frontend

1. Install dependencies (if using axios):

   ```bash
   pnpm add axios
   ```

2. Create axios instance with interceptors:

   ```typescript
   import axios from "axios";

   const api = axios.create({
     baseURL: "http://localhost:3001",
   });

   // Add token to all requests
   api.interceptors.request.use((config) => {
     const token = getAccessToken();
     if (token) {
       config.headers.Authorization = `Bearer ${token}`;
     }
     return config;
   });

   // Auto-refresh on 401
   api.interceptors.response.use(
     (response) => response,
     async (error) => {
       if (error.response?.status === 401) {
         await refreshAccessToken();
         return api.request(error.config);
       }
       return Promise.reject(error);
     },
   );
   ```

3. Update all components to use the new API client

4. Test authentication flow:
   - Login
   - Make authenticated request
   - Wait for token to expire (15 min)
   - Verify auto-refresh works
   - Logout

---

🎉 **All backend routes are now secured with JWT authentication!**
