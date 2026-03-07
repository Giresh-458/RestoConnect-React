
const express = require('express');
const path = require('path');
const router = express.Router();

const admincontroller = require('../Controller/adminController');
const auth_middleware = require('../authenticationMiddleWare');


// ===========================================
// DASHBOARD ROUTES
// ===========================================

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/dashboard', admincontroller.getAdminDashboard);


// ===========================================
// RESTAURANT MANAGEMENT ROUTES
// ===========================================

/**
 * @swagger
 * /api/admin/restaurants:
 *   get:
 *     summary: Get all restaurants (admin)
 *     tags: [Admin - Restaurants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of restaurants
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Restaurant'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// Legacy restaurant routes (kept for compatibility)
router.get('/restaurants', admincontroller.getAllRestaurants); // admin use

/**
 * @swagger
 * /api/admin/add_restaurant:
 *   post:
 *     summary: Add new restaurant
 *     tags: [Admin - Restaurants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - location
 *               - amount
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               amount:
 *                 type: number
 *               owner_username:
 *                 type: string
 *               owner_password:
 *                 type: string
 *               owner_email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Restaurant added
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/add_restaurant', admincontroller.postAddRestaurent);

/**
 * @swagger
 * /api/admin/restaurants:
 *   post:
 *     summary: Add new restaurant (REST)
 *     tags: [Admin - Restaurants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - location
 *               - amount
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Restaurant added
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/restaurants', admincontroller.postAddRestaurent);

/**
 * @swagger
 * /api/admin/restaurants/{id}:
 *   put:
 *     summary: Edit restaurant
 *     tags: [Admin - Restaurants]
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
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Restaurant updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/restaurants/:id', admincontroller.postEditRestaurent);
router.post('/edit_restaurant/:id', admincontroller.postEditRestaurent);

/**
 * @swagger
 * /api/admin/restaurants/{id}:
 *   delete:
 *     summary: Delete restaurant
 *     tags: [Admin - Restaurants]
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
 *         description: Restaurant deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/restaurants/:id', admincontroller.postDeleteRestaurent);
router.delete('/delete_restaurant/:id',admincontroller.postDeleteRestaurent);

/**
 * @swagger
 * /api/admin/restaurants/{id}/suspension:
 *   patch:
 *     summary: Suspend restaurant
 *     tags: [Admin - Restaurants]
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
 *               - suspensionEndDate
 *             properties:
 *               suspensionEndDate:
 *                 type: string
 *               suspensionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Restaurant suspended
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch('/restaurants/:id/suspension', admincontroller.suspendRestaurant);
router.post('/suspend_restaurant/:id', admincontroller.suspendRestaurant);

/**
 * @swagger
 * /api/admin/restaurants/{id}/suspension/clear:
 *   patch:
 *     summary: Unsuspend restaurant
 *     tags: [Admin - Restaurants]
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
 *         description: Restaurant unsuspended
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch('/restaurants/:id/suspension/clear', admincontroller.unsuspendRestaurant);
router.post('/unsuspend_restaurant/:id', admincontroller.unsuspendRestaurant);

/**
 * @swagger
 * /api/admin/chartstats:
 *   get:
 *     summary: Get statistics graphs
 *     tags: [Admin - Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, monthly, yearly]
 *     responses:
 *       200:
 *         description: Chart statistics
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/chartstats',admincontroller.getStatisticsGraphs);


// ===========================================
// USER MANAGEMENT ROUTES
// ===========================================

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/users', admincontroller.getAllUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Admin - Users]
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
 *         description: User deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/users/:id', admincontroller.deleteUser);
router.post('/delete_user/:id', admincontroller.deleteUser);

/**
 * @swagger
 * /api/admin/users/{id}/suspension:
 *   patch:
 *     summary: Suspend user
 *     tags: [Admin - Users]
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
 *               - suspensionEndDate
 *             properties:
 *               suspensionEndDate:
 *                 type: string
 *               suspensionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: User suspended
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch('/users/:id/suspension', admincontroller.suspendUser);
router.post('/suspend_user/:id', admincontroller.suspendUser);

/**
 * @swagger
 * /api/admin/users/{id}/suspension/clear:
 *   patch:
 *     summary: Unsuspend user
 *     tags: [Admin - Users]
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
 *         description: User unsuspended
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch('/users/:id/suspension/clear', admincontroller.unsuspendUser);
router.post('/unsuspend_user/:id', admincontroller.unsuspendUser);

/**
 * @swagger
 * /api/admin/profile:
 *   put:
 *     summary: Edit admin profile
 *     tags: [Admin - Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               currentPassword:
 *                 type: string
 *               newpassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/profile', admincontroller.editProfile);
router.post('/edit_profile', admincontroller.editProfile);

/**
 * @swagger
 * /api/admin/password:
 *   put:
 *     summary: Change admin password
 *     tags: [Admin - Profile]
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
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/password', admincontroller.changePassword);
router.post('/change_password', admincontroller.changePassword);

/**
 * @swagger
 * /api/admin/account:
 *   delete:
 *     summary: Delete admin account
 *     tags: [Admin - Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/account', admincontroller.deleteAccount);
router.delete('/delete_account', admincontroller.deleteAccount);

/**
 * @swagger
 * /api/admin/statistics:
 *   get:
 *     summary: Get admin statistics
 *     tags: [Admin - Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/statistics', admincontroller.getStatistics);


// ===========================================
// RESTAURANT ONBOARDING REQUESTS
// ===========================================

/**
 * @swagger
 * /api/admin/requests:
 *   get:
 *     summary: Get all restaurant requests
 *     tags: [Admin - Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of requests
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/requests', admincontroller.getAllRequests);
router.get('/restaurant-requests', admincontroller.getAllRequests);

/**
 * @swagger
 * /api/admin/restaurant-requests/{owner_username}/accept:
 *   post:
 *     summary: Accept restaurant request
 *     tags: [Admin - Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: owner_username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Request accepted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/accept_request/:owner_username', admincontroller.getaceptreq);
router.post('/restaurant-requests/:owner_username/accept', admincontroller.getaceptreq);

/**
 * @swagger
 * /api/admin/restaurant-requests/{owner_username}/reject:
 *   post:
 *     summary: Reject restaurant request
 *     tags: [Admin - Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: owner_username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Request rejected
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/reject_request/:owner_username', admincontroller.getrejectreq);
router.post('/restaurant-requests/:owner_username/reject', admincontroller.getrejectreq);


// ===========================================
// ACTIVITIES & ANALYTICS
// ===========================================

/**
 * @swagger
 * /api/admin/activities:
 *   get:
 *     summary: Get recent activities
 *     tags: [Admin - Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent activities
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/activities', admincontroller.getRecentActivities);

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: restaurant
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of orders
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/orders', admincontroller.getAllOrders);

/**
 * @swagger
 * /api/admin/reservations:
 *   get:
 *     summary: Get all reservations
 *     tags: [Admin - Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: restaurant
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of reservations
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/reservations', admincontroller.getAllReservations);

/**
 * @swagger
 * /api/admin/feedback:
 *   get:
 *     summary: Get all feedback
 *     tags: [Admin - Feedback]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of feedback
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/feedback', admincontroller.getAllFeedback);

/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Get analytics data
 *     tags: [Admin - Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/analytics', admincontroller.getAnalytics);


// ===========================================
// EMPLOYEE MANAGEMENT
// ===========================================

/**
 * @swagger
 * /api/admin/add-employee:
 *   post:
 *     summary: Add new employee
 *     tags: [Admin - Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Employee created
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/add-employee', admincontroller.addEmployee);
router.post('/employees', admincontroller.addEmployee);


// ===========================================
// INSIGHTS & ANALYTICS
// ===========================================

/**
 * @swagger
 * /api/admin/insights/employees:
 *   get:
 *     summary: Get employee performance
 *     tags: [Admin - Insights]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employee performance data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/insights/employees', admincontroller.getEmployeePerformance);

/**
 * @swagger
 * /api/admin/insights/restaurant-revenue:
 *   get:
 *     summary: Get restaurant revenue
 *     tags: [Admin - Insights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [all, today, week, month, year]
 *     responses:
 *       200:
 *         description: Revenue data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/insights/restaurant-revenue', admincontroller.getRestaurantRevenue);

/**
 * @swagger
 * /api/admin/insights/dish-trends:
 *   get:
 *     summary: Get dish trends
 *     tags: [Admin - Insights]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dish trends data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/insights/dish-trends', admincontroller.getDishTrends);

/**
 * @swagger
 * /api/admin/insights/top-customers:
 *   get:
 *     summary: Get top customers
 *     tags: [Admin - Insights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [all, month, quarter, year]
 *     responses:
 *       200:
 *         description: Top customers data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/insights/top-customers', admincontroller.getTopCustomers);

/**
 * @swagger
 * /api/admin/overview:
 *   get:
 *     summary: Get admin overview
 *     tags: [Admin - Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overview data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/overview', admincontroller.getAdminOverview);

/**
 * @swagger
 * /api/admin/revenue-chart:
 *   get:
 *     summary: Get revenue over time
 *     tags: [Admin - Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, monthly, yearly]
 *     responses:
 *       200:
 *         description: Revenue chart data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/revenue-chart', admincontroller.getRevenueOverTime);


module.exports = router;

