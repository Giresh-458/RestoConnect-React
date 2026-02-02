import React, { useEffect, useState } from "react";
import { isLogin, logout } from "../util/auth";
import { redirect, useNavigate } from "react-router-dom";
import "./StaffDashBoardPage.css";
import {
  FaUtensils,
  FaCog,
  FaSignOutAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUsers,
  FaChair,
  FaClipboardList,
  FaBell,
  FaPlay,
  FaPause,
  FaConciergeBell,
  FaCalendarCheck,
  FaTasks,
  FaWarehouse
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
    availableTables: [],
    allTables: [],
    staffTasks: []
  });
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const [selectedTables, setSelectedTables] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [newTable, setNewTable] = useState({ number: '', capacity: '' });
  const [passwords, setPasswords] = useState({ old: '', new: '' });
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

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
        availableTables: json.availableTables || [],
        allTables: json.allTables || [],
        staffTasks: json.staffTasks || []
      });
      return json;
    } catch (err) {
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

  const handlePasswordChange = async () => {
    if (!passwords.old || !passwords.new) {
      alert('Please fill in both password fields');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:3000/staff/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwords.old,
          newPassword: passwords.new
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change password');
      }
      
      const result = await response.json();
      alert(result.message || 'Password changed successfully!');
      setPasswords({ old: '', new: '' });
      setShowSettings(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleTaskComplete = async (taskId) => {
    try {
      const response = await fetch(`http://localhost:3000/staff/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'Done' })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update task');
      }
      
      const result = await response.json();
      await fetchData();
      alert(result.message || 'Task marked as completed!');
    } catch (err) {
      alert(err.message || 'Failed to complete task');
    }
  };

  const handleOrderDone = async (orderId) => {
    if (!window.confirm("Mark this order as done?")) return;

    try {
      const response = await fetch("http://localhost:3000/staff/Dashboard/update-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ orderId, status: "done" }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to update order");
      }

      await fetchData();
      alert("Order marked as done successfully!");
    } catch (err) {
      console.error("Error updating order:", err);
      alert(err.message || "Failed to update order. Please try again.");
    }
  };

  const handleTableSelect = (reservationId, tableNumber) => {
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
      alert(err.message || "Failed to add table. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Render reservations function
  const renderReservations = () => {
    // Filter for pending reservations (not yet allocated to a table)
    const pendingReservations = data.reservations?.filter(r => {
      // Show reservations that are NOT allocated (no table assigned yet)
      return !r.allocated && (r.status === 'pending' || r.status === 'confirmed');
    }) || [];
    
    console.log('🔍 Rendering pending reservations:', {
      total: data.reservations?.length || 0,
      pending: pendingReservations.length,
      allocated: data.reservations?.filter(r => r.allocated).length || 0,
      pendingList: pendingReservations.map(r => ({
        id: r._id,
        customer: r.customerName,
        status: r.status,
        allocated: r.allocated,
        table: r.table_id
      }))
    });
    
    if (pendingReservations.length === 0) {
      return <p>No reservations found.</p>;
    }

    // Get available tables from the data.availableTables array
    const availableTables = Array.isArray(data.availableTables) 
      ? data.availableTables 
      : [];

    // Removed console.log for available tables

    return (
      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Reservation Time</th>
            <th>Guests</th>
            <th>Status</th>
            <th>Assign Table</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {pendingReservations.map((reservation) => (
            <tr key={reservation._id}>
              <td>{reservation.customerName || 'N/A'}</td>
              <td>{new Date(reservation.time).toLocaleString() || reservation.time || 'N/A'}</td>
              <td>{reservation.guests || 'N/A'}</td>
              <td>
                <span className="status-badge status-pending">
                  {reservation.status || 'Pending'}
                </span>
              </td>
              <td>
                {availableTables.length === 0 ? (
                  <span className="text-gray-500 text-sm">No tables available. Add tables in settings.</span>
                ) : (
                  <>
                    <select 
                      className="border p-1 rounded"
                      value={selectedTables[reservation._id] || ''}
                      onChange={(e) => handleTableSelect(reservation._id, e.target.value)}
                      disabled={isProcessing}
                    >
                      <option value="">Select Table</option>
                      {availableTables.map((table) => (
                        <option key={table.number} value={String(table.number)}>
                          Table {table.number} ({table.seats || 4} seats)
                        </option>
                      ))}
                    </select>
                  </>
                )}
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
  const today = new Date();
  const todayString = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  console.log('🔍 Filtering active orders - Today:', todayString);

  const activeOrdersList = data.orders?.filter((o) => {
    const orderDate = new Date(o.date);
    const orderDateString = orderDate.getFullYear() + '-' + String(orderDate.getMonth() + 1).padStart(2, '0') + '-' + String(orderDate.getDate()).padStart(2, '0');
    const isActiveStatus = o.status === "active" || o.status === "waiting" || o.status === "pending";
    const isToday = orderDateString === todayString;

    console.log(`📋 Order ${o._id?.slice(-4)}: status="${o.status}", date="${o.date}", orderDateString="${orderDateString}", isActiveStatus=${isActiveStatus}, isToday=${isToday}, include=${isActiveStatus && isToday}`);

    return isActiveStatus && isToday;
  }) || [];

  console.log(`✅ Filtered ${activeOrdersList.length} active orders out of ${data.orders?.length || 0} total orders`);
  console.log('📊 Active orders:', activeOrdersList.map(o => ({ id: o._id?.slice(-4), status: o.status, date: o.date })));
  
  
  const activeOrders = activeOrdersList.length;
  
  const occupiedTables = data.allTables?.filter((t) => t.status && t.status.toLowerCase() !== "available").length || 0;

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
        <div className="settings-modal">
          <div className="settings-content">
            <h2>
              <FaCog /> Change Password
            </h2>
            <label>Old Password</label>
            <input
              type="password"
              value={passwords.old}
              onChange={(e) => setPasswords({...passwords, old: e.target.value})}
              placeholder="Enter old password"
            />
            <label>New Password</label>
            <input
              type="password"
              value={passwords.new}
              onChange={(e) => setPasswords({...passwords, new: e.target.value})}
              placeholder="Enter new password"
            />
            <div className="settings-actions">
              <button
                onClick={() => setShowSettings(false)}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button 
                onClick={handlePasswordChange}
                className="btn-save"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- Welcome & Tabs -------------------- */}
      <div className="welcome-section">
        <div className="welcome-card">
          <span className="welcome-text">
            👋 Welcome, <strong>Staff Member!</strong>
          </span>
          <span className="branch-text">
            📍 Branch: <strong>{data.rest_name || "Tasty Bites"}</strong>
          </span>
        </div>
        
        <div className="dashboard-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            🍽️ Orders
          </button>
          <button 
            className={`tab-btn ${activeTab === 'reservations' ? 'active' : ''}`}
            onClick={() => setActiveTab('reservations')}
          >
            📅 Reservations
          </button>
          <button 
            className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            ✅ My Tasks
          </button>
          <button 
            className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            📦 Inventory
          </button>
        </div>
      </div>

      {/* -------------------- Summary Blocks -------------------- */}
      {activeTab === 'overview' && (
        <>
          <div className="summary-grid">
            <div className="summary-card blue">
              <div className="card-icon">🍽️</div>
              <div className="card-content">
                <h3>Active Orders</h3>
                <p>{activeOrders}</p>
              </div>
            </div>
            <div className="summary-card green">
              <div className="card-icon">🪑</div>
              <div className="card-content">
                <h3>Tables Occupied</h3>
                <p>{occupiedTables}</p>
              </div>
            </div>
            <div className="summary-card yellow">
              <div className="card-icon">⚠️</div>
              <div className="card-content">
                <h3>Low Stock Items</h3>
                <p>{lowStockCount}</p>
              </div>
            </div>
            <div className="summary-card red">
              <div className="card-icon">✅</div>
              <div className="card-content">
                <h3>Pending Tasks</h3>
                <p>{data.staffTasks.filter(task => task.status === "Pending").length}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <section className="dashboard-section quick-actions">
            <h2>⚡ Quick Actions</h2>
            <div className="action-grid">
              <button className="action-btn" onClick={() => setActiveTab('orders')}>
                <span className="action-icon">🍽️</span>
                <span>View Active Orders</span>
              </button>
              <button className="action-btn" onClick={() => setActiveTab('reservations')}>
                <span className="action-icon">📅</span>
                <span>Manage Reservations</span>
              </button>
              <button className="action-btn" onClick={() => setActiveTab('tasks')}>
                <span className="action-icon">✅</span>
                <span>Check My Tasks</span>
              </button>
              <button className="action-btn" onClick={() => setActiveTab('inventory')}>
                <span className="action-icon">📦</span>
                <span>View Inventory</span>
              </button>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="dashboard-section recent-activity">
            <h2>🕒 Recent Activity</h2>
            <div className="activity-list">
              {data.feedback && data.feedback.length > 0 ? (
                data.feedback.slice(0, 3).map((f, idx) => (
                  <div key={idx} className="activity-item">
                    <span className="activity-icon">💬</span>
                    <div className="activity-content">
                      <p className="activity-text">"{f.additionalFeedback}"</p>
                      <span className="activity-meta">— {f.customerName}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No recent feedback</p>
              )}
            </div>
          </section>
        </>
      )}


      {/* -------------------- Active Orders Tab -------------------- */}
      {activeTab === 'orders' && (
        <section className="dashboard-section active-orders">
          <h2>🍽️ Active Orders</h2>
          {activeOrdersList.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📋</span>
              <p>No active orders at the moment</p>
            </div>
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
                {activeOrdersList.map((order) => (
                  <tr key={order._id}>
                    <td>#{order._id.slice(-4)}</td>
                    <td>{order.table_id || "N/A"}</td>
                    <td>{order.dishes?.join(", ")}</td>
                    <td>
                      <span className={`status-badge status-${order.status?.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="action-btn-small"
                        onClick={() => handleOrderDone(order._id)}
                      >
                        ✓ Complete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {/* -------------------- Reservations Tab -------------------- */}
      {activeTab === 'reservations' && (
        <>
          <section className="dashboard-section table-assignments">
            <h2>🍴 Pending Reservations</h2>
            {renderReservations()}
          </section>

          <section className="dashboard-section reserved-tables">
            <h2>🍽️ Reserved Tables</h2>
            {!data.reservations || data.reservations.filter(r => r.allocated && r.status === 'confirmed').length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🪑</span>
                <p>No reserved tables</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Table</th>
                    <th>Customer</th>
                    <th>Reservation Time</th>
                    <th>Guests</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.reservations.filter(r => r.allocated && r.status === 'confirmed').map((resv) => (
                    <tr key={resv._id}>
                      <td>Table {resv.table_id || resv.tables?.join(", ") || "N/A"}</td>
                      <td>{resv.customerName || "N/A"}</td>
                      <td>{new Date(resv.time).toLocaleString() || resv.time || "N/A"}</td>
                      <td>{resv.guests || "N/A"}</td>
                      <td><span className="status-badge status-reserved">Confirmed</span></td>
                      <td>
                        <button 
                          className="action-btn-small danger"
                          onClick={() => handleRemoveReservation(resv._id)}
                        >
                          ❌ Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="dashboard-section add-table">
            <h2>➕ Add New Table</h2>
            <div className="add-table-form">
              <div className="form-group">
                <label>Table Number:</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g., 1, 2, 3..."
                  value={newTable.number}
                  onChange={(e) => setNewTable({ ...newTable, number: e.target.value })}
                  disabled={isProcessing}
                />
              </div>
              <div className="form-group">
                <label>Capacity (seats):</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  placeholder="e.g., 4, 6, 8..."
                  value={newTable.capacity}
                  onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
                  disabled={isProcessing}
                />
              </div>
              <button
                onClick={handleAddTable}
                disabled={isProcessing || !newTable.number || !newTable.capacity}
                className="add-table-btn"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Adding Table...
                  </>
                ) : (
                  '➕ Add Table'
                )}
              </button>
            </div>
          </section>

          <section className="dashboard-section all-tables">
            <h2>🪑 All Tables</h2>
            {!data.allTables || data.allTables.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🪑</span>
                <p>No tables found. Add tables using the form above.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Table Number</th>
                    <th>Capacity (seats)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.allTables.map((table) => (
                    <tr key={table.number}>
                      <td>Table {table.number}</td>
                      <td>{table.seats || 4} seats</td>
                      <td>
                        <span className={`status-badge ${
                          table.status === 'Available' ? 'status-available' : 'status-allocated'
                        }`}>
                          {table.status || 'Available'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}

      {/* -------------------- Tasks Tab -------------------- */}
      {activeTab === 'tasks' && (
        <section className="dashboard-section my-tasks">
          <h2>✅ My Tasks</h2>
          {!data.staffTasks || data.staffTasks.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">✅</span>
              <p>No tasks assigned yet</p>
            </div>
          ) : (
            <div className="tasks-grid">
              {data.staffTasks.map((task, idx) => (
                <div key={idx} className={`task-card task-${task.priority?.toLowerCase()}`}>
                  <div className="task-header">
                    <span className={`priority-badge priority-${task.priority?.toLowerCase()}`}>
                      {task.priority || 'Medium'}
                    </span>
                    <span className={`status-badge status-${task.status?.toLowerCase()}`}>
                      {task.status || 'Pending'}
                    </span>
                  </div>
                  <p className="task-description">{task.name}</p>
                  {task.status === 'Pending' && (
                    <button 
                      className="task-complete-btn"
                      onClick={() => handleTaskComplete(task.id)}
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* -------------------- Inventory Tab -------------------- */}
      {activeTab === 'inventory' && (
        <section className="dashboard-section inventory-status">
          <h2>📦 Inventory Status</h2>
          {!inventoryItems || inventoryItems.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📦</span>
              <p>No inventory data found</p>
            </div>
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
      )}

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
