const SupportTicket = require("../Model/SupportTicket_model");
const { Restaurant } = require("../Model/Restaurents_model");
const { User } = require("../Model/userRoleModel");
const { Order } = require("../Model/Order_model");
const Dish = require("../Model/Dishes_model_test");

const CATEGORY_LABELS = {
  wrong_order: "Wrong Order",
  food_quality: "Food Quality",
  missing_items: "Missing Items",
  overcharged: "Overcharged / Billing",
  long_wait: "Long Wait Time",
  staff_conduct: "Staff Behavior",
  hygiene: "Hygiene Concern",
  reservation_issue: "Reservation Issue",
  other: "Other",
};

const CATEGORY_ICONS = {
  wrong_order: "🔄",
  food_quality: "🍽️",
  missing_items: "📦",
  overcharged: "💰",
  long_wait: "⏳",
  staff_conduct: "👤",
  hygiene: "🧹",
  reservation_issue: "📅",
  other: "❓",
};

const formatTicket = (ticket) => ({
  id: ticket._id,
  ticketNumber: ticket.ticketNumber,
  subject: ticket.subject,
  category: ticket.category,
  categoryLabel: CATEGORY_LABELS[ticket.category] || ticket.category,
  categoryIcon: CATEGORY_ICONS[ticket.category] || "❓",
  priority: ticket.priority,
  status: ticket.status,
  createdBy: ticket.createdBy,
  createdByRole: ticket.createdByRole,
  rest_id: ticket.rest_id,
  restaurantName: ticket.restaurantName,
  assignedTo: ticket.assignedTo,
  assignedRole: ticket.assignedRole,
  relatedOrderId: ticket.relatedOrderId,
  orderSnapshot: ticket.orderSnapshot || null,
  relatedReservationId: ticket.relatedReservationId,
  satisfactionRating: ticket.satisfactionRating,
  satisfactionComment: ticket.satisfactionComment,
  firstResponseAt: ticket.firstResponseAt,
  resolvedAt: ticket.resolvedAt,
  messages: ticket.messages || [],
  internalNotes: ticket.internalNotes || [],
  createdAt: ticket.createdAt,
  updatedAt: ticket.updatedAt,
});

/* ═══════════════════════════════════════════════════
   CUSTOMER  ENDPOINTS
   ═══════════════════════════════════════════════════ */

/**
 * GET /api/customer/support/orders
 * Return the customer's past dining orders (Swiggy-style order list).
 * Each order includes dish names, restaurant info, and whether a ticket
 * already exists for it.
 */
exports.customerGetOrders = async (req, res, next) => {
  try {
    const customerName = req.session.username;
    if (!customerName) return res.status(401).json({ error: "Not authenticated" });

    // Fetch recent orders (last 50)
    const orders = await Order.find({ customerName })
      .sort({ date: -1 })
      .limit(50);

    // Look up dish names in one go
    const allDishIds = [...new Set(orders.flatMap((o) => o.dishes || []))];
    const dishDocs = await Dish.find({ _id: { $in: allDishIds } });
    const dishMap = {};
    dishDocs.forEach((d) => {
      dishMap[d._id] = { name: d.name, price: d.price, image: d.image };
    });

    // Check which orders already have tickets
    const orderIds = orders.map((o) => o._id);
    const existingTickets = await SupportTicket.find(
      { relatedOrderId: { $in: orderIds }, createdBy: customerName },
      { relatedOrderId: 1, ticketNumber: 1, status: 1 }
    );
    const ticketByOrder = {};
    existingTickets.forEach((t) => {
      ticketByOrder[t.relatedOrderId] = {
        ticketId: t._id,
        ticketNumber: t.ticketNumber,
        status: t.status,
      };
    });

    const result = orders.map((order) => ({
      orderId: order._id,
      restaurant: order.restaurant || "",
      restId: order.rest_id || "",
      items: (order.dishes || []).map((dId) => ({
        id: dId,
        name: dishMap[dId]?.name || dId,
        price: dishMap[dId]?.price || 0,
        image: dishMap[dId]?.image || "",
      })),
      totalAmount: order.totalAmount,
      tableNumber: order.tableNumber || null,
      status: order.status,
      paymentStatus: order.paymentStatus,
      date: order.date,
      orderTime: order.orderTime,
      existingTicket: ticketByOrder[order._id] || null,
    }));

    res.json({ orders: result });
  } catch (error) {
    console.error("customerGetOrders error:", error);
    return next(error);
  }
};

/**
 * GET /api/customer/support/categories
 */
exports.getCategories = async (_req, res) => {
  res.json({ categories: CATEGORY_LABELS, icons: CATEGORY_ICONS });
};

/**
 * GET /api/customer/support/tickets?status=open
 */
exports.customerGetTickets = async (req, res, next) => {
  try {
    const customerName = req.session.username;
    if (!customerName) return res.status(401).json({ error: "Not authenticated" });

    const filter = { createdBy: customerName, createdByRole: "customer" };
    const { status } = req.query;
    if (status && status !== "all") filter.status = status;

    const tickets = await SupportTicket.find(filter).sort({ updatedAt: -1 });
    res.json({ tickets: tickets.map(formatTicket) });
  } catch (error) {
    console.error("customerGetTickets error:", error);
    return next(error);
  }
};

/**
 * GET /api/customer/support/tickets/:ticketId
 */
exports.customerGetTicket = async (req, res, next) => {
  try {
    const customerName = req.session.username;
    if (!customerName) return res.status(401).json({ error: "Not authenticated" });

    const ticket = await SupportTicket.findOne({
      _id: req.params.ticketId,
      createdBy: customerName,
      createdByRole: "customer",
    });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    res.json({ ticket: formatTicket(ticket) });
  } catch (error) {
    console.error("customerGetTicket error:", error);
    return next(error);
  }
};

/**
 * POST /api/customer/support/tickets
 * Create a ticket from an order (Swiggy-style).
 * body: { orderId, category, description }
 */
exports.customerCreateTicket = async (req, res, next) => {
  try {
    const customerName = req.session.username;
    if (!customerName) return res.status(401).json({ error: "Not authenticated" });

    const { orderId, category, description } = req.body;

    if (!orderId || !category || !description?.trim()) {
      return res.status(400).json({
        error: "Order, category, and description are required",
      });
    }

    // Validate category
    if (!CATEGORY_LABELS[category]) {
      return res.status(400).json({ error: "Invalid category" });
    }

    // Check the order exists and belongs to this customer
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.customerName !== customerName) {
      return res.status(403).json({ error: "This order does not belong to you" });
    }

    // Check if a ticket already exists for this order
    const existing = await SupportTicket.findOne({
      relatedOrderId: orderId,
      createdBy: customerName,
      status: { $nin: ["closed"] },
    });
    if (existing) {
      return res.status(400).json({
        error: "You already have an open ticket for this order",
        ticketId: existing._id,
        ticketNumber: existing.ticketNumber,
      });
    }

    // Fetch restaurant & dish details for the snapshot
    const restaurant = await Restaurant.findById(order.rest_id);
    const dishDocs = await Dish.find({ _id: { $in: order.dishes || [] } });

    const subject = `${CATEGORY_LABELS[category]} — Order at ${restaurant?.name || order.restaurant || "Restaurant"}`;

    // Auto-determine priority from category
    let priority = "medium";
    if (["hygiene", "overcharged"].includes(category)) priority = "high";
    if (category === "missing_items" || category === "wrong_order") priority = "high";

    const ticket = new SupportTicket({
      createdBy: customerName,
      createdByRole: "customer",
      rest_id: order.rest_id || "",
      restaurantName: restaurant?.name || order.restaurant || "",
      category,
      subject,
      priority,
      relatedOrderId: orderId,
      orderSnapshot: {
        orderId: order._id,
        restaurantName: restaurant?.name || order.restaurant || "",
        items: dishDocs.map((d) => ({ name: d.name, price: d.price })),
        totalAmount: order.totalAmount,
        tableNumber: order.tableNumber,
        orderDate: order.date,
        status: order.status,
        paymentStatus: order.paymentStatus,
      },
      messages: [
        {
          senderRole: "customer",
          senderName: customerName,
          text: description.trim(),
        },
      ],
    });

    await ticket.save();
    res.json({ success: true, ticket: formatTicket(ticket) });
  } catch (error) {
    console.error("customerCreateTicket error:", error);
    return next(error);
  }
};

/**
 * POST /api/customer/support/tickets/:ticketId/messages
 */
exports.customerPostMessage = async (req, res, next) => {
  try {
    const customerName = req.session.username;
    if (!customerName) return res.status(401).json({ error: "Not authenticated" });

    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: "Message is required" });

    const ticket = await SupportTicket.findOne({
      _id: req.params.ticketId,
      createdBy: customerName,
      createdByRole: "customer",
    });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    if (ticket.status === "closed") {
      return res.status(400).json({ error: "This ticket is closed. Please open a new one." });
    }

    ticket.messages.push({
      senderRole: "customer",
      senderName: customerName,
      text: message.trim(),
    });

    if (ticket.status === "awaiting_customer") ticket.status = "awaiting_owner";
    else if (ticket.status === "resolved") {
      ticket.status = "open";
      ticket.resolvedAt = null;
    }

    await ticket.save();
    res.json({ success: true, ticket: formatTicket(ticket) });
  } catch (error) {
    console.error("customerPostMessage error:", error);
    return next(error);
  }
};

/**
 * PATCH /api/customer/support/tickets/:ticketId/rate
 */
exports.customerRateTicket = async (req, res, next) => {
  try {
    const customerName = req.session.username;
    if (!customerName) return res.status(401).json({ error: "Not authenticated" });

    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const ticket = await SupportTicket.findOne({
      _id: req.params.ticketId,
      createdBy: customerName,
      createdByRole: "customer",
    });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    if (!["resolved", "closed"].includes(ticket.status)) {
      return res.status(400).json({ error: "You can only rate resolved or closed tickets" });
    }

    ticket.satisfactionRating = rating;
    ticket.satisfactionComment = comment || null;
    await ticket.save();
    res.json({ success: true, ticket: formatTicket(ticket) });
  } catch (error) {
    console.error("customerRateTicket error:", error);
    return next(error);
  }
};

/**
 * PATCH /api/customer/support/tickets/:ticketId/close
 */
exports.customerCloseTicket = async (req, res, next) => {
  try {
    const customerName = req.session.username;
    if (!customerName) return res.status(401).json({ error: "Not authenticated" });

    const ticket = await SupportTicket.findOne({
      _id: req.params.ticketId,
      createdBy: customerName,
      createdByRole: "customer",
    });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    ticket.status = "resolved";
    ticket.resolvedAt = new Date();
    ticket.messages.push({
      senderRole: "system",
      senderName: "System",
      text: "Customer marked this ticket as resolved.",
    });

    await ticket.save();
    res.json({ success: true, ticket: formatTicket(ticket) });
  } catch (error) {
    console.error("customerCloseTicket error:", error);
    return next(error);
  }
};

/* ═══════════════════════════════════════════════════
   OWNER  ENDPOINTS
   ═══════════════════════════════════════════════════ */

/**
 * GET /api/owner/support/tickets?status=open&priority=high&category=billing
 * List all tickets for the owner's restaurant
 */
exports.ownerGetTickets = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.session.username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const filter = { rest_id: user.rest_id };
    const { status, priority, category } = req.query;
    if (status && status !== "all") filter.status = status;
    if (priority && priority !== "all") filter.priority = priority;
    if (category && category !== "all") filter.category = category;

    const tickets = await SupportTicket.find(filter).sort({ updatedAt: -1 });

    // Stats for dashboard badges
    const stats = {
      total: tickets.length,
      open: tickets.filter((t) => t.status === "open").length,
      inProgress: tickets.filter((t) => t.status === "in_progress").length,
      awaitingOwner: tickets.filter((t) => t.status === "awaiting_owner").length,
      escalated: tickets.filter((t) => t.status === "escalated").length,
      resolved: tickets.filter((t) => ["resolved", "closed"].includes(t.status)).length,
      urgent: tickets.filter((t) => t.priority === "urgent" && !["resolved", "closed"].includes(t.status)).length,
    };

    res.json({ tickets: tickets.map(formatTicket), stats });
  } catch (error) {
    console.error("ownerGetTickets error:", error);
    return next(error);
  }
};

/**
 * GET /api/owner/support/tickets/:ticketId
 */
exports.ownerGetTicket = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.session.username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const ticket = await SupportTicket.findOne({
      _id: req.params.ticketId,
      rest_id: user.rest_id,
    });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    res.json({ ticket: formatTicket(ticket) });
  } catch (error) {
    console.error("ownerGetTicket error:", error);
    return next(error);
  }
};

/**
 * POST /api/owner/support/tickets/:ticketId/messages
 * Owner replies to a ticket
 * body: { message }
 */
exports.ownerPostMessage = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.session.username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: "Message is required" });

    const ticket = await SupportTicket.findOne({
      _id: req.params.ticketId,
      rest_id: user.rest_id,
    });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    if (ticket.status === "closed") {
      return res.status(400).json({ error: "This ticket is closed" });
    }

    ticket.messages.push({
      senderRole: "owner",
      senderName: user.username,
      text: message.trim(),
    });

    // Track first response time
    if (!ticket.firstResponseAt) {
      ticket.firstResponseAt = new Date();
    }

    // Auto-transition status
    if (["open", "awaiting_owner"].includes(ticket.status)) {
      ticket.status = "awaiting_customer";
    }

    await ticket.save();
    res.json({ success: true, ticket: formatTicket(ticket) });
  } catch (error) {
    console.error("ownerPostMessage error:", error);
    return next(error);
  }
};

/**
 * PATCH /api/owner/support/tickets/:ticketId/status
 * Owner changes ticket status
 * body: { status }
 */
exports.ownerUpdateStatus = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.session.username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const { status } = req.body;
    const allowed = ["open", "in_progress", "awaiting_customer", "awaiting_owner", "escalated", "resolved", "closed"];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const ticket = await SupportTicket.findOne({
      _id: req.params.ticketId,
      rest_id: user.rest_id,
    });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    const prev = ticket.status;
    ticket.status = status;

    if (status === "resolved" && prev !== "resolved") {
      ticket.resolvedAt = new Date();
      ticket.messages.push({
        senderRole: "system",
        senderName: "System",
        text: `Ticket marked as resolved by ${user.username}.`,
      });
    }

    if (status === "escalated" && prev !== "escalated") {
      ticket.messages.push({
        senderRole: "system",
        senderName: "System",
        text: `Ticket escalated to admin by ${user.username}.`,
      });
    }

    await ticket.save();
    res.json({ success: true, ticket: formatTicket(ticket) });
  } catch (error) {
    console.error("ownerUpdateStatus error:", error);
    return next(error);
  }
};

/**
 * PATCH /api/owner/support/tickets/:ticketId/priority
 * body: { priority }
 */
exports.ownerUpdatePriority = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.session.username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const { priority } = req.body;
    if (!priority || !["low", "medium", "high", "urgent"].includes(priority)) {
      return res.status(400).json({ error: "Invalid priority" });
    }

    const ticket = await SupportTicket.findOne({
      _id: req.params.ticketId,
      rest_id: user.rest_id,
    });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    ticket.priority = priority;
    await ticket.save();
    res.json({ success: true, ticket: formatTicket(ticket) });
  } catch (error) {
    console.error("ownerUpdatePriority error:", error);
    return next(error);
  }
};

/**
 * POST /api/owner/support/tickets/:ticketId/notes
 * Owner adds an internal note (not visible to customer)
 * body: { text }
 */
exports.ownerAddNote = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.session.username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: "Note text is required" });

    const ticket = await SupportTicket.findOne({
      _id: req.params.ticketId,
      rest_id: user.rest_id,
    });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    ticket.internalNotes.push({ author: user.username, text: text.trim() });
    await ticket.save();

    res.json({ success: true, ticket: formatTicket(ticket) });
  } catch (error) {
    console.error("ownerAddNote error:", error);
    return next(error);
  }
};

/**
 * GET /api/owner/support/stats
 * Dashboard widget data
 */
exports.ownerGetStats = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.session.username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const allTickets = await SupportTicket.find({ rest_id: user.rest_id });

    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const stats = {
      total: allTickets.length,
      open: allTickets.filter((t) => t.status === "open").length,
      inProgress: allTickets.filter((t) => t.status === "in_progress").length,
      awaitingOwner: allTickets.filter((t) => t.status === "awaiting_owner").length,
      escalated: allTickets.filter((t) => t.status === "escalated").length,
      resolved: allTickets.filter((t) => ["resolved", "closed"].includes(t.status)).length,
      urgent: allTickets.filter((t) => t.priority === "urgent" && !["resolved", "closed"].includes(t.status)).length,
      newLast24h: allTickets.filter((t) => t.createdAt >= last24h).length,
      resolvedLast7d: allTickets.filter(
        (t) => t.resolvedAt && t.resolvedAt >= last7d
      ).length,
    };

    // Average first response time (in minutes) for resolved tickets
    const responded = allTickets.filter((t) => t.firstResponseAt);
    stats.avgFirstResponseMin =
      responded.length > 0
        ? Math.round(
            responded.reduce(
              (sum, t) => sum + (t.firstResponseAt - t.createdAt) / 60000,
              0
            ) / responded.length
          )
        : null;

    // Average satisfaction rating
    const rated = allTickets.filter((t) => t.satisfactionRating);
    stats.avgSatisfaction =
      rated.length > 0
        ? Math.round(
            (rated.reduce((sum, t) => sum + t.satisfactionRating, 0) / rated.length) * 10
          ) / 10
        : null;

    // Category breakdown
    const byCat = {};
    allTickets.forEach((t) => {
      byCat[t.category] = (byCat[t.category] || 0) + 1;
    });
    stats.byCategory = Object.entries(byCat).map(([cat, count]) => ({
      category: cat,
      label: CATEGORY_LABELS[cat] || cat,
      count,
    }));

    res.json({ stats });
  } catch (error) {
    console.error("ownerGetStats error:", error);
    return next(error);
  }
};

/* ═══════════════════════════════════════════════════
   ADMIN  ENDPOINTS
   ═══════════════════════════════════════════════════ */

/**
 * GET /api/admin/support/tickets?status=escalated&rest_id=XYZ
 * Admin can see ALL tickets across ALL restaurants
 */
exports.adminGetTickets = async (req, res, next) => {
  try {
    const filter = {};
    const { status, priority, category, rest_id } = req.query;
    if (status && status !== "all") filter.status = status;
    if (priority && priority !== "all") filter.priority = priority;
    if (category && category !== "all") filter.category = category;
    if (rest_id) filter.rest_id = rest_id;

    const tickets = await SupportTicket.find(filter).sort({ updatedAt: -1 }).limit(200);

    const stats = {
      total: await SupportTicket.countDocuments(),
      open: await SupportTicket.countDocuments({ status: "open" }),
      escalated: await SupportTicket.countDocuments({ status: "escalated" }),
      resolved: await SupportTicket.countDocuments({ status: { $in: ["resolved", "closed"] } }),
      urgent: await SupportTicket.countDocuments({
        priority: "urgent",
        status: { $nin: ["resolved", "closed"] },
      }),
    };

    res.json({ tickets: tickets.map(formatTicket), stats });
  } catch (error) {
    console.error("adminGetTickets error:", error);
    return next(error);
  }
};

/**
 * GET /api/admin/support/tickets/:ticketId
 */
exports.adminGetTicket = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.ticketId);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    res.json({ ticket: formatTicket(ticket) });
  } catch (error) {
    console.error("adminGetTicket error:", error);
    return next(error);
  }
};

/**
 * POST /api/admin/support/tickets/:ticketId/messages
 * body: { message }
 */
exports.adminPostMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: "Message is required" });

    const ticket = await SupportTicket.findById(req.params.ticketId);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    const adminUser = req.session.username || "admin";

    ticket.messages.push({
      senderRole: "admin",
      senderName: adminUser,
      text: message.trim(),
    });

    if (!ticket.firstResponseAt) ticket.firstResponseAt = new Date();
    if (ticket.status === "escalated") ticket.status = "in_progress";

    await ticket.save();
    res.json({ success: true, ticket: formatTicket(ticket) });
  } catch (error) {
    console.error("adminPostMessage error:", error);
    return next(error);
  }
};

/**
 * PATCH /api/admin/support/tickets/:ticketId/status
 * body: { status }
 */
exports.adminUpdateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ["open", "in_progress", "awaiting_customer", "awaiting_owner", "escalated", "resolved", "closed"];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const ticket = await SupportTicket.findById(req.params.ticketId);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    const adminUser = req.session.username || "admin";
    const prev = ticket.status;
    ticket.status = status;

    if (status === "resolved" && prev !== "resolved") {
      ticket.resolvedAt = new Date();
      ticket.messages.push({
        senderRole: "system",
        senderName: "System",
        text: `Ticket resolved by admin (${adminUser}).`,
      });
    }

    if (status === "closed" && prev !== "closed") {
      ticket.messages.push({
        senderRole: "system",
        senderName: "System",
        text: `Ticket closed by admin (${adminUser}).`,
      });
    }

    await ticket.save();
    res.json({ success: true, ticket: formatTicket(ticket) });
  } catch (error) {
    console.error("adminUpdateStatus error:", error);
    return next(error);
  }
};

/**
 * PATCH /api/admin/support/tickets/:ticketId/assign
 * body: { assignedTo, assignedRole }
 */
exports.adminAssignTicket = async (req, res, next) => {
  try {
    const { assignedTo, assignedRole } = req.body;

    const ticket = await SupportTicket.findById(req.params.ticketId);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    ticket.assignedTo = assignedTo || null;
    ticket.assignedRole = assignedRole || null;
    if (ticket.status === "open" || ticket.status === "escalated") {
      ticket.status = "in_progress";
    }

    ticket.messages.push({
      senderRole: "system",
      senderName: "System",
      text: `Ticket assigned to ${assignedTo || "unassigned"} (${assignedRole || "–"}).`,
    });

    await ticket.save();
    res.json({ success: true, ticket: formatTicket(ticket) });
  } catch (error) {
    console.error("adminAssignTicket error:", error);
    return next(error);
  }
};

/**
 * POST /api/admin/support/tickets/:ticketId/notes
 * body: { text }
 */
exports.adminAddNote = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: "Note text is required" });

    const ticket = await SupportTicket.findById(req.params.ticketId);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    const adminUser = req.session.username || "admin";
    ticket.internalNotes.push({ author: adminUser, text: text.trim() });
    await ticket.save();

    res.json({ success: true, ticket: formatTicket(ticket) });
  } catch (error) {
    console.error("adminAddNote error:", error);
    return next(error);
  }
};

/**
 * GET /api/admin/support/stats
 * Platform-wide support stats
 */
exports.adminGetStats = async (req, res, next) => {
  try {
    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const total = await SupportTicket.countDocuments();
    const open = await SupportTicket.countDocuments({ status: "open" });
    const inProgress = await SupportTicket.countDocuments({ status: "in_progress" });
    const escalated = await SupportTicket.countDocuments({ status: "escalated" });
    const resolved = await SupportTicket.countDocuments({ status: { $in: ["resolved", "closed"] } });
    const urgent = await SupportTicket.countDocuments({
      priority: "urgent",
      status: { $nin: ["resolved", "closed"] },
    });
    const newLast24h = await SupportTicket.countDocuments({ createdAt: { $gte: last24h } });
    const resolvedLast7d = await SupportTicket.countDocuments({
      resolvedAt: { $gte: last7d },
    });

    // Per-restaurant breakdown (top 10 by ticket count)
    const byRestaurant = await SupportTicket.aggregate([
      { $group: { _id: "$rest_id", count: { $sum: 1 }, restaurantName: { $first: "$restaurantName" } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      stats: {
        total,
        open,
        inProgress,
        escalated,
        resolved,
        urgent,
        newLast24h,
        resolvedLast7d,
        byRestaurant,
      },
    });
  } catch (error) {
    console.error("adminGetStats error:", error);
    return next(error);
  }
};
