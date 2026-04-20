# Backend

Express API for RestoConnect.

## Environment

Use [env.example](env.example) as the source of truth.

Required variables:

- `MONGODB_URI`
- `SESSION_SECRET`
- `JWT_SECRET`
- `STRIPE_SECRET_KEY`

Common production variables:

- `CLIENT_URL`
- `CORS_ALLOWED_ORIGINS`
- `PUBLIC_API_URL`
- `REDIS_URL`
- `COOKIE_SAME_SITE`
- `COOKIE_SECURE`
- `TRUST_PROXY`

Optional email variables for forgot-password flows:

- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_FROM`
- `SMTP_SERVICE` or `SMTP_HOST`/`SMTP_PORT`

## Commands

```bash
npm install
npm run dev
npm start
```

## Health check

- `GET /health`

## Docs

- Swagger UI: `/api-docs`
- OpenAPI JSON: `/api-docs.json`

See [../DEPLOYMENT.md](../DEPLOYMENT.md) for Docker and deployment setup.

## Nitin is Great