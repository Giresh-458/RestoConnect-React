const express = require("express");
const router = express.Router();
const customerController = require("../Controller/customerController");

// ==================== PUBLIC ROUTES ====================

/**
 * @swagger
 * /api/customer/restaurants/public-cuisines:
 *   get:
 *     summary: Get all public cuisines available
 *     tags: [Customer]
 *     description: Retrieve a list of all cuisines that are available across restaurants in the platform. This endpoint does not require authentication.
 *     responses:
 *       200:
 *         description: Cuisines retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               example: ["Italian", "Chinese", "Indian", "Mexican", "Thai"]
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/restaurants/public-cuisines",
  customerController.getPublicCuisines,
);

module.exports = router;
