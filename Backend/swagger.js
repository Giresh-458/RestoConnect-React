const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./config/env');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RestoConnect API',
      version: '1.0.0',
      description: 'API documentation for RestoConnect - Restaurant Management System\n\n**Docs are publicly viewable** — no JWT or CSRF needed to browse. Auth is required only when executing protected endpoints.\n\n## User Roles\n- **Super Admin**: Platform-wide analytics and management\n-  **Employee**: Similar to admin but with employee role\n- **Staff**: Day-to-day restaurant operations\n- **Owner**: Restaurant-specific management\n- **Customer**: End-user functionality\n\n## To Try Protected Endpoints\n1. **Login** to get JWT: POST /api/auth/login\n2. **Get CSRF token** (for POST/PUT/DELETE): GET /api/csrf-token\n3. Click **Authorize** and enter: Bearer {your_jwt}\n4. Add header: X-CSRF-Token: {csrf_token} for state-changing requests',
      contact: {
        name: 'API Support',
        email: 'support@restoconnect.com'
      }
    },
    servers: [
      {
        url: config.publicApiUrl || '/',
        description: config.publicApiUrl ? 'Configured public API endpoint' : 'Current origin'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/auth/login'
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Session cookie for authentication'
        },
        csrfHeader: {
          type: 'apiKey',
          in: 'header',
          name: 'X-CSRF-Token',
          description: 'CSRF token obtained from /api/csrf-token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            username: { type: 'string', example: 'john_doe' },
            email: { type: 'string', example: 'john@example.com' },
            role: { type: 'string', enum: ['admin', 'employee', 'staff', 'owner', 'customer', 'superadmin'], example: 'staff' },
            restaurantName: { type: 'string', example: 'Tasty Bites' },
            rest_id: { type: 'string', example: '507f1f77bcf86cd799439012' },
            isSuspended: { type: 'boolean', example: false },
            suspensionEndDate: { type: 'string', format: 'date-time', nullable: true },
            suspensionReason: { type: 'string', nullable: true }
          }
        },
        Restaurant: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439012' },
            name: { type: 'string', example: 'Tasty Bites' },
            location: { type: 'string', example: '123 Main Street, City' },
            city: { type: 'string', example: 'New York' },
            amount: { type: 'number', example: 50000 },
            rating: { type: 'number', example: 4.5 },
            image: { type: 'string', example: '/images/restaurant.jpg' },
            isSuspended: { type: 'boolean', example: false },
            isOpen: { type: 'boolean', example: true },
            date: { type: 'string', format: 'date-time' }
          }
        },
        Order: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439013' },
            customerName: { type: 'string', example: 'John Doe' },
            rest_id: { type: 'string', example: '507f1f77bcf86cd799439012' },
            dishes: { type: 'array', items: { type: 'string' } },
            totalAmount: { type: 'number', example: 250.00 },
            status: { type: 'string', enum: ['pending', 'active', 'waiting', 'preparing', 'ready', 'served', 'done', 'completed', 'cancelled'], example: 'pending' },
            tableNumber: { type: 'string', example: '5' },
            date: { type: 'string', format: 'date-time' },
            orderTime: { type: 'string', format: 'date-time' },
            estimatedTime: { type: 'number', example: 30 }
          }
        },
        Reservation: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439014' },
            customerName: { type: 'string', example: 'Jane Smith' },
            rest_id: { type: 'string', example: '507f1f77bcf86cd799439012' },
            date: { type: 'string', format: 'date-time' },
            time: { type: 'string', example: '19:00' },
            guests: { type: 'number', example: 4 },
            status: { type: 'string', enum: ['pending', 'confirmed', 'seated', 'completed', 'cancelled'], example: 'confirmed' },
            allocated: { type: 'boolean', example: true },
            table_id: { type: 'string', example: '5' },
            tables: { type: 'array', items: { type: 'string' } }
          }
        },
        Table: {
          type: 'object',
          properties: {
            number: { type: 'string', example: '5' },
            seats: { type: 'number', example: 4 },
            status: { type: 'string', enum: ['Available', 'Occupied', 'Reserved', 'Cleaning', 'Allocated'], example: 'Available' }
          }
        },
        Task: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1234567890 },
            name: { type: 'string', example: 'Prepare special menu' },
            status: { type: 'string', enum: ['Pending', 'Completed'], example: 'Pending' },
            priority: { type: 'string', enum: ['low', 'medium', 'high'], example: 'medium' }
          }
        },
        Announcement: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439015' },
            text: { type: 'string', example: 'Special discount today!' },
            priority: { type: 'string', enum: ['low', 'medium', 'high'], example: 'high' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Error message' },
            message: { type: 'string', example: 'Detailed error description' }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' }
          }
        }
      },
      responses: {
        Unauthorized: {
          description: 'Unauthorized - Invalid or missing authentication',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: 'Unauthorized' }
            }
          }
        },
        Forbidden: {
          description: 'Forbidden - Insufficient permissions or invalid CSRF token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: 'Access denied' }
            }
          }
        },
        InvalidCSRF: {
          description: 'Invalid CSRF token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { message: 'Invalid CSRF token' }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: 'Resource not found' }
            }
          }
        },
        BadRequest: {
          description: 'Bad request - Invalid input',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: 'Missing required fields' }
            }
          }
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: 'Internal Server Error' }
            }
          }
        }
      }
    },
    security: [{
       bearerAuth: [],
    cookieAuth: [],
    csrfHeader: []
    }]
  },
  apis: ['./routes/*.js', './server.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec };

