import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const proxyPaths = [
  '/api',
  '/api-docs',
  '/api-docs.json',
  '/check-session',
  '/graphql',
  '/profile-pictures',
  '/req_res',
  '/restaurant-images',
  '/schemas',
  '/uploads',
]

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devPort = Number(env.VITE_PORT || 5173)
  const proxyTarget = (env.VITE_DEV_PROXY_TARGET || '').trim()

  const proxy = proxyTarget
    ? Object.fromEntries(
        proxyPaths.map((path) => [
          path,
          {
            target: proxyTarget,
            changeOrigin: true,
            secure: false,
          },
        ]),
      )
    : undefined

  return {
    plugins: [react()],
    server: {
      port: devPort,
      proxy,
    },
  }
})
