const express = require("express");
const router = express.Router();
const controller = require("../Controller/superadminController");

// Dashboard overview
router.get("/dashboard", controller.getDashboard);

// Employee performance analytics
router.get("/employees", controller.getEmployeePerformance);

// Restaurant revenue & platform fee analytics
router.get("/restaurant-revenue", controller.getRestaurantRevenue);

// Dish & category trends
router.get("/dish-trends", controller.getDishTrends);

// Top customers
router.get("/top-customers", controller.getTopCustomers);

// Revenue over time (charts)
router.get("/revenue-chart", controller.getRevenueOverTime);

module.exports = router;
