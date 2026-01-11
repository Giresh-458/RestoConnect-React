const express = require("express");
const router = express.Router();
const ownerController = require("../Controller/ownerController");

router.get("/", ownerController.getOwnerHomepage);
router.get("/dashboard", ownerController.getownerDashboard_dashboard);
router.get("/dashboard/ownerdashboard", ownerController.getownerDashboard_dashboard);
router.get("/menuManagement", ownerController.getMenuManagement);
router.post("/menuManagement/add", ownerController.addProduct);
router.post("/menuManagement/edit/:id", ownerController.editProduct);
router.post("/menuManagement/delete/:id", ownerController.deleteProduct);

router.get('/orders', ownerController.getOrders);
router.get("/reservations", ownerController.getReservations);

// Staff management routes for owner
router.get("/staffManagement", ownerController.getStaffList);
router.post("/staffManagement/add", ownerController.addStaff);
router.post("/staffManagement/edit/:id", ownerController.editStaff);
router.post("/staffManagement/delete/:id", ownerController.deleteStaff);
router.post("/staffManagement/task/delete/:id", ownerController.deleteTask);

// Table management routes for owner
router.get("/tables", ownerController.getTables);
router.post("/tables/add", ownerController.addTable);
router.post("/tables/delete/:number", ownerController.deleteTable);

// JSON API for tables (for React frontend)
router.post("/tables", ownerController.addTableApi);
router.delete("/tables/:number", ownerController.deleteTableApi);

router.delete("/restaurant/delete/:id", ownerController.deleteRestaurant);

router.get("/staffManagement/task", ownerController.getTasks);

// Orders route for owner
// router.get('/orders', ownerController.getOrders);
// router.get("/inventory", ownerController.getInventory);
// router.post("/inventory/update", ownerController.updateInventory);

router.get("/reports", ownerController.getReportsData);

// API routes for owner homepage dashboard
router.get("/info", ownerController.getOwnerInfo);
router.get("/dashboard/stats", ownerController.getDashboardStats);
router.get("/dashboard/trend", ownerController.getRevenueOrdersTrend);
router.get("/orders/recent", ownerController.getRecentOrders);
// Inventory management routes
router.get("/inventory", ownerController.getInventoryAPI);
router.post("/inventory", ownerController.createInventoryItem);
router.patch("/inventory/:id/quantity", ownerController.updateInventoryQuantity);
router.delete("/inventory/:id", ownerController.deleteInventoryItem);

router.get("/feedback", ownerController.getFeedback);
router.put("/feedback/:id/status", ownerController.updateFeedbackStatus);

// API routes for owner dashboard
router.get("/owner/reports", ownerController.getReportsData);

module.exports = router;
