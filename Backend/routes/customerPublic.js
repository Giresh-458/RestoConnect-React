const express = require("express");
const router = express.Router();
const customerController = require("../Controller/customerController");
const { searchRestaurants } = require("../Controller/searchController");
const { redisReadCacheMiddleware } = require("../middleware/redisCache");

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

/**
 * @swagger
 * /api/customer/search:
 *   get:
 *     summary: Search restaurants with filters and pagination
 *     tags: [Customer]
 *     description: Public optimized restaurant search. Uses MongoDB text search for query/q/search, exact indexed filters for city/cuisine/open status, and paginated results.
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search keyword for restaurant name, cuisine, or city. Alias of q/search.
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search keyword alias.
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: cuisine
 *         schema:
 *           type: string
 *       - in: query
 *         name: open
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalResults:
 *                   type: integer
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Restaurant'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get("/search", searchRestaurants);

module.exports = router;
