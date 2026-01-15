
const express = require('express');
const router = express.Router();
const path  =require('path');

const customerController = require('../Controller/customerController');
const menuController = require('../Controller/menuController');
const homePageController = require("../Controller/homePageController")
const { uploadProfilePicture, handleUploadErrors } = require('../util/fileUpload');



router.get('/customerDashboard',customerController.getCustomerDashboard);

router.get('/feedback', customerController.getFeedBack);
// router.post('/submit-feedback', customerController.postSubmitFeedBack);
router.post("/submit-feedback", customerController.submitFeedback);

router.get('/edit', customerController.getEditProfile);
router.post('/edit', uploadProfilePicture, handleUploadErrors, customerController.postEditProfile);

router.post('/order_reservation',customerController.postOrderAndReservation );
router.get('/order_reservation',customerController.postOrderAndReservation );
router.post('/order_reservation/order', customerController.order);
router.post('/order_reservation/reservation',customerController.reservation);
router.post('/order_reservation/combined', customerController.postOrderAndReservationCombined);
router.post('/checkout', customerController.apiCheckout);
router.post('/checkout/pay', customerController.apiCheckoutPay);
router.get('/orders/:orderId', customerController.getOrderById);
router.get('/payments',customerController.getPayments);
router.post('/orderplaced',customerController.postPaymentsSuccess);
router.post('/orders/:orderId/reorder', customerController.reorderOrder);
router.post('/preferences/email-notifications', customerController.updateEmailNotifications);

// Favourites routes
router.post('/favourites/add', customerController.addToFavourites);
router.post('/favourites/remove', customerController.removeFromFavourites);
router.get('/favourites', customerController.getFavourites);

// Menu page route
router.get('/menu/:restid', menuController.getMenu);

// Add dish to cart
router.post('/cart/add', menuController.addDishToCart);
router.post('/cart/increase', menuController.increaseDishQuantity);
router.post('/cart/decrease', menuController.decreaseDishQuantity);



// Order cart
router.post('/cart/order', menuController.orderCart);

// Customer homepage - search and filter restaurants
router.get('/restaurants/search', customerController.searchRestaurants);

// Promo code routes
router.post('/promo/validate', customerController.validatePromoCode);
router.post('/promo/apply', customerController.applyPromoCode);

module.exports = router;
