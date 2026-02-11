const express = require("express");
const router = express.Router();
const supportController = require("../Controller/supportController");

router.get("/stats", supportController.ownerGetStats);
router.get("/tickets", supportController.ownerGetTickets);
router.get("/tickets/:ticketId", supportController.ownerGetTicket);
router.post("/tickets/:ticketId/messages", supportController.ownerPostMessage);
router.patch("/tickets/:ticketId/status", supportController.ownerUpdateStatus);
router.patch("/tickets/:ticketId/priority", supportController.ownerUpdatePriority);
router.post("/tickets/:ticketId/notes", supportController.ownerAddNote);

module.exports = router;
