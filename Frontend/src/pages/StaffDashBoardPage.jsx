import React, { useEffect, useState } from "react";
import { isLogin } from "../util/auth";
import { redirect } from "react-router-dom";
import "./StaffDashBoardPage.css";
import {
  FaUtensils,
  FaCog,
  FaSignOutAlt,
  FaMapMarkerAlt,
  FaSmile,
  FaBoxes,
} from "react-icons/fa";

export function StaffDashBoardPage() {
  const [data, setData] = useState({});
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("http://localhost:3000/staff/DashboardData", {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch staff dashboard data");
        const json = await response.json();
        setData(json);
        console.log("Dashboard Data Received:", json);

      } catch (err) {
        console.error("Error loading dashboard data:", err);
      }
    }
    fetchData();
  }, []);

  const handleLogout = () => {
    window.location.href = "http://localhost:3000/logout";
  };

  // 🟡 Compute stats safely
  const activeOrders = data.orders?.filter((o) => o.status !== "completed").length || 0;
  const occupiedTables = data.reservations?.filter((r) => r.status === "confirmed").length || 0;

  // ✅ Build inventory summary from backend inventory array
  const inventoryItems = data.inventoryStatus || [];

  // Use quantityValue (numeric) and minStock for proper comparison
  const lowStockCount = inventoryItems.filter((i) => {
    const qty = (i.quantityValue ?? parseFloat(i.quantity)) || 0;
    const min = i.minStock ?? 0;
    return qty <= min && qty > 0;
  }).length;

  return (
    <div className="staff-dashboard min-h-screen p-6 bg-blue-50">
      {/* -------------------- Navbar -------------------- */}

      <nav className="dashboard-navbar">
      <div className="nav-left">
         <FaUtensils className="nav-icon" />
         <h1>RestoConnect Staff Dashboard</h1>
      </div>

      <div className="nav-right">
         <button
            onClick={() => setShowSettings(!showSettings)}
            className="settings-btn"
         >
            <FaCog /> Settings
         </button>
         <button onClick={handleLogout} className="logout-btn">
            <FaSignOutAlt /> Logout
         </button>
      </div>
      </nav>

      {/* -------------------- Settings Modal -------------------- */}
      {showSettings && (
        <div className="absolute top-20 right-10 bg-white shadow-lg rounded-xl p-4 w-80 z-50 border">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FaCog className="text-blue-500" /> Settings
          </h2>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Old Password
          </label>
          <input
            type="password"
            className="w-full border px-3 py-2 rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Enter old password"
          />
          <label className="block mb-2 text-sm font-medium text-gray-700">
            New Password
          </label>
          <input
            type="password"
            className="w-full border px-3 py-2 rounded-md mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Enter new password"
          />
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Close
            </button>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
              Save
            </button>
          </div>
        </div>
      )}

      {/* -------------------- Welcome Line -------------------- */}
      <div className="welcome-card">
      <span className="welcome-text">
         👋 Welcome, <strong>Staff Member!</strong>
      </span>
      <span className="branch-text">
         📍 Branch: <strong>{data.rest_name || "Tasty Bites"}</strong>
      </span>
      </div>

      {/* -------------------- Summary Blocks -------------------- */}
      <div className="summary-grid">
      <div className="summary-card blue">
         <h3>Active Orders</h3>
         <p>{activeOrders}</p>
      </div>
      <div className="summary-card green">
         <h3>Tables Occupied</h3>
         <p>{occupiedTables}</p>
      </div>
      <div className="summary-card yellow">
         <h3>Low Stock</h3>
         <p>{lowStockCount}</p>
      </div>
      <div className="summary-card red">
         <h3>Pending Tasks</h3>
         <p>{data.orders?.filter((o) => o.status === "pending").length || 0}</p>
      </div>
      </div>


            {/* -------------------- Active Orders -------------------- */}
      <section className="dashboard-section active-orders">
      <h2>🍽️ Active Orders</h2>
      {!data.orders || data.orders.length === 0 ? (
         <p className="text-gray-500">No active orders</p>
      ) : (
         <table>
            <thead>
            <tr>
               <th>Order ID</th>
               <th>Table</th>
               <th>Items</th>
               <th>Status</th>
               <th>Action</th>
            </tr>
            </thead>
            <tbody>
            {data.orders.map((order) => (
               <tr key={order._id}>
                  <td>#{order._id.slice(-4)}</td>
                  <td>{order.table_id || "N/A"}</td>
                  <td>{order.dishes?.join(", ")}</td>
                  <td
                  className={
                     order.status === "Cooking"
                        ? "status-cooking"
                        : order.status === "Served"
                        ? "status-served"
                        : ""
                  }
                  >
                  {order.status}
                  </td>
                  <td>
                  <button>✔ Done</button>
                  </td>
               </tr>
            ))}
            </tbody>
         </table>
      )}
      </section>

      {/* -------------------- Table Assignments -------------------- */}
      <section className="dashboard-section table-assignments">
      <h2>🍴 Table Assignments</h2>
      {!data.reservations || data.reservations.length === 0 ? (
         <p className="text-gray-500">No table assignments available</p>
      ) : (
         <table>
            <thead>
            <tr>
               <th>Table</th>
               <th>Customer</th>
               <th>Reservation Time</th>
               <th>Status</th>
               <th>Action</th>
            </tr>
            </thead>
            <tbody>
            {data.reservations.map((resv, idx) => (
               <tr key={idx}>
                  <td>{resv.table_id || "N/A"}</td>
                  <td>{resv.customerName || "N/A"}</td>
                  <td>{resv.time || "N/A"}</td>
                  <td>{resv.status}</td>
                  <td>
                  <button>👤 Assign</button>
                  </td>
               </tr>
            ))}
            </tbody>
         </table>
      )}
      </section>


      {/* -------------------- Inventory Status -------------------- */}
      <section className="dashboard-section inventory-status">
      <h2>📦 Inventory Status</h2>

      {!inventoryItems || inventoryItems.length === 0 ? (
         <p className="text-gray-500">No inventory data found.</p>
      ) : (
         <table>
            <thead>
            <tr>
               <th>Item</th>
               <th>Quantity</th>
               <th>Status</th>
            </tr>
            </thead>
            <tbody>
            {inventoryItems.map((inv, idx) => (
               <tr key={idx}>
                  <td className="font-medium">{inv.item}</td>
                  <td>{inv.quantity}</td>
                  <td>
                  <span
                     className={`status-badge ${
                        inv.status === "Out of Stock"
                        ? "badge-red"
                        : inv.status === "Low Stock"
                        ? "badge-yellow"
                        : "badge-green"
                     }`}
                  >
                     {inv.status}
                  </span>
                  </td>
               </tr>
            ))}
            </tbody>
         </table>
      )}
      </section>


      {/* -------------------- Customer Feedback -------------------- */}
      <section className="dashboard-section customer-feedback">
      <h2>💬 Customer Feedback</h2>
      {!data.feedback || data.feedback.length === 0 ? (
         <p className="text-gray-500">No feedback found</p>
      ) : (
         <div className="feedback-list">
            {data.feedback.map((f, idx) => (
            <div key={idx} className="feedback-item">
               ⭐ “{f.additionalFeedback}” — <b>{f.customerName}</b>
            </div>
            ))}
         </div>
      )}
      </section>

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

