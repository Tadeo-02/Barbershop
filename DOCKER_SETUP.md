# Docker Deployment Setup

This project is configured for containerized deployment using Docker and Docker Compose.

## Overview

The Docker setup includes:

- **Frontend**: React app served via Nginx (port 3000)
- **Backend**: Express.js API server (port 3001)
- **Database**: Remote MySQL (external service)

Frontend and backend communicate through a Docker network. The database is external and accessed via `DATABASE_URL`.

## Prerequisites

- Docker (v20.10+)
- Docker Compose (v2.0+)
- Git (for cloning the repository)

## Quick Start - Local Development

1. **Clone the repository and enter directory**

   ```bash
   git clone <your-repo-url>
   cd Barbershop
   ```

2. **Create environment file from template**

   ```bash
   cp .env.example .env
   ```

3. **Update `.env` with your configuration** (optional for local dev)

   ```bash
   # Edit .env file with your preferred settings
   # For local development, defaults are fine
   ```

4. **Build and start all services**

   ```bash
   docker-compose up --build
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Database: your remote MySQL host

6. **Stop services**
   ```bash
   docker-compose down
   ```

## Commands Reference

### Starting Services

```bash
# Start all services in foreground
docker-compose up

# Start all services in background
docker-compose up -d

# Start with fresh build
docker-compose up --build

# Rebuild specific service
docker-compose build backend
docker-compose build frontend
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# Stop specific service
docker-compose stop backend
docker-compose stop frontend
```

### Viewing Logs

```bash
# View logs from all services
docker-compose logs -f

# View logs from specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# View last 100 lines
docker-compose logs --tail=100
```

### Database Management

#### Access MySQL directly (remote)

```bash
mysql -h your-db-host.com -u your_user -p your_database
# Enter password when prompted (check DATABASE_URL or DB_* values)
```

#### Run Prisma commands inside backend container

```bash
# Check Prisma status
docker-compose exec backend pnpm exec prisma migrate status

# Create new migration
docker-compose exec backend pnpm exec prisma migrate dev --name migration_name

# Push schema to database
docker-compose exec backend pnpm exec prisma db push

# View Prisma studio (interactive database browser)
docker-compose exec backend pnpm exec prisma studio
```

#### Backup database (remote)

```bash
mysqldump -h your-db-host.com -u your_user -p your_database > backup.sql
```

#### Restore database (remote)

```bash
mysql -h your-db-host.com -u your_user -p your_database < backup.sql
```

### Debugging

#### Check service health

```bash
docker-compose ps
# Shows status of all services including health checks
```

#### Inspect running container

```bash
# Get shell access to backend
docker-compose exec backend sh

# Get shell access to frontend
docker-compose exec frontend sh

# Database access is via your remote provider
```

#### View container resource usage

```bash
docker stats
```

## Production Deployment

### On Cloud Platforms

#### AWS (ECS)

1. Push images to ECR
2. Create ECS cluster and task definition
3. Configure RDS for MySQL (or use managed service)
4. Deploy using Docker Compose or CloudFormation

#### Google Cloud Run

1. Push images to Google Container Registry (GCR)
2. Deploy backend and frontend separately
3. Use Cloud SQL for MySQL

#### Azure Container Instances

1. Push images to Azure Container Registry (ACR)
2. Create container instances
3. Use Azure Database for MySQL

#### Railway.app, Render, or Similar

1. Connect your Git repository
2. Configure environment variables in platform dashboard
3. Platform automatically builds and deploys Docker images

### Environment Variables for Production

Before deploying, create a `.env` file with production values:

```env
NODE_ENV=production

# Remote MySQL connection
DATABASE_URL=mysql://user:password@your-db-host.com:3306/database_name

# Your backend configuration
# AFIP_CUIT=your_production_cuit
# AFIP_SECRET=your_production_secret
```

### Database URL (required)

Set `DATABASE_URL` to your remote MySQL connection string.

## Security Considerations

1. **Database Credentials**
   - Ensure `DATABASE_URL` uses strong, non-default credentials
   - Rotate database credentials regularly

2. **Environment Variables**
   - Never commit `.env` file to Git
   - Use `.gitignore` to exclude it
   - Manage secrets securely on your deployment platform

3. **Database Access**
   - Don't expose MySQL port (3306) to public internet
   - Only internal services should access the database
   - Use firewalls and security groups on cloud platforms

4. **Backend Security**
   - Backend container doesn't expose unnecessary ports
   - Uses non-root user (nodejs)
   - Health checks enable automatic restarts on failures

5. **HTTPS/SSL**
   - Use a reverse proxy or load balancer for HTTPS
   - Configure SSL certificates (Let's Encrypt recommended)
   - Set `X-Forwarded-Proto` headers properly

## Monitoring & Logs

### Docker Compose Logs

```bash
# Real-time logs
docker-compose logs -f

# Last 50 lines, follow new entries
docker-compose logs -f --tail=50
```

### Health Checks

All services include health checks that:

- Run every 30 seconds
- Restart containers if health check fails
- Wait 5-30 seconds for service startup

View health status:

```bash
docker-compose ps
```

## Troubleshooting

### Services won't start

```bash
# Check logs
docker-compose logs

# Rebuild images
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Database connection issues

```bash
# Verify connection string in .env
# Format: mysql://user:password@your-db-host:3306/database_name

# Check connectivity to your remote DB host
mysql -h your-db-host.com -u your_user -p your_database
```

### Backend port conflicts

```bash
# Change BACKEND_PORT in .env
# Default is 3001
BACKEND_PORT=3002
docker-compose up
```

### Frontend not loading backend data

```bash
# Verify backend is running
curl http://localhost:3001/health

# Check Nginx proxy configuration in nginx.conf
# Verify routes match your API endpoints

# Check browser console for CORS errors
```

### Out of disk space

```bash
# Remove unused Docker resources
docker system prune -a

# Remove all stopped containers
docker container prune

# Remove dangling images
docker image prune
```

## Scaling

### Running multiple instances of a service

```bash
# Scale backend to 3 instances (requires load balancer)
docker-compose up -d --scale backend=3

# Note: Frontend should only run 1 instance in Compose
```

### Resource limits

Edit `docker-compose.yml` to add resource limits:

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

## Cleanup

### Remove all containers and volumes

```bash
docker-compose down -v
```

### Remove unused images

```bash
docker image prune
```

### Full cleanup (WARNING: removes all Docker data)

```bash
docker system prune -a --volumes
```

## Support & Next Steps

1. **For deployment platforms**: Read platform-specific documentation
2. **For scaling**: Consider Kubernetes (k8s) for production deployments
3. **For CI/CD**: Set up GitHub Actions, GitLab CI, or similar to auto-build and push images
4. **For monitoring**: Integrate with monitoring solutions (Prometheus, DataDog, etc.)

---

**Last Updated**: April 2026
**Docker Version**: 20.10+
**Docker Compose Version**: 2.0+
