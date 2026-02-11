const express = require("express");
const router = express.Router();
const ownerController = require("../Controller/ownerController");
const { uploadDishImage, handleUploadErrors } = require("../util/fileUpload");


router.get("/", ownerController.getOwnerHomepage);
router.get("/dashboard", ownerController.getownerDashboard_dashboard);
router.get("/dashboard/ownerdashboard", ownerController.getownerDashboard_dashboard);
router.get("/menuManagement", ownerController.getMenuManagement);
router.post("/menuManagement/add", uploadDishImage, handleUploadErrors, ownerController.addProduct);
router.post("/menuManagement/edit/:id", uploadDishImage, handleUploadErrors, ownerController.editProduct);
router.post("/menuManagement/delete/:id", ownerController.deleteProduct);

router.get('/orders', ownerController.getOrders);
router.get("/reservations", ownerController.getReservations);

// Staff management routes for owner
router.get("/staffManagement", ownerController.getStaffList);
router.post("/staffManagement/add", ownerController.addStaff);
router.post("/staffManagement/edit/:id", ownerController.editStaff);
router.post("/staffManagement/delete/:id", ownerController.deleteStaff);

router.use((req,res,next)=>{
    console.log(req.url);
    next();
})

router.get("/staffManagement/tasks/:staffId", ownerController.getStaffTasks);
router.delete("/staffManagement/tasks/:taskId", ownerController.deleteStaffTask);

// Table management routes for owner
router.get("/tables", ownerController.getTables);
router.post("/tables/add", ownerController.addTable);
router.post("/tables/delete/:number", ownerController.deleteTable);

router.delete("/restaurant/delete/:id", ownerController.deleteRestaurant);

router.post("/add-task", ownerController.addTask);
router.post("/add-announcement", ownerController.addAnnouncement);
router.post("/add-shift", ownerController.addShift);
router.get("/support-messages", ownerController.getSupportMessages);
router.get("/support-threads", ownerController.getCustomerSupportThreads);
router.post("/support-threads/:threadId/messages", ownerController.postCustomerSupportMessage);
router.patch("/support-threads/:threadId/status", ownerController.updateCustomerSupportStatus);
router.get("/announcements", ownerController.getAnnouncements);
router.delete("/announcements/:id", ownerController.deleteAnnouncement);

// Orders route for owner

router.get("/reports", ownerController.getReportsData);

// API routes for owner homepage dashboard
router.get("/info", ownerController.getOwnerInfo);
router.get("/dashboard/stats", ownerController.getDashboardStats);
router.get("/dashboard/summary", ownerController.getDashboardSummary);
router.get("/dashboard/trend", ownerController.getRevenueOrdersTrend);
router.get("/orders/recent", ownerController.getRecentOrders);
router.get("/inventory", ownerController.getInventoryAPI);
router.post("/inventory", ownerController.createInventoryItem);
router.patch("/inventory/:id/quantity", ownerController.updateInventoryQuantity);
router.delete("/inventory/:id", ownerController.deleteInventoryItem);

router.get("/feedback", ownerController.getFeedback);
router.put("/feedback/:id/status", ownerController.updateFeedbackStatus);

// API routes for owner dashboard
router.get("/owner/reports", ownerController.getReportsData);

module.exports = router;
