const express = require("express");
const router = express.Router();
const supportController = require("../Controller/supportController");


router.get("/stats", supportController.adminGetStats);
router.get("/tickets", supportController.adminGetTickets);
router.get("/tickets/:ticketId", supportController.adminGetTicket);
router.post("/tickets/:ticketId/messages", supportController.adminPostMessage);
router.patch("/tickets/:ticketId/status", supportController.adminUpdateStatus);
router.patch("/tickets/:ticketId/assign", supportController.adminAssignTicket);
router.post("/tickets/:ticketId/notes", supportController.adminAddNote);

module.exports = router;
