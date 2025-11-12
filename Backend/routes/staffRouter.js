const express = require("express");
const router = express.Router();

const staffController = require("../Controller/staffController");

router.get("/DashboardData", staffController.getDashBoardData);


router.get("/Dashboard", staffController.getDashBoard);

router.post("/Dashboard/update-order", staffController.postUpdateOrder);
router.post("/Dashboard/allocate-table", staffController.postAllocateTable);

router.get("/HomePage", staffController.getHomePage);
router.post("/HomePage/tasks", staffController.postHomePageTask);
router.delete("/HomePage/tasks/:id", staffController.deleteHomePageTasks);

router.delete(
  "/Dashboard/remove-reservation/:id",
  staffController.postRemoveReservation
);

router.post("/update-inventory", staffController.postUpdateInventory);

router.post("/HomePage/tasks/delete/:id", staffController.deleteHomePageTasks);
router.post(
  "/Dashboard/remove-reservation/delete/:id",
  staffController.postRemoveReservation
);

router.get("/api/homepage", staffController.getStaffHomepageData);
router.post("/api/support-message", staffController.postSupportMessage);
router.put("/api/tasks/:id", staffController.updateTaskStatus);

module.exports = router;
