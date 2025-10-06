const express = require('express');
const router = express.Router();
const path  =require('path');

const customerController = require('../Controller/customerController');
const menuController = require('../Controller/menuController');
const homePageController = require("../Controller/homePageController")



router.get('/customerDashboard',customerController.getCustomerDashboard);

router.get('/feedback', customerController.getFeedBack);
router.post('/submit-feedback', customerController.postSubmitFeedBack);

router.get('/edit', customerController.getEditProfile);
router.post('/edit', customerController.postEditProfile);

router.post('/order_reservation',customerController.postOrderAndReservation );
router.get('/order_reservation',customerController.postOrderAndReservation );
router.post('/order_reservation/order', customerController.order);
router.post('/order_reservation/reservation',customerController.reservation);
router.post('/order_reservation/combined', customerController.postOrderAndReservationCombined);
router.get('/payments',customerController.getPayments);
router.post('/orderplaced',customerController.postPaymentsSuccess);

// Menu page route
router.get('/menu/:restid', menuController.getMenu);

// Add dish to cart
router.post('/cart/add', menuController.addDishToCart);
router.post('/cart/increase', menuController.increaseDishQuantity);
router.post('/cart/decrease', menuController.decreaseDishQuantity);



// Order cart
router.post('/cart/order', menuController.orderCart);

module.exports = router;
