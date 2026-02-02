# Error Handling Guide - RestoConnect Frontend

## Setup Complete ✅

Your frontend is now equipped with comprehensive error handling:

### 1. **Error Page Route**
- All unmatched routes (`*`) now display the [ErrorPage.jsx](src/pages/ErrorPage.jsx)
- Users see a styled 404 page with "Go to Home" and "Go Back" buttons
- CSS styling in [ErrorPage.css](src/pages/ErrorPage.css)

### 2. **Error Handler Utility**
Located at: [src/util/errorHandler.js](src/util/errorHandler.js)

#### Functions Available:

**`handleFetchError(navigate, error, message)`**
- Catches fetch errors and redirects to error page
- Takes error object and optional custom message

**`handleApiError(navigate, response, fallbackMessage)`**
- Handles HTTP errors (404, 500, etc.)
- Automatically detects error type and shows appropriate message

**`fetchWithErrorHandling(url, options, navigate, errorMessage)`**
- Wrapper for fetch that automatically handles errors
- Simplest way to handle API calls with redirection

---

## Usage Examples

### Example 1: Using fetchWithErrorHandling (Recommended)
```jsx
import { useNavigate } from 'react-router-dom';
import { fetchWithErrorHandling } from '../util/errorHandler';

function MyComponent() {
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const data = await fetchWithErrorHandling(
        'http://localhost:3000/api/data',
        { credentials: 'include' },
        navigate,
        'Failed to load data'
      );
      // Use data...
    } catch (error) {
      // Error is already handled and user redirected
    }
  };

  return <button onClick={fetchData}>Load Data</button>;
}
```

### Example 2: Using handleApiError
```jsx
import { useNavigate } from 'react-router-dom';
import { handleApiError } from '../util/errorHandler';

function MyComponent() {
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/data', {
        credentials: 'include'
      });

      if (!response.ok) {
        handleApiError(navigate, response, 'Failed to fetch data');
        return;
      }

      const data = await response.json();
      // Use data...
    } catch (error) {
      handleApiError(navigate, error, 'Network error occurred');
    }
  };

  return <button onClick={fetchData}>Load Data</button>;
}
```

### Example 3: Using handleFetchError
```jsx
import { useNavigate } from 'react-router-dom';
import { handleFetchError } from '../util/errorHandler';

function MyComponent() {
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/data', {
        credentials: 'include'
      });
      const data = await response.json();
      // Use data...
    } catch (error) {
      handleFetchError(
        navigate,
        error,
        'Something went wrong. Please try again.'
      );
    }
  };

  return <button onClick={fetchData}>Load Data</button>;
}
```

---

## Integration with Existing Components

To integrate error handling into existing components with catch blocks:

### Pattern:
```jsx
catch (error) {
  console.error('Error details:', error);
  handleFetchError(navigate, error, 'Custom error message');
}
```

### Example - StaffManagement.jsx:
```jsx
import { handleFetchError } from '../util/errorHandler';
import { useNavigate } from 'react-router-dom';

function StaffManagement() {
  const navigate = useNavigate();

  const fetchInitialData = async () => {
    try {
      // ... fetch code
    } catch (error) {
      console.error('Error fetching data:', error);
      handleFetchError(navigate, error, 'Failed to load staff data');
    }
  };
}
```

---

## Error Page Customization

The error page supports custom messages via route state:

```jsx
// From any component:
navigate('/error', {
  state: { message: 'Custom error message here' }
});
```

The [ErrorPage.jsx](src/pages/ErrorPage.jsx) has two buttons:
- **Go to Home** - Navigates to `/`
- **Go Back** - Uses browser history to go back

---

## Features

✅ Styled 404 error page with good CSS  
✅ Catch-all route for unmatched paths  
✅ Global error handling utilities  
✅ Responsive design  
✅ Accessible markup (ARIA labels)  
✅ Custom error messages support  
✅ Smooth error transitions  

---

## Notes

- All error handler functions require `useNavigate()` hook from react-router-dom
- Use these utilities in components that are inside `<RouterProvider>`
- The error page is always available at `/error` path
- 404 errors (unmatched routes) automatically show the error page
