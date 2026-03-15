const express = require("express");
const router = express.Router();
const path = require("path");

const customerController = require("../Controller/customerController");
const menuController = require("../Controller/menuController");
const homePageController = require("../Controller/homePageController");
const {
  uploadProfilePicture,
  handleUploadErrors,
} = require("../util/fileUpload");

// ==================== PUBLIC ROUTES ====================

/**
 * @swagger
 * /api/customer/restaurants/public-cuisines:
 *   get:
 *     summary: Get all public cuisines available
 *     tags: [Customer]
 *     description: Retrieve a list of all cuisines that are available in restaurants
 *     responses:
 *       200:
 *         description: Cuisines retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
router.get(
  "/restaurants/public-cuisines",
  customerController.getPublicCuisines,
);

// ==================== DASHBOARD ROUTES ====================

/**
 * @swagger
 * /api/customer/customerDashboard:
 *   get:
 *     summary: Get customer dashboard data
 *     tags: [Customer Dashboard]
 *     description: Retrieve comprehensive dashboard data including recent orders, reservations, favorites, and statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     img_url:
 *                       type: string
 *                     totalOrders:
 *                       type: number
 *                     avgSpend:
 *                       type: string
 *                 recentOrders:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       orderId:
 *                         type: string
 *                       dishName:
 *                         type: string
 *                       price:
 *                         type: number
 *                       status:
 *                         type: string
 *                       date:
 *                         type: string
 *                       restaurant:
 *                         type: string
 *                 favoriteRestaurants:
 *                   type: array
 *                 upcomingReservations:
 *                   type: array
 *                 weeklySpending:
 *                   type: array
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 */
router.get("/customerDashboard", customerController.getCustomerDashboard);

// ==================== FEEDBACK ROUTES ====================

/**
 * @swagger
 * /api/customer/feedback:
 *   get:
 *     summary: Get feedback page data
 *     tags: [Feedback]
 *     description: Retrieve recent orders and feedback information for the customer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Feedback data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                 recentOrders:
 *                   type: array
 *                 restaurants:
 *                   type: array
 *                 feedbacks:
 *                   type: array
 *       404:
 *         description: User not found
 */
router.get("/feedback", customerController.getFeedBack);

/**
 * @swagger
 * /api/customer/submit-feedback:
 *   post:
 *     summary: Submit feedback for an order
 *     tags: [Feedback]
 *     description: Submit rating and feedback for a completed order at a restaurant
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
 *               - rest_id
 *               - orderId
 *             properties:
 *               rest_id:
 *                 type: string
 *                 description: Restaurant ID
 *               orderId:
 *                 type: string
 *                 description: Order ID
 *               diningRating:
 *                 type: number
 *                 description: Dining experience rating (1-5)
 *               orderRating:
 *                 type: number
 *                 description: Order quality rating (1-5)
 *               lovedItems:
 *                 type: string
 *                 description: Items the customer loved
 *               additionalFeedback:
 *                 type: string
 *                 description: Additional comments
 *     responses:
 *       200:
 *         description: Feedback submitted successfully
 *       400:
 *         description: Invalid request or duplicate feedback
 *       404:
 *         description: Restaurant not found
 */
router.post("/submit-feedback", customerController.submitFeedback);

// ==================== SUPPORT ROUTES ====================

/**
 * @swagger
 * /api/customer/support-threads:
 *   get:
 *     summary: Get customer support threads
 *     tags: [Support]
 *     description: Retrieve all support chat threads for a restaurant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: rest_id
 *         schema:
 *           type: string
 *         required: true
 *         description: Restaurant ID
 *     responses:
 *       200:
 *         description: Support threads retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 restaurant:
 *                   type: object
 *                 threads:
 *                   type: array
 *       400:
 *         description: Restaurant ID required
 *       401:
 *         description: Not authenticated
 */
router.get("/support-threads", customerController.getCustomerSupportThreads);

/**
 * @swagger
 * /api/customer/support-threads:
 *   post:
 *     summary: Create a new support thread
 *     tags: [Support]
 *     description: Initiate a new support chat with a restaurant
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
 *               - rest_id
 *               - message
 *             properties:
 *               rest_id:
 *                 type: string
 *                 description: Restaurant ID
 *               message:
 *                 type: string
 *                 description: Initial message to support
 *     responses:
 *       200:
 *         description: Support thread created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Not authenticated
 */
router.post("/support-threads", customerController.createCustomerSupportThread);

/**
 * @swagger
 * /api/customer/support-threads/{threadId}/messages:
 *   post:
 *     summary: Post message to support thread
 *     tags: [Support]
 *     description: Add a new message to an existing support chat thread
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: threadId
 *         schema:
 *           type: string
 *         required: true
 *         description: Support thread ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rest_id
 *               - message
 *             properties:
 *               rest_id:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message posted successfully
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Support thread not found
 */
router.post(
  "/support-threads/:threadId/messages",
  customerController.postCustomerSupportMessage,
);

/**
 * @swagger
 * /api/customer/support-threads/{threadId}/status:
 *   patch:
 *     summary: Update support thread status
 *     tags: [Support]
 *     description: Mark a support thread as resolved or pending
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: threadId
 *         schema:
 *           type: string
 *         required: true
 *         description: Support thread ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rest_id
 *               - status
 *             properties:
 *               rest_id:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, resolved]
 *     responses:
 *       200:
 *         description: Thread status updated successfully
 *       401:
 *         description: Not authenticated
 */
router.patch(
  "/support-threads/:threadId/status",
  customerController.updateCustomerSupportStatus,
);

// ==================== PROFILE ROUTES ====================

/**
 * @swagger
 * /api/customer/edit:
 *   get:
 *     summary: Get customer profile edit data
 *     tags: [Profile]
 *     description: Retrieve customer profile information for editing
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     img_url:
 *                       type: string
 *       404:
 *         description: User not found
 */
router.get("/edit", customerController.getEditProfile);

/**
 * @swagger
 * /api/customer/edit:
 *   post:
 *     summary: Update customer profile
 *     tags: [Profile]
 *     description: Update customer profile information including name, email, phone, and profile picture
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 */
router.post(
  "/edit",
  uploadProfilePicture,
  handleUploadErrors,
  customerController.postEditProfile,
);

// ==================== ORDER & RESERVATION ROUTES ====================

/**
 * @swagger
 * /api/customer/order_reservation:
 *   get:
 *     summary: Get order and reservation data
 *     tags: [Orders & Reservations]
 *     description: Retrieve order and reservation form data including cart and restaurant info
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order/reservation data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 restaurantName:
 *                   type: string
 *                 cart:
 *                   type: array
 *                 rest_id:
 *                   type: string
 *   post:
 *     summary: Get order and reservation data (alternative endpoint)
 *     tags: [Orders & Reservations]
 *     description: Retrieve order and reservation form data
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               restaurant:
 *                 type: string
 *               rest_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Data retrieved successfully
 */
router.post("/order_reservation", customerController.postOrderAndReservation);
router.get("/order_reservation", customerController.postOrderAndReservation);

/**
 * @swagger
 * /api/customer/order_reservation/order:
 *   post:
 *     summary: Create an order
 *     tags: [Orders & Reservations]
 *     description: Create a new order for dishes
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
 *               - restaurant
 *             properties:
 *               restaurant:
 *                 type: string
 *               specialRequests:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order created successfully
 *       400:
 *         description: Restaurant is closed
 */
router.post("/order_reservation/order", customerController.order);

/**
 * @swagger
 * /api/customer/order_reservation/reservation:
 *   post:
 *     summary: Create a reservation
 *     tags: [Orders & Reservations]
 *     description: Create a new table reservation at a restaurant
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
 *               - restaurant
 *               - date
 *               - time
 *               - guests
 *             properties:
 *               restaurant:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               time:
 *                 type: string
 *               guests:
 *                 type: number
 *     responses:
 *       200:
 *         description: Reservation created successfully
 *       400:
 *         description: Invalid request
 */
router.post("/order_reservation/reservation", customerController.reservation);

/**
 * @swagger
 * /api/customer/order_reservation/combined:
 *   post:
 *     summary: Create order and reservation together
 *     tags: [Orders & Reservations]
 *     description: Create both an order and reservation in a single request
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
 *               restaurant:
 *                 type: string
 *               specialRequests:
 *                 type: string
 *               date:
 *                 type: string
 *               time:
 *                 type: string
 *               guests:
 *                 type: number
 *     responses:
 *       200:
 *         description: Order and reservation created successfully
 */
router.post(
  "/order_reservation/combined",
  customerController.postOrderAndReservationCombined,
);

// ==================== CHECKOUT & PAYMENT ROUTES ====================

/**
 * @swagger
 * /api/customer/checkout:
 *   post:
 *     summary: Process checkout
 *     tags: [Checkout]
 *     description: Process cart checkout with order and/or reservation
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
 *               - rest_id
 *               - items
 *               - totalAmount
 *             properties:
 *               rest_id:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *               totalAmount:
 *                 type: number
 *               reservation:
 *                 type: object
 *               promoCode:
 *                 type: string
 *               promoDiscount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Checkout processed successfully
 *       400:
 *         description: Invalid request
 */
router.post("/checkout", customerController.apiCheckout);

/**
 * @swagger
 * /api/customer/checkout/pay:
 *   post:
 *     summary: Process payment
 *     tags: [Checkout]
 *     description: Complete payment for checkout order/reservation
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
 *               - rest_id
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: Existing order ID (optional, if not creating new order)
 *               rest_id:
 *                 type: string
 *                 description: Restaurant ID (required for existing orders or payment)
 *               payload:
 *                 type: object
 *                 description: Order/Reservation details when creating new order (required if no orderId)
 *                 properties:
 *                   rest_id:
 *                     type: string
 *                     description: Restaurant ID
 *                   items:
 *                     type: array
 *                     description: Items in the order
 *                     items:
 *                       type: object
 *                   totalAmount:
 *                     type: number
 *                     description: Total order amount
 *                   reservation:
 *                     type: object
 *                     description: Reservation details if applicable
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *       400:
 *         description: Invalid request or restaurant closed
 *       404:
 *         description: Order not found
 */
router.post("/checkout/pay", customerController.apiCheckoutPay);

/**
 * @swagger
 * /api/customer/payments:
 *   get:
 *     summary: Get payment page data
 *     tags: [Payments]
 *     description: Retrieve payment page information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bill_price:
 *                   type: number
 */
router.get("/payments", customerController.getPayments);

/**
 * @swagger
 * /api/customer/orderplaced:
 *   post:
 *     summary: Confirm payment success
 *     tags: [Payments]
 *     description: Record successful payment and create order/reservation
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
 *               restaurant:
 *                 type: string
 *               rest_id:
 *                 type: string
 *               cart:
 *                 type: array
 *               totalAmount:
 *                 type: number
 *               reservation:
 *                 type: object
 *     responses:
 *       200:
 *         description: Payment confirmed and order created
 */
router.post("/orderplaced", customerController.postPaymentsSuccess);

// ==================== ORDER ROUTES ====================

/**
 * @swagger
 * /api/customer/orders/{orderId}:
 *   get:
 *     summary: Get order details
 *     tags: [Orders]
 *     description: Retrieve details for a specific order
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *       404:
 *         description: Order not found
 */
router.get("/orders/:orderId", customerController.getOrderById);

/**
 * @swagger
 * /api/customer/orders/{orderId}/reorder:
 *   post:
 *     summary: Reorder from a previous order
 *     tags: [Orders]
 *     description: Create a new order with the same items as a previous order
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         schema:
 *           type: string
 *         required: true
 *         description: Previous order ID
 *     responses:
 *       200:
 *         description: Reorder created successfully
 *       404:
 *         description: Order not found
 */
router.post("/orders/:orderId/reorder", customerController.reorderOrder);

// ==================== PREFERENCES ROUTES ====================

/**
 * @swagger
 * /api/customer/preferences/email-notifications:
 *   post:
 *     summary: Update email notification preferences
 *     tags: [Preferences]
 *     description: Enable or disable email notifications
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
 *               - enabled
 *             properties:
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *       400:
 *         description: Invalid request
 */
router.post(
  "/preferences/email-notifications",
  customerController.updateEmailNotifications,
);

// ==================== FAVOURITES ROUTES ====================

/**
 * @swagger
 * /api/customer/favourites:
 *   get:
 *     summary: Get favorite restaurants
 *     tags: [Favorites]
 *     description: Retrieve list of customer's favorite restaurants
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Favorite restaurants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get("/favourites", customerController.getFavourites);

/**
 * @swagger
 * /api/customer/favourites/add:
 *   post:
 *     summary: Add dish to favorites
 *     tags: [Favorites]
 *     description: Add a dish to customer's favorites
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
 *               - dishId
 *             properties:
 *               dishId:
 *                 type: string
 *                 description: Dish ID to add to favorites
 *     responses:
 *       200:
 *         description: Dish added to favorites
 */
router.post("/favourites/add", customerController.addToFavourites);

/**
 * @swagger
 * /api/customer/favourites/remove:
 *   post:
 *     summary: Remove dish from favorites
 *     tags: [Favorites]
 *     description: Remove a dish from customer's favorites
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
 *               - dishId
 *             properties:
 *               dishId:
 *                 type: string
 *                 description: Dish ID to remove from favorites
 *     responses:
 *       200:
 *         description: Dish removed from favorites
 */
router.post("/favourites/remove", customerController.removeFromFavourites);

// ==================== MENU ROUTES ====================

/**
 * @swagger
 * /api/customer/menu/{restid}:
 *   get:
 *     summary: Get restaurant menu
 *     tags: [Menu]
 *     description: Retrieve the menu for a specific restaurant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restid
 *         schema:
 *           type: string
 *         required: true
 *         description: Restaurant ID
 *     responses:
 *       200:
 *         description: Menu retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 restaurant:
 *                   type: object
 *                 dishes:
 *                   type: array
 *       404:
 *         description: Restaurant not found
 */
router.get("/menu/:restid", menuController.getMenu);

// ==================== CART ROUTES ====================

/**
 * @swagger
 * /api/customer/cart/add:
 *   post:
 *     summary: Add dish to cart
 *     tags: [Cart]
 *     description: Add a dish to the customer's shopping cart
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
 *               - dish
 *             properties:
 *               dish:
 *                 type: string
 *                 description: Dish name (e.g., "Biryani", "Pizza")
 *                 example: "Butter Chicken"
 *     responses:
 *       200:
 *         description: Dish added to cart
 */
router.post("/cart/add", menuController.addDishToCart);

/**
 * @swagger
 * /api/customer/cart/increase:
 *   post:
 *     summary: Increase dish quantity in cart
 *     tags: [Cart]
 *     description: Increase the quantity of a dish in the cart
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
 *               - dish
 *             properties:
 *               dish:
 *                 type: string
 *                 description: Dish name (e.g., "Biryani", "Pizza")
 *                 example: "Butter Chicken"
 *     responses:
 *       200:
 *         description: Quantity increased
 */
router.post("/cart/increase", menuController.increaseDishQuantity);

/**
 * @swagger
 * /api/customer/cart/decrease:
 *   post:
 *     summary: Decrease dish quantity in cart
 *     tags: [Cart]
 *     description: Decrease the quantity of a dish in the cart
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
 *               - dish
 *             properties:
 *               dish:
 *                 type: string
 *                 description: Dish name (e.g., "Biryani", "Pizza")
 *                 example: "Butter Chicken"
 *     responses:
 *       200:
 *         description: Quantity decreased
 */
router.post("/cart/decrease", menuController.decreaseDishQuantity);

/**
 * @swagger
 * /api/customer/cart/order:
 *   post:
 *     summary: Place order from cart
 *     tags: [Cart]
 *     description: Create an order from the items in the cart
 *     security:
 *       - bearerAuth: []
 *       - csrfHeader: []
 *     responses:
 *       200:
 *         description: Order placed successfully
 */
router.post("/cart/order", menuController.orderCart);

// ==================== SEARCH & FILTER ROUTES ====================

/**
 * @swagger
 * /api/customer/restaurants/search:
 *   get:
 *     summary: Search and filter restaurants
 *     tags: [Restaurants]
 *     description: Search and filter restaurants by name, cuisine, location, and distance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for restaurant name or location
 *       - in: query
 *         name: cuisine
 *         schema:
 *           type: string
 *         description: Filter by cuisine type
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location/city
 *       - in: query
 *         name: maxDistance
 *         schema:
 *           type: number
 *         description: Maximum delivery distance in km
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [rating, distance, popularity]
 *         description: Sort results by
 *     responses:
 *       200:
 *         description: Restaurants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */
router.get("/restaurants/search", customerController.searchRestaurants);

// ==================== PROMO CODE ROUTES ====================

/**
 * @swagger
 * /api/customer/promo/available:
 *   get:
 *     summary: Get available promo codes
 *     tags: [Promo Codes]
 *     description: Retrieve list of available promotional codes for a restaurant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: rest_id
 *         schema:
 *           type: string
 *         required: true
 *         description: Restaurant ID to get available promo codes for
 *     responses:
 *       200:
 *         description: Available promo codes retrieved successfully
 *       400:
 *         description: Restaurant ID is required
 */
router.get("/promo/available", customerController.getAvailablePromoCodes);

/**
 * @swagger
 * /api/customer/promo/validate:
 *   post:
 *     summary: Validate promo code
 *     tags: [Promo Codes]
 *     description: Check if a promo code is valid for the current order at a restaurant
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
 *               - rest_id
 *             properties:
 *               code:
 *                 type: string
 *                 description: Promo code to validate
 *               rest_id:
 *                 type: string
 *                 description: Restaurant ID (required)
 *               orderAmount:
 *                 type: number
 *                 description: Order amount to validate against promo conditions (optional)
 *     responses:
 *       200:
 *         description: Promo code validated successfully
 *       400:
 *         description: Invalid promo code or missing restaurant ID
 *       404:
 *         description: Promo code not found
 */
router.post("/promo/validate", customerController.validatePromoCode);

/**
 * @swagger
 * /api/customer/promo/apply:
 *   post:
 *     summary: Apply promo code to order
 *     tags: [Promo Codes]
 *     description: Apply a promotional code to reduce order total at a restaurant
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
 *               - rest_id
 *             properties:
 *               code:
 *                 type: string
 *                 description: Promo code to apply
 *               rest_id:
 *                 type: string
 *                 description: Restaurant ID (required)
 *     responses:
 *       200:
 *         description: Promo code applied successfully
 *       400:
 *         description: Invalid promo code or missing restaurant ID
 *       404:
 *         description: Promo code not found
 */
router.post("/promo/apply", customerController.applyPromoCode);

module.exports = router;
