const express = require("express");
const router = express.Router();
const reservationController = require("../Controller/reservationController");

router.get("/", reservationController.getAllReservations);
router.post("/add", reservationController.createReservation);
router.patch("/update/:id", reservationController.updateReservationStatus);
router.delete("/delete/:id", reservationController.deleteReservation);

module.exports = router;
