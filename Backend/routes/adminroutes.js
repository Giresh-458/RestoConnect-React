const express = require('express');
const path = require('path');
const router = express.Router();

const admincontroller = require('../Controller/adminController');
const auth_middleware = require('../authenticationMiddleWare');



router.get('/dashboard', admincontroller.getAdminDashboard);
router.get('/restaurants', admincontroller.getAllRestaurants); // admin use
router.post('/add_restaurant', admincontroller.postAddRestaurent);
router.post('/edit_restaurant/:id', admincontroller.postEditRestaurent);
router.delete('/delete_restaurant/:id',admincontroller.postDeleteRestaurent);
router.post('/suspend_restaurant/:id', admincontroller.suspendRestaurant);
router.post('/unsuspend_restaurant/:id', admincontroller.unsuspendRestaurant);
router.get('/chartstats',admincontroller.getStatisticsGraphs);

router.get('/users', admincontroller.getAllUsers);
router.post('/delete_user/:id', admincontroller.deleteUser);
router.post('/suspend_user/:id', admincontroller.suspendUser);
router.post('/unsuspend_user/:id', admincontroller.unsuspendUser);
router.post('/edit_profile', admincontroller.editProfile);
router.post('/change_password', admincontroller.changePassword); 
router.delete('/delete_account', admincontroller.deleteAccount);
router.get('/statistics', admincontroller.getStatistics);
router.post('/accept_request/:owner_username', admincontroller.getaceptreq);
router.post('/reject_request/:owner_username', admincontroller.getrejectreq);
router.get('/requests', admincontroller.getAllRequests);

router.get('/activities', admincontroller.getRecentActivities);

router.get('/orders', admincontroller.getAllOrders);
router.get('/reservations', admincontroller.getAllReservations);
router.get('/feedback', admincontroller.getAllFeedback);
router.get('/analytics', admincontroller.getAnalytics);


module.exports = router;
