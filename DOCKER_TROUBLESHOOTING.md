# Docker Troubleshooting Guide

## Common Issues & Solutions

Note: This setup uses a remote MySQL database by default. Unless you added a local db service, commands that reference a `db` container do not apply.

### 1. Containers Won't Start

#### Symptom

```bash
docker-compose up
# Shows error or exits immediately
```

#### Solutions

**Check logs:**

```bash
docker-compose logs -f
docker-compose logs backend
docker-compose logs frontend
```

**Rebuild without cache:**

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

**Check port conflicts:**

```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :3306

# macOS/Linux
lsof -i :3000
lsof -i :3001
lsof -i :3306

# Kill process using port (replace PID)
# Windows: taskkill /PID <PID> /F
# Linux/Mac: kill -9 <PID>
```

---

### 2. Database Connection Errors

#### Symptom

```
Error: connect ECONNREFUSED 127.0.0.1:3306
Error: Client network socket disconnected before secure TLS connection was established
```

#### Solutions

**Wait for database startup:**

- Docker Compose includes health checks
- Wait 10-15 seconds for MySQL to be ready
- If still failing:

```bash
# Manually check connection to your remote DB
mysql -h your-db-host.com -u your_user -p your_database
# Enter password from DATABASE_URL or DB_* values
```

**Fix DATABASE_URL format:**

```bash
# ✓ Correct for remote DB:
DATABASE_URL=mysql://barbershop_user:password@your-db-host:3306/barbershop

# ✗ Wrong (localhost):
DATABASE_URL=mysql://barbershop_user:password@localhost:3306/barbershop

# ✗ Wrong (no credentials):
DATABASE_URL=mysql://localhost:3306/barbershop
```

**Verify credentials match:**

```bash
# In .env, ensure these match:
DB_USER=barbershop_user
DB_PASSWORD=barbershop_secure_password_change_me
DB_NAME=barbershop

# And DATABASE_URL uses same:
DATABASE_URL=mysql://barbershop_user:barbershop_secure_password_change_me@your-db-host:3306/barbershop
```

---

### 3. Backend Crashes After Starting

#### Symptom

```
barbershop-backend exited with code 0
```

#### Solutions

**Check backend logs:**

```bash
docker-compose logs backend
```

**Run migrations:**

```bash
# Wait for database to be healthy first
sleep 15

# Push schema to database
docker-compose exec backend pnpm exec prisma db push

# Or run migrations
docker-compose exec backend pnpm exec prisma migrate deploy
```

**Check for missing environment variables:**

```bash
# View running backend environment
docker-compose exec backend env | grep -i afip
docker-compose exec backend env | grep -i database
```

---

### 4. Frontend Shows Blank Page

#### Symptom

```
http://localhost:3000 loads but shows nothing
```

#### Solutions

**Check frontend logs:**

```bash
docker-compose logs frontend
```

**Verify backend is running:**

```bash
curl http://localhost:3001/health
# Should return: {"status":"healthy","timestamp":"..."}
```

**Check Nginx configuration:**

```bash
# View nginx config in container
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf

# Test Nginx config
docker-compose exec frontend nginx -t
```

**Check browser console for errors:**

- Open http://localhost:3000
- Press F12 → Console tab
- Look for red errors

**Clear browser cache:**

- Ctrl+Shift+Delete (Windows)
- Cmd+Shift+Delete (Mac)

---

### 5. CORS Errors in Browser

#### Symptom

```
Access to XMLHttpRequest blocked by CORS policy
```

#### Solutions

**This is usually expected in development**

**Check backend has CORS enabled:**

```bash
# In src/BACK/main.router.ts or main.controller.ts, verify:
import cors from 'cors';
app.use(cors());
```

**Verify Nginx is proxying correctly:**

```bash
# Test API through proxy
curl -v http://localhost:3000/appointments

# Should proxy to backend
# If 404, check nginx.conf routes match your API endpoints
```

**For production, configure specific origins:**

```javascript
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
```

---

### 6. Port Already in Use

#### Symptom

```
Error: bind EADDRINUSE 0.0.0.0:3000
```

#### Solutions

**Change ports in .env:**

```env
BACKEND_PORT=3002
FRONTEND_PORT=3001
DB_PORT=3307
```

**Or kill existing process:**

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>

# Or just use Docker to remove everything
docker-compose down
docker system prune -a
```

---

### 7. Out of Disk Space

#### Symptom

```
Error: no space left on device
no space left on device writing to: ...
```

#### Solutions

```bash
# See what's taking space
docker system df

# Clean up unused containers/images
docker system prune -a --volumes

# Remove specific images
docker rmi image_name

# Remove dangling volumes
docker volume prune

# On Windows, Docker Desktop:
Settings → Resources → Disk image size
# Increase the limit
```

---

### 8. Service Health Checks Failing

#### Symptom

```
unhealthy
```

#### Solutions

**Increase health check wait time:**

```yaml
# In docker-compose.yml, for each service:
healthcheck:
  test: ["CMD", "wget", "--tries=1", "--spider", "http://localhost:3000/"]
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 60s # <-- Increase this
```

**Rebuild after changes:**

```bash
docker-compose down
docker-compose build
docker-compose up
```

---

### 9. Environment Variables Not Working

#### Symptom

```
undefined variable
process.env.VARIABLE_NAME is undefined
```

#### Solutions

**Verify .env exists:**

```bash
ls -la .env
# Should show file exists

# If not:
cp .env.example .env
```

**Check variable is set:**

```bash
# View variables in container
docker-compose exec backend env | grep VARIABLE_NAME

# Or check in application
docker-compose exec backend pnpm exec node -e "console.log(process.env.DATABASE_URL)"
```

**Reload after .env changes:**

```bash
# Recreate containers to pick up new env vars
docker-compose down
docker-compose up -d
```

---

### 10. Migrations Not Running

#### Symptom

```
Prisma migrations not applied
Database doesn't have tables
```

#### Solutions

**Run migrations manually:**

```bash
# Wait for database first
sleep 15

# Create migration
docker-compose exec backend pnpm exec prisma migrate dev --name init

# Or push schema directly
docker-compose exec backend pnpm exec prisma db push

# Or deploy existing migrations
docker-compose exec backend pnpm exec prisma migrate deploy
```

**Check migration status:**

```bash
docker-compose exec backend pnpm exec prisma migrate status
```

**Verify database connection:**

```bash
docker-compose exec backend pnpm exec prisma db validate

# Or check manually
mysql -h your-db-host.com -u your_user -p your_database -e "SHOW TABLES;"
```

---

### 11. Prisma Studio Not Working

#### Symptom

```
ERROR: Can't reach database server at `your-db-host:3306`
```

#### Solutions

```bash
# Prisma Studio requires direct connection, not through Docker bridge
# Instead use MySQL client:

# Access the database directly (remote)
mysql -h your-db-host.com -u your_user -p your_database

# Or setup tunneling
# From host machine:
docker-compose exec backend pnpm exec prisma studio --browser none
# Then access from host at http://localhost:5555
```

---

### 12. Logs are Too Noisy

#### Solutions

**Filter logs by service:**

```bash
docker-compose logs backend
docker-compose logs frontend
```

**Follow only new logs:**

```bash
docker-compose logs -f --tail=50 backend
```

**Search logs for errors:**

```bash
docker-compose logs backend | grep -i error
docker-compose logs backend | grep -i warning
```

**Save logs to file:**

```bash
docker-compose logs > all_logs.txt
docker-compose logs backend > backend_logs.txt
```

---

### 13. Testing Locally Before Production

#### Verify Everything Works

```bash
# 1. Check all services are running
docker-compose ps
# All should show "Up"

# 2. Check health endpoints
curl http://localhost:3001/health
# Should return: {"status":"healthy","timestamp":"..."}

curl http://localhost:3000/
# Should return HTML

# 3. Test database connection
docker-compose exec backend pnpm exec prisma db validate
# Should show "✓ Connection successful"

# 4. Check logs for errors
docker-compose logs

# 5. Test API endpoints
curl -X GET http://localhost:3001/turnos
curl -X GET http://localhost:3001/usuarios
curl -X GET http://localhost:3001/categorias

# 6. Test frontend loads
# Open http://localhost:3000 in browser
# Check browser console (F12) for errors

# 7. View resource usage
docker stats
```

---

### 14. Performance Issues

#### Symptom

```
Slow responses
High CPU/Memory usage
```

#### Solutions

**Check resource limits:**

```bash
docker stats
# Look for high CPU% or MEM%
```

**Set resource limits in docker-compose.yml:**

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: 512M
        reservations:
          cpus: "0.5"
          memory: 256M
```

**Check database performance:**

```bash
# Connect to database (remote)
mysql -h your-db-host.com -u your_user -p your_database -e "SELECT * FROM INFORMATION_SCHEMA.PROCESSLIST;"
```

**View container logs for errors:**

```bash
docker-compose logs backend | tail -100
# Check your DB provider logs for slow queries/errors
```

---

### 15. Need Help?

**Advanced debugging:**

```bash
# Get shell access to container
docker-compose exec backend sh
docker-compose exec frontend sh
# Check file permissions
docker-compose exec backend ls -la dist/

# Check Node version
docker-compose exec backend node --version

# Check MySQL version (remote)
mysql -h your-db-host.com -u your_user -p -e "SELECT VERSION();"
```

**Collect diagnostics for support:**

```bash
# Collect all useful info
docker-compose version > diagnostics.txt
docker version >> diagnostics.txt
docker-compose ps >> diagnostics.txt
docker-compose logs > full_logs.txt
```

---

_Last Updated: April 2026_
