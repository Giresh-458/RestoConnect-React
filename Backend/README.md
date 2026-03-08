# RestoConnect Backend API Documentation

## Project Overview

RestoConnect is a full-stack restaurant management system built with Node.js, Express, and MongoDB. This backend serves as the API layer for the React frontend, providing authentication, authorization, and business logic for multiple user roles: **Customer**, **Owner**, **Staff**, **Admin**, and **Super Admin**.

---

## Technology Stack

### Core Technologies
- **Runtime**: Node.js 18+
- **Framework**: Express.js v4.21.2
- **Database**: MongoDB with Mongoose ODM v8.13.2
- **Template Engine**: EJS v3.1.10

### Authentication & Security
- **JWT**: `jsonwebtoken` v9.0.2 - Token-based authentication
- **Password Hashing**: `bcrypt` v5.1.1
- **Session Management**: `express-session` v1.18.1
- **CSRF Protection**: `csurf` v1.11.0
- **CORS**: `cors` v2.8.5 (configured for `http://localhost:5173`)

### File Handling & Media
- **File Upload**: `multer` v2.0.2
- **Email**: `nodemailer` v6.10.1

### Logging & Monitoring
- **HTTP Logger**: `morgan` v1.10.1
- **File Rotation**: `rotating-file-stream` v3.2.7

### API Documentation
- **Swagger**: `swagger-jsdoc` v6.2.8 + `swagger-ui-express` v5.0.1

### Utilities
- **Cookie Parser**: `cookie-parser` v1.4.7
- **Body Parser**: `body-parser` v1.20.3
- **Short ID**: `shortid` v2.2.17

### Development
- **Nodemon**: v3.1.10 (auto-restart during development)

---

## Configuration

### Environment Setup

**Server Configuration:**
- **Port**: 3000
- **Frontend Origin**: `http://localhost:5173`
- **Session Cookie**: 
  - HTTP Only: true
  - Secure: false (development)
  - SameSite: lax
  - Max Age: 30 days

**CORS Configuration:**
```javascript
{
  origin: "http://localhost:5173",
  credentials: true
}
```

**Session Configuration:**
- Secret: `"session"` (should be moved to environment variable in production)
- Rolling: true (extends session on each request)
- Resave: false
- Save Uninitialized: false

---

## Running the Server

### Installation
```bash
cd Backend
npm install
```

### Development Mode
```bash
npm start
# or
nodemon server.js
```

The server will start at `http://localhost:3000`

### Production Mode
```bash
node server.js
```

---

## API Structure

### Base Routes

| Route | Description | Authentication |
|-------|-------------|----------------|
| `/api/auth` | Authentication endpoints (login, signup, password reset) | Public |
| `/api/customer` | Customer operations | customer role |
| `/api/owner` | Owner operations | owner role |
| `/api/staff` | Staff operations | staff role |
| `/api/admin` | Admin operations | admin/employee role |
| `/api/superadmin` | Super admin operations | admin role |
| `/api/employee` | Employee operations | employee role |

### Support Routes

| Route | Description | Authentication |
|-------|-------------|----------------|
| `/api/customer/support` | Customer support tickets | customer |
| `/api/owner/support` | Owner support management | owner |
| `/api/admin/support` | Admin support oversight | admin/employee |
| `/api/staff/support` | Staff support interactions | staff |

### Additional Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Homepage |
| `/menu/:restid` | GET | Restaurant menu |
| `/create` | GET | Restaurant request form |
| `/req_res` | GET/POST | Restaurant request submission |
| `/logout` | GET | Logout endpoint |
| `/check-session` | GET | Session validation |
| `/api/restaurants` | GET | List all restaurants |
| `/api/csrf-token` | GET | Get CSRF token |
| `/api-docs` | GET | Swagger UI documentation |

---

## Middleware Stack

1. **Body Parser** - Parse URL-encoded and JSON bodies
2. **Cookie Parser** - Parse cookies
3. **CORS** - Cross-origin resource sharing
4. **Static Files** - Serve files from `/public`
5. **Session** - Express session management
6. **CSRF Protection** - Applied to all routes except:
   - `/api-docs/*`
   - `/api/auth/login`
   - `/api/auth/signup`
   - `/api/auth/forgot-password/*`

---

## Error Handling

### CSRF Error
```javascript
{
  message: "Invalid CSRF token",
  status: 403
}
```

### General Error Handler
All errors are logged to `logs/error.txt` and return:
```javascript
{
  message: "Error message",
  url: "/original/request/url",
  status: 500 // or specific error code
}
```

### Logging
- **Request Logs**: `logs/programlog.txt` (daily rotation)
- **Error Logs**: `logs/error.txt` (daily rotation)

---

## Database Connection

Managed by `connectDB()` utility function from `./util/database`.

MongoDB connection string should be configured in environment variables or configuration files.

---

## Authentication Flow

### JWT-Based Authentication
1. User logs in via `/api/auth/login`
2. Server generates JWT token stored in `AUTH_TOKEN_COOKIE`
3. Subsequent requests include cookie automatically
4. Middleware `authentication(role)` validates token and role

### Legacy Session Support
For backward compatibility, session-based auth is still supported alongside JWT.

### Role-Based Access Control
```javascript
app.use("/api/owner", authentication("owner"), ownerRouter);
app.use("/api/admin", authentication(["admin", "employee"]), adminRouter);
```

---

## File Upload Configuration

File uploads handled by `multer` via `uploadDishImage` and `uploadRestaurantImage` utilities.

Upload errors processed by `handleUploadErrors` middleware.

---

## Swagger Documentation

Interactive API documentation available at: `http://localhost:3000/api-docs`

Features:
- Custom branding
- Persistent authorization
- Request duration display
- Expandable documentation sections
- Filter functionality

---

## Project Structure

```
Backend/
├── Controller/          # Business logic controllers
│   ├── ownerController.js
│   ├── customerController.js
│   ├── adminController.js
│   └── ...
├── Model/              # Mongoose schemas and models
├── routes/             # Express route handlers
│   ├── ownerRoutes.js
│   ├── customer.js
│   ├── adminroutes.js
│   └── ...
├── util/               # Utility functions
│   ├── database.js
│   ├── jwtHelper.js
│   └── fileUpload.js
├── logs/               # Application logs (auto-generated)
├── public/             # Static assets
├── views/              # EJS templates
├── server.js           # Main application entry point
└── package.json        # Dependencies and scripts
```

---

## Security Considerations

1. **CSRF Protection**: Enabled for all state-changing operations
2. **Cookie Security**: HTTP-only cookies prevent XSS attacks
3. **Password Hashing**: bcrypt with salt rounds
4. **Role Validation**: Middleware enforces role-based access
5. **Input Validation**: Should be implemented in controllers
6. **Rate Limiting**: Not currently implemented (recommended for production)
7. **Environment Variables**: Sensitive data should be moved to `.env` file

---

## Development Notes

- Server runs on port 3000 by default
- Frontend expected at `http://localhost:5173` (Vite dev server)
- MongoDB connection required for server to function
- Hot reloading enabled via nodemon
- All routes support CORS with credentials

---

## Testing

No test framework configured yet. Test script placeholder in package.json:
```bash
npm test
```

---

## Deployment Considerations

Before deploying to production:

1. Move sensitive data to environment variables:
   - Session secret
   - MongoDB connection string
   - JWT secret
   - Email credentials

2. Enable secure cookies:
   ```javascript
   secure: true
   ```

3. Configure proper CORS origin (not wildcard)

4. Set up rate limiting

5. Enable HTTPS

6. Configure production logging service

7. Set up monitoring and alerting

---

## Contact & Support

- **Repository**: https://github.com/Giresh-458/RestoConnect
- **Issues**: https://github.com/Giresh-458/RestoConnect/issues
