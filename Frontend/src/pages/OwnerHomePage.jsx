import { useEffect, useState } from "react";
import { isLogin } from "../util/auth";
import { redirect } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from "./OwnerHomePage.module.css";

export function OwnerHomePage() {
  const [dashboardStats, setDashboardStats] = useState({
    totalRevenueThisMonth: 0,
    ordersToday: 0,
    activeStaff: 0,
    stockStatus: 0
  });
  const [trendData, setTrendData] = useState({
    days: [],
    revenue: [],
    orders: []
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [restaurantName, setRestaurantName] = useState("SpiceHub Restaurant");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all data in parallel
      const [statsRes, trendRes, ordersRes, inventoryRes, ownerInfoRes] = await Promise.all([
        fetch("http://localhost:3000/api/owner/dashboard/stats", {
          credentials: "include"
        }),
        fetch("http://localhost:3000/api/owner/dashboard/trend", {
          credentials: "include"
        }),
        fetch("http://localhost:3000/api/owner/orders/recent", {
          credentials: "include"
        }),
        fetch("http://localhost:3000/api/owner/inventory", {
          credentials: "include"
        }),
        fetch("http://localhost:3000/api/owner/info", {
          credentials: "include"
        })
      ]);

      const stats = await statsRes.json();
      const trend = await trendRes.json();
      const orders = await ordersRes.json();
      const inv = await inventoryRes.json();
      const ownerInfo = await ownerInfoRes.json();

      setDashboardStats(stats);
      setRecentOrders(orders.orders || []);
      setInventory(inv.inventory || []);
      setUserName(ownerInfo.username || "Owner");
      setRestaurantName(ownerInfo.restaurantName || "SpiceHub Restaurant");

      // Format trend data for recharts
      const formattedTrend = trend.days.map((day, index) => ({
        day,
        Revenue: trend.revenue[index] || 0,
        Orders: trend.orders[index] || 0
      }));
      setTrendData({ ...trend, formatted: formattedTrend });

      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  };

  const handleInventoryUpdate = async (itemId, change) => {
    try {
      const response = await fetch(`http://localhost:3000/api/owner/inventory/${itemId}/quantity`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ change })
      });

      if (response.ok) {
        const result = await response.json();
        // Update local inventory state
        setInventory(prevInventory =>
          prevInventory.map(item =>
            item._id === itemId ? result.inventory : item
          )
        );
        // Refresh dashboard stats to update stock status
        const statsRes = await fetch("http://localhost:3000/api/owner/dashboard/stats", {
          credentials: "include"
        });
        const stats = await statsRes.json();
        setDashboardStats(stats);
      }
    } catch (error) {
      console.error("Error updating inventory:", error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.ownerHomePage}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>Home Page</h1>
          <p className={styles.restaurantName}>{restaurantName}</p>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.iconButton}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </button>
          <button className={styles.iconButton}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </button>
          <span className={styles.userName}>{userName}</span>
        </div>
      </header>

      {/* KPI Cards */}
      <div className={styles.kpiContainer}>
        <div className={styles.kpiCard}>
          <h3 className={styles.kpiTitle}>Total Revenue (This month)</h3>
          <p className={styles.kpiValue}>{formatCurrency(dashboardStats.totalRevenueThisMonth)}</p>
        </div>
        <div className={styles.kpiCard}>
          <h3 className={styles.kpiTitle}>Orders Today</h3>
          <p className={styles.kpiValue}>{dashboardStats.ordersToday}</p>
        </div>
        <div className={styles.kpiCard}>
          <h3 className={styles.kpiTitle}>Active Staff</h3>
          <p className={styles.kpiValue}>{dashboardStats.activeStaff}</p>
        </div>
        <div className={styles.kpiCard}>
          <h3 className={styles.kpiTitle}>Stock Status</h3>
          <p className={styles.kpiValue}>{dashboardStats.stockStatus}%</p>
        </div>
      </div>

      {/* Revenue & Orders Trend Graph */}
      <div className={styles.chartContainer}>
        <h2 className={styles.sectionTitle}>Revenue & Orders (Last 7 days)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData.formatted || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Revenue" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb' }} />
            <Line type="monotone" dataKey="Orders" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Orders Section */}
      <div className={styles.recentOrdersSection}>
        <h2 className={styles.sectionTitle}>Recent Orders</h2>
        <div className={styles.ordersList}>
          {recentOrders.length > 0 ? (
            recentOrders.map((order) => (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.orderInfo}>
                  <h3 className={styles.orderId}>{order.orderId} — {order.customerName}</h3>
                  <p className={styles.orderDetails}>
                    Table {order.tableNumber} • {formatCurrency(order.totalAmount)}
                  </p>
                  <p className={styles.orderStatus}>Status: {order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
                </div>
              </div>
            ))
          ) : (
            <p className={styles.noData}>No recent orders</p>
          )}
        </div>
      </div>

      {/* Inventory Management Section */}
      <div className={styles.inventorySection}>
        <h2 className={styles.sectionTitle}>Inventory Management</h2>
        <div className={styles.inventoryList}>
          {inventory.length > 0 ? (
            inventory.map((item) => (
              <div key={item._id} className={styles.inventoryItem}>
                <span className={styles.inventoryName}>
                  {item.name} ({item.unit}) - {item.quantity}
                </span>
                <div className={styles.inventoryControls}>
                  <button
                    className={styles.quantityButton}
                    onClick={() => handleInventoryUpdate(item._id, -1)}
                    disabled={item.quantity <= 0}
                  >
                    -
                  </button>
                  <button
                    className={styles.quantityButton}
                    onClick={() => handleInventoryUpdate(item._id, 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className={styles.noData}>No inventory items. Add items to manage inventory.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export async function loader() {
  let role = await isLogin();
  console.log(role);
  if (role != 'owner') {
    return redirect('/login');
  }
}
