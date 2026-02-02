/**
 * Global error handler utility for redirecting to error page
 */

export const handleFetchError = (navigate, error, message = null) => {
  const errorMessage = message || error?.message || 'An unexpected error occurred';
  
  console.error('Fetch Error:', error);
  
  // Redirect to error page with message
  navigate('/error', { 
    state: { message: errorMessage } 
  });
};

export const handleApiError = (navigate, response, fallbackMessage = 'Something went wrong') => {
  // Handle 404 errors
  if (response.status === 404) {
    navigate('/error', {
      state: { message: 'The resource you requested was not found.' }
    });
    return;
  }

  // Handle 500 errors
  if (response.status === 500) {
    navigate('/error', {
      state: { message: 'Server error. Please try again later.' }
    });
    return;
  }

  // Handle other errors
  navigate('/error', {
    state: { message: fallbackMessage }
  });
};

/**
 * Wrap fetch calls with error handling
 * Usage: const data = await fetchWithErrorHandling(url, options, navigate, errorMessage);
 */
export const fetchWithErrorHandling = async (url, options, navigate, errorMessage = 'Failed to fetch data') => {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.message || errorData.error || errorMessage;
      handleApiError(navigate, response, message);
      throw new Error(message);
    }
    
    return await response.json();
  } catch (error) {
    if (!error.message.includes('redirect')) {
      handleFetchError(navigate, error, errorMessage);
    }
    throw error;
  }
};
