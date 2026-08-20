# Logging Configuration

## Backend (Pino)

The backend uses [Pino](https://getpino.io/) as its centralized logging library.

### Log Levels

| Level | Description |
|-------|-------------|
| `debug` | Verbose diagnostic info (query results, request bodies, internal state) |
| `info` | Normal operations (CRUD success, data fetched, appointments created) |
| `warn` | Unexpected but non-critical conditions (missing config, missing categories) |
| `error` | Failures that require attention (DB errors, Prisma errors, failed operations) |

### Configuration

Set `LOG_LEVEL` in your `.env` file:

```bash
# Development (default: debug)
LOG_LEVEL=debug

# Production (default: info)
LOG_LEVEL=info
```

If `LOG_LEVEL` is not set, the default is:
- `debug` when `NODE_ENV` is not `"production"`
- `info` when `NODE_ENV === "production"`

### Remote Logging (Optional)

To send logs to an external service (e.g., Better Stack / Logtail, Datadog):

```bash
LOG_REMOTE_URL=https://in.logtail.com
LOG_REMOTE_TOKEN=your-token-here
```

If these are not set, logs are written to stdout/stderr as fallback.

### Development

In development mode, Pino uses `pino-pretty` for human-readable colored output.

### Production

In production, logs are output as JSON (structured) for machine parsing.

## Frontend

The frontend uses a lightweight wrapper around `console.*`:

- **Development**: `debug`, `info`, `warn`, `error` are all visible
- **Production**: only `warn` and `error` are visible (controlled automatically via `import.meta.env.PROD`)

No configuration needed for the frontend.

## Files

- Backend logger: `src/BACK/lib/logger.ts`
- Frontend logger: `src/FRONT/views/lib/logger.ts` (to be created)
