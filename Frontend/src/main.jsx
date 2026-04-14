import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { toApiUrl } from './config/api.js'

const CSRF_ENDPOINT = toApiUrl('/api/csrf-token')
let csrfTokenPromise = null

const originalFetch = window.fetch.bind(window)
const originalXhrOpen = window.XMLHttpRequest.prototype.open

const getCsrfToken = async () => {
  if (!csrfTokenPromise) {
    csrfTokenPromise = originalFetch(CSRF_ENDPOINT, { credentials: 'include' })
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

window.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input.url
  const normalizedUrl = toApiUrl(url)

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

  if (input instanceof Request && finalInit.body === undefined && !['GET', 'HEAD'].includes(method)) {
    finalInit.body = input.clone().body
  }

  return originalFetch(normalizedUrl, finalInit)
}

window.XMLHttpRequest.prototype.open = function open(method, url, ...rest) {
  const normalizedUrl = typeof url === 'string' ? toApiUrl(url) : url
  return originalXhrOpen.call(this, method, normalizedUrl, ...rest)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
