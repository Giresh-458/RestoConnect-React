const express = require("express");
const router = express.Router();
const supportController = require("../Controller/supportController");

router.get("/orders", supportController.customerGetOrders);

router.get("/categories", supportController.getCategories);
router.get("/tickets", supportController.customerGetTickets);
router.get("/tickets/:ticketId", supportController.customerGetTicket);
router.post("/tickets", supportController.customerCreateTicket);
router.post("/tickets/:ticketId/messages", supportController.customerPostMessage);
router.patch("/tickets/:ticketId/rate", supportController.customerRateTicket);
router.patch("/tickets/:ticketId/close", supportController.customerCloseTicket);

module.exports = router;
