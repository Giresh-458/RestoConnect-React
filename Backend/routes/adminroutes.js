const express = require('express');
const path = require('path');
const router = express.Router();

const admincontroller = require('../Controller/adminController');
const auth_middleware = require('../authenticationMiddleWare');

// Apply admin-only middleware to all admin routes
router.use(auth_middleware('admin'));

router.get('/dashboard', admincontroller.getAdminDashboard);
router.get('/restaurants', admincontroller.getAllRestaurants); // admin use
router.post('/add_restaurant', admincontroller.postAddRestaurent);
router.post('/edit_restaurant/:id', admincontroller.postEditRestaurent);
router.post('/delete_restaurant/:id', admincontroller.postDeleteRestaurent);
router.post('/suspend_restaurant/:id', admincontroller.suspendRestaurant);
router.post('/unsuspend_restaurant/:id', admincontroller.unsuspendRestaurant);
router.get('/chartstats',admincontroller.getStatisticsGraphs);

// User management routes
router.get('/users', admincontroller.getAllUsers);
router.post('/delete_user/:id', admincontroller.deleteUser);
router.post('/suspend_user/:id', admincontroller.suspendUser);
router.post('/unsuspend_user/:id', admincontroller.unsuspendUser);
router.post('/edit_profile', admincontroller.editProfile);
router.post('/change_password', admincontroller.changePassword); // <-- NEW ROUTE
router.delete('/delete_account', admincontroller.deleteAccount);
router.get('/statistics', admincontroller.getStatistics);
router.get('/accept_request/:owner_username', admincontroller.getaceptreq);
router.get('/reject_request/:owner_username', admincontroller.getrejectreq);
router.get('/requests', admincontroller.getAllRequests);

router.get('/activities', admincontroller.getRecentActivities);




module.exports = router;
