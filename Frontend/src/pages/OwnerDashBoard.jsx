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
  const navigate = useNavigate();

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError("");
      const response = await fetch("/api/owner/dashboard/stats");
      if (!response.ok) {
        throw new Error("Failed to load dashboard stats");
      }
      const data = await response.json();
      setStats(data);
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
        value: stats?.totalRevenueThisMonth ?? 0,
        icon: "₹",
        helper: "Net sales this month",
      },
      {
        label: "Orders Today",
        value: stats?.ordersToday ?? 0,
        icon: "🧾",
        helper: "All channels",
      },
      {
        label: "Active Staff",
        value: stats?.activeStaff ?? 0,
        icon: "👥",
        helper: "Currently on shift",
      },
      {
        label: "Stock Status",
        value: stats?.stockStatus ?? 0,
        icon: "📦",
        helper: "Items at/near min",
      },
    ];
  }, [stats]);

  return (
    <div className={styles.ownerDashboard}>
      <header className={styles.dashboardHeader}>
        <div className={styles.headerText}>
          <p className={styles.headerEyebrow}>Owner Portal</p>
          <h1 className={styles.headerTitle}>Dashboard Overview</h1>
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
                <div className={styles.statIcon}>{card.icon}</div>
                <div>
                  <p className={styles.statLabel}>{card.label}</p>
                  <p className={styles.statValue}>{card.value}</p>
                  <p className={styles.statHelper}>{card.helper}</p>
                </div>
              </div>
            ))}
          </div>
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
        {activeTab === "inventory" && <InventoryManagement />}
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
