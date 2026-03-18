# Swagger API Documentation Integration

## Overview
This document explains how Swagger (OpenAPI 3.0) has been integrated into the RestoConnect-React project to provide comprehensive API documentation. The implementation uses swagger-jsdoc for automatic documentation generation from code comments and swagger-ui-express for interactive documentation.

## Architecture
The Swagger integration follows a centralized approach:
- **Configuration**: Centralized Swagger setup in `swagger.js`
- **Documentation Generation**: Automatic parsing of JSDoc comments in route files
- **UI Interface**: Interactive Swagger UI for API exploration and testing
- **Security**: Integrated authentication and CSRF protection

## Dependencies

### Backend Dependencies
```json
{
  "swagger-jsdoc": "^6.2.8",
  "swagger-ui-express": "^5.0.1"
}
```

## File Structure

```
Backend/
├── swagger.js                    # Swagger configuration and schemas
├── server.js                     # Swagger UI setup and middleware
├── public/
│   └── swagger.html             # Custom Swagger UI page
└── routes/
    ├── adminroutes.js           # Admin API endpoints with @swagger comments
    ├── customer.js              # Customer API endpoints with @swagger comments
    ├── ownerRoutes.js           # Owner API endpoints with @swagger comments
    ├── staffRouter.js           # Staff API endpoints with @swagger comments
    ├── superadminRoutes.js      # Super Admin API endpoints with @swagger comments
    └── ...                      # Other route files with documentation
```

## Configuration Setup

### 1. Swagger Configuration (`Backend/swagger.js`)

The main configuration file defines:

#### OpenAPI Specification:
```javascript
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RestoConnect API',
      version: '1.0.0',
      description: 'API documentation for RestoConnect - Restaurant Management System'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ]
  },
  apis: ['./routes/*.js', './server.js']  // Files to scan for documentation
};
```

#### Security Schemes:
- **Bearer Auth**: JWT token authentication
- **Cookie Auth**: Session-based authentication
- **CSRF Header**: CSRF token protection

#### Data Schemas:
Comprehensive schema definitions for:
- User (all roles: admin, employee, staff, owner, customer, superadmin)
- Restaurant
- Order
- Reservation
- Table
- Task
- Announcement
- Error responses
- Success responses

#### Standardized Responses:
Pre-defined response templates for:
- Unauthorized (401)
- Forbidden (403)
- Invalid CSRF (403)
- Not Found (404)
- Bad Request (400)
- Internal Server Error (500)

### 2. Server Integration (`Backend/server.js`)

#### Swagger UI Setup:
```javascript
const swaggerUi = require('swagger-ui-express');
const { swaggerSpec } = require('./swagger');

// API specification endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(swaggerSpec);
});

// Interactive Swagger UI
app.use('/api-docs', swaggerUi.serveFiles(swaggerSpec), swaggerUi.setup(swaggerSpec, {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { font-size: 2.5em; }
    .swagger-ui .info .description { font-size: 1.1em; line-height: 1.6; }
  `,
  customSiteTitle: 'RestoConnect API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
  }
}));
```

#### Security Integration:
- Swagger docs accessible without authentication (public)
- CSRF protection bypassed for documentation endpoints
- Authentication required for testing protected endpoints

### 3. Custom Swagger UI (`Backend/public/swagger.html`)

Custom HTML page with enhanced features:

#### CSRF Token Management:
```javascript
async function fetchCsrfToken() {
  const res = await fetch('/api/csrf-token', { credentials: 'include' });
  const data = await res.json();
  csrfToken = data.csrfToken;
}

function requestInterceptor(req) {
  const method = req.method?.toUpperCase();
  const isStateChanging = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  
  if (isStateChanging && csrfToken) {
    req.headers['X-CSRF-Token'] = csrfToken;
  }
  return req;
}
```

## API Documentation Implementation

### 1. Route Documentation Pattern

Each endpoint is documented using JSDoc comments:

```javascript
/**
 * @swagger
 * /api/owner/dashboard:
 *   get:
 *     summary: Get owner dashboard data
 *     tags: [Owner]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *       - csrfHeader: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get("/dashboard", ownerController.getownerDashboard_dashboard);
```

### 2. Documentation Coverage

#### Admin Routes (`adminroutes.js`):
- Dashboard analytics
- User management
- Restaurant management
- Order management
- Support system

#### Customer Routes (`customer.js`):
- Restaurant browsing
- Menu access
- Order placement
- Payment processing
- Feedback system

#### Owner Routes (`ownerRoutes.js`):
- Restaurant dashboard
- Menu management
- Order management
- Staff management
- Analytics and reports

#### Staff Routes (`staffRouter.js`):
- Order management
- Reservation handling
- Table management
- Inventory tracking
- Task management

#### Super Admin Routes (`superadminRoutes.js`):
- Platform analytics
- Employee performance
- Revenue tracking
- Customer insights
- System management

## Security Implementation

### 1. Authentication Methods

#### JWT Bearer Token:
```javascript
bearerAuth: {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'JWT token obtained from /api/auth/login'
}
```

#### Session Cookie:
```javascript
cookieAuth: {
  type: 'apiKey',
  in: 'cookie',
  name: 'connect.sid',
  description: 'Session cookie for authentication'
}
```

#### CSRF Protection:
```javascript
csrfHeader: {
  type: 'apiKey',
  in: 'header',
  name: 'X-CSRF-Token',
  description: 'CSRF token obtained from /api/csrf-token'
}
```

### 2. Authentication Flow

1. **Login**: Get JWT token from `/api/auth/login`
2. **CSRF Token**: Get CSRF token from `/api/csrf-token`
3. **Authorize**: Click "Authorize" button in Swagger UI
4. **Enter Credentials**: `Bearer {jwt_token}`
5. **Test APIs**: Include CSRF token in state-changing requests

## Features and Capabilities

### 1. Interactive Testing
- **Try it out**: Test endpoints directly from documentation
- **Parameter validation**: Automatic validation based on schemas
- **Response formatting**: Formatted JSON responses
- **Error handling**: Proper error response display

### 2. Documentation Features
- **Auto-generation**: Documentation generated from code comments
- **Schema reuse**: Reusable component schemas
- **Response examples**: Example responses for all endpoints
- **Security documentation**: Clear authentication requirements

### 3. UI Enhancements
- **Custom styling**: Branded documentation interface
- **Persistent auth**: Authorization persists across sessions
- **Request duration**: Display API response times
- **Search functionality**: Filter endpoints by keywords
- **Expandable sections**: Organized endpoint categories

## Access Points

### 1. Primary Documentation
- **URL**: `http://localhost:3000/api-docs`
- **Features**: Full interactive Swagger UI
- **Authentication**: Not required for viewing
- **Testing**: Requires authentication for protected endpoints

### 2. Raw Specification
- **URL**: `http://localhost:3000/api-docs.json`
- **Format**: OpenAPI 3.0 JSON specification
- **Usage**: For API clients and tools
- **Accessibility**: Publicly accessible

### 3. Custom UI Page
- **URL**: `http://localhost:3000/swagger.html`
- **Features**: Enhanced CSRF handling
- **Purpose**: Alternative documentation interface
- **Integration**: Custom JavaScript for security

## Documentation Standards

### 1. Comment Structure
```javascript
/**
 * @swagger
 * /path/to/endpoint:
 *   method:
 *     summary: Brief description
 *     tags: [Category]
 *     security: [securitySchemes]
 *     parameters: [parameters]
 *     requestBody: [requestBody]
 *     responses: {responses}
 */
```

### 2. Schema Definitions
- **Reusable components**: Defined in `swagger.js`
- **Type safety**: Proper data types and formats
- **Examples**: Realistic example values
- **Validation**: Input validation rules

### 3. Response Standards
- **Consistent format**: Standardized response structures
- **Error handling**: Comprehensive error responses
- **Status codes**: Appropriate HTTP status codes
- **Content types**: Proper content-type headers

## Benefits

### 1. Development Benefits
- **API discovery**: Easy API exploration
- **Testing**: Built-in testing capabilities
- **Documentation**: Always up-to-date documentation
- **Collaboration**: Shared API understanding

### 2. Maintenance Benefits
- **Single source**: Documentation in code
- **Auto-update**: Documentation updates with code
- **Validation**: Schema validation
- **Consistency**: Standardized documentation format

### 3. Integration Benefits
- **Client development**: Easy client integration
- **Third-party access**: Public API specification
- **Tool support**: Compatible with API tools
- **Automation**: Automated API testing

## Best Practices Implemented

### 1. Security
- **Public docs**: Documentation publicly accessible
- **Protected testing**: Authentication required for testing
- **CSRF handling**: Automatic CSRF token management
- **Multiple auth**: Support for various auth methods

### 2. Documentation Quality
- **Comprehensive coverage**: All endpoints documented
- **Clear descriptions**: Easy-to-understand descriptions
- **Proper examples**: Realistic request/response examples
- **Error documentation**: Complete error response documentation

### 3. User Experience
- **Intuitive interface**: Easy-to-use Swagger UI
- **Search functionality**: Find endpoints quickly
- **Persistent auth**: Stay authenticated across sessions
- **Visual feedback**: Clear success/error indicators

## Usage Guide

### 1. For Developers
1. Access `http://localhost:3000/api-docs`
2. Click "Authorize" button
3. Enter `Bearer {your_jwt_token}`
4. Test endpoints using "Try it out"
5. View responses and documentation

### 2. For API Consumers
1. Review documentation at `/api-docs`
2. Download OpenAPI spec from `/api-docs.json`
3. Integrate with API clients
4. Follow authentication requirements

### 3. For Testing
1. Use Swagger UI for manual testing
2. Export OpenAPI spec for automated testing
3. Validate against schemas
4. Test authentication flows

## Future Enhancements

### Potential Improvements:
1. **API Versioning**: Support for multiple API versions
2. **Rate Limiting**: Documentation of rate limits
3. **Webhooks**: Webhook endpoint documentation
4. **Pagination**: Consistent pagination documentation
5. **Filtering**: Advanced filtering options
6. **Sorting**: Sorting parameter documentation
7. **Batch Operations**: Batch endpoint documentation

---

**Note**: This Swagger integration provides comprehensive, interactive API documentation that enhances developer experience, facilitates API testing, and ensures documentation stays synchronized with the codebase. The implementation follows OpenAPI 3.0 standards and includes robust security integration for protected endpoints.
