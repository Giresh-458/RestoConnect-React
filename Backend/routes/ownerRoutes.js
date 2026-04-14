const express = require("express");
const router = express.Router();
const ownerController = require("../Controller/ownerController");
const { uploadDishImage, handleUploadErrors } = require("../util/fileUpload");


// ===========================================
// HOMEPAGE & DASHBOARD ROUTES
// ===========================================

/**
 * @swagger
 * /api/owner:
 *   get:
 *     summary: Get owner homepage
 *     tags: [Owner - Homepage]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Owner homepage data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/", ownerController.getOwnerHomepage);

/**
 * @swagger
 * /api/owner/dashboard:
 *   get:
 *     summary: Get owner dashboard data
 *     tags: [Owner - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data with revenue, orders, staff count
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/dashboard", ownerController.getownerDashboard_dashboard);

/**
 * @swagger
 * /api/owner/dashboard/ownerdashboard:
 *   get:
 *     summary: Get owner dashboard (alternate route)
 *     tags: [Owner - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/dashboard/ownerdashboard", ownerController.getownerDashboard_dashboard);


// ===========================================
// MENU MANAGEMENT ROUTES
// ===========================================

/**
 * @swagger
 * /api/owner/menuManagement:
 *   get:
 *     summary: Get menu management page
 *     tags: [Owner - Menu]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of dishes for the restaurant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       price:
 *                         type: number
 *                       description:
 *                         type: string
 *                       category:
 *                         type: string
 *                       image:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/menuManagement", ownerController.getMenuManagement);

/**
 * @swagger
 * /api/owner/menuManagement/add:
 *   post:
 *     summary: Add new dish to menu
 *     tags: [Owner - Menu]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 description: Dish name
 *               price:
 *                 type: number
 *                 description: Dish price
 *               description:
 *                 type: string
 *                 description: Dish description
 *               serves:
 *                 type: number
 *                 description: Number of servings
 *               category:
 *                 type: string
 *                 description: Dish category
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Dish image file
 *     responses:
 *       200:
 *         description: Dish added successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/menuManagement/add", uploadDishImage, handleUploadErrors, ownerController.addProduct);


// ===========================================
// ORDERS ROUTES
// ===========================================

/**
 * @swagger
 * /api/owner/orders:
 *   get:
 *     summary: Get all orders for owner's restaurant
 *     tags: [Owner - Orders]
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
router.get('/orders', ownerController.getOrders);

/**
 * @swagger
 * /api/owner/orders/recent:
 *   get:
 *     summary: Get recent orders
 *     tags: [Owner - Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent orders list
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/orders/recent", ownerController.getRecentOrders);

/**
 * @swagger
 * /api/owner/orders/{id}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Owner - Orders]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
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
 *                 enum: [pending, preparing, ready, served, done, completed, cancelled]
 *     responses:
 *       200:
 *         description: Order status updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch("/orders/:id/status", ownerController.updateOrderStatus);


// ===========================================
// RESERVATIONS ROUTES
// ===========================================

/**
 * @swagger
 * /api/owner/reservations:
 *   get:
 *     summary: Get all reservations
 *     tags: [Owner - Reservations]
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
router.get("/reservations", ownerController.getReservations);

/**
 * @swagger
 * /api/owner/reservations/{id}/status:
 *   patch:
 *     summary: Update reservation status
 *     tags: [Owner - Reservations]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Reservation ID
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
 *                 enum: [pending, confirmed, seated, completed, cancelled]
 *               tables:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of table numbers to assign
 *               cancellationReason:
 *                 type: string
 *                 description: Reason for cancellation (required if status is cancelled)
 *     responses:
 *       200:
 *         description: Reservation status updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch("/reservations/:id/status", ownerController.updateReservationStatus);


// ===========================================
// STAFF MANAGEMENT ROUTES
// ===========================================

/**
 * @swagger
 * /api/owner/staffManagement:
 *   get:
 *     summary: Get staff list
 *     tags: [Owner - Staff]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of staff members
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   username:
 *                     type: string
 *                   email:
 *                     type: string
 *                   role:
 *                     type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/staffManagement", ownerController.getStaffList);

/**
 * @swagger
 * /api/owner/staffManagement/add:
 *   post:
 *     summary: Add new staff member
 *     tags: [Owner - Staff]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               restaurantName:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Staff member added
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/staffManagement/add", ownerController.addStaff);

/**
 * @swagger
 * /api/owner/staffManagement/edit/{id}:
 *   post:
 *     summary: Edit staff member
 *     tags: [Owner - Staff]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Staff updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/staffManagement/edit/:id", ownerController.editStaff);

/**
 * @swagger
 * /api/owner/staffManagement/delete/{id}:
 *   post:
 *     summary: Delete staff member
 *     tags: [Owner - Staff]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff ID
 *     responses:
 *       200:
 *         description: Staff deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/staffManagement/delete/:id", ownerController.deleteStaff);

router.use((req,res,next)=>{
    console.log(req.url);
    next();
})

/**
 * @swagger
 * /api/owner/staffManagement/tasks/{staffId}:
 *   get:
 *     summary: Get tasks for specific staff
 *     tags: [Owner - Staff]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: staffId
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff ID
 *     responses:
 *       200:
 *         description: Staff tasks
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/staffManagement/tasks/:staffId", ownerController.getStaffTasks);

/**
 * @swagger
 * /api/owner/staffManagement/tasks/{taskId}:
 *   delete:
 *     summary: Delete staff task
 *     tags: [Owner - Staff]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete("/staffManagement/tasks/:taskId", ownerController.deleteStaffTask);

/**
 * @swagger
 * /api/owner/staffManagement/api/add:
 *   post:
 *     summary: Add new staff member (API)
 *     tags: [Owner - Staff]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - email
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Staff member added
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/staffManagement/api/add", ownerController.addStaffAPI);

/**
 * @swagger
 * /api/owner/staffManagement/api/{id}:
 *   delete:
 *     summary: Delete staff member (API)
 *     tags: [Owner - Staff]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Staff ID
 *     responses:
 *       200:
 *         description: Staff deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete("/staffManagement/api/:id", ownerController.deleteStaffAPI);


// ===========================================
// TABLE MANAGEMENT ROUTES
// ===========================================

/**
 * @swagger
 * /api/owner/tables:
 *   get:
 *     summary: Get all tables
 *     tags: [Owner - Tables]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tables
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tables:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Table'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/tables", ownerController.getTables);

/**
 * @swagger
 * /api/owner/tables/{number}/status:
 *   patch:
 *     summary: Update table status
 *     tags: [Owner - Tables]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: number
 *         required: true
 *         schema:
 *           type: string
 *         description: Table number
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
 *                 enum: [Available, Occupied, Reserved, Cleaning]
 *     responses:
 *       200:
 *         description: Table status updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch("/tables/:number/status", ownerController.updateTableStatus);

/**
 * @swagger
 * /api/owner/tables/api/add:
 *   post:
 *     summary: Add new table
 *     tags: [Owner - Tables]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - number
 *               - seats
 *             properties:
 *               number:
 *                 type: string
 *               seats:
 *                 type: number
 *     responses:
 *       200:
 *         description: Table added
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/tables/api/add", ownerController.addTableAPI);

/**
 * @swagger
 * /api/owner/tables/api/{number}:
 *   delete:
 *     summary: Delete table
 *     tags: [Owner - Tables]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: number
 *         required: true
 *         schema:
 *           type: string
 *         description: Table number
 *     responses:
 *       200:
 *         description: Table deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete("/tables/api/:number", ownerController.deleteTableAPI);


// ===========================================
// RESTAURANT MANAGEMENT
// ===========================================

/**
 * @swagger
 * /api/owner/restaurant/delete/{id}:
 *   delete:
 *     summary: Delete restaurant
 *     tags: [Owner - Restaurant]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Restaurant ID
 *     responses:
 *       200:
 *         description: Restaurant deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete("/restaurant/delete/:id", ownerController.deleteRestaurant);


// ===========================================
// TASKS & ANNOUNCEMENTS
// ===========================================

/**
 * @swagger
 * /api/owner/add-task:
 *   post:
 *     summary: Add new task
 *     tags: [Owner - Tasks]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *             properties:
 *               description:
 *                 type: string
 *               assignedTo:
 *                 type: array
 *                 items:
 *                   type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *     responses:
 *       200:
 *         description: Task added
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/add-task", ownerController.addTask);

/**
 * @swagger
 * /api/owner/add-announcement:
 *   post:
 *     summary: Add new announcement
 *     tags: [Owner - Announcements]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high]
 *     responses:
 *       200:
 *         description: Announcement added
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/add-announcement", ownerController.addAnnouncement);

/**
 * @swagger
 * /api/owner/add-shift:
 *   post:
 *     summary: Add new shift
 *     tags: [Owner - Shifts]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - date
 *               - startTime
 *               - endTime
 *             properties:
 *               name:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               assignedStaff:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Shift added
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/add-shift", ownerController.addShift);

/**
 * @swagger
 * /api/owner/announcements:
 *   get:
 *     summary: Get all announcements
 *     tags: [Owner - Announcements]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of announcements
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/announcements", ownerController.getAnnouncements);

/**
 * @swagger
 * /api/owner/announcements/{id}:
 *   delete:
 *     summary: Delete announcement
 *     tags: [Owner - Announcements]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Announcement ID
 *     responses:
 *       200:
 *         description: Announcement deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete("/announcements/:id", ownerController.deleteAnnouncement);


// ===========================================
// SUPPORT ROUTES
// ===========================================

/**
 * @swagger
 * /api/owner/support-messages:
 *   get:
 *     summary: Get support messages
 *     tags: [Owner - Support]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Support messages
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/support-messages", ownerController.getSupportMessages);

/**
 * @swagger
 * /api/owner/support-threads:
 *   get:
 *     summary: Get customer support threads
 *     tags: [Owner - Support]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Support threads
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/support-threads", ownerController.getCustomerSupportThreads);

/**
 * @swagger
 * /api/owner/support-threads/{threadId}/messages:
 *   post:
 *     summary: Post support message
 *     tags: [Owner - Support]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: threadId
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
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message posted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/support-threads/:threadId/messages", ownerController.postCustomerSupportMessage);

/**
 * @swagger
 * /api/owner/support-threads/{threadId}/status:
 *   patch:
 *     summary: Update support thread status
 *     tags: [Owner - Support]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: threadId
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
 *                 enum: [pending, resolved]
 *     responses:
 *       200:
 *         description: Status updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch("/support-threads/:threadId/status", ownerController.updateCustomerSupportStatus);


// ===========================================
// REPORTS ROUTES
// ===========================================

/**
 * @swagger
 * /api/owner/reports:
 *   get:
 *     summary: Get reports data
 *     tags: [Owner - Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reports data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/reports", ownerController.getReportsData);

/**
 * @swagger
 * /api/owner/owner/reports:
 *   get:
 *     summary: Get reports data (legacy route)
 *     tags: [Owner - Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reports data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// Legacy route
router.get("/owner/reports", ownerController.getReportsData);


// ===========================================
// INFO & DASHBOARD API ROUTES
// ===========================================

/**
 * @swagger
 * /api/owner/info:
 *   get:
 *     summary: Get owner info
 *     tags: [Owner - Account]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Owner information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                 restaurantName:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/info", ownerController.getOwnerInfo);

/**
 * @swagger
 * /api/owner/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Owner - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard KPIs
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/dashboard/stats", ownerController.getDashboardStats);

/**
 * @swagger
 * /api/owner/dashboard/summary:
 *   get:
 *     summary: Get dashboard summary
 *     tags: [Owner - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Complete dashboard summary
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/dashboard/summary", ownerController.getDashboardSummary);

/**
 * @swagger
 * /api/owner/dashboard/trend:
 *   get:
 *     summary: Get revenue and orders trend
 *     tags: [Owner - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Revenue and orders trend for last 7 days
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/dashboard/trend", ownerController.getRevenueOrdersTrend);


// ===========================================
// INVENTORY ROUTES
// ===========================================

/**
 * @swagger
 * /api/owner/inventory:
 *   get:
 *     summary: Get inventory items
 *     tags: [Owner - Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory list
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/inventory", ownerController.getInventoryAPI);

/**
 * @swagger
 * /api/owner/inventory:
 *   post:
 *     summary: Create inventory item
 *     tags: [Owner - Inventory]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - unit
 *             properties:
 *               name:
 *                 type: string
 *               unit:
 *                 type: string
 *               quantity:
 *                 type: number
 *               minStock:
 *                 type: number
 *               supplier:
 *                 type: string
 *     responses:
 *       200:
 *         description: Inventory item created
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/inventory", ownerController.createInventoryItem);

/**
 * @swagger
 * /api/owner/inventory/{id}/quantity:
 *   patch:
 *     summary: Update inventory quantity
 *     tags: [Owner - Inventory]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Inventory item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - change
 *             properties:
 *               change:
 *                 type: number
 *                 enum: [1, -1]
 *     responses:
 *       200:
 *         description: Quantity updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch("/inventory/:id/quantity", ownerController.updateInventoryQuantity);

/**
 * @swagger
 * /api/owner/inventory/{id}:
 *   delete:
 *     summary: Delete inventory item
 *     tags: [Owner - Inventory]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Inventory item ID
 *     responses:
 *       200:
 *         description: Inventory item deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete("/inventory/:id", ownerController.deleteInventoryItem);


// ===========================================
// FEEDBACK ROUTES
// ===========================================

/**
 * @swagger
 * /api/owner/feedback:
 *   get:
 *     summary: Get customer feedback
 *     tags: [Owner - Feedback]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Feedback list
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/feedback", ownerController.getFeedback);

/**
 * @swagger
 * /api/owner/feedback/{id}/status:
 *   put:
 *     summary: Update feedback status
 *     tags: [Owner - Feedback]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Feedback ID
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
 *                 enum: [Resolved, Pending]
 *     responses:
 *       200:
 *         description: Feedback status updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put("/feedback/:id/status", ownerController.updateFeedbackStatus);


// ===========================================
// MENU MANAGEMENT API ROUTES
// ===========================================

/**
 * @swagger
 * /api/owner/menuManagement/api/edit/{id}:
 *   put:
 *     summary: Edit dish (API)
 *     tags: [Owner - Menu]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dish ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *               serves:
 *                 type: number
 *               isAvailable:
 *                 type: boolean
 *               category:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Dish updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put("/menuManagement/api/edit/:id", uploadDishImage, handleUploadErrors, ownerController.editProductAPI);

/**
 * @swagger
 * /api/owner/menuManagement/api/delete/{id}:
 *   delete:
 *     summary: Delete dish (API)
 *     tags: [Owner - Menu]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dish ID
 *     responses:
 *       200:
 *         description: Dish deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete("/menuManagement/api/delete/:id", ownerController.deleteProductAPI);


// ===========================================
// SETTINGS ROUTES
// ===========================================

/**
 * @swagger
 * /api/owner/settings:
 *   get:
 *     summary: Get restaurant settings
 *     tags: [Owner - Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Restaurant settings
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/settings", ownerController.getRestaurantSettings);

/**
 * @swagger
 * /api/owner/settings:
 *   put:
 *     summary: Update restaurant settings
 *     tags: [Owner - Settings]
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
 *               name:
 *                 type: string
 *               isOpen:
 *                 type: boolean
 *               operatingHours:
 *                 type: object
 *                 properties:
 *                   open:
 *                     type: string
 *                   close:
 *                     type: string
 *               location:
 *                 type: string
 *               city:
 *                 type: string
 *               cuisine:
 *                 type: array
 *                 items:
 *                   type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               description:
 *                 type: string
 *               taxRate:
 *                 type: number
 *               serviceCharge:
 *                 type: number
 *     responses:
 *       200:
 *         description: Settings updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put("/settings", ownerController.updateRestaurantSettings);


// ===========================================
// ACCOUNT ROUTES
// ===========================================

/**
 * @swagger
 * /api/owner/account:
 *   put:
 *     summary: Update owner account
 *     tags: [Owner - Account]
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
 *               username:
 *                 type: string
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put("/account", ownerController.updateOwnerAccount);


// ===========================================
// PROMO CODES ROUTES
// ===========================================

/**
 * @swagger
 * /api/owner/promo-codes:
 *   get:
 *     summary: Get promo codes
 *     tags: [Owner - Promo Codes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of promo codes
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/promo-codes", ownerController.getPromoCodes);

/**
 * @swagger
 * /api/owner/promo-codes:
 *   post:
 *     summary: Create promo code
 *     tags: [Owner - Promo Codes]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - discountValue
 *               - validUntil
 *             properties:
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *               discountValue:
 *                 type: number
 *               minAmount:
 *                 type: number
 *               maxDiscount:
 *                 type: number
 *               validFrom:
 *                 type: string
 *                 format: date
 *               validUntil:
 *                 type: string
 *                 format: date
 *               usageLimit:
 *                 type: number
 *     responses:
 *       200:
 *         description: Promo code created
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/promo-codes", ownerController.createPromoCode);

/**
 * @swagger
 * /api/owner/promo-codes/{id}/toggle:
 *   patch:
 *     summary: Toggle promo code active status
 *     tags: [Owner - Promo Codes]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Promo code ID
 *     responses:
 *       200:
 *         description: Promo code toggled
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch("/promo-codes/:id/toggle", ownerController.togglePromoCode);

/**
 * @swagger
 * /api/owner/promo-codes/{id}:
 *   delete:
 *     summary: Delete promo code
 *     tags: [Owner - Promo Codes]
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Promo code ID
 *     responses:
 *       200:
 *         description: Promo code deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete("/promo-codes/:id", ownerController.deletePromoCode);


// ===========================================
// LIVE FLOOR ROUTE
// ===========================================

/**
 * @swagger
 * /api/owner/live-floor:
 *   get:
 *     summary: Get live floor data
 *     description: Returns tables, active orders, and today's reservations
 *     tags: [Owner - Live Floor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Live floor data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tables:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Table'
 *                 activeOrders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 todayReservations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Reservation'
 *                 isOpen:
 *                   type: boolean
 *                 operatingHours:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/live-floor", ownerController.getLiveFloor);

module.exports = router;

