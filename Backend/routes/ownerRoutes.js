const express = require("express");
const router = express.Router();
const ownerController = require("../Controller/ownerController");

router.get("/", ownerController.getOwnerHomepage);
router.get("/dashboard", ownerController.getDashboard);
router.get("/menuManagement", ownerController.getMenuManagement);
router.post("/menuManagement/add", ownerController.addProduct);
router.post("/menuManagement/edit/:id", ownerController.editProduct);
router.post("/menuManagement/delete/:id", ownerController.deleteProduct);

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

router.delete("/restaurant/delete/:id", ownerController.deleteRestaurant);

router.get("/staffManagement/task", ownerController.getTasks);

router.get("/inventory", ownerController.getInventory);
router.post("/inventory/update", ownerController.updateInventory);

router.get("/reports", ownerController.getReportsData);

// API routes for owner homepage dashboard
router.get("/api/info", ownerController.getOwnerInfo);
router.get("/api/dashboard/stats", ownerController.getDashboardStats);
router.get("/api/dashboard/trend", ownerController.getRevenueOrdersTrend);
router.get("/api/orders/recent", ownerController.getRecentOrders);
router.get("/api/inventory", ownerController.getInventory);
router.post("/api/inventory", ownerController.createInventoryItem);
router.patch("/api/inventory/:id/quantity", ownerController.updateInventoryQuantity);

module.exports = router;
