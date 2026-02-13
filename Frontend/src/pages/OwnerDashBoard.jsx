import { useEffect, useMemo, useState } from "react";
import { isLogin } from "../util/auth";
import { redirect, useNavigate } from "react-router-dom";

import styles from "./OwnerDashBoard.module.css";

import { Reports } from "../components/OwnerReports";
import { OwnerManagement } from "./OwnerManagement";
import { OwnerOrders } from "./OwnerOrders";
import { OwnerReservations } from "./OwnerReservations";
import { InventoryManagement } from "./InventoryManagement";
import { FeedBackPage } from "./FeedBackPage";

export function OwnerDashBoard() {
  const [activeTab, setActiveTab] = useState("reports");
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [insightsError, setInsightsError] = useState("");
  const navigate = useNavigate();

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError("");
      const response = await fetch("http://localhost:3000/api/owner/dashboard/summary", {
        credentials: "include",
      });
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok) {
        throw new Error("Failed to load dashboard stats");
      }
      if (!contentType.includes("application/json")) {
        const fallbackText = await response.text();
        throw new Error(
          "Unexpected response from server. Please check authentication and API routing."
        );
      }
      const data = await response.json();
      setStats(data.stats || null);
      setOwnerInfo({ restaurantName: data.restaurantName });
      setRecentOrders(data.recentOrders || []);
      setReservations(data.upcomingReservations || []);
      setInventory(data.lowStockItems || []);
      // Store alerts in stats for easier access
      if (data.alerts) {
        setStats(prev => ({ ...prev, alerts: data.alerts }));
      }
      setLastUpdated(new Date());
    } catch (err) {
      setStatsError(err?.message || "Unable to load stats");
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const statCards = useMemo(() => {
    return [
      {
        label: "Revenue (Month)",
        value: `₹${stats?.totalRevenueThisMonth?.toLocaleString() ?? 0}`,
        icon: "₹",
        helper: "Total this month",
        trend: stats?.totalRevenueToday > 0 ? `+₹${stats.totalRevenueToday} today` : null
      },
      {
        label: "Orders Today",
        value: stats?.ordersToday ?? 0,
        icon: "🧾",
        helper: `${stats?.pendingOrders ?? 0} pending`,
        trend: stats?.completedOrdersToday > 0 ? `${stats.completedOrdersToday} completed` : null
      },
      {
        label: "Table Occupancy",
        value: `${stats?.tableOccupancy ?? 0}%`,
        icon: "🪑",
        helper: `${stats?.occupiedTables ?? 0}/${stats?.totalTables ?? 0} tables`,
        trend: null
      },
      {
        label: "Avg Order Value",
        value: `₹${stats?.avgOrderValue?.toLocaleString() ?? 0}`,
        icon: "💰",
        helper: "Per order",
        trend: null
      },
      {
        label: "Active Staff",
        value: stats?.activeStaff ?? 0,
        icon: "👥",
        helper: "Currently on shift",
        trend: null
      },
      {
        label: "Customer Rating",
        value: stats?.avgRating?.toFixed(1) ?? "N/A",
        icon: "⭐",
        helper: "Average rating",
        trend: null
      },
    ];
  }, [stats]);

  const lowStockItems = useMemo(() => inventory, [inventory]);

  const upcomingReservations = useMemo(() => {
    const now = new Date();
    return reservations
      .filter((r) => new Date(r.date) >= now)
      .slice(0, 6);
  }, [reservations]);

  return (
    <div className={styles.ownerDashboard}>
      <header className={styles.dashboardHeader}>
        <div className={styles.headerText}>
          <p className={styles.headerEyebrow}>Owner Portal</p>
          <h1 className={styles.headerTitle}>
            {ownerInfo?.restaurantName ? `${ownerInfo.restaurantName} Overview` : "Dashboard Overview"}
          </h1>
          <p className={styles.headerSubtitle}>
            Track performance, manage operations, and act on insights in one place.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.refreshButton} onClick={loadStats} disabled={statsLoading}>
            {statsLoading ? "Refreshing…" : "Refresh"}
          </button>
          <button className={styles.primaryButton} onClick={() => navigate("/owner/menumanagement")}
          >
            Manage Menu
          </button>
        </div>
      </header>

      <section className={styles.statsSection}>
        <div className={styles.statsHeader}>
          <h2 className={styles.sectionTitle}>Today at a glance</h2>
          <span className={styles.sectionMeta}>
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Fetching latest data"}
          </span>
        </div>
        {statsError ? (
          <div className={styles.errorBanner}>{statsError}</div>
        ) : (
          <div className={styles.statsGrid}>
            {statCards.map((card) => (
              <div key={card.label} className={styles.statCard}>
                <div>
                  <div className={styles.statIcon}>{card.icon}</div>
                  <div>
                    <p className={styles.statLabel}>{card.label}</p>
                    <p className={styles.statValue}>{card.value}</p>
                    <p className={styles.statHelper}>{card.helper}</p>
                  </div>
                </div>
                {card.trend && <p className={styles.statTrend}>{card.trend}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.insightsSection}>
        <div className={styles.statsHeader}>
          <h2 className={styles.sectionTitle}>Operations insights</h2>
          <span className={styles.sectionMeta}>Live operational signals</span>
        </div>
        {insightsError ? (
          <div className={styles.errorBanner}>{insightsError}</div>
        ) : (
          <>
            {stats?.alerts && stats.alerts.length > 0 && (
              <div className={styles.alertsRow}>
                {stats.alerts.map((alert, idx) => (
                  <div key={idx} className={`${styles.alertCard} ${styles[alert.type]}`}>
                    <span className={styles.alertIcon}>
                      {alert.type === 'critical' ? '🚨' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}
                    </span>
                    <span className={styles.alertMessage}>{alert.message}</span>
                    <button 
                      className={styles.alertAction} 
                      onClick={() => setActiveTab(alert.action)}
                    >
                      View →
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className={styles.insightsGrid}>
              <div className={styles.insightCard}>
                <div className={styles.insightHeader}>
                  <h3>Recent orders</h3>
                  <button className={styles.linkButton} onClick={() => setActiveTab("orders")}>View all</button>
                </div>
                <ul className={styles.list}>
                  {recentOrders.slice(0, 5).map((order) => (
                    <li key={order.id} className={styles.listItem}>
                      <div>
                        <p className={styles.listTitle}>{order.orderId} · {order.customerName}</p>
                        <p className={styles.listMeta}>Table {order.tableNumber} · ₹{order.totalAmount}</p>
                      </div>
                      <span className={`${styles.statusBadge} ${styles[order.status]}`}>{order.status}</span>
                    </li>
                  ))}
                  {!recentOrders.length && <li className={styles.emptyState}>No recent orders</li>}
                </ul>
              </div>

              <div className={styles.insightCard}>
                <div className={styles.insightHeader}>
                  <h3>Upcoming reservations</h3>
                  <button className={styles.linkButton} onClick={() => setActiveTab("reservations")}>View all</button>
                </div>
                <ul className={styles.list}>
                  {reservations.map((reservation) => (
                    <li key={reservation._id} className={styles.listItem}>
                      <div>
                        <p className={styles.listTitle}>{reservation.customerName}</p>
                        <p className={styles.listMeta}>
                          {new Date(reservation.date).toLocaleDateString()} · {reservation.time} · {reservation.guests} guests
                        </p>
                      </div>
                      <span className={`${styles.statusBadge} ${styles[reservation.status]}`}>{reservation.status}</span>
                    </li>
                  ))}
                  {!reservations.length && <li className={styles.emptyState}>No upcoming reservations</li>}
                </ul>
              </div>

              <div className={styles.insightCard}>
                <div className={styles.insightHeader}>
                  <h3>Low stock alerts</h3>
                  <button className={styles.linkButton} onClick={() => setActiveTab("inventory")}>Manage</button>
                </div>
                <ul className={styles.list}>
                  {lowStockItems.slice(0, 5).map((item, idx) => (
                    <li key={idx} className={styles.listItem}>
                      <div>
                        <p className={styles.listTitle}>{item.name}</p>
                        <p className={styles.listMeta}>Remaining {item.quantity} {item.unit}</p>
                      </div>
                      <span className={styles.alertBadgeSmall}>Low</span>
                    </li>
                  ))}
                  {!lowStockItems.length && <li className={styles.emptyState}>Inventory looks healthy ✓</li>}
                </ul>
              </div>
            </div>
          </>
        )}
      </section>

      <section className={styles.quickActions}>
        <h2 className={styles.sectionTitle}>Quick actions</h2>
        <div className={styles.actionsGrid}>
          <button className={styles.actionCard} onClick={() => setActiveTab("orders")}>
            <span>🧾 Orders</span>
            <p>Review incoming orders and status updates.</p>
          </button>
          <button className={styles.actionCard} onClick={() => setActiveTab("reservations")}>
            <span>📅 Reservations</span>
            <p>Confirm bookings and adjust seating.</p>
          </button>
          <button className={styles.actionCard} onClick={() => setActiveTab("inventory")}>
            <span>📦 Inventory</span>
            <p>Track stock levels and reorder needs.</p>
          </button>
          <button className={styles.actionCard} onClick={() => setActiveTab("feedback")}>
            <span>⭐ Feedback</span>
            <p>Respond to recent guest feedback quickly.</p>
          </button>
        </div>
      </section>

      <div className={styles.dashboardTabs}>
        <button
          className={`${styles.tabButton} ${
            activeTab === "reports" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("reports")}
        >
          Reports
        </button>

        <button
          className={`${styles.tabButton} ${
            activeTab === "management" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("management")}
        >
          Management
        </button>

        <button
          className={`${styles.tabButton} ${
            activeTab === "orders" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("orders")}
        >
          Orders
        </button>

        <button
          className={`${styles.tabButton} ${
            activeTab === "reservations" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("reservations")}
        >
          Reservations
        </button>

        <button
          className={`${styles.tabButton} ${
            activeTab === "feedback" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("feedback")}
        >
          Feedback
        </button>

        <button
          className={`${styles.tabButton} ${
            activeTab === "inventory" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("inventory")}
        >
          Inventory
        </button>
      </div>

      <div className={styles.dashboardContent}>
        {activeTab === "reports" && <Reports />}
        {activeTab === "management" && <OwnerManagement />}
        {activeTab === "orders" && <OwnerOrders />}
        {activeTab === "reservations" && <OwnerReservations />}
        {activeTab === "feedback" && <FeedBackPage mode="owner" />}
        {activeTab === "inventory" && (
          <InventoryManagement onInventoryChange={loadStats} />
        )}
      </div>
    </div>
  );
}

export async function loader() {
  const role = await isLogin();
  if (role !== "owner") {
    return redirect("/login");
  }
  return null;
}
