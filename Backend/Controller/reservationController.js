// Backend/Controller/reservationController.js

const { Reservation } = require("../Model/Reservation_model");

// ✅ Get all reservations for the logged-in restaurant
exports.getAllReservations = async (req, res, next) => {
  try {
    const rest_id = req.session.rest_id;
    if (!rest_id) {
      return res.status(400).json({ error: "Restaurant ID missing in session" });
    }

    const reservations = await Reservation.find({ rest_id }).sort({ date: -1 });
    res.json(reservations);
  } catch (err) {
    console.error("Error fetching reservations:", err);
    err.status = err.status || 500;
    err.message = err.message || "Internal Server Error";
    return next(err);
  }
};

// ✅ Create a new reservation
exports.createReservation = async (req, res, next) => {
  try {
    const rest_id = req.session.rest_id;
    const { customerName, table_id, time, guests, status } = req.body;

    if (!rest_id || !customerName || !table_id || !time || !guests) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const reservation = new Reservation({
      customerName,
      table_id,
      time,
      guests,
      status: status || "pending",
      rest_id,
    });

    await reservation.save();
    res.status(201).json({ message: "Reservation created successfully", reservation });
  } catch (err) {
    console.error("Error creating reservation:", err);
    err.status = err.status || 500;
    err.message = err.message || "Internal Server Error";
    return next(err);
  }
};

// ✅ Update reservation status
exports.updateReservationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await Reservation.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    res.json({ message: "Status updated successfully", reservation: updated });
  } catch (err) {
    console.error("Error updating reservation:", err);
    err.status = err.status || 500;
    err.message = err.message || "Internal Server Error";
    return next(err);
  }
};

// ✅ Delete reservation
exports.deleteReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Reservation.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    res.json({ message: "Reservation deleted successfully" });
  } catch (err) {
    console.error("Error deleting reservation:", err);
    err.status = err.status || 500;
    err.message = err.message || "Internal Server Error";
    return next(err);
  }
};
