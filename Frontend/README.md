# Frontend

React + Vite client for RestoConnect.

## Environment

Use [env.example](env.example) as the source of truth.

Important variables:

- `VITE_API_BASE_URL`: deployed backend URL for Vercel, or empty for same-origin/Docker
- `VITE_DEV_PROXY_TARGET`: backend target for local Vite proxy
- `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key

## Commands

```bash
npm install
npm run dev
npm run build
```

## Deployment

- `vercel.json` is included for SPA route rewrites
- See [../DEPLOYMENT.md](../DEPLOYMENT.md) for the full deployment checklist
