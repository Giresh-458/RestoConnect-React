const express = require("express");
const router = express.Router();
const customerController = require("../Controller/customerController");

// PUBLIC ROUTES ONLY
router.get(
  "/restaurants/public-cuisines",
  customerController.getPublicCuisines
);

module.exports = router;
