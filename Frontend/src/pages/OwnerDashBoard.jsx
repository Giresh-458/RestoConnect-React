import { useEffect, useState } from "react";
import { isLogin } from "../util/auth";
import { redirect } from "react-router-dom";
import { Reports } from "../components/OwnerReports";
import { Inventory } from "../components/Inventory";

export function OwnerDashBoard() {
  const [activeTab, setActiveTab] = useState("reports");

  return (
    <div className="owner-dashboard">
      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === "reports" ? "active" : ""}`}
          onClick={() => setActiveTab("reports")}
        >
          Reports
        </button>
        <button
          className={`tab-button ${activeTab === "inventory" ? "active" : ""}`}
          onClick={() => setActiveTab("inventory")}
        >
          Inventory
        </button>
      </div>

      <div className="dashboard-content">
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
