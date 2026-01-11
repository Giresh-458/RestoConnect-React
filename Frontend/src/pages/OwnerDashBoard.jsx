import { useState } from "react";
import { isLogin } from "../util/auth";
import { redirect } from "react-router-dom";

import styles from "./OwnerDashBoard.module.css";

import { Reports } from "../components/OwnerReports";
import { OwnerManagement } from "./OwnerManagement";
import { OwnerOrders } from "./OwnerOrders";
import { OwnerReservations } from "./OwnerReservations";
import { InventoryManagement } from "./InventoryManagement";
import { FeedBackPage } from "./FeedBackPage";

export function OwnerDashBoard() {
  const [activeTab, setActiveTab] = useState("reports");

  return (
    <div className={styles.ownerDashboard}>
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
