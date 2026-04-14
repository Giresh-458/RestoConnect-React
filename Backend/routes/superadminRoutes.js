
const express = require("express");
const router = express.Router();
const controller = require("../Controller/superadminController");

/**
 * @swagger
 * /api/superadmin/dashboard:
 *   get:
 *     summary: Get super admin dashboard
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get("/dashboard", controller.getDashboard);

/**
 * @swagger
 * /api/superadmin/employees:
 *   get:
 *     summary: Get employee performance analytics
 *     tags: [Super Admin - Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employee performance data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get("/employees", controller.getEmployeePerformance);

/**
 * @swagger
 * /api/superadmin/restaurant-revenue:
 *   get:
 *     summary: Get restaurant revenue & platform fee analytics
 *     tags: [Super Admin - Analytics]
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
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get("/restaurant-revenue", controller.getRestaurantRevenue);

/**
 * @swagger
 * /api/superadmin/dish-trends:
 *   get:
 *     summary: Get dish & category trends
 *     tags: [Super Admin - Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dish trends data
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get("/dish-trends", controller.getDishTrends);

/**
 * @swagger
 * /api/superadmin/top-customers:
 *   get:
 *     summary: Get top customers
 *     tags: [Super Admin - Analytics]
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
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get("/top-customers", controller.getTopCustomers);

/**
 * @swagger
 * /api/superadmin/revenue-chart:
 *   get:
 *     summary: Get revenue over time (charts)
 *     tags: [Super Admin - Analytics]
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
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get("/revenue-chart", controller.getRevenueOverTime);

module.exports = router;

