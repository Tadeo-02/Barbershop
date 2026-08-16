# Barbershop — AGENTS.md

## Quick start
```bash
pnpm install
pnpm prisma db pull && pnpm exec prisma generate  # MySQL must be running with DATABASE_URL set
pnpm dev           # Vite frontend on :5173
pnpm dev:backend   # Express backend via ts-node on :3001
```

Create `.env` manually; no `.env.example` is currently committed. Required/used env vars include MySQL connection values (`DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`), `JWT_SECRET`, optional `FRONTEND_URL`/`PORT`, optional category promotion thresholds, and AFIP billing values (`AFIP_ENVIRONMENT`, `AFIP_CUIT`, `AFIP_ACCESS_TOKEN`, `AFIP_PUNTO_VENTA`, `AFIP_CERT_PATH`, `AFIP_KEY_PATH`). Frontend API base can be set with `VITE_API_URL`.

## Architecture
- **Backend entrypoint:** `index.ts` (tsconfig.backend.json, CommonJS/mixed, Express 5)
- **Frontend entrypoint:** `src/FRONT/views/main.tsx` (Vite + React 19, jsdom tests)
- **Auth:** JWT in localStorage key `token`, `x-user-id` header for rate-limit keying
- **Role routing:** `ProtectedRoute` component checks roles (`admin`/`barber`/`client`)
- **Path alias:** `@lib` → `src/FRONT/views/lib` (configured in tsconfig.app.json + vite.config.ts)
- **Vite proxy:** routes `/appointments`, `/turnos`, `/availability`, `/tipoCortes`, `/categorias`, `/usuarios`, `/login`, `/sucursales`, `/horarios`, `/facturacion` → `http://localhost:3001`

## Notable conventions
- **Spanish API field names:** `contraseña` (not password), `dni`, `codUsuario`, `codSucursal`, `codTurno`, `codCorte`, `nombreCorte`, `valorBase`, `fechaTurno`, `horaDesde`, `horaHasta`, `estado`, `activo` (TINYINT 0/1 in DB, transformed to boolean in Zod)
- **Password strength:** min 10 chars, must include uppercase, lowercase, digit, symbol (regex in `src/BACK/Schemas/usersSchema.ts`)
- **CUIL validation:** cross-field refinement — middle digits must match DNI, format `XX-XXXXXXXX-X`
- **Frontend CSS:** CSS modules (`.module.css`), mobile-first, Tailwind CSS v4 (no config file)
- **Toasts:** `react-hot-toast` for all user feedback

## Commands
| Command | Action |
|---|---|
| `pnpm dev` | Frontend dev server |
| `pnpm dev:backend` | Backend via ts-node with --project tsconfig.backend.json |
| `pnpm build` | `tsc -b && vite build` (frontend) |
| `pnpm build:backend` | `tsc -p tsconfig.backend.json` |
| `pnpm lint` | ESLint (flat config) |
| `pnpm test` | Vitest watch (globals enabled, jsdom) |
| `pnpm test:run` | Vitest single run |
| `pnpm test:coverage` | Vitest with v8 coverage |

## Testing
- **Test root:** `__tests__/` — Vitest config in `vite.config.ts`
- **Pattern:** `__tests__/**/*.test.{ts,tsx}` (excludes `.spec.*`)
- **Setup:** `__tests__/setup.ts` (imports `@testing-library/jest-dom`)
- **Playwright test** (`__tests__/createUser.spec.ts`) uses `playwright/test` directly (not vitest); expects frontend at `localhost:5173`
- **Rate-limit testing** (`__tests__/lib/test-security.js`) requires backend running, runs with plain `node`
- **Global mocks test pattern:** schemas tests use `safeParse` directly; middleware tests mock Express req/res/next

## Dev test credentials (from README)
- **Admin:** admin@gmail.com / 123456
- **Barber:** king@gmail.com / 123456
- **Client:** cp3@gmail.com / Cp3!123456

## Security middleware
- `rateLimiter.ts` — general, auth (5/15min), sensitive (3/60min), modification, user-based variants
- `deduplication.ts` — strict (5s) for login/registration, standard (3s) for updates; keyed by IP + body hash
- `securityMonitor.ts` — logs suspicious events to console
- `authMiddleware.ts` — JWT validation

## Prisma
- Schema is **not committed** (listed in `.gitignore`); run `prisma db pull` from live MySQL DB
- MySQL provider, UUID primary keys (`dbgenerated("(uuid())")`)
- Generated client reuses `.prisma*` packages hoisted by `.npmrc` setting
