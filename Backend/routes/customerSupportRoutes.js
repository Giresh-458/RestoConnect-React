const express = require("express");
const router = express.Router();
const supportController = require("../Controller/supportController");

// ==================== CUSTOMER SUPPORT ORDERS ====================

/**
 * @swagger
 * /api/customer/support/orders:
 *   get:
 *     summary: Get customer support orders
 *     tags: [Customer Support]
 *     description: Retrieve list of customer's support-related orders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/orders", supportController.customerGetOrders);

// ==================== SUPPORT CATEGORIES ====================

/**
 * @swagger
 * /api/customer/support/categories:
 *   get:
 *     summary: Get support ticket categories
 *     tags: [Customer Support]
 *     description: Retrieve list of available support ticket categories. Does not require authentication.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                     example: "Order Issue"
 *                   description:
 *                     type: string
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/categories", supportController.getCategories);

// ==================== SUPPORT TICKETS ====================

/**
 * @swagger
 * /api/customer/support/tickets:
 *   get:
 *     summary: Get customer support tickets
 *     tags: [Customer Support]
 *     description: Retrieve list of support tickets created by the authenticated customer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Support tickets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   subject:
 *                     type: string
 *                   status:
 *                     type: string
 *                     enum: [open, closed, in-progress, resolved]
 *                   category:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *   post:
 *     summary: Create a new support ticket
 *     tags: [Customer Support]
 *     description: Create a new support ticket for issue resolution
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
 *               - subject
 *               - category
 *               - message
 *             properties:
 *               subject:
 *                 type: string
 *                 example: "Order not received"
 *               category:
 *                 type: string
 *                 example: "order_issue"
 *               message:
 *                 type: string
 *                 example: "I placed an order 2 hours ago but it hasn't arrived"
 *     responses:
 *       201:
 *         description: Support ticket created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 subject:
 *                   type: string
 *                 status:
 *                   type: string
 *                 category:
 *                   type: string
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/tickets", supportController.customerGetTickets);
router.post("/tickets", supportController.customerCreateTicket);

/**
 * @swagger
 * /api/customer/support/tickets/{ticketId}:
 *   get:
 *     summary: Get support ticket details
 *     tags: [Customer Support]
 *     description: Retrieve detailed information about a specific support ticket including messages and status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *         description: Support ticket ID
 *     responses:
 *       200:
 *         description: Ticket details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 subject:
 *                   type: string
 *                 status:
 *                   type: string
 *                 category:
 *                   type: string
 *                 messages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       senderRole:
 *                         type: string
 *                         enum: [customer, staff]
 *                       senderName:
 *                         type: string
 *                       text:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Support ticket not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/tickets/:ticketId", supportController.customerGetTicket);

// ==================== SUPPORT MESSAGES ====================

/**
 * @swagger
 * /api/customer/support/tickets/{ticketId}/messages:
 *   post:
 *     summary: Post a message to support ticket
 *     tags: [Customer Support]
 *     description: Add a new message to an existing support ticket conversation
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *         description: Support ticket ID
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
 *                 example: "Thank you for the quick response"
 *     responses:
 *       201:
 *         description: Message posted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 ticketId:
 *                   type: string
 *                 senderRole:
 *                   type: string
 *                 text:
 *                   type: string
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Support ticket not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  "/tickets/:ticketId/messages",
  supportController.customerPostMessage,
);

// ==================== SUPPORT TICKET RATING ====================

/**
 * @swagger
 * /api/customer/support/tickets/{ticketId}/rate:
 *   patch:
 *     summary: Rate a support ticket
 *     tags: [Customer Support]
 *     description: Rate the quality of support received on a resolved ticket
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *         description: Support ticket ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: "Excellent support, issue resolved quickly"
 *     responses:
 *       200:
 *         description: Ticket rated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 rating:
 *                   type: integer
 *                 comment:
 *                   type: string
 *       400:
 *         description: Invalid rating or request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Support ticket not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch("/tickets/:ticketId/rate", supportController.customerRateTicket);

// ==================== SUPPORT TICKET CLOSURE ====================

/**
 * @swagger
 * /api/customer/support/tickets/{ticketId}/close:
 *   patch:
 *     summary: Close a support ticket
 *     tags: [Customer Support]
 *     description: Close an open support ticket. Can only close your own tickets.
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *         description: Support ticket ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Issue resolved"
 *     responses:
 *       200:
 *         description: Support ticket closed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 status:
 *                   type: string
 *                   example: "closed"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Support ticket not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch("/tickets/:ticketId/close", supportController.customerCloseTicket);

module.exports = router;
