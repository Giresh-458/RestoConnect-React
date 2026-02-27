import { isLogin } from "../util/auth";
import { redirect } from "react-router-dom";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import "../components/StaffHomePage.css";
import { useToast } from "../components/common/Toast";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr).getTime()) / 60000;
  if (diff < 1) return "just now";
  if (diff < 60) return `${Math.round(diff)}m ago`;
  return `${Math.floor(diff / 60)}h ${Math.round(diff % 60)}m ago`;
}

function timeUntil(dateStr) {
  if (!dateStr) return "";
  
  let targetDate;
  try {
    if (dateStr && typeof dateStr === 'string' && dateStr.includes(':') && !dateStr.includes('T')) {
      const today = new Date();
      const [hours, minutes] = dateStr.split(':');
      today.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0);
      targetDate = today;
    } else {
      targetDate = new Date(dateStr);
    }
    
    if (isNaN(targetDate.getTime())) {
      return "";
    }
  } catch (e) {
    return "";
  }
  
  const diff = (targetDate.getTime() - Date.now()) / 60000;
  if (diff < 0) return `${Math.abs(Math.round(diff))}m overdue`;
  if (diff < 60) return `in ${Math.round(diff)}m`;
  return `in ${Math.floor(diff / 60)}h ${Math.round(diff % 60)}m`;
}

function StatCard({ icon, label, value, subtext, color }) {
  return (
    <div className={`sh-stat-card sh-stat-${color}`}>
      <div className="sh-stat-icon">{icon}</div>
      <div className="sh-stat-info">
        <span className="sh-stat-value">{value}</span>
        <span className="sh-stat-label">{label}</span>
        {subtext && <span className="sh-stat-sub">{subtext}</span>}
      </div>
    </div>
  );
}

function OrderCard({ order, onStatusChange, isUpdating }) {
  const elapsed = order.orderTime ? timeAgo(order.orderTime) : "";
  const statusFlow = ["pending", "preparing", "ready", "served"];
  const currentIdx = statusFlow.indexOf(order.status?.toLowerCase());
  const nextStatus =
    currentIdx >= 0 && currentIdx < statusFlow.length - 1
      ? statusFlow[currentIdx + 1]
      : null;

  const statusLabels = {
    pending: "New",
    preparing: "Preparing",
    ready: "Ready",
    served: "Served",
    active: "Active",
    waiting: "Waiting",
  };
  const statusColors = {
    pending: "#f59e0b",
    preparing: "#3b82f6",
    ready: "#10b981",
    served: "#6b7280",
    active: "#f59e0b",
    waiting: "#f59e0b",
  };

  return (
    <div className={`sh-order-card sh-order-${order.status?.toLowerCase()}`}>
      <div className="sh-order-header">
        <span className="sh-order-id">#{String(order._id).slice(-4)}</span>
        <span
          className="sh-order-badge"
          style={{
            background:
              statusColors[order.status?.toLowerCase()] || "#6b7280",
          }}
        >
          {statusLabels[order.status?.toLowerCase()] || order.status}
        </span>
      </div>
      <div className="sh-order-table">
        <span className="sh-table-icon">🪑</span>
        Table {order.tableNumber || "N/A"}
      </div>
      <div className="sh-order-items">
        {(order.dishes || []).slice(0, 3).map((d, i) => (
          <span key={i} className="sh-dish-tag">
            {d}
          </span>
        ))}
        {(order.dishes || []).length > 3 && (
          <span className="sh-dish-more">
            +{order.dishes.length - 3} more
          </span>
        )}
      </div>
      <div className="sh-order-footer">
        <span className="sh-order-time">{elapsed}</span>
        {order.totalAmount > 0 && (
          <span className="sh-order-amount">
            ${order.totalAmount.toFixed(2)}
          </span>
        )}
      </div>
      {nextStatus && (
        <button
          className="sh-order-action"
          disabled={isUpdating}
          onClick={() => onStatusChange(order._id, nextStatus)}
        >
          {isUpdating
            ? "..."
            : nextStatus === "preparing"
            ? "🔥 Start Preparing"
            : nextStatus === "ready"
            ? "✅ Mark Ready"
            : nextStatus === "served"
            ? "🍽️ Mark Served"
            : `→ ${nextStatus}`}
        </button>
      )}
      {!nextStatus && order.status?.toLowerCase() !== "served" && (
        <button
          className="sh-order-action"
          disabled={isUpdating}
          onClick={() => onStatusChange(order._id, "done")}
        >
          {isUpdating ? "..." : "✓ Complete"}
        </button>
      )}
    </div>
  );
}

// ─── Sub-component: Table Map ───
function TableMap({ tables }) {
  const statusConfig = {
    Available: { color: "#10b981", bg: "#ecfdf5", label: "Free" },
    Allocated: { color: "#3b82f6", bg: "#eff6ff", label: "Reserved" },
    Occupied: { color: "#ef4444", bg: "#fef2f2", label: "Busy" },
    Cleaning: { color: "#f59e0b", bg: "#fefce8", label: "Cleaning" },
  };
  return (
    <div className="sh-table-grid">
      {tables.map((t) => {
        const cfg = statusConfig[t.status] || statusConfig.Available;
        return (
          <div
            key={t.number}
            className="sh-table-cell"
            style={{ borderColor: cfg.color, background: cfg.bg }}
          >
            <span className="sh-table-num" style={{ color: cfg.color }}>
              T{t.number}
            </span>
            <span className="sh-table-seats">{t.seats} seats</span>
            <span className="sh-table-status" style={{ color: cfg.color }}>
              {cfg.label}
            </span>
          </div>
        );
      })}
      {tables.length === 0 && (
        <div className="sh-empty-small">No tables configured</div>
      )}
    </div>
  );
}

// ─── Sub-component: Reservation Row ───
function ReservationRow({ res, availableTables, onAssign, isProcessing }) {
  const [selectedTable, setSelectedTable] = useState("");
  const countdown = timeUntil(res.time);
  const isOverdue = countdown.includes("overdue");

  return (
    <div className={`sh-res-row ${isOverdue ? "sh-res-overdue" : ""}`}>
      <div className="sh-res-info">
        <div className="sh-res-name">{res.customerName}</div>
        <div className="sh-res-meta">
          <span>
            {new Date(res.time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="sh-res-dot">·</span>
          <span>
            {res.guests} guest{res.guests !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
      <div
        className={`sh-res-countdown ${
          isOverdue ? "sh-countdown-overdue" : ""
        }`}
      >
        {countdown}
      </div>
      {!res.allocated ? (
        <div className="sh-res-assign">
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            disabled={isProcessing}
          >
            <option value="">Table...</option>
            {availableTables
              .filter((t) => t.seats >= (res.guests || 1))
              .map((t) => (
              <option key={t.number} value={t.number}>
                T{t.number} ({t.seats})
              </option>
            ))}
            {availableTables.filter((t) => t.seats >= (res.guests || 1)).length === 0 && (
              <option disabled>No tables with enough seats</option>
            )}
          </select>
          <button
            onClick={() => {
              onAssign(res._id, selectedTable);
              setSelectedTable("");
            }}
            disabled={!selectedTable || isProcessing}
            className="sh-assign-btn"
          >
            {isProcessing ? "..." : "Assign"}
          </button>
        </div>
      ) : (
        <span className="sh-res-assigned">
          Table {res.table_id || res.tables?.[0] || "?"}
        </span>
      )}
    </div>
  );
}

// ─── Sub-component: Alert Item ───
function AlertItem({ alert }) {
  const icons = { inventory: "📦", reservation: "📅", order: "🍽️" };
  return (
    <div className={`sh-alert-item sh-alert-${alert.severity}`}>
      <span className="sh-alert-icon">{icons[alert.icon] || "⚠️"}</span>
      <span className="sh-alert-msg">{alert.message}</span>
    </div>
  );
}

// ─── Sub-component: Task Item ───
function TaskItem({ task, onToggle, isUpdating }) {
  const isDone = task.status === "Done";
  return (
    <div className={`sh-task-item ${isDone ? "sh-task-done" : ""}`}>
      <button
        className={`sh-task-check ${isDone ? "checked" : ""}`}
        onClick={() => !isDone && onToggle(task.id)}
        disabled={isDone || isUpdating}
      >
        {isDone ? "✓" : ""}
      </button>
      <div className="sh-task-info">
        <span className={`sh-task-name ${isDone ? "sh-line-through" : ""}`}>
          {task.name}
        </span>
        {task.priority && (
          <span
            className={`sh-task-priority sh-priority-${task.priority?.toLowerCase()}`}
          >
            {task.priority}
          </span>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════
export function StaffHomePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [updatingTask, setUpdatingTask] = useState(null);
  const [processingReservation, setProcessingReservation] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Data fetching
  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const resp = await fetch("http://localhost:3000/staff/homepage", {
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!resp.ok) throw new Error(`Server error: ${resp.status}`);
      const contentType = resp.headers.get("content-type") || "";
      if (!contentType.includes("application/json"))
        throw new Error("Invalid response format");

      setData(await resp.json());
    } catch (err) {
      console.error("Fetch error:", err);
      if (!silent) setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  // Order status change
  const handleOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrder(orderId);
    try {
      const resp = await fetch(
        "http://localhost:3000/staff/Dashboard/update-order",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            orderId,
            status: newStatus,
          }),
        }
      );
      if (!resp.ok) throw new Error("Failed to update order");
      await fetchData(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdatingOrder(null);
    }
  };

  // Assign table to reservation
  const handleAssignTable = async (reservationId, tableNumber) => {
    if (!tableNumber) return;
    setProcessingReservation(true);
    try {
      const resp = await fetch(
        "http://localhost:3000/staff/Dashboard/allocate-table",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            reservationId: String(reservationId),
            tableNumber: String(tableNumber),
          }),
        }
      );
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.message || err.error || "Failed to assign table");
      }
      await fetchData(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessingReservation(false);
    }
  };

  // Task toggle
  const handleTaskDone = async (taskId) => {
    setUpdatingTask(taskId);
    try {
      const resp = await fetch(
        `http://localhost:3000/staff/tasks/${taskId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: "Done" }),
        }
      );
      if (!resp.ok) throw new Error("Failed to update task");
      await fetchData(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdatingTask(null);
    }
  };

  // Computed data
  const pendingReservations = useMemo(
    () =>
      (data?.reservations || []).filter(
        (r) =>
          !r.allocated &&
          (r.status === "pending" || r.status === "confirmed")
      ),
    [data?.reservations]
  );

  const ordersByStatus = useMemo(() => {
    const groups = { new: [], preparing: [], ready: [] };
    (data?.orders || []).forEach((o) => {
      const s = o.status?.toLowerCase();
      if (s === "pending" || s === "active" || s === "waiting")
        groups.new.push(o);
      else if (s === "preparing") groups.preparing.push(o);
      else if (s === "ready") groups.ready.push(o);
    });
    return groups;
  }, [data?.orders]);

  const pendingTasks = useMemo(
    () => (data?.tasks || []).filter((t) => t.status !== "Done"),
    [data?.tasks]
  );
  const doneTasks = useMemo(
    () => (data?.tasks || []).filter((t) => t.status === "Done"),
    [data?.tasks]
  );

  // ─── Loading State ───
  if (loading) {
    return (
      <div className="sh-loading">
        <div className="sh-spinner"></div>
        <p>Preparing your command center...</p>
      </div>
    );
  }

  // ─── Error State ───
  if (error) {
    return (
      <div className="sh-error">
        <div className="sh-error-icon">⚠️</div>
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => fetchData()} className="sh-retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  const perf = data?.performance || {};
  const stats = data?.tableStats || {};
  const criticalAlerts = (data?.alerts || []).filter(
    (a) => a.severity === "critical"
  );
  const warningAlerts = (data?.alerts || []).filter(
    (a) => a.severity === "warning"
  );

  return (
    <div className="sh-root">
      {/* ─── TOP BAR ─── */}
      <header className="sh-topbar">
        <div className="sh-topbar-left">
          <span className="sh-restaurant-name">
            🍽️ {data?.staff?.branch || "Restaurant"}
          </span>
          <span className="sh-topbar-divider">|</span>
          <span className="sh-live-badge">
            <span className="sh-live-dot"></span> LIVE
          </span>
        </div>
        <div className="sh-topbar-center">
          <span className="sh-clock">
            {currentTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
          <span className="sh-date">
            {currentTime.toLocaleDateString([], {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
        <div className="sh-topbar-right">
          <span className="sh-staff-badge">
            👤 {data?.staff?.name || "Staff"}
          </span>
          <span className="sh-role-badge">
            {data?.staff?.role || "Staff"}
          </span>
          <button
            onClick={() => fetchData(true)}
            className={`sh-refresh-btn ${refreshing ? "sh-spinning" : ""}`}
            title="Refresh"
          >
            🔄
          </button>
        </div>
      </header>

      {/* ─── CRITICAL ALERTS BANNER ─── */}
      {criticalAlerts.length > 0 && (
        <div className="sh-critical-banner">
          <span className="sh-critical-icon">🚨</span>
          <div className="sh-critical-msgs">
            {criticalAlerts.map((a, i) => (
              <span key={i}>{a.message}</span>
            ))}
          </div>
        </div>
      )}

      {/* ─── STATS STRIP ─── */}
      <section className="sh-stats-strip">
        <StatCard
          icon="🍽️"
          label="Active Orders"
          value={data?.orders?.length || 0}
          color="blue"
        />
        <StatCard
          icon="🪑"
          label="Tables Occupied"
          value={`${stats.occupied || 0}/${stats.total || 0}`}
          subtext={`${stats.available || 0} free`}
          color="green"
        />
        <StatCard
          icon="👥"
          label="Guests Dining"
          value={stats.guests || 0}
          color="purple"
        />
        <StatCard
          icon="📅"
          label="Reservations"
          value={pendingReservations.length}
          subtext="pending today"
          color="amber"
        />
        <StatCard
          icon="✅"
          label="Orders Served"
          value={perf.completedOrders || perf.ordersServed || 0}
          subtext={
            perf.totalRevenue
              ? `$${perf.totalRevenue.toFixed(0)} revenue`
              : ""
          }
          color="emerald"
        />
        <StatCard
          icon="⏱️"
          label="Avg Serve Time"
          value={`${perf.avgServeTime || 0}m`}
          subtext={`${perf.efficiencyScore || 0}% on-time`}
          color="rose"
        />
      </section>

      {/* ─── MAIN GRID ─── */}
      <div className="sh-main-grid">
        {/* ─── LEFT: Live Order Queue ─── */}
        <section className="sh-orders-section">
          <div className="sh-section-header">
            <h2>🔥 Live Order Queue</h2>
            <span className="sh-order-count">
              {data?.orders?.length || 0} active
            </span>
          </div>

          {(data?.orders || []).length === 0 ? (
            <div className="sh-empty-state">
              <span className="sh-empty-icon">📋</span>
              <p>No active orders right now</p>
              <span className="sh-empty-sub">
                New orders will appear here automatically
              </span>
            </div>
          ) : (
            <div className="sh-order-columns">
              {/* New Orders */}
              <div className="sh-order-col">
                <div className="sh-col-header sh-col-new">
                  <span
                    className="sh-col-dot"
                    style={{ background: "#f59e0b" }}
                  ></span>
                  New ({ordersByStatus.new.length})
                </div>
                <div className="sh-col-body">
                  {ordersByStatus.new.map((o) => (
                    <OrderCard
                      key={o._id}
                      order={o}
                      onStatusChange={handleOrderStatus}
                      isUpdating={updatingOrder === o._id}
                    />
                  ))}
                </div>
              </div>
              {/* Preparing */}
              <div className="sh-order-col">
                <div className="sh-col-header sh-col-preparing">
                  <span
                    className="sh-col-dot"
                    style={{ background: "#3b82f6" }}
                  ></span>
                  Preparing ({ordersByStatus.preparing.length})
                </div>
                <div className="sh-col-body">
                  {ordersByStatus.preparing.map((o) => (
                    <OrderCard
                      key={o._id}
                      order={o}
                      onStatusChange={handleOrderStatus}
                      isUpdating={updatingOrder === o._id}
                    />
                  ))}
                </div>
              </div>
              {/* Ready to Serve */}
              <div className="sh-order-col">
                <div className="sh-col-header sh-col-ready">
                  <span
                    className="sh-col-dot"
                    style={{ background: "#10b981" }}
                  ></span>
                  Ready ({ordersByStatus.ready.length})
                </div>
                <div className="sh-col-body">
                  {ordersByStatus.ready.map((o) => (
                    <OrderCard
                      key={o._id}
                      order={o}
                      onStatusChange={handleOrderStatus}
                      isUpdating={updatingOrder === o._id}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ─── RIGHT SIDEBAR ─── */}
        <aside className="sh-sidebar">
          {/* Table Map */}
          <div className="sh-card">
            <div className="sh-section-header">
              <h3>🪑 Floor Map</h3>
              <div className="sh-table-legend">
                <span className="sh-legend-item">
                  <span
                    className="sh-legend-dot"
                    style={{ background: "#10b981" }}
                  ></span>
                  Free
                </span>
                <span className="sh-legend-item">
                  <span
                    className="sh-legend-dot"
                    style={{ background: "#3b82f6" }}
                  ></span>
                  Reserved
                </span>
                <span className="sh-legend-item">
                  <span
                    className="sh-legend-dot"
                    style={{ background: "#ef4444" }}
                  ></span>
                  Busy
                </span>
              </div>
            </div>
            <TableMap tables={data?.tables || []} />
          </div>

          {/* Alerts */}
          {warningAlerts.length > 0 && (
            <div className="sh-card sh-alerts-card">
              <h3>⚠️ Alerts ({warningAlerts.length})</h3>
              <div className="sh-alerts-list">
                {warningAlerts.slice(0, 5).map((a, i) => (
                  <AlertItem key={i} alert={a} />
                ))}
              </div>
            </div>
          )}

          {/* Announcements */}
          {(data?.announcements || []).length > 0 && (
            <div className="sh-card">
              <h3>📢 Announcements</h3>
              <div className="sh-announcements">
                {data.announcements.map((a) => (
                  <div
                    key={a.id}
                    className={`sh-announce-item ${
                      a.priority === "high" ? "sh-announce-high" : ""
                    }`}
                  >
                    {a.priority === "high" && (
                      <span className="sh-announce-badge">URGENT</span>
                    )}
                    <p>{a.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ─── BOTTOM GRID ─── */}
      <div className="sh-bottom-grid">
        {/* Reservations */}
        <section className="sh-card sh-reservations-card">
          <div className="sh-section-header">
            <h3>📅 Today's Reservations</h3>
            <span className="sh-badge">
              {(data?.reservations || []).length}
            </span>
          </div>
          {(data?.reservations || []).length === 0 ? (
            <div className="sh-empty-small">No reservations today</div>
          ) : (
            <div className="sh-res-list">
              {(data?.reservations || []).map((r) => (
                <ReservationRow
                  key={r._id}
                  res={r}
                  availableTables={data?.availableTables || []}
                  onAssign={handleAssignTable}
                  isProcessing={processingReservation}
                />
              ))}
            </div>
          )}
        </section>

        {/* My Tasks */}
        <section className="sh-card sh-tasks-card">
          <div className="sh-section-header">
            <h3>✅ My Tasks</h3>
            <span className="sh-badge">{pendingTasks.length} pending</span>
          </div>
          {pendingTasks.length === 0 && doneTasks.length === 0 ? (
            <div className="sh-empty-small">No tasks assigned</div>
          ) : (
            <div className="sh-tasks-list">
              {pendingTasks.map((t) => (
                <TaskItem
                  key={t.id}
                  task={t}
                  onToggle={handleTaskDone}
                  isUpdating={updatingTask === t.id}
                />
              ))}
              {doneTasks.length > 0 && (
                <div className="sh-tasks-done-section">
                  <span className="sh-done-label">
                    Completed ({doneTasks.length})
                  </span>
                  {doneTasks.slice(0, 3).map((t) => (
                    <TaskItem
                      key={t.id}
                      task={t}
                      onToggle={() => {}}
                      isUpdating={false}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Performance */}
        <section className="sh-card sh-perf-card">
          <h3>📊 Today's Performance</h3>
          <div className="sh-perf-grid">
            <div className="sh-perf-item">
              <span className="sh-perf-num">{perf.ordersServed || 0}</span>
              <span className="sh-perf-label">Orders Served</span>
            </div>
            <div className="sh-perf-item">
              <span className="sh-perf-num">
                {perf.avgRating || 0}
                <small>/5</small>
              </span>
              <span className="sh-perf-label">Avg Rating</span>
            </div>
            <div className="sh-perf-item">
              <span className="sh-perf-num">
                {perf.avgServeTime || 0}
                <small>m</small>
              </span>
              <span className="sh-perf-label">Avg Serve Time</span>
            </div>
            <div className="sh-perf-item">
              <span className="sh-perf-num">
                {perf.efficiencyScore || 0}
                <small>%</small>
              </span>
              <span className="sh-perf-label">Efficiency</span>
            </div>
          </div>
          {/* Shift info */}
          {(data?.shifts || []).length > 0 && (
            <div className="sh-shift-info">
              <h4>🕐 Your Shift</h4>
              {data.shifts.map((s) => (
                <div key={s.id} className="sh-shift-row">
                  <span>{s.name}</span>
                  <span className="sh-shift-time">{s.time}</span>
                </div>
              ))}
            </div>
          )}
          {/* Recent Feedback */}
          {(data?.recentFeedback || []).length > 0 && (
            <div className="sh-feedback-section">
              <h4>💬 Recent Feedback</h4>
              {data.recentFeedback.slice(0, 3).map((f, i) => {
                const ratings = [f.diningRating, f.orderRating].filter(r => typeof r === 'number');
                const avgRating = ratings.length > 0 ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;
                return (
                  <div key={i} className="sh-feedback-item">
                    <div className="sh-feedback-header">
                      <span className="sh-feedback-name">{f.customerName}</span>
                      <span className="sh-feedback-rating">
                        {"★".repeat(avgRating || 0)}
                        {"☆".repeat(5 - (avgRating || 0))}
                      </span>
                    </div>
                    {f.feedback && (
                      <p className="sh-feedback-text">"{f.feedback}"</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export async function loader() {
  let role = await isLogin();
  if (role !== "staff") {
    return redirect("/login");
  }
  return null;
}
