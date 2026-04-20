/**
 * @swagger
 * tags:
 *   - name: Payments
 *     description: Stripe payment endpoints
 *   - name: GraphQL
 *     description: GraphQL endpoint and supported query patterns
 *   - name: Admin Support
 *     description: Admin and employee support ticket operations
 *   - name: Owner Support
 *     description: Owner support ticket operations
 *   - name: Staff Utilities
 *     description: Staff utility endpoints not colocated with detailed route docs
 *
 * components:
 *   schemas:
 *     SupportTicket:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         ticketNumber:
 *           type: string
 *           example: TKT-00001
 *         createdBy:
 *           type: string
 *         createdByRole:
 *           type: string
 *           enum: [customer, owner, staff]
 *         rest_id:
 *           type: string
 *         restaurantName:
 *           type: string
 *         category:
 *           type: string
 *           enum: [wrong_order, food_quality, missing_items, overcharged, long_wait, staff_conduct, hygiene, reservation_issue, web_issue, other]
 *         subject:
 *           type: string
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         status:
 *           type: string
 *           enum: [open, in_progress, awaiting_customer, awaiting_owner, escalated, resolved, closed]
 *         assignedTo:
 *           type: string
 *           nullable: true
 *         messages:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               senderRole:
 *                 type: string
 *               senderName:
 *                 type: string
 *               text:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *     SupportStats:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *         open:
 *           type: integer
 *         inProgress:
 *           type: integer
 *         escalated:
 *           type: integer
 *         resolved:
 *           type: integer
 *         urgent:
 *           type: integer
 *     GraphQLRequest:
 *       type: object
 *       properties:
 *         query:
 *           type: string
 *         variables:
 *           type: object
 *           additionalProperties: true
 *         operationName:
 *           type: string
 */

/**
 * @swagger
 * /graphql:
 *   get:
 *     summary: Open the GraphiQL explorer
 *     tags: [GraphQL]
 *     description: |
 *       Opens the interactive GraphiQL UI.
 *
 *       Supported queries:
 *
 *       `publicRestaurants`
 *       Public query that returns restaurant basics with non-expired leftovers.
 *
 *       `restaurantInventory(restId: ID)`
 *       Authenticated B2B query for owner, staff, admin, or employee users.
 *       Owner and staff users read their own restaurant inventory automatically.
 *       Admin and employee users may pass `restId` to inspect a specific restaurant.
 *     responses:
 *       200:
 *         description: GraphiQL HTML page
 *   post:
 *     summary: Execute a GraphQL query
 *     tags: [GraphQL]
 *     description: |
 *       Execute GraphQL queries against the backend.
 *
 *       Example public query:
 *       ```graphql
 *       query {
 *         publicRestaurants {
 *           id
 *           name
 *           city
 *           leftovers {
 *             itemName
 *             quantity
 *             expiryDate
 *           }
 *         }
 *       }
 *       ```
 *
 *       Example authenticated inventory query:
 *       ```graphql
 *       query GetInventory($restId: ID) {
 *         restaurantInventory(restId: $restId) {
 *           restaurantId
 *           restaurantName
 *           city
 *           lowStockCount
 *           outOfStockCount
 *           inventory {
 *             id
 *             name
 *             quantity
 *             unit
 *             supplier
 *             minStock
 *             status
 *             isLowStock
 *             isOutOfStock
 *           }
 *         }
 *       }
 *       ```
 *
 *       Auth for `restaurantInventory` can be provided through the existing auth cookie
 *       or an `Authorization: Bearer <jwt>` header.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GraphQLRequest'
 *           examples:
 *             publicRestaurants:
 *               summary: Public restaurant query
 *               value:
 *                 query: "query { publicRestaurants { id name city leftovers { itemName quantity expiryDate } } }"
 *             restaurantInventory:
 *               summary: Authenticated inventory query
 *               value:
 *                 query: "query GetInventory($restId: ID) { restaurantInventory(restId: $restId) { restaurantId restaurantName city lowStockCount outOfStockCount inventory { id name quantity unit supplier minStock status isLowStock isOutOfStock } } }"
 *                 variables:
 *                   restId: "restaurant_123"
 *                 operationName: "GetInventory"
 *     responses:
 *       200:
 *         description: GraphQL execution result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       message:
 *                         type: string
 */

/**
 * @swagger
 * /api/create-payment-intent:
 *   post:
 *     summary: Create a Stripe PaymentIntent
 *     tags: [Payments]
 *     security:
 *       - csrfHeader: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: integer
 *                 minimum: 1
 *                 description: Amount in the smallest currency unit, such as paise or cents.
 *                 example: 50000
 *               currency:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 3
 *                 default: usd
 *                 example: inr
 *     responses:
 *       200:
 *         description: PaymentIntent created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clientSecret:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/admin/support/stats:
 *   get:
 *     summary: Get admin support statistics
 *     tags: [Admin Support]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Support statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupportStats'
 *
 * /api/admin/support/tickets:
 *   get:
 *     summary: List support tickets for admin review
 *     tags: [Admin Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *       - in: query
 *         name: rest_id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SupportTicket'
 *
 * /api/admin/support/tickets/{ticketId}:
 *   get:
 *     summary: Get a single support ticket
 *     tags: [Admin Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupportTicket'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 * /api/admin/support/tickets/{ticketId}/messages:
 *   post:
 *     summary: Add an admin reply to a support ticket
 *     tags: [Admin Support]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message added
 *
 * /api/admin/support/tickets/{ticketId}/status:
 *   patch:
 *     summary: Update a support ticket status
 *     tags: [Admin Support]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [open, in_progress, awaiting_customer, awaiting_owner, escalated, resolved, closed]
 *     responses:
 *       200:
 *         description: Status updated
 *
 * /api/admin/support/tickets/{ticketId}/assign:
 *   patch:
 *     summary: Assign a support ticket
 *     tags: [Admin Support]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assignedTo:
 *                 type: string
 *               assignedRole:
 *                 type: string
 *                 enum: [owner, admin]
 *     responses:
 *       200:
 *         description: Assignment updated
 *
 * /api/admin/support/tickets/{ticketId}/notes:
 *   post:
 *     summary: Add an internal admin note
 *     tags: [Admin Support]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [note]
 *             properties:
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Note added
 */

/**
 * @swagger
 * /api/owner/support/stats:
 *   get:
 *     summary: Get owner support statistics
 *     tags: [Owner Support]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Support statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupportStats'
 *
 * /api/owner/support/tickets:
 *   get:
 *     summary: List owner support tickets
 *     tags: [Owner Support]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ticket list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SupportTicket'
 *   post:
 *     summary: Create an owner support ticket
 *     tags: [Owner Support]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [category, subject, message]
 *             properties:
 *               category:
 *                 type: string
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *     responses:
 *       200:
 *         description: Ticket created
 *
 * /api/owner/support/tickets/{ticketId}:
 *   get:
 *     summary: Get an owner support ticket
 *     tags: [Owner Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupportTicket'
 *
 * /api/owner/support/tickets/{ticketId}/messages:
 *   post:
 *     summary: Add an owner reply to a support ticket
 *     tags: [Owner Support]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message added
 *
 * /api/owner/support/tickets/{ticketId}/status:
 *   patch:
 *     summary: Update owner ticket status
 *     tags: [Owner Support]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [open, in_progress, awaiting_customer, awaiting_owner, escalated, resolved, closed]
 *     responses:
 *       200:
 *         description: Status updated
 *
 * /api/owner/support/tickets/{ticketId}/priority:
 *   patch:
 *     summary: Update owner ticket priority
 *     tags: [Owner Support]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [priority]
 *             properties:
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *     responses:
 *       200:
 *         description: Priority updated
 *
 * /api/owner/support/tickets/{ticketId}/notes:
 *   post:
 *     summary: Add an owner internal note
 *     tags: [Owner Support]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [note]
 *             properties:
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Note added
 */

/**
 * @swagger
 * /api/employee/support/stats:
 *   get:
 *     summary: Get employee support statistics
 *     tags: [Admin Support]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Support statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupportStats'
 *
 * /api/employee/support/tickets:
 *   get:
 *     summary: List employee support tickets
 *     tags: [Admin Support]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ticket list
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SupportTicket'
 *
 * /api/employee/support/tickets/{ticketId}:
 *   get:
 *     summary: Get an employee support ticket
 *     tags: [Admin Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ticket details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SupportTicket'
 *
 * /api/employee/support/tickets/{ticketId}/messages:
 *   post:
 *     summary: Add an employee reply to a support ticket
 *     tags: [Admin Support]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message added
 *
 * /api/employee/support/tickets/{ticketId}/status:
 *   patch:
 *     summary: Update an employee support ticket status
 *     tags: [Admin Support]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 *
 * /api/employee/support/tickets/{ticketId}/assign:
 *   patch:
 *     summary: Assign an employee-visible support ticket
 *     tags: [Admin Support]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assignedTo:
 *                 type: string
 *               assignedRole:
 *                 type: string
 *     responses:
 *       200:
 *         description: Assignment updated
 *
 * /api/employee/support/tickets/{ticketId}/notes:
 *   post:
 *     summary: Add an employee internal note
 *     tags: [Admin Support]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [note]
 *             properties:
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Note added
 */

/**
 * @swagger
 * /api/staff/update-inventory:
 *   post:
 *     summary: Update inventory from the staff interface
 *     tags: [Staff Utilities]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               item:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               minStock:
 *                 type: number
 *     responses:
 *       200:
 *         description: Inventory updated
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */

module.exports = {};
