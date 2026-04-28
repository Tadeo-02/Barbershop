# Mecha's Barbershop

Aplicación de Gestión de Turnos y Usuarios de Mecha's Barbershop

## 🚀 Quick Start with Docker (Recommended)

The easiest way to get started is with **Docker**:

```bash
cp .env.example .env
docker-compose up -d
```

Then visit: **http://localhost:3000**

📖 See [QUICKSTART.md](QUICKSTART.md) for detailed Docker setup.

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get running in 5 minutes with Docker
- **[DOCKER_SETUP.md](DOCKER_SETUP.md)** - Complete Docker guide with commands
- **[DEPLOYMENT_GUIDES.md](DEPLOYMENT_GUIDES.md)** - Deploy to Railway, AWS, Google Cloud, etc.
- **[DOCKER_TROUBLESHOOTING.md](DOCKER_TROUBLESHOOTING.md)** - Common issues & solutions
- **[PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md)** - Pre-deployment verification

---

## Manual Setup (Development Only)

If you prefer not to use Docker:

### Instructions

1. Clone repository (delete old node_modules if you have issues)

   ```bash
   git clone <repo-url>
   cd Barbershop
   rm -rf node_modules  # if needed
   ```

2. Install dependencies

   ```bash
   pnpm install
   ```

3. Setup database

   ```bash
   pnpm exec prisma db pull
   pnpm exec prisma generate
   ```

4. Start Frontend

   ```bash
   pnpm dev
   # Opens http://localhost:5173
   ```

5. Start Backend (in another terminal)
   ```bash
   pnpm dev:backend
   # Backend runs on http://localhost:3001
   ```

---

## Test Accounts

| Role   | Email           | Password   |
| ------ | --------------- | ---------- |
| Client | cp3@gmail.com   | Cp3!123456 |
| Barber | king@gmail.com  | 123456     |
| Admin  | admin@gmail.com | 123456     |

---

## Production Deployment

Ready to deploy? Choose your platform:

- **Railway.app** (⭐ Easiest) - [Guide](DEPLOYMENT_GUIDES.md#railwayapp)
- **DigitalOcean** - [Guide](DEPLOYMENT_GUIDES.md#digitalocean-app-platform)
- **AWS** - [Guide](DEPLOYMENT_GUIDES.md#aws-ecs)
- **Google Cloud** - [Guide](DEPLOYMENT_GUIDES.md#google-cloud-run)
- **VPS/Manual** - [Guide](DEPLOYMENT_GUIDES.md#docker-hub--manual-deployment)

See [DEPLOYMENT_GUIDES.md](DEPLOYMENT_GUIDES.md) for detailed instructions.

---

## Technology Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** MySQL + Prisma ORM
- **Deployment:** Docker + Docker Compose
- **Testing:** Vitest + React Testing Library

---

## Project Structure

```
src/
  FRONT/           # React frontend
  BACK/            # Express backend
prisma/
  schema.prisma    # Database schema
__tests__/         # Test files
docker-compose.yml # Docker orchestration
Dockerfile.*       # Container definitions
```

---

## Common Commands

### With Docker (Recommended)

```bash
docker-compose up -d          # Start all services
docker-compose down           # Stop all services
docker-compose logs -f        # View logs
docker-compose ps            # Check status
```

### Manual Development

```bash
pnpm dev              # Start frontend dev server
pnpm dev:backend      # Start backend
pnpm test            # Run tests
pnpm lint            # Lint code
pnpm build           # Build for production
```

---

## Contributing

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push branch: `git push origin feature/amazing-feature`
4. Open Pull Request

---

## License

This project is private. For access, contact the maintainers.

---

## Support

- **Issues?** Check [DOCKER_TROUBLESHOOTING.md](DOCKER_TROUBLESHOOTING.md)
- **Deployment help?** See [DEPLOYMENT_GUIDES.md](DEPLOYMENT_GUIDES.md)
- **Questions?** Open an issue on GitHub
