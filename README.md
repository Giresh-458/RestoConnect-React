# RestoConnect

RestoConnect is a full-stack restaurant management platform with:

- `Frontend/`: React + Vite client
- `Backend/`: Express + MongoDB API
- `docker-compose.yml`: local production-style stack with frontend, backend, MongoDB, and Redis

## Production readiness changes

- Runtime configuration moved into environment variables
- Frontend hardcoded API URLs removed
- Backend hardcoded database origin, CORS origin, session secret, JWT secret fallback, and email credential fallback removed
- Production-safe cookie, proxy, and CORS configuration added
- Dockerfiles added for frontend and backend
- Vercel SPA rewrite config added for frontend deployment
- Render blueprint added for backend deployment

## Quick start

### Frontend

1. Copy values from [Frontend/env.example](Frontend/env.example).
2. Run:

```bash
cd Frontend
npm install
npm run dev
```

### Backend

1. Copy values from [Backend/env.example](Backend/env.example).
2. Run:

```bash
cd Backend
npm install
npm run dev
```

## Docker

Use the compose setup for a local production-like environment:

```bash
cp docker-compose.env.example .env
docker compose up --build
```

The frontend will be available at `http://localhost:8080`.

## Deployment

Full deployment instructions live in [DEPLOYMENT.md](DEPLOYMENT.md).
