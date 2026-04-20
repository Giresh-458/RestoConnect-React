# Deployment Guide

This repo is set up for:

- Frontend: Vercel
- Backend: Render (blueprint included) or Railway
- Database: MongoDB Atlas
- Redis: local Docker, plus optional cloud Redis for backend session storage

## 1. Local Docker setup

1. Copy the compose env file:

```bash
cp docker-compose.env.example .env
```

2. Fill in at least:

- `VITE_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `SESSION_SECRET`
- `JWT_SECRET`

3. Start the stack:

```bash
docker compose up --build
```

4. Open:

- App: `http://localhost:8080`
- Backend health: `http://localhost:8080/health`
- Swagger: `http://localhost:8080/api-docs`

## 2. MongoDB Atlas

Create an Atlas cluster and copy the SRV connection string into `MONGODB_URI`.

Recommended database name:

- `restoconnect`

Make sure you also:

- create a database user
- allow the backend host to connect
- store the full Atlas connection string in the backend host as `MONGODB_URI`

## 3. Frontend on Vercel

Deploy the `Frontend/` directory as a Vite app.

Set these environment variables in Vercel:

- `VITE_API_BASE_URL=https://your-backend-domain`
- `VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key`

Important notes:

- `vercel.json` is already included for SPA route rewrites
- if you change the backend domain, rebuild/redeploy the frontend so Vite picks up the new value

## 4. Backend on Render

This repo includes [render.yaml](render.yaml) for the backend.

Use the Render Blueprint flow and then fill in the `sync: false` variables:

- `CLIENT_URL=https://your-vercel-domain`
- `CORS_ALLOWED_ORIGINS=https://your-vercel-domain`
- `PUBLIC_API_URL=https://your-backend-domain`
- `MONGODB_URI=your_atlas_connection_string`
- `CACHE_ENABLED=true` if you want Redis API response caching, or `false` to run without cache
- `CACHE_DEFAULT_TTL_SECONDS=120` or another TTL that matches your traffic
- `SESSION_SECRET=strong_random_value`
- `JWT_SECRET=strong_random_value`
- `STRIPE_SECRET_KEY=your_stripe_secret_key`
- `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` if you want password reset emails to work

The included Render config already sets the important cross-origin production flags:

- `COOKIE_SAME_SITE=none`
- `COOKIE_SECURE=true`
- `TRUST_PROXY=true`

After deploy, verify:

- `https://your-backend-domain/health`
- `https://your-backend-domain/api-docs`

## 5. Backend on Railway

If you prefer Railway instead of Render, deploy the `Backend/` directory and use the same backend environment variables listed above.

Use these values for separated frontend/backend hosting:

- `NODE_ENV=production`
- `CLIENT_URL=https://your-vercel-domain`
- `CORS_ALLOWED_ORIGINS=https://your-vercel-domain`
- `PUBLIC_API_URL=https://your-railway-domain`
- `COOKIE_SAME_SITE=none`
- `COOKIE_SECURE=true`
- `TRUST_PROXY=true`

Add:

- `MONGODB_URI` from MongoDB Atlas
- `REDIS_URL` from Railway Redis if you want Redis-backed sessions or API response caching in production
- `CACHE_ENABLED=true` to enable API response caching, or `false` to run without cache

## 6. API and cookie checks

Because the frontend and backend are deployed on different origins, these must match:

- frontend `VITE_API_BASE_URL`
- backend `CLIENT_URL`
- backend `CORS_ALLOWED_ORIGINS`
- backend cookie settings: `COOKIE_SAME_SITE=none`, `COOKIE_SECURE=true`

If login works locally but not in production, this is the first place to check.

## 7. Post-deploy verification

Run this checklist after the frontend and backend are live:

1. Open the frontend and confirm the home page loads without `localhost` calls in the browser network tab.
2. Open the backend `/health` endpoint and confirm it returns `status: ok`.
3. Log in from the deployed frontend and confirm session/JWT cookies are being set.
4. Load a protected API route from the frontend and confirm credentials are included.
5. Open Swagger on the deployed backend and confirm requests use the deployed API URL.
6. Test one Stripe payment flow using test keys.
7. Test one file/image upload flow.
8. Test forgot-password only if email env vars are configured.

## 8. Files added for deployment

- [docker-compose.yml](docker-compose.yml)
- [docker-compose.env.example](docker-compose.env.example)
- [Frontend/Dockerfile](Frontend/Dockerfile)
- [Frontend/nginx.conf](Frontend/nginx.conf)
- [Frontend/vercel.json](Frontend/vercel.json)
- [Backend/Dockerfile](Backend/Dockerfile)
- [render.yaml](render.yaml)
