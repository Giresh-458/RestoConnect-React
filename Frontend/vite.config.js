import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const proxyPaths = [
  '/api',
  '/api-docs',
  '/api-docs.json',
  '/graphql-docs',
  '/graphql-docs.json',
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
    test: {
      environment: 'jsdom',
      globals: true,
      css: true,
      setupFiles: './src/test/setup.js',
      reporters: ['default'],
      outputFile: {
        junit: './reports/junit/frontend-junit.xml',
      },
      coverage: {
        provider: 'v8',
        reportsDirectory: './coverage',
        reporter: ['text', 'html', 'lcov', 'json-summary'],
        include: [
          'src/config/api.js',
          'src/components/Search/Search.jsx',
          'src/components/CheckoutSteps.jsx',
          'src/components/common/LoadingSpinner.jsx',
          'src/components/common/Toast.jsx',
          'src/components/common/ConfirmDialog.jsx',
          'src/components/RestaurantCard/RestaurantCard.jsx',
          'src/store/CartSlice.js',
          'src/util/csrf.js',
          'src/util/errorHandler.js',
          'src/util/imageUtils.js',
          'src/util/maskEmail.js',
        ],
      },
    },
  }
})
