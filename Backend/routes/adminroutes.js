const express = require('express');
const path = require('path');
const router = express.Router();

const admincontroller = require('../Controller/adminController');

router.get('/dashboard', admincontroller.getAdminDashboard);
router.get('/restaurants', admincontroller.getAllRestaurants); // admin use
router.post('/add_restaurant', admincontroller.postAddRestaurent);
router.post('/edit_restaurant/:id', admincontroller.postEditRestaurent);
router.post('/delete_restaurant/:id', admincontroller.postDeleteRestaurent);

// User management routes
router.get('/users', admincontroller.getAllUsers);
router.post('/delete_user/:id', admincontroller.deleteUser);
router.post('/edit_user/:id', admincontroller.editUser);
router.post('/edit_profile', admincontroller.editProfile);
router.get('/statistics', admincontroller.getStatistics);
router.get('/accept_request/:owner_username', admincontroller.getaceptreq);
router.get('/reject_request/:owner_username', admincontroller.getrejectreq);
router.get('/requests', admincontroller.getAllRequests);

// ✅ Public API for homepage (fetch restaurants via AJAX)
router.get('/public/restaurants', admincontroller.getPublicRestaurants);

module.exports = router;
