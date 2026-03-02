const SupportTicket = require("../Model/SupportTicket_model");

const formatTicket = (ticket) => ({
  id: ticket._id,
  ticketNumber: ticket.ticketNumber,
  subject: ticket.subject,
  category: ticket.category,
  categoryLabel: ticket.category,
  priority: ticket.priority,
  status: ticket.status,
  createdBy: ticket.createdBy,
  createdByRole: ticket.createdByRole,
  rest_id: ticket.rest_id,
  restaurantName: ticket.restaurantName,
  messages: ticket.messages || [],
  createdAt: ticket.createdAt,
  updatedAt: ticket.updatedAt,
});

exports.staffCreateTicket = async (req, res, next) => {
  try {
    const staffMember = req.user;
    if (!staffMember) return res.status(401).json({ error: "Not authenticated" });

    const rest_id = staffMember.rest_id;
    if (!rest_id) return res.status(400).json({ error: "No restaurant assigned" });

    const { subject, message, category, priority } = req.body;
    if (!subject?.trim() || !message?.trim()) {
      return res.status(400).json({ error: "Subject and message are required" });
    }

    const { Restaurant } = require("../Model/Restaurents_model");
    const restaurant = await Restaurant.findById(rest_id);

    const ticket = new SupportTicket({
      createdBy: staffMember.username,
      createdByRole: "staff",
      rest_id: String(rest_id),
      restaurantName: restaurant ? restaurant.name : "",
      category: category || "web_issue",
      subject: subject.trim(),
      priority: priority || "medium",
      messages: [
        {
          senderRole: "staff",
          senderName: staffMember.username,
          text: message.trim(),
        },
      ],
    });

    await ticket.save();
    res.status(201).json({ success: true, ticket: formatTicket(ticket) });
  } catch (error) {
    console.error("staffCreateTicket error:", error);
    return next(error);
  }
};

exports.staffGetTickets = async (req, res, next) => {
  try {
    const staffMember = req.user;
    if (!staffMember) return res.status(401).json({ error: "Not authenticated" });

    const rest_id = staffMember.rest_id;
    if (!rest_id) return res.status(400).json({ error: "No restaurant assigned" });

    const filter = {
      rest_id: rest_id,
      $or: [
        { category: "web_issue" },
        { createdBy: staffMember.username, createdByRole: "staff" },
      ],
    };
    
    const { status } = req.query;
    if (status && status !== "all") filter.status = status;

    const tickets = await SupportTicket.find(filter).sort({ updatedAt: -1 });

    const stats = {
      total: tickets.length,
      open: tickets.filter((t) => t.status === "open").length,
      inProgress: tickets.filter((t) => t.status === "in_progress").length,
      resolved: tickets.filter((t) => ["resolved", "closed"].includes(t.status)).length,
    };

    res.json({ tickets: tickets.map(formatTicket), stats });
  } catch (error) {
    console.error("staffGetTickets error:", error);
    return next(error);
  }
};

exports.staffGetTicket = async (req, res, next) => {
  try {
    const staffMember = req.user;
    if (!staffMember) return res.status(401).json({ error: "Not authenticated" });

    const rest_id = staffMember.rest_id;
    if (!rest_id) return res.status(400).json({ error: "No restaurant assigned" });

    const ticket = await SupportTicket.findOne({
      _id: req.params.ticketId,
      rest_id: rest_id,
      $or: [
        { category: "web_issue" },
        { createdBy: staffMember.username, createdByRole: "staff" },
      ],
    });
    
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    res.json({ ticket: formatTicket(ticket) });
  } catch (error) {
    console.error("staffGetTicket error:", error);
    return next(error);
  }
};

exports.staffPostMessage = async (req, res, next) => {
  try {
    const staffMember = req.user;
    if (!staffMember) return res.status(401).json({ error: "Not authenticated" });

    const rest_id = staffMember.rest_id;
    if (!rest_id) return res.status(400).json({ error: "No restaurant assigned" });

    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: "Message is required" });

    const ticket = await SupportTicket.findOne({
      _id: req.params.ticketId,
      rest_id: rest_id,
      $or: [
        { category: "web_issue" },
        { createdBy: staffMember.username, createdByRole: "staff" },
      ],
    });
    
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    if (ticket.status === "closed") {
      return res.status(400).json({ error: "This ticket is closed" });
    }

    ticket.messages.push({
      senderRole: "staff",
      senderName: staffMember.username,
      text: message.trim(),
    });

    if (!ticket.firstResponseAt) {
      ticket.firstResponseAt = new Date();
    }

    if (ticket.status === "open") {
      ticket.status = "in_progress";
    }

    await ticket.save();
    res.json({ success: true, ticket: formatTicket(ticket) });
  } catch (error) {
    console.error("staffPostMessage error:", error);
    return next(error);
  }
};

exports.staffUpdateStatus = async (req, res, next) => {
  try {
    const staffMember = req.user;
    if (!staffMember) return res.status(401).json({ error: "Not authenticated" });

    const rest_id = staffMember.rest_id;
    if (!rest_id) return res.status(400).json({ error: "No restaurant assigned" });

    const { status } = req.body;
    const allowed = ["open", "in_progress", "escalated", "resolved", "closed"];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const ticket = await SupportTicket.findOne({
      _id: req.params.ticketId,
      rest_id: rest_id,
      $or: [
        { category: "web_issue" },
        { createdBy: staffMember.username, createdByRole: "staff" },
      ],
    });
    
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    const prev = ticket.status;
    ticket.status = status;

    if (status === "resolved" && prev !== "resolved") {
      ticket.resolvedAt = new Date();
      ticket.messages.push({
        senderRole: "system",
        senderName: "System",
        text: `Ticket resolved by staff (${staffMember.username}).`,
      });
    }

    await ticket.save();
    res.json({ success: true, ticket: formatTicket(ticket) });
  } catch (error) {
    console.error("staffUpdateStatus error:", error);
    return next(error);
  }
};
