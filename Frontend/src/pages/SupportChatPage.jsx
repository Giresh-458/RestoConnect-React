import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { customerApi, ownerApi, adminApi } from "../api/supportApi";
import styles from "./SupportChatPage.module.css";

/* ── Constants ──────────────────────────────────────── */
const STATUS_LABELS = {
  open: "Open",
  in_progress: "In Progress",
  awaiting_customer: "Awaiting You",
  awaiting_owner: "Awaiting Response",
  escalated: "Escalated",
  resolved: "Resolved",
  closed: "Closed",
};

const PRIORITY_COLORS = {
  low: "#22c55e",
  medium: "#eab308",
  high: "#f97316",
  urgent: "#ef4444",
};

const PRIORITY_LABELS = { low: "Low", medium: "Medium", high: "High", urgent: "Urgent" };

/* ── Main component ─────────────────────────────────── */
export function SupportChatPage({ mode }) {
  const location = useLocation();
  const messagesEndRef = useRef(null);

  const isOwnerView = mode === "owner" || location.pathname.includes("/owner/support");
  const isCustomerView = mode === "customer" || location.pathname.includes("/customer/support");
  const isAdminView = mode === "admin" || location.pathname.includes("/admin/support");

  /* ── Customer flow: "orders" → pick order → pick issue → ticket created
       Three screens: "orders" | "issue" | "tickets"                       */
  const [customerScreen, setCustomerScreen] = useState("orders");

  /* ── Order history (Swiggy-style) ─────────────── */
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  /* ── Issue category selection ─────────────────── */
  const [categories, setCategories] = useState({});
  const [categoryIcons, setCategoryIcons] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("");
  const [issueDescription, setIssueDescription] = useState("");

  /* ── Ticket state ──────────────────────────────── */
  const [tickets, setTickets] = useState([]);
  const [activeTicketId, setActiveTicketId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState(null);

  /* Filter state */
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  /* Owner / admin: internal note */
  const [noteText, setNoteText] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [ownerTicketForm, setOwnerTicketForm] = useState({ subject: "", message: "", category: "web_issue", priority: "medium" });

  /* Rating modal */
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState("");

  /* ── Derived data ──────────────────────────────── */
  const activeTicket = useMemo(
    () => tickets.find((t) => t.id === activeTicketId) || null,
    [tickets, activeTicketId]
  );

  const filteredTickets = useMemo(() => {
    let list = tickets;
    if (statusFilter !== "all") list = list.filter((t) => t.status === statusFilter);
    if (priorityFilter !== "all") list = list.filter((t) => t.priority === priorityFilter);
    return list;
  }, [tickets, statusFilter, priorityFilter]);

  /* ── Auto-scroll messages ────────────────────── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeTicket?.messages]);

  /* ═══════════════════════════════════════════════
     CUSTOMER FLOW: Load orders & categories
     ═══════════════════════════════════════════════ */
  useEffect(() => {
    if (!isCustomerView) return;
    (async () => {
      try {
        const [ordersRes, catRes] = await Promise.all([
          customerApi.getOrders(),
          customerApi.getCategories(),
        ]);
        setOrders(ordersRes.orders || []);
        setCategories(catRes.categories || {});
        setCategoryIcons(catRes.icons || {});
      } catch (err) {
        setError(err.message || "Failed to load orders");
      } finally {
        setOrdersLoading(false);
      }
    })();
  }, [isCustomerView]);

  /* ═══════════════════════════════════════════════
     LOAD TICKETS  (all roles)
     ═══════════════════════════════════════════════ */
  const loadTickets = useCallback(async () => {
    setError("");
    try {
      let data;
      if (isCustomerView) {
        data = await customerApi.getTickets(statusFilter !== "all" ? statusFilter : undefined);
      } else if (isOwnerView) {
        data = await ownerApi.getTickets({ status: statusFilter, priority: priorityFilter });
      } else {
        data = await adminApi.getTickets({ status: statusFilter, priority: priorityFilter });
      }
      setTickets(data.tickets || []);
      if (data.stats) setStats(data.stats);
      if (!activeTicketId && data.tickets?.length) {
        setActiveTicketId(data.tickets[0].id);
      }
    } catch (err) {
      setError(err.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [isCustomerView, isOwnerView, isAdminView, statusFilter, priorityFilter, activeTicketId]);

  // Owner/Admin: load stats once
  useEffect(() => {
    if (!isOwnerView && !isAdminView) return;
    (async () => {
      try {
        const fn = isAdminView ? adminApi.getStats : ownerApi.getStats;
        const data = await fn();
        setStats(data.stats);
      } catch (err) {
        setError(err.message || "Failed to load support stats");
      }
    })();
  }, [isOwnerView, isAdminView]);

  // Load tickets when screen = tickets or for owner/admin
  useEffect(() => {
    if (isCustomerView && customerScreen !== "tickets") return;
    setLoading(true);
    loadTickets();
  }, [customerScreen, statusFilter, priorityFilter, isOwnerView, isAdminView]);

  // Keep active ticket in filtered list
  useEffect(() => {
    if (activeTicketId && !filteredTickets.some((t) => t.id === activeTicketId)) {
      setActiveTicketId(filteredTickets[0]?.id || "");
    }
  }, [filteredTickets, activeTicketId]);

  /* ═══════════════════════════════════════════════
     ACTIONS
     ═══════════════════════════════════════════════ */
  const handleSendMessage = async () => {
    if (!message.trim() || sending || !activeTicketId) return;
    setSending(true);
    setError("");
    try {
      if (isCustomerView) await customerApi.postMessage(activeTicketId, message.trim());
      else if (isOwnerView) await ownerApi.postMessage(activeTicketId, message.trim());
      else await adminApi.postMessage(activeTicketId, message.trim());
      setMessage("");
      await loadTickets();
    } catch (err) {
      setError(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  /** Swiggy-style: select order → pick issue → submit */
  const handleSubmitIssue = async () => {
    if (!selectedOrder || !selectedCategory || !issueDescription.trim()) {
      setError("Please select a category and describe your issue");
      return;
    }
    setSending(true);
    setError("");
    try {
      const data = await customerApi.createTicket({
        orderId: selectedOrder.orderId,
        category: selectedCategory,
        description: issueDescription.trim(),
      });
      // Reset flow and jump to tickets view with the new ticket selected
      setSelectedOrder(null);
      setSelectedCategory("");
      setIssueDescription("");
      setCustomerScreen("tickets");
      setActiveTicketId(data.ticket?.id || "");
      await loadTickets();
    } catch (err) {
      setError(err.message || "Failed to create ticket");
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status) => {
    if (!activeTicketId) return;
    try {
      if (isCustomerView && status === "resolved") await customerApi.closeTicket(activeTicketId);
      else if (isOwnerView) await ownerApi.updateStatus(activeTicketId, status);
      else await adminApi.updateStatus(activeTicketId, status);
      await loadTickets();
    } catch (err) {
      setError(err.message || "Failed to update status");
    }
  };

  const handlePriorityChange = async (priority) => {
    if (!activeTicketId) return;
    try {
      await ownerApi.updatePriority(activeTicketId, priority);
      await loadTickets();
    } catch (err) {
      setError(err.message || "Failed to update priority");
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !activeTicketId) return;
    try {
      const fn = isAdminView ? adminApi.addNote : ownerApi.addNote;
      await fn(activeTicketId, noteText.trim());
      setNoteText("");
      await loadTickets();
    } catch (err) {
      setError(err.message || "Failed to add note");
    }
  };

  const handleOwnerCreateTicket = async () => {
    if (!ownerTicketForm.subject.trim() || !ownerTicketForm.message.trim()) {
      setError("Subject and message are required");
      return;
    }
    try {
      await ownerApi.createTicket(ownerTicketForm);
      setOwnerTicketForm({ subject: "", message: "", category: "web_issue", priority: "medium" });
      await loadTickets();
    } catch (err) {
      setError(err.message || "Failed to create ticket");
    }
  };

  const handleRate = async () => {
    if (!activeTicketId) return;
    try {
      await customerApi.rateTicket(activeTicketId, rating, ratingComment);
      setShowRating(false);
      setRatingComment("");
      await loadTickets();
    } catch (err) {
      setError(err.message || "Failed to submit rating");
    }
  };

  /* ═══════════════════════════════════════════════
     RENDER: CUSTOMER VIEW  —  Swiggy-style
     ═══════════════════════════════════════════════ */
  if (isCustomerView) {
    return (
      <div className={styles.supportPage}>
        {/* ─── Tab bar ─── */}
        <div className={styles.tabBar}>
          <button
            className={customerScreen === "orders" ? styles.tabActive : styles.tab}
            onClick={() => { setCustomerScreen("orders"); setSelectedOrder(null); setSelectedCategory(""); setIssueDescription(""); }}
          >
            Get Help
          </button>
          <button
            className={customerScreen === "tickets" ? styles.tabActive : styles.tab}
            onClick={() => setCustomerScreen("tickets")}
          >
            My Tickets {tickets.length > 0 && <span className={styles.badge}>{tickets.length}</span>}
          </button>
        </div>

        {error && <div className={styles.errorBanner}>{error}<button onClick={() => setError("")}>✕</button></div>}

        {/* ═══ Screen: Order History ═══ */}
        {customerScreen === "orders" && !selectedOrder && (
          <div className={styles.ordersScreen}>
            <h2 className={styles.screenTitle}>Your Dining History</h2>
            <p className={styles.screenSub}>Select an order to report an issue</p>

            {ordersLoading ? (
              <div className={styles.loader}>Loading your orders...</div>
            ) : orders.length === 0 ? (
              <div className={styles.emptyOrders}>
                <span className={styles.emptyIcon}>🍽️</span>
                <h3>No orders yet</h3>
                <p>Once you dine at a restaurant, your orders will appear here.</p>
              </div>
            ) : (
              <div className={styles.orderList}>
                {orders.map((order) => (
                  <div
                    key={order.orderId}
                    className={styles.orderCard}
                    onClick={() => {
                      if (order.existingTicket && order.existingTicket.status !== "closed") {
                        // Jump to existing ticket
                        setCustomerScreen("tickets");
                        setActiveTicketId(order.existingTicket.ticketId);
                        loadTickets();
                      } else {
                        setSelectedOrder(order);
                      }
                    }}
                  >
                    <div className={styles.orderCardHeader}>
                      <div className={styles.orderRestaurant}>
                        <h3>{order.restaurant}</h3>
                        <span className={styles.orderDate}>
                          {new Date(order.date).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                          {" · "}
                          {new Date(order.date).toLocaleTimeString("en-IN", {
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className={styles.orderAmount}>
                        ₹{order.totalAmount?.toFixed(2)}
                      </div>
                    </div>

                    <div className={styles.orderItems}>
                      {order.items.slice(0, 3).map((item, i) => (
                        <span key={i} className={styles.orderItemChip}>{item.name}</span>
                      ))}
                      {order.items.length > 3 && (
                        <span className={styles.orderItemMore}>+{order.items.length - 3} more</span>
                      )}
                    </div>

                    <div className={styles.orderFooter}>
                      <span className={`${styles.orderStatus} ${styles[`os_${order.status}`]}`}>
                        {order.status}
                      </span>
                      {order.tableNumber && (
                        <span className={styles.orderTable}>Table {order.tableNumber}</span>
                      )}
                      {order.existingTicket ? (
                        <span className={styles.existingTicketBadge}>
                          {order.existingTicket.ticketNumber} · {STATUS_LABELS[order.existingTicket.status]}
                        </span>
                      ) : (
                        <span className={styles.helpLink}>Get Help →</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ Screen: Pick Issue Category (Swiggy-style) ═══ */}
        {customerScreen === "orders" && selectedOrder && (
          <div className={styles.issueScreen}>
            <button className={styles.backBtn} onClick={() => { setSelectedOrder(null); setSelectedCategory(""); setIssueDescription(""); }}>
              ← Back to orders
            </button>

            {/* Order summary card */}
            <div className={styles.orderSummaryCard}>
              <div className={styles.orderSummaryHeader}>
                <h3>{selectedOrder.restaurant}</h3>
                <span className={styles.orderDate}>
                  {new Date(selectedOrder.date).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </span>
              </div>
              <div className={styles.orderSummaryItems}>
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className={styles.summaryItem}>
                    <span>{item.name}</span>
                    <span className={styles.summaryItemPrice}>₹{item.price}</span>
                  </div>
                ))}
                <div className={styles.summaryTotal}>
                  <strong>Total</strong>
                  <strong>₹{selectedOrder.totalAmount?.toFixed(2)}</strong>
                </div>
              </div>
            </div>

            {/* Category picker */}
            <h3 className={styles.issueHeading}>What went wrong?</h3>
            <div className={styles.categoryGrid}>
              {Object.entries(categories).map(([key, label]) => (
                <button
                  key={key}
                  className={selectedCategory === key ? styles.catCardActive : styles.catCard}
                  onClick={() => setSelectedCategory(key)}
                >
                  <span className={styles.catIcon}>{categoryIcons[key] || "❓"}</span>
                  <span className={styles.catLabel}>{label}</span>
                </button>
              ))}
            </div>

            {/* Description */}
            {selectedCategory && (
              <div className={styles.issueForm}>
                <label>Tell us more about the issue</label>
                <textarea
                  rows={4}
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Describe what happened so we can help you better..."
                />
                <button
                  className={styles.submitBtn}
                  onClick={handleSubmitIssue}
                  disabled={sending || !issueDescription.trim()}
                >
                  {sending ? "Submitting..." : "Submit Issue"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══ Screen: My Tickets ═══ */}
        {customerScreen === "tickets" && (
          <div className={styles.ticketsScreen}>
            {/* Filter bar */}
            <div className={styles.ticketFilterBar}>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="awaiting_customer">Awaiting You</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {loading ? (
              <div className={styles.loader}>Loading tickets...</div>
            ) : filteredTickets.length === 0 ? (
              <div className={styles.emptyOrders}>
                <span className={styles.emptyIcon}>🎫</span>
                <h3>No tickets yet</h3>
                <p>When you report an issue on an order, it will show up here.</p>
              </div>
            ) : (
              <div className={styles.ticketSplitView}>
                {/* Ticket list */}
                <aside className={styles.ticketList}>
                  {filteredTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className={ticket.id === activeTicketId ? styles.ticketCardActive : styles.ticketCard}
                      onClick={() => setActiveTicketId(ticket.id)}
                    >
                      <div className={styles.ticketCardHeader}>
                        <span className={styles.ticketNumber}>{ticket.ticketNumber}</span>
                        <span className={styles.priorityDot} style={{ background: PRIORITY_COLORS[ticket.priority] }} title={PRIORITY_LABELS[ticket.priority]} />
                      </div>
                      <p className={styles.ticketSubject}>{ticket.subject}</p>
                      <div className={styles.ticketCardMeta}>
                        <span className={styles.categoryChip}>
                          {ticket.categoryIcon} {ticket.categoryLabel}
                        </span>
                        <span className={["resolved", "closed"].includes(ticket.status) ? styles.statusResolved : styles.statusOpen}>
                          {STATUS_LABELS[ticket.status]}
                        </span>
                      </div>
                      {ticket.orderSnapshot && (
                        <p className={styles.ticketOrderInfo}>
                          {ticket.orderSnapshot.restaurantName} · ₹{ticket.orderSnapshot.totalAmount}
                        </p>
                      )}
                      <p className={styles.ticketTime}>{new Date(ticket.updatedAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </aside>

                {/* Chat panel */}
                <section className={styles.chatPanel}>
                  {activeTicket ? (
                    <>
                      {renderTicketHeader(activeTicket, { isCustomerView, isOwnerView, isAdminView, handleStatusChange, handlePriorityChange, showNotes, setShowNotes, setShowRating })}
                      {renderOrderSnapshot(activeTicket)}
                      {renderMessages(activeTicket, { isCustomerView, isOwnerView, isAdminView, messagesEndRef })}
                      {renderComposer(activeTicket, { message, setMessage, handleSendMessage, sending })}
                    </>
                  ) : (
                    <div className={styles.emptyPanel}>
                      <span className={styles.emptyIcon}>💬</span>
                      <h3>Select a ticket</h3>
                      <p>Click a ticket from the list to view the conversation.</p>
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        )}

        {/* Rating modal */}
        {showRating && renderRatingModal({ rating, setRating, ratingComment, setRatingComment, handleRate, setShowRating })}
      </div>
    );
  }

  /* ═══════════════════════════════════════════════
     RENDER: OWNER / ADMIN VIEW
     ═══════════════════════════════════════════════ */
  const roleLabel = isAdminView ? "Admin" : "Owner";

  return (
    <div className={styles.supportPage}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{roleLabel} Support Center</p>
          <h1>{isAdminView ? "Platform Support Dashboard" : "Customer Support Tickets"}</h1>
          <p className={styles.subtitle}>
            {isAdminView
              ? "Monitor, escalate and resolve support tickets across all restaurants."
              : "Manage customer issues, respond to tickets and track resolution."}
          </p>
        </div>
      </header>

      {/* Stats bar */}
      {stats && (
        <div className={styles.statsBar}>
          <div className={styles.statCard}><span className={styles.statValue}>{stats.open ?? 0}</span><span className={styles.statLabel}>Open</span></div>
          <div className={styles.statCard}><span className={styles.statValue}>{stats.inProgress ?? 0}</span><span className={styles.statLabel}>In Progress</span></div>
          <div className={styles.statCard}><span className={styles.statValue}>{stats.awaitingOwner ?? stats.escalated ?? 0}</span><span className={styles.statLabel}>{isAdminView ? "Escalated" : "Needs Reply"}</span></div>
          <div className={`${styles.statCard} ${styles.statUrgent}`}><span className={styles.statValue}>{stats.urgent ?? 0}</span><span className={styles.statLabel}>Urgent</span></div>
          <div className={styles.statCard}><span className={styles.statValue}>{stats.resolved ?? 0}</span><span className={styles.statLabel}>Resolved</span></div>
          {stats.avgSatisfaction != null && (
            <div className={styles.statCard}><span className={styles.statValue}>{stats.avgSatisfaction}/5</span><span className={styles.statLabel}>Avg Rating</span></div>
          )}
          {stats.avgFirstResponseMin != null && (
            <div className={styles.statCard}><span className={styles.statValue}>{stats.avgFirstResponseMin}m</span><span className={styles.statLabel}>Avg Response</span></div>
          )}
        </div>
      )}

      {isOwnerView && (
        <div className={styles.notesPanel}>
          <h4>Raise Ticket to Admin</h4>
          <div className={styles.noteComposer}>
            <input
              type="text"
              value={ownerTicketForm.subject}
              onChange={(e) => setOwnerTicketForm((prev) => ({ ...prev, subject: e.target.value }))}
              placeholder="Subject"
            />
            <select
              value={ownerTicketForm.priority}
              onChange={(e) => setOwnerTicketForm((prev) => ({ ...prev, priority: e.target.value }))}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className={styles.noteComposer}>
            <input
              type="text"
              value={ownerTicketForm.message}
              onChange={(e) => setOwnerTicketForm((prev) => ({ ...prev, message: e.target.value }))}
              placeholder="Describe the issue for admin"
            />
            <button className={styles.primaryBtn} onClick={handleOwnerCreateTicket}>Create Ticket</button>
          </div>
        </div>
      )}

      {error && <div className={styles.errorBanner}>{error}<button onClick={() => setError("")}>✕</button></div>}

      {loading ? (
        <div className={styles.loader}>Loading support tickets...</div>
      ) : (
        <div className={styles.ticketSplitView}>
          {/* Ticket sidebar */}
          <aside className={styles.ticketList}>
            <div className={styles.filterSection}>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="awaiting_owner">Needs Reply</option>
                <option value="escalated">Escalated</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {filteredTickets.length === 0 ? (
              <p className={styles.emptyState}>No tickets found.</p>
            ) : (
              filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={ticket.id === activeTicketId ? styles.ticketCardActive : styles.ticketCard}
                  onClick={() => { setActiveTicketId(ticket.id); setShowNotes(false); }}
                >
                  <div className={styles.ticketCardHeader}>
                    <span className={styles.ticketNumber}>{ticket.ticketNumber}</span>
                    <span className={styles.priorityDot} style={{ background: PRIORITY_COLORS[ticket.priority] }} title={PRIORITY_LABELS[ticket.priority]} />
                  </div>
                  <p className={styles.ticketSubject}>{ticket.subject}</p>
                  <div className={styles.ticketCardMeta}>
                    <span className={styles.categoryChip}>{ticket.categoryIcon} {ticket.categoryLabel}</span>
                    <span className={["resolved", "closed"].includes(ticket.status) ? styles.statusResolved : ticket.status === "escalated" ? styles.statusEscalated : styles.statusOpen}>
                      {STATUS_LABELS[ticket.status]}
                    </span>
                  </div>
                  <p className={styles.ticketCreatedBy}>by {ticket.createdBy}</p>
                  {ticket.orderSnapshot && (
                    <p className={styles.ticketOrderInfo}>Order: ₹{ticket.orderSnapshot.totalAmount} · {new Date(ticket.orderSnapshot.orderDate).toLocaleDateString()}</p>
                  )}
                  <p className={styles.ticketTime}>{new Date(ticket.updatedAt).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </aside>

          {/* Chat panel */}
          <section className={styles.chatPanel}>
            {activeTicket ? (
              <>
                {renderTicketHeader(activeTicket, { isCustomerView, isOwnerView, isAdminView, handleStatusChange, handlePriorityChange, showNotes, setShowNotes, setShowRating })}
                {renderOrderSnapshot(activeTicket)}

                {/* Internal notes */}
                {showNotes && (
                  <div className={styles.notesPanel}>
                    <h4>Internal Notes <span className={styles.notesHint}>(not visible to customer)</span></h4>
                    {activeTicket.internalNotes?.length > 0 ? (
                      <ul className={styles.notesList}>
                        {activeTicket.internalNotes.map((note, i) => (
                          <li key={note._id || i}>
                            <strong>{note.author}</strong> — {new Date(note.createdAt).toLocaleString()}
                            <p>{note.text}</p>
                          </li>
                        ))}
                      </ul>
                    ) : <p className={styles.emptyState}>No notes yet.</p>}
                    <div className={styles.noteComposer}>
                      <input type="text" value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add an internal note..." />
                      <button className={styles.primaryBtn} onClick={handleAddNote} disabled={!noteText.trim()}>Add</button>
                    </div>
                  </div>
                )}

                {renderMessages(activeTicket, { isCustomerView, isOwnerView, isAdminView, messagesEndRef })}
                {renderComposer(activeTicket, { message, setMessage, handleSendMessage, sending })}
              </>
            ) : (
              <div className={styles.emptyPanel}>
                <span className={styles.emptyIcon}>🎫</span>
                <h3>No ticket selected</h3>
                <p>Select a ticket from the list to view details and respond.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Shared render helpers (extracted for readability)
   ═══════════════════════════════════════════════════ */

function renderTicketHeader(ticket, ctx) {
  return (
    <div className={styles.chatHeader}>
      <div className={styles.chatHeaderLeft}>
        <div className={styles.ticketMeta}>
          <span className={styles.ticketNumber}>{ticket.ticketNumber}</span>
          <span className={styles.priorityBadge} style={{ background: PRIORITY_COLORS[ticket.priority] }}>
            {PRIORITY_LABELS[ticket.priority]}
          </span>
          <span className={styles.categoryChip}>{ticket.categoryIcon} {ticket.categoryLabel}</span>
        </div>
        <h3>{ticket.subject}</h3>
        <div className={styles.ticketInfo}>
          <span>Status: <strong>{STATUS_LABELS[ticket.status]}</strong></span>
          {ticket.restaurantName && <span>Restaurant: <strong>{ticket.restaurantName}</strong></span>}
          <span>Created: {new Date(ticket.createdAt).toLocaleString()}</span>
          {ticket.assignedTo && <span>Assigned: <strong>{ticket.assignedTo}</strong></span>}
        </div>
        {ticket.satisfactionRating && (
          <div className={styles.ratingDisplay}>
            {"★".repeat(ticket.satisfactionRating)}{"☆".repeat(5 - ticket.satisfactionRating)}
            {ticket.satisfactionComment && <span> — "{ticket.satisfactionComment}"</span>}
          </div>
        )}
      </div>

      <div className={styles.headerControls}>
        {/* Owner & admin action buttons */}
        {(ctx.isOwnerView || ctx.isAdminView) && !["closed"].includes(ticket.status) && (
          <div className={styles.statusActions}>
            {ticket.status !== "in_progress" && (
              <button className={styles.actionBtn} onClick={() => ctx.handleStatusChange("in_progress")}>Start Working</button>
            )}
            {ticket.status !== "resolved" && (
              <button className={styles.resolveBtn} onClick={() => ctx.handleStatusChange("resolved")}>Resolve</button>
            )}
            {ctx.isOwnerView && ticket.status !== "escalated" && (
              <button className={styles.escalateBtn} onClick={() => ctx.handleStatusChange("escalated")}>Escalate</button>
            )}
            {ctx.isAdminView && ticket.status !== "closed" && (
              <button className={styles.closeBtn} onClick={() => ctx.handleStatusChange("closed")}>Close</button>
            )}
          </div>
        )}

        {ctx.isOwnerView && !["resolved", "closed"].includes(ticket.status) && (
          <select className={styles.prioritySelect} value={ticket.priority} onChange={(e) => ctx.handlePriorityChange(e.target.value)}>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
          </select>
        )}

        {ctx.isCustomerView && !["resolved", "closed"].includes(ticket.status) && (
          <button className={styles.resolveBtn} onClick={() => ctx.handleStatusChange("resolved")}>Mark Resolved</button>
        )}
        {ctx.isCustomerView && ["resolved", "closed"].includes(ticket.status) && !ticket.satisfactionRating && (
          <button className={styles.primaryBtn} onClick={() => ctx.setShowRating(true)}>Rate Experience</button>
        )}

        {(ctx.isOwnerView || ctx.isAdminView) && (
          <button className={ctx.showNotes ? styles.notesActive : styles.notesBtn} onClick={() => ctx.setShowNotes(!ctx.showNotes)}>
            Notes ({ticket.internalNotes?.length || 0})
          </button>
        )}
      </div>
    </div>
  );
}

function renderOrderSnapshot(ticket) {
  const snap = ticket.orderSnapshot;
  if (!snap) return null;
  return (
    <div className={styles.snapshotBar}>
      <div className={styles.snapshotTitle}>
        <span className={styles.snapshotIcon}>🧾</span>
        <strong>Order Details</strong>
        <span className={styles.snapshotDate}>{new Date(snap.orderDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
      </div>
      <div className={styles.snapshotItems}>
        {snap.items.map((item, i) => (
          <span key={i} className={styles.snapshotChip}>{item.name} <small>₹{item.price}</small></span>
        ))}
      </div>
      <div className={styles.snapshotFooter}>
        <span>Total: <strong>₹{snap.totalAmount}</strong></span>
        {snap.tableNumber && <span>Table: {snap.tableNumber}</span>}
        <span>Status: {snap.status}</span>
        <span>Payment: {snap.paymentStatus}</span>
      </div>
    </div>
  );
}

function renderMessages(ticket, ctx) {
  return (
    <div className={styles.messages}>
      {ticket.messages?.length ? (
        ticket.messages.map((msg, index) => {
          const isSystem = msg.senderRole === "system";
          const isSelf =
            (ctx.isCustomerView && msg.senderRole === "customer") ||
            (ctx.isOwnerView && msg.senderRole === "owner") ||
            (ctx.isAdminView && msg.senderRole === "admin");

          if (isSystem) {
            return (
              <div key={`${msg.timestamp}-${index}`} className={styles.systemMessage}>
                <p>{msg.text}</p>
                <span>{new Date(msg.timestamp).toLocaleString()}</span>
              </div>
            );
          }

          return (
            <div key={`${msg.timestamp}-${index}`} className={isSelf ? styles.msgSelf : styles.msgOther}>
              <div className={styles.msgBubble}>
                <div className={styles.msgHeader}>
                  <span className={styles.senderName}>{msg.senderName}</span>
                  <span className={styles.senderRole}>{msg.senderRole}</span>
                </div>
                <p>{msg.text}</p>
                <span className={styles.msgTime}>{new Date(msg.timestamp).toLocaleString()}</span>
              </div>
            </div>
          );
        })
      ) : (
        <p className={styles.emptyState}>No messages yet.</p>
      )}
      <div ref={ctx.messagesEndRef} />
    </div>
  );
}

function renderComposer(ticket, ctx) {
  if (["closed"].includes(ticket.status)) return null;
  return (
    <div className={styles.composer}>
      <textarea
        value={ctx.message}
        onChange={(e) => ctx.setMessage(e.target.value)}
        placeholder="Type your reply..."
        rows={3}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ctx.handleSendMessage(); }
        }}
      />
      <button className={styles.sendBtn} onClick={ctx.handleSendMessage} disabled={ctx.sending || !ctx.message.trim()}>
        {ctx.sending ? "Sending..." : "Send"}
      </button>
    </div>
  );
}

function renderRatingModal(ctx) {
  return (
    <div className={styles.modalOverlay} onClick={() => ctx.setShowRating(false)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>Rate Support Experience</h2>
        <p className={styles.ratingSubtitle}>How was your support experience?</p>
        <div className={styles.starRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} className={n <= ctx.rating ? styles.starActive : styles.star} onClick={() => ctx.setRating(n)}>★</button>
          ))}
        </div>
        <textarea className={styles.ratingTextarea} rows={3} value={ctx.ratingComment} onChange={(e) => ctx.setRatingComment(e.target.value)} placeholder="Any additional comments (optional)" />
        <div className={styles.modalActions}>
          <button className={styles.secondaryBtn} onClick={() => ctx.setShowRating(false)}>Skip</button>
          <button className={styles.primaryBtn} onClick={ctx.handleRate}>Submit Rating</button>
        </div>
      </div>
    </div>
  );
}
