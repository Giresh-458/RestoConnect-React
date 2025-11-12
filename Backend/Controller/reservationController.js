// Backend/Controller/reservationController.js

const { Reservation } = require("../Model/Reservation_model");

// ✅ Get all reservations for the logged-in restaurant
exports.getAllReservations = async (req, res) => {
  try {
    const rest_id = req.session.rest_id;
    if (!rest_id) {
      return res.status(400).json({ error: "Restaurant ID missing in session" });
    }

    const reservations = await Reservation.find({ rest_id }).sort({ date: -1 });
    res.json(reservations);
  } catch (err) {
    console.error("Error fetching reservations:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Create a new reservation
exports.createReservation = async (req, res) => {
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
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Update reservation status
exports.updateReservationStatus = async (req, res) => {
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
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ✅ Delete reservation
exports.deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Reservation.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    res.json({ message: "Reservation deleted successfully" });
  } catch (err) {
    console.error("Error deleting reservation:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
