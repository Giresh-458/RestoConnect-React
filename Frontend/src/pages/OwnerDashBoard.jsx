import { useEffect, useState } from "react";
import { isLogin } from "../util/auth";
import { redirect } from "react-router-dom";
import { Reports } from "../components/OwnerReports";
import { Inventory } from "../components/Inventory";
import styles from "./OwnerDashBoard.module.css";

export function OwnerDashBoard() {
  const [activeTab, setActiveTab] = useState("reports");

  return (
    <div className={styles.ownerDashboard}>
      <div className={styles.dashboardTabs}>
        <button
          className={`${styles.tabButton} ${activeTab === "reports" ? styles.active : ""}`}
          onClick={() => setActiveTab("reports")}
        >
          Reports
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "inventory" ? styles.active : ""}`}
          onClick={() => setActiveTab("inventory")}
        >
          Inventory
        </button>
      </div>

      <div className={styles.dashboardContent}>
        {activeTab === "reports" && <Reports />}
        {activeTab === "inventory" && <Inventory />}
      </div>
    </div>
  );
}

export async function loader() {
  let role = await isLogin();
  if (role != 'owner') {
    return redirect('/login');
  }
}
