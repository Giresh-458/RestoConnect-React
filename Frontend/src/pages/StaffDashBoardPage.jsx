import React, { useEffect, useState } from "react";
import { isLogin, logout } from "../util/auth";
import { redirect, useNavigate } from "react-router-dom";
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    rest_name: '',
    orders: [],
    reservations: [],
    feedback: [],
    inventoryStatus: [],
    availableTables: []
  });
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();
  const [newTable, setNewTable] = useState({ number: "", capacity: "" });
  const [selectedTables, setSelectedTables] = useState({}); // Track selected table for each reservation
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:3000/staff/DashboardData", {
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch dashboard data");
      }

      const json = await response.json();
      setData({
        rest_name: json.rest_name || '',
        orders: json.orders || [],
        reservations: json.reservations || [],
        feedback: json.feedback || [],
        inventoryStatus: json.inventoryStatus || [],
        availableTables: json.availableTables || []
      });
      return json;
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError(err.message || "Failed to load dashboard data. Please refresh the page.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        await fetchData();
      } catch (error) {
        if (isMounted) {
    setError(null);
    try {
      const response = await fetch("http://localhost:3000/staff/DashboardData", {
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch dashboard data");
      }

      const json = await response.json();
      setData({
        rest_name: json.rest_name || '',
        orders: json.orders || [],
        reservations: json.reservations || [],
        feedback: json.feedback || [],
        inventoryStatus: json.inventoryStatus || [],
        availableTables: json.availableTables || []
      });
      return json;
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError(err.message || "Failed to load dashboard data. Please refresh the page.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
=======
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();
  const [newTable, setNewTable] = useState({ number: "", capacity: "" });
  const [selectedTables, setSelectedTables] = useState({}); // Track selected table for each reservation
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:3000/staff/DashboardData", {
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch dashboard data");
      }

      const json = await response.json();
      setData({
        rest_name: json.rest_name || '',
        orders: json.orders || [],
        reservations: json.reservations || [],
        feedback: json.feedback || [],
        inventoryStatus: json.inventoryStatus || [],
        availableTables: json.availableTables || []
      });
      return json;
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError(err.message || "Failed to load dashboard data. Please refresh the page.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
=======
  const [newTable, setNewTable] = useState({ number: "", capacity: "" });
  const [selectedTables, setSelectedTables] = useState({}); // Track selected table for each reservation
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:3000/staff/DashboardData", {
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch dashboard data");
      }
      
      const json = await response.json();
      setData({
        rest_name: json.rest_name || '',
        orders: json.orders || [],
        reservations: json.reservations || [],
        feedback: json.feedback || [],
        inventoryStatus: json.inventoryStatus || [],
        availableTables: json.availableTables || []
      });
      return json;
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError(err.message || "Failed to load dashboard data. Please refresh the page.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
>>>>>>> 15a2ebddacd1b6edf5321ba76b39a6a668a613aa

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        await fetchData();
      } catch (error) {
        if (isMounted) {
          console.error("Error in useEffect:", error);
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, []);

   const handleLogout = async () => {
      try {
         await logout();
      } catch (e) {
         console.error('Logout failed', e);
      }
      navigate('/login');
   };

  const handleOrderDone = async (orderId) => {
    if (!window.confirm("Mark this order as served?")) return;
    
    try {
      const response = await fetch("http://localhost:3000/staff/Dashboard/update-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ orderId, status: "Served" }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to update order");
      }
      
      await fetchData();
      alert("Order marked as served successfully!");
    } catch (err) {
      console.error("Error updating order:", err);
      alert(err.message || "Failed to update order. Please try again.");
    }
  };

  const handleTableSelect = (reservationId, tableNumber) => {
    console.log('Selected table:', { reservationId, tableNumber });
    setSelectedTables(prev => ({
      ...prev,
      [reservationId]: tableNumber
    }));
  };

  const handleAssignTable = async (reservationId) => {
    const tableNumber = selectedTables[reservationId];
    if (!tableNumber) {
      alert('Please select a table first');
      return;
    }
    
    if (!window.confirm(`Assign Table ${tableNumber} to this reservation?`)) return;
    
    try {
      setIsProcessing(true);
      const response = await fetch("http://localhost:3000/staff/Dashboard/allocate-table", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ 
          reservationId: reservationId.toString(), 
          tableNumber: tableNumber.toString() 
        }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to allocate table");
      }
      
      await fetchData();
      alert(`Table ${tableNumber} assigned successfully!`);
      
      // Clear the selected table for this reservation
      setSelectedTables(prev => {
        const newState = {...prev};
        delete newState[reservationId];
        return newState;
      });
    } catch (err) {
      console.error("Error allocating table:", err);
      alert(err.message || "Failed to assign table. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveReservation = async (reservationId) => {
    if (!window.confirm("Are you sure you want to remove this reservation?")) {
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:3000/staff/Dashboard/remove-reservation/${reservationId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Failed to remove reservation");
      }
      // Refresh data after update
      await fetchData();
      alert("Reservation removed and table freed successfully");
    } catch (err) {
      console.error("Error removing reservation:", err);
      alert(err.message || "Failed to remove reservation. Please try again.");
    }
  };

  const handleAddTable = async () => {
    if (!newTable.number || !newTable.capacity) {
      alert("Please enter both table number and capacity");
      return;
    }
    
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const response = await fetch("http://localhost:3000/staff/add-table", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          number: parseInt(newTable.number),
          capacity: parseInt(newTable.capacity),
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to add table");
      }
      
      alert(result.message || "Table added successfully!");
      setNewTable({ number: "", capacity: "" });
      // Refresh data after update
      await fetchData();
    } catch (err) {
      console.error("Error adding table:", err);
      setError(err.message || "Failed to add table. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Render reservations function
  const renderReservations = () => {
    if (!data.reservations || data.reservations.length === 0) {
      return <p>No reservations found.</p>;
    }

    // Get available tables from the data.availableTables array
    const availableTables = Array.isArray(data.availableTables) 
      ? data.availableTables 
      : [];

    return (
      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Reservation Time</th>
            <th>Status</th>
            <th>Assign Table</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.reservations.map((reservation) => (
            <tr key={reservation._id}>
              <td>{reservation.customerName || 'N/A'}</td>
              <td>{reservation.time || 'N/A'}</td>
              <td>{reservation.status}</td>
              <td>
                <select 
                  className="border p-1 rounded"
                  value={selectedTables[reservation._id] || ''}
                  onChange={(e) => handleTableSelect(reservation._id, e.target.value)}
                  disabled={isProcessing}
                >
                  <option value="">Select Table</option>
                  {availableTables.map((table) => (
                    <option key={table.number} value={table.number}>
                      Table {table.number} ({table.seats || 4} seats)
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleAssignTable(reservation._id)}
                  className="bg-blue-500 text-white px-3 py-1 rounded ml-2 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                  disabled={!selectedTables[reservation._id] || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    '👤 Assign'
                  )}
                </button>
              </td>
              <td>
                <button 
                  onClick={() => handleRemoveReservation(reservation._id)}
                  className="text-red-500 hover:text-red-700"
                >
                  ❌
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
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
            <button 
              onClick={handleAddTable} 
              className={`px-4 py-2 rounded text-white ${isProcessing || !newTable.number || !newTable.capacity ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}
              disabled={isProcessing || !newTable.number || !newTable.capacity}
            >
              {isProcessing ? 'Adding...' : 'Add Table'}
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
                  <button onClick={() => handleOrderDone(order._id)}>✔ Done</button>
                  </td>
               </tr>
            ))}
            </tbody>
         </table>
      )}
      </section>

      {/* -------------------- Table Assignments -------------------- */}
      <section className="dashboard-section table-assignments">
        <h2>🍴 Pending Reservations</h2>
        {renderReservations()}
      </section>

      {/* -------------------- Reserved Tables -------------------- */}
      <section className="dashboard-section reserved-tables">
      <h2>🍽️ Reserved Tables</h2>
      {!data.reservations || data.reservations.filter(r => r.allocated).length === 0 ? (
         <p className="text-gray-500">No reserved tables</p>
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
            {data.reservations.filter(r => r.allocated).map((resv) => (
               <tr key={resv._id}>
                  <td>{resv.tables?.join(", ") || "N/A"}</td>
                  <td>{resv.customerName || "N/A"}</td>
                  <td>{resv.time || "N/A"}</td>
                  <td>Reserved</td>
                  <td>
                  <button onClick={() => handleRemoveReservation(resv._id)}>❌ Remove</button>
                  </td>
               </tr>
            ))}
            </tbody>
         </table>
      )}
      </section>

      {/* -------------------- Add Table -------------------- */}
      <section className="dashboard-section add-table">
      <h2>➕ Add New Table</h2>
      <div className="add-table-form">
         <input
            type="number"
            placeholder="Table Number"
            value={newTable.number}
            onChange={(e) => setNewTable({ ...newTable, number: e.target.value })}
         />
         <input
            type="number"
            placeholder="Capacity"
            value={newTable.capacity}
            onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
         />
         <button onClick={handleAddTable}>Add Table</button>
      </div>
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

