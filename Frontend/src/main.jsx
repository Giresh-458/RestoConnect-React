import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const BACKEND_BASE_URL = 'http://localhost:3000'
const CSRF_ENDPOINT = `${BACKEND_BASE_URL}/api/csrf-token`
let csrfTokenPromise = null

const getCsrfToken = async () => {
  if (!csrfTokenPromise) {
    csrfTokenPromise = fetch(CSRF_ENDPOINT, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch CSRF token')
        }
        const data = await res.json()
        return data.csrfToken
      })
      .catch((err) => {
        csrfTokenPromise = null
        throw err
      })
  }
  return csrfTokenPromise
}

const isBackendUrl = (url) =>
  url.startsWith(BACKEND_BASE_URL) || url.startsWith('/')

const originalFetch = window.fetch.bind(window)
window.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input.url
  if (!isBackendUrl(url)) {
    return originalFetch(input, init)
  }

  const method = (init.method || (input instanceof Request ? input.method : 'GET')).toUpperCase()
  const isStateChanging = !['GET', 'HEAD', 'OPTIONS'].includes(method)

  const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined))
  if (isStateChanging) {
    const csrfToken = await getCsrfToken()
    headers.set('X-CSRF-Token', csrfToken)
  }

  const finalInit = {
    ...init,
    headers,
    credentials:
      init.credentials || (input instanceof Request ? input.credentials : undefined) || 'include',
  }

  if (input instanceof Request) {
    return originalFetch(new Request(input, finalInit))
  }
  return originalFetch(input, finalInit)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
