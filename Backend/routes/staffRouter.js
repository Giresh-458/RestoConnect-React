
const express = require("express");
const router = express.Router();

const staffController = require("../Controller/staffController");

// ===========================================
// DASHBOARD ROUTES
// ===========================================

/**
 * @swagger
 * /api/staff/dashboard/summary:
 *   get:
 *     summary: Get staff dashboard summary
 *     tags: [Staff - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary with today's stats
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// REST-style dashboard (broken into parts)
router.get('/dashboard/summary', staffController.getStaffDashboardSummary);

// ===========================================
// ORDERS ROUTES
// ===========================================

/**
 * @swagger
 * /api/staff/orders:
 *   get:
 *     summary: Get all staff orders
 *     tags: [Staff - Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/orders', staffController.getStaffOrders);

/**
 * @swagger
 * /api/staff/orders/{orderId}/status:
 *   patch:
 *     summary: Update order status by ID
 *     tags: [Staff - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// REST-style order & reservation endpoints (API-first)
router.patch('/orders/:orderId/status', (req, res, next) => {
  req.body.orderId = req.params.orderId;
  return staffController.postUpdateOrder(req, res, next);
});

// ===========================================
// RESERVATIONS ROUTES
// ===========================================

/**
 * @swagger
 * /api/staff/reservations:
 *   get:
 *     summary: Get all reservations
 *     tags: [Staff - Reservations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of reservations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reservation'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/reservations', staffController.getStaffReservations);

/**
 * @swagger
 * /api/staff/reservations/{reservationId}/allocate:
 *   patch:
 *     summary: Allocate table to reservation by ID
 *     tags: [Staff - Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tableNumber
 *             properties:
 *               tableNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Table allocated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch('/reservations/:reservationId/allocate', (req, res, next) => {
  req.body.reservationId = req.params.reservationId;
  return staffController.postAllocateTable(req, res, next);
});

/**
 * @swagger
 * /api/staff/reservations/{id}:
 *   delete:
 *     summary: Remove a reservation
 *     tags: [Staff - Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reservation removed
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/reservations/:id', staffController.postRemoveReservation);

// ===========================================
// TABLES ROUTES
// ===========================================

/**
 * @swagger
 * /api/staff/tables:
 *   get:
 *     summary: Get all tables
 *     tags: [Staff - Tables]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tables
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Table'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     summary: Add a new table
 *     tags: [Staff - Tables]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - number
 *               - capacity
 *             properties:
 *               number:
 *                 type: integer
 *               capacity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Table added
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/tables', staffController.getStaffTables);
router.post('/tables', staffController.postAddTable);

/**
 * @swagger
 * /api/staff/tables/status:
 *   put:
 *     summary: Update table status
 *     tags: [Staff - Tables]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tableNumber
 *               - status
 *             properties:
 *               tableNumber:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Table status updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/tables/status', staffController.postUpdateTableStatus);

/**
 * @swagger
 * /api/staff/tables/{tableNumber}:
 *   delete:
 *     summary: Delete a table
 *     tags: [Staff - Tables]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tableNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Table deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/tables/:tableNumber', staffController.postDeleteTable);

// ===========================================
// INVENTORY ROUTES
// ===========================================

/**
 * @swagger
 * /api/staff/inventory:
 *   get:
 *     summary: Get inventory status
 *     tags: [Staff - Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory items
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/inventory', staffController.getStaffInventory);

router.post("/update-inventory", staffController.postUpdateInventory);

// ===========================================
// TASKS ROUTES
// ===========================================

/**
 * @swagger
 * /api/staff/tasks:
 *   get:
 *     summary: Get staff tasks
 *     tags: [Staff - Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/tasks', staffController.getStaffTasks);

/**
 * @swagger
 * /api/staff/tasks/{id}:
 *   put:
 *     summary: Update task status
 *     tags: [Staff - Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Task updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put("/tasks/:id", staffController.updateTaskStatus);

router.post("/HomePage/tasks", staffController.postHomePageTask);
router.delete("/HomePage/tasks/:id", staffController.deleteHomePageTasks);
router.post("/HomePage/tasks/delete/:id", staffController.deleteHomePageTasks);

// ===========================================
// FEEDBACK ROUTES
// ===========================================

/**
 * @swagger
 * /api/staff/feedback:
 *   get:
 *     summary: Get staff feedback
 *     tags: [Staff - Feedback]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of feedback
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/feedback', staffController.getStaffFeedback);

// ===========================================
// ANNOUNCEMENTS ROUTES
// ===========================================

/**
 * @swagger
 * /api/staff/announcements:
 *   get:
 *     summary: Get announcements
 *     tags: [Staff - Announcements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of announcements
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Announcement'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/announcements', staffController.getStaffAnnouncements);

// ===========================================
// HOMEPAGE ROUTES (REST-style, broken into parts)
// ===========================================

/**
 * @swagger
 * /api/staff/homepage/summary:
 *   get:
 *     summary: Get staff homepage summary
 *     tags: [Staff - Homepage]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Staff info, performance stats, table stats
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/homepage/summary", staffController.getStaffHomepageSummary);

/**
 * @swagger
 * /api/staff/homepage/orders:
 *   get:
 *     summary: Get today's active orders (homepage)
 *     tags: [Staff - Homepage]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's active orders
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/homepage/orders", staffController.getStaffHomepageOrders);

/**
 * @swagger
 * /api/staff/homepage/reservations:
 *   get:
 *     summary: Get today's reservations (homepage)
 *     tags: [Staff - Homepage]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's reservations
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/homepage/reservations", staffController.getStaffHomepageReservations);

/**
 * @swagger
 * /api/staff/homepage/shifts:
 *   get:
 *     summary: Get staff's today shifts
 *     tags: [Staff - Homepage]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's assigned shifts
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/homepage/shifts", staffController.getStaffHomepageShifts);

/**
 * @swagger
 * /api/staff/homepage/alerts:
 *   get:
 *     summary: Get homepage alerts (low stock, reservations, delayed orders)
 *     tags: [Staff - Homepage]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Alerts list
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/homepage/alerts", staffController.getStaffHomepageAlerts);

/**
 * @swagger
 * /api/staff/homepage/support-messages:
 *   get:
 *     summary: Get staff support messages
 *     tags: [Staff - Homepage]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Support messages and tickets
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/homepage/support-messages", staffController.getStaffHomepageSupportMessages);

/**
 * @swagger
 * /api/staff/homepage/feedback:
 *   get:
 *     summary: Get recent feedback (homepage)
 *     tags: [Staff - Homepage]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent feedback (limit 5)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/homepage/feedback", staffController.getStaffHomepageFeedback);

// ===========================================
// PASSWORD & PROFILE ROUTES
// ===========================================

/**
 * @swagger
 * /api/staff/change-password:
 *   post:
 *     summary: Change staff password
 *     tags: [Staff - Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/change-password', staffController.changePassword);

// ===========================================
// SUPPORT TICKETS ROUTES
// ===========================================

/**
 * @swagger
 * /api/staff/support-message:
 *   post:
 *     summary: Send support message
 *     tags: [Staff - Support]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               subject:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/support-message", staffController.postSupportMessage);

// Staff support ticket routes - only for web issues
const staffSupportController = require("../Controller/staffSupportController");

/**
 * @swagger
 * /api/staff/support/tickets:
 *   get:
 *     summary: Get staff support tickets
 *     tags: [Staff - Support]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of support tickets
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     summary: Create support ticket
 *     tags: [Staff - Support]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ticket created
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/support/tickets", staffSupportController.staffCreateTicket);
router.get("/support/tickets", staffSupportController.staffGetTickets);

/**
 * @swagger
 * /api/staff/support/tickets/{ticketId}:
 *   get:
 *     summary: Get support ticket by ID
 *     tags: [Staff - Support]
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/support/tickets/:ticketId", staffSupportController.staffGetTicket);

/**
 * @swagger
 * /api/staff/support/tickets/{ticketId}/messages:
 *   post:
 *     summary: Post message to support ticket
 *     tags: [Staff - Support]
 *     security:
 *       - bearerAuth: []
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
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message posted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/support/tickets/:ticketId/messages", staffSupportController.staffPostMessage);

/**
 * @swagger
 * /api/staff/support/tickets/{ticketId}/status:
 *   patch:
 *     summary: Update support ticket status
 *     tags: [Staff - Support]
 *     security:
 *       - bearerAuth: []
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
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch("/support/tickets/:ticketId/status", staffSupportController.staffUpdateStatus);

module.exports = router;

