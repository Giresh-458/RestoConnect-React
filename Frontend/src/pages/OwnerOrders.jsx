import { useEffect, useState } from "react";
import { isLogin } from "../util/auth";
import { redirect } from "react-router-dom";
import * as api from "../api/ownerApi";
import styles from "./OwnerOrders.module.css";

const STATUS_FLOW = {
  pending: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["served", "cancelled"],
  served: ["completed"],
  completed: [],
  cancelled: [],
  done: ["completed"],
};

const STATUS_COLORS = {
  pending: "#f59e0b",
  preparing: "#3b82f6",
  ready: "#10b981",
  served: "#8b5cf6",
  completed: "#10b981",
  cancelled: "#ef4444",
  done: "#8b5cf6",
};

export function OwnerOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [restInfo, setRestInfo] = useState({ name: "", cuisine: [], isOpen: true, operatingHours: {} });
  const [time] = useState(new Date());

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [data, settings] = await Promise.all([api.fetchOrders(), api.fetchSettings()]);
      setOrders(Array.isArray(data) ? data : []);
      if (settings) setRestInfo({ name: settings.name || "", cuisine: settings.cuisine || [], isOpen: settings.isOpen !== undefined ? settings.isOpen : true, operatingHours: settings.operatingHours || {} });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await api.updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (e) {
      alert("Failed: " + (e.message || "Unknown error"));
    } finally {
      setUpdating(null);
    }
  };

  const fmt = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const statusCounts = orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {});

  if (loading) {
    return <div className={styles.loader}><div className={styles.spinner} /><p>Loading orders...</p></div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroLeft}>
          <h1 className={styles.heroTitle}>🧁 Orders</h1>
          {restInfo.name && <p className={styles.heroRestName}>{restInfo.name}</p>}
          <p className={styles.heroDate}>
            {time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            <span className={styles.heroTime}>{time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
          </p>
        </div>
        <div className={styles.heroRight}>
          <div className={`${styles.statusPill} ${restInfo.isOpen ? styles.statusOpen : styles.statusClosed}`}>
            <span className={styles.statusDot} />
            <span>{restInfo.isOpen ? "OPEN" : "CLOSED"}</span>
            <span className={styles.statusHours}>{restInfo.operatingHours?.open || "09:00"} - {restInfo.operatingHours?.close || "22:00"}</span>
          </div>
          <button className={styles.refreshBtnHero} onClick={load}>↻ Refresh</button>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className={styles.filterBar}>
        <button className={`${styles.filterBtn} ${filter === "all" ? styles.active : ""}`} onClick={() => setFilter("all")}>
          All ({orders.length})
        </button>
        {Object.keys(STATUS_FLOW).map((s) => (
          <button
            key={s}
            className={`${styles.filterBtn} ${filter === s ? styles.active : ""}`}
            style={{ "--filter-color": STATUS_COLORS[s] }}
            onClick={() => setFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)} ({statusCounts[s] || 0})
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className={styles.ordersList}>
        {filtered.length === 0 && <p className={styles.empty}>No orders found</p>}
        {filtered.map((order) => {
          const isExpanded = expandedOrder === order._id;
          const nextStatuses = STATUS_FLOW[order.status] || [];
          const dishes = order.dishDetails || order.dishes || [];
          const subtotal = dishes.reduce((sum, d) => sum + (d.price || 0) * (d.quantity || 1), 0);
          const taxRate = order.taxRate || 10;
          const tax = order.taxAmount || subtotal * (taxRate / 100);
          const total = order.totalAmount || subtotal + tax;

          return (
            <div key={order._id} className={styles.orderCard}>
              <div className={styles.orderRow} onClick={() => setExpandedOrder(isExpanded ? null : order._id)}>
                <div className={styles.orderMain}>
                  <span className={styles.orderCustomer}>{order.customerName}</span>
                  <span className={styles.orderMeta}>Table {order.tableNumber || "N/A"}</span>
                  <span className={styles.orderMeta}>{new Date(order.date || order.createdAt).toLocaleString()}</span>
                </div>
                <div className={styles.orderRight}>
                  <span className={styles.orderTotal}>{fmt(total)}</span>
                  <span className={styles.badge} style={{ background: STATUS_COLORS[order.status] + "20", color: STATUS_COLORS[order.status] }}>
                    {order.status}
                  </span>
                  <span className={styles.expandIcon}>{isExpanded ? "▲" : "▼"}</span>
                </div>
              </div>

              {isExpanded && (
                <div className={styles.expandedContent}>
                  {/* Dish Items */}
                  {dishes.length > 0 && (
                    <div className={styles.dishList}>
                      <h4>Items</h4>
                      {dishes.map((d, i) => (
                        <div key={i} className={styles.dishRow}>
                          <span>{d.name || "Unknown Dish"}{(d.quantity || 1) > 1 ? ` × ${d.quantity}` : ""}</span>
                          <span>{fmt((d.price || 0) * (d.quantity || 1))}</span>
                        </div>
                      ))}
                      <div className={styles.totalRow}>
                        <span>Subtotal</span><span>{fmt(subtotal)}</span>
                      </div>
                      <div className={styles.totalRow}>
                        <span>Tax ({taxRate}%)</span><span>{fmt(tax)}</span>
                      </div>
                      <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                        <span>Total</span><span>{fmt(total)}</span>
                      </div>
                    </div>
                  )}

                  {/* Order Details */}
                  <div className={styles.detailsGrid}>
                    {order.paymentStatus && (
                      <div className={styles.detail}>
                        <span className={styles.detailLabel}>Payment</span>
                        <span className={`${styles.payBadge} ${styles["pay_" + order.paymentStatus]}`}>{order.paymentStatus}</span>
                      </div>
                    )}
                    {order.estimatedTime && (
                      <div className={styles.detail}>
                        <span className={styles.detailLabel}>Est. Time</span>
                        <span>{order.estimatedTime} min</span>
                      </div>
                    )}
                    {order.promoCode && (
                      <div className={styles.detail}>
                        <span className={styles.detailLabel}>Promo</span>
                        <span>{order.promoCode} (-{fmt(order.promoDiscount)})</span>
                      </div>
                    )}
                  </div>

                  {/* Status Actions */}
                  {nextStatuses.length > 0 && (
                    <div className={styles.statusActions}>
                      <span className={styles.actionLabel}>Update Status:</span>
                      {nextStatuses.map((ns) => (
                        <button
                          key={ns}
                          className={styles.statusAction}
                          style={{ "--action-color": STATUS_COLORS[ns] }}
                          onClick={() => handleStatusChange(order._id, ns)}
                          disabled={updating === order._id}
                        >
                          {updating === order._id ? "..." : ns === "cancelled" ? "✕ Cancel" : `→ ${ns.charAt(0).toUpperCase() + ns.slice(1)}`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export async function loader() {
  const role = await isLogin();
  if (role !== "owner") return redirect("/login");
  return null;
}
