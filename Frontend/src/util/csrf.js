const BACKEND_BASE_URL = 'http://localhost:3000';
const CSRF_ENDPOINT = `${BACKEND_BASE_URL}/api/csrf-token`;

let csrfTokenPromise = null;

export const getCsrfToken = async () => {
  if (!csrfTokenPromise) {
    csrfTokenPromise = fetch(CSRF_ENDPOINT, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch CSRF token');
        }
        const data = await res.json();
        return data.csrfToken;
      })
      .catch((err) => {
        csrfTokenPromise = null;
        throw err;
      });
  }
  return csrfTokenPromise;
};

export const createHeaders = (additionalHeaders = {}) => {
  const headers = {
    ...additionalHeaders,
  };
  
  // Only add CSRF token for state-changing requests
  const method = additionalHeaders.method || 'GET';
  const isStateChanging = !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
  
  if (isStateChanging && !headers['X-CSRF-Token']) {
    // Don't await here - let the caller handle it
    // This will be resolved by the caller
    return { headers, needsCsrf: true };
  }
  
  return { headers, needsCsrf: false };
};

export const fetchWithCSRF = async (url, options = {}) => {
  const method = options.method || 'GET';
  const isStateChanging = !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
  
  if (isStateChanging) {
    const csrfToken = await getCsrfToken();
    options.headers = {
      ...options.headers,
      'X-CSRF-Token': csrfToken,
    };
  }
  
  // Ensure credentials are included
  if (!options.credentials) {
    options.credentials = 'include';
  }
  
  return fetch(url, options);
};
