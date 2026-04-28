# 🚀 Quick Start Guide - Docker Deployment

Get your Barbershop app running in **minutes** with Docker!

## Prerequisites (2 min)

- [ ] Docker installed ([download](https://docker.com))
- [ ] Docker Compose installed (included with Docker Desktop)
- [ ] Git installed ([download](https://git-scm.com))

## Local Development (5 minutes)

### 1. Clone & Setup

```bash
git clone https://github.com/utnfrrodsw/tp.git
cd Barbershop
cp .env.example .env
```

### 2. Start Everything

```bash
# Windows (PowerShell)
.\docker-manage.bat start

# Mac/Linux
./docker-manage.sh start

# Or use docker-compose directly
docker-compose up -d
```

### 3. Access the App

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Database:** Your remote MySQL server

### 4. Done! 🎉

```bash
# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

---

## One-Command Setup (Alternative)

```bash
git clone https://github.com/utnfrrodsw/tp.git && \
cd Barbershop && \
cp .env.example .env && \
docker-compose up -d && \
sleep 15 && \
docker-compose exec backend pnpm exec prisma db push && \
echo "✓ App running at http://localhost:3000"
```

---

## Common Commands

### View Status

```bash
docker-compose ps
```

### View Logs (Real-time)

```bash
docker-compose logs -f
docker-compose logs -f backend    # Just backend
docker-compose logs -f frontend   # Just frontend
```

### Stop Everything

```bash
docker-compose down
```

### Full Restart

```bash
docker-compose down -v
docker-compose up --build
```

### Access Database

Since your MySQL is remote, use your database client directly:

```bash
# Connect to your remote MySQL
mysql -h your-db-host.com -u your_user -p your_database
```

Or run Prisma commands in the backend container:

```bash
docker-compose exec backend pnpm exec prisma db validate
docker-compose exec backend pnpm exec prisma migrate deploy
```

### Run Migrations

```bash
docker-compose exec backend pnpm exec prisma migrate deploy
```

---

## For Production Deployment

### Option 1: Railway.app (⭐ Easiest)

```bash
# 1. Push to GitHub
git push origin main

# 2. Connect to Railway at https://railway.app
# 3. Done! Auto-deploys on every push
```

**Cost:** ~$5-15/month  
**Time:** 5 minutes

### Option 2: VPS (DigitalOcean, Linode, etc.)

```bash
# 1. SSH into your server
ssh root@your-server-ip

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 3. Clone and deploy
git clone https://github.com/utnfrrodsw/tp.git
cd Barbershop
cp .env.example .env
# Edit .env with production values
nano .env
docker-compose up -d
```

**Cost:** $5-20/month  
**Time:** 15 minutes

### Option 3: AWS/Google Cloud/Azure

See [DEPLOYMENT_GUIDES.md](DEPLOYMENT_GUIDES.md) for detailed instructions.

---

## Troubleshooting

### ❌ Services won't start

```bash
# View detailed logs
docker-compose logs

# Rebuild everything
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### ❌ Can't access http://localhost:3000

```bash
# Check if running
docker-compose ps

# Check for port conflicts
netstat -ano | findstr :3000
```

### ❌ Database connection error

```bash
# Wait for database startup
sleep 15

# Run migrations
docker-compose exec backend pnpm exec prisma db push
```

- especially the `DATABASE_URL`:

```env
NODE_ENV=production
BACKEND_PORT=3001
FRONTEND_PORT=3000
FRONTEND_URL=http://localhost:3000

# Your REMOTE MySQL connection string
DATABASE_URL="mysql://YOUR_USER:YOUR_PASSWORD@your-host.com:3306/your_database"

# Your AFIP credentials (if using billing)
AFIP_ACCESS_TOKEN=your_token
AFIP_CUIT=your_cuit
AFIP_ENVIRONMENT=testing

# SMTP (optional)
SMTP_HOST=smtp.example.com
SMTP_USER=your@email.com
SMTP_PASS=your_password
```

---

## File Reference

| File                        | Purpose                                       |
| --------------------------- | --------------------------------------------- |
| `docker-compose.yml`        | Defines all services (backend, frontend only) |
| `Dockerfile.backend`        | Builds the Node.js backend container          |
| `Dockerfile.frontend`       | Builds the Nginx frontend container           |
| `nginx.conf`                | Nginx configuration (routes, proxies)         |
| `.env.example`              | Environment variables template                |
| `docker-manage.bat`         | Windows management script                     |
| `docker-manage.sh`          | Linux/Mac management script                   |
| `DOCKER_SETUP.md`           | Comprehensive Docker documentation            |
| `DEPLOYMENT_GUIDES.md`      | Platform-specific deployment guides           |
| `DOCKER_TROUBLESHOOTING.md` | Common issues & solutions                     |

---

## Next Steps

1. **Local Development**
   - Run `docker-compose up -d`
   - Start coding
   - Services auto-reload (if using dev override)

2. **Testing**
   - Run `docker-compose exec backend pnpm test`
   - Run `docker-compose exec frontend pnpm test`

3. **Deployment**
   - Choose a platform ([comparison](DEPLOYMENT_GUIDES.md))
   - Follow platform-specific guide
   - Update DNS records

4. **Monitoring**
   - Check logs: `docker-compose logs -f`
   - Monitor health: `docker-compose ps`
   - Setup alerts on your platform

---

## Support

- **Docs:** [DOCKER_SETUP.md](DOCKER_SETUP.md)
- **Troubleshooting:** [DOCKER_TROUBLESHOOTING.md](DOCKER_TROUBLESHOOTING.md)
- **Deployment:** [DEPLOYMENT_GUIDES.md](DEPLOYMENT_GUIDES.md)
- **GitHub Issues:** [Report a problem](https://github.com/utnfrrodsw/tp/issues)

---

**Ready? Run:**

```bash
docker-compose up -d
```

**Then visit:** http://localhost:3000

🚀 Happy deploying!

---

_Last Updated: April 2026_
