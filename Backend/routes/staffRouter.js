const express = require("express");
const router = express.Router();

const staffController = require("../Controller/staffController");




router.get("/DashboardData", staffController.getDashBoardData);
router.get('/dashboard', staffController.getDashBoardData);


router.get("/Dashboard", staffController.getDashBoard);

router.post("/Dashboard/update-order", staffController.postUpdateOrder);
router.post("/Dashboard/allocate-table", staffController.postAllocateTable);
router.post('/orders/status', staffController.postUpdateOrder);
router.post('/reservations/allocate', staffController.postAllocateTable);



// Legacy HomePage route (renders HTML) - keep for backward compatibility
//router.get("/HomePage",staffController.getHomePage);
router.post("/HomePage/tasks", staffController.postHomePageTask);
router.delete("/HomePage/tasks/:id", staffController.deleteHomePageTasks);

router.delete(
  "/Dashboard/remove-reservation/:id",
  staffController.postRemoveReservation
);
router.delete('/reservations/:id', staffController.postRemoveReservation);

router.post("/update-inventory", staffController.postUpdateInventory);



router.post("/HomePage/tasks/delete/:id", staffController.deleteHomePageTasks);
router.post(
  "/Dashboard/remove-reservation/delete/:id",
  staffController.postRemoveReservation
);

// API route for homepage data (JSON response) - MUST be before catch-all routes
// Verify the controller function exists
if (!staffController.getStaffHomepageData) {
  console.error("❌ ERROR: staffController.getStaffHomepageData is not defined!");
} else {
  console.log("✅ staffController.getStaffHomepageData is defined at module load");
}

// Register the route - handle async properly
console.log("🔵 Registering /homepage route, controller type:", typeof staffController.getStaffHomepageData);
router.get("/homepage", async (req, res, next) => {
  console.log("✅✅✅✅✅✅ ROUTE HANDLER CALLED! /homepage matched!");
  console.log("  Method:", req.method);
  console.log("  Path:", req.path);
  console.log("  URL:", req.url);
  console.log("  Calling getStaffHomepageData now...");
  try {
    // The controller is async and handles its own response
    await staffController.getStaffHomepageData(req, res);
  } catch (error) {
    console.error("❌❌❌ ERROR calling getStaffHomepageData:", error);
    console.error("  Error stack:", error.stack);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Internal server error", details: error.message });
    }
    next(error);
  }
});

// Also support /homepage/ for consistency
router.get("/homepage", (req,res,next)=>{
  console.log("in correct route");
  next();
},staffController.getStaffHomepageData);
router.post("/support-message", staffController.postSupportMessage);
router.put("/tasks/:id", staffController.updateTaskStatus);
router.post("/add-table", staffController.postAddTable);
router.post('/tables', staffController.postAddTable);
router.post('/change-password', staffController.changePassword);


module.exports = router;
