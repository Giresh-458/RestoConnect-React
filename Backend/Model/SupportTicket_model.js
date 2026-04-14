const mongoose = require("mongoose");

/* ── Message sub-document ──────────────────────────── */
const messageSchema = new mongoose.Schema(
  {
    senderRole: {
      type: String,
      required: true,
      enum: ["customer", "owner", "staff", "admin", "system"],
    },
    senderName: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

/* ── Internal note sub-document (owner/admin only) ── */
const noteSchema = new mongoose.Schema(
  {
    author: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

/* ── Order snapshot — frozen at ticket-creation time ─ */
const orderSnapshotSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },
    restaurantName: { type: String, default: "" },
    items: [{ name: String, price: Number }],
    totalAmount: { type: Number, default: 0 },
    tableNumber: { type: String, default: null },
    orderDate: { type: Date },
    status: { type: String, default: "" },
    paymentStatus: { type: String, default: "" },
  },
  { _id: false }
);

/* ── Support Ticket ────────────────────────────────── */
const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, unique: true },

    /* Who opened the ticket */
    createdBy: { type: String, required: true },
    createdByRole: {
      type: String,
      required: true,
      enum: ["customer", "owner", "staff"],
    },

    /* Which restaurant */
    rest_id: { type: String, ref: "Restaurant", required: true },
    restaurantName: { type: String, default: "" },

    /* ── Dining-focused categories (Swiggy style) ── */
    category: {
      type: String,
      required: true,
      enum: [
        "wrong_order",
        "food_quality",
        "missing_items",
        "overcharged",
        "long_wait",
        "staff_conduct",
        "hygiene",
        "reservation_issue",
        "web_issue",
        "other",
      ],
    },

    subject: { type: String, required: true },

    priority: {
      type: String,
      default: "medium",
      enum: ["low", "medium", "high", "urgent"],
    },

    status: {
      type: String,
      default: "open",
      enum: [
        "open",
        "in_progress",
        "awaiting_customer",
        "awaiting_owner",
        "escalated",
        "resolved",
        "closed",
      ],
    },

    assignedTo: { type: String, default: null },
    assignedRole: {
      type: String,
      default: null,
      enum: [null, "owner", "admin"],
    },

    /* ── The order this ticket is about ── */
    relatedOrderId: { type: String, ref: 'Order', default: null },
    orderSnapshot: { type: orderSnapshotSchema, default: null },

    relatedReservationId: { type: String, ref: 'Reservation', default: null },

    /* Resolution / feedback */
    satisfactionRating: { type: Number, min: 1, max: 5, default: null },
    satisfactionComment: { type: String, default: null },

    /* SLA tracking */
    firstResponseAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },

    messages: [messageSchema],
    internalNotes: [noteSchema],
  },
  { timestamps: true }
);

/* ── Auto-increment ticketNumber on create ──────── */
supportTicketSchema.pre("save", async function (next) {
  if (this.isNew && !this.ticketNumber) {
    const count = await mongoose.model("SupportTicket").countDocuments();
    this.ticketNumber = `TKT-${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

/* ── Indexes ──────────────────────────────────────── */
supportTicketSchema.index({ rest_id: 1, status: 1 });
supportTicketSchema.index({ createdBy: 1, status: 1 });
// ticketNumber index is already created by unique: true
supportTicketSchema.index({ status: 1, priority: 1 });
supportTicketSchema.index({ relatedOrderId: 1 });

const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);

module.exports = SupportTicket;
