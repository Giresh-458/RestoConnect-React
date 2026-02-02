import { useEffect, useState } from "react";
import { isLogin } from "../util/auth";
import { redirect, useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import styles from "./OwnerHomePage.module.css";

export function OwnerHomePage() {
  const navigate = useNavigate();
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
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchDashboardData();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
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

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getLowStockItems = () => {
    return inventory.filter(item => item.minStock > 0 && item.quantity <= item.minStock);
  };

  const getPendingOrders = () => {
    return recentOrders.filter(order => order.status === 'pending' || order.status === 'preparing');
  };

  const quickActions = [
    { 
      title: "View Orders", 
      icon: "📦", 
      color: "#3b82f6",
      action: () => navigate('/owner/orders'),
      description: "Manage current orders"
    },
    { 
      title: "Reservations", 
      icon: "📅", 
      color: "#8b5cf6",
      action: () => navigate('/owner/reservations'),
      description: "View bookings"
    },
    { 
      title: "Menu", 
      icon: "🍽️", 
      color: "#10b981",
      action: () => navigate('/owner/menumanagement'),
      description: "Update menu items"
    },
    { 
      title: "Dashboard", 
      icon: "📊", 
      color: "#f59e0b",
      action: () => navigate('/owner/dashboard'),
      description: "Full analytics"
    }
  ];

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
        setInventory(prevInventory =>
          prevInventory.map(item =>
            item._id === itemId ? result.inventory : item
          )
        );
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

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const lowStockItems = getLowStockItems();
  const pendingOrders = getPendingOrders();
  const hasAlerts = lowStockItems.length > 0 || pendingOrders.length > 0;

  return (
    <div className={styles.ownerHomePage}>
      {/* Hero Section with Gradient */}
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.heroLeft}>
            <h1 className={styles.heroTitle}>
              {getGreeting()}, {userName}! 👋
            </h1>
            <p className={styles.heroSubtitle}>{restaurantName}</p>
            <p className={styles.heroDate}>
              {formatDate(currentTime)} • {formatTime(currentTime)}
            </p>
          </div>
          <div className={styles.heroRight}>
            {hasAlerts && (
              <div className={styles.alertBadge}>
                <span className={styles.alertIcon}>🔔</span>
                <span className={styles.alertCount}>
                  {lowStockItems.length + pendingOrders.length}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {hasAlerts && (
        <div className={styles.alertsSection}>
          {pendingOrders.length > 0 && (
            <div className={styles.alert} style={{ borderLeft: '4px solid #f59e0b' }}>
              <div className={styles.alertHeader}>
                <span className={styles.alertTitle}>⚡ {pendingOrders.length} Pending Orders</span>
                <button 
                  className={styles.alertAction}
                  onClick={() => navigate('/owner/orders')}
                >
                  View All →
                </button>
              </div>
              <p className={styles.alertMessage}>Orders need attention in the kitchen</p>
            </div>
          )}
          {lowStockItems.length > 0 && (
            <div className={styles.alert} style={{ borderLeft: '4px solid #ef4444' }}>
              <div className={styles.alertHeader}>
                <span className={styles.alertTitle}>⚠️ {lowStockItems.length} Low Stock Items</span>
                <button 
                  className={styles.alertAction}
                  onClick={() => navigate('/owner/dashboard')}
                >
                  Check Inventory →
                </button>
              </div>
              <p className={styles.alertMessage}>
                {lowStockItems.slice(0, 2).map(item => item.name).join(', ')}
                {lowStockItems.length > 2 && ` and ${lowStockItems.length - 2} more`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className={styles.quickActionsSection}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <div 
              key={index}
              className={styles.quickActionCard}
              onClick={action.action}
              style={{ '--action-color': action.color }}
            >
              <div className={styles.quickActionIcon}>{action.icon}</div>
              <h3 className={styles.quickActionTitle}>{action.title}</h3>
              <p className={styles.quickActionDesc}>{action.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className={styles.metricsSection}>
        <h2 className={styles.sectionTitle}>Today's Performance</h2>
        <div className={styles.kpiContainer}>
          <div className={styles.kpiCard} style={{ '--kpi-color': '#3b82f6' }}>
            <div className={styles.kpiIcon}>💰</div>
            <div className={styles.kpiContent}>
              <h3 className={styles.kpiTitle}>Monthly Revenue</h3>
              <p className={styles.kpiValue}>{formatCurrency(dashboardStats.totalRevenueThisMonth)}</p>
              <span className={styles.kpiTrend}>↑ This month</span>
            </div>
          </div>
          <div className={styles.kpiCard} style={{ '--kpi-color': '#10b981' }}>
            <div className={styles.kpiIcon}>📦</div>
            <div className={styles.kpiContent}>
              <h3 className={styles.kpiTitle}>Orders Today</h3>
              <p className={styles.kpiValue}>{dashboardStats.ordersToday}</p>
              <span className={styles.kpiTrend}>Active orders</span>
            </div>
          </div>
          <div className={styles.kpiCard} style={{ '--kpi-color': '#8b5cf6' }}>
            <div className={styles.kpiIcon}>👥</div>
            <div className={styles.kpiContent}>
              <h3 className={styles.kpiTitle}>Active Staff</h3>
              <p className={styles.kpiValue}>{dashboardStats.activeStaff}</p>
              <span className={styles.kpiTrend}>On duty now</span>
            </div>
          </div>
          <div className={styles.kpiCard} style={{ '--kpi-color': '#f59e0b' }}>
            <div className={styles.kpiIcon}>📊</div>
            <div className={styles.kpiContent}>
              <h3 className={styles.kpiTitle}>Stock Level</h3>
              <p className={styles.kpiValue}>{dashboardStats.stockStatus}%</p>
              <span className={styles.kpiTrend}>
                {dashboardStats.stockStatus >= 70 ? '✓ Good' : dashboardStats.stockStatus >= 40 ? '⚠ Low' : '❌ Critical'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className={styles.chartsRow}>
        {/* Revenue Trend */}
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Revenue Trend (7 Days)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData.formatted || []}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px' 
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="Revenue" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fill="url(#revenueGradient)"
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Orders Trend */}
        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Orders Trend (7 Days)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={trendData.formatted || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px' 
                }} 
              />
              <Bar dataKey="Orders" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={styles.activitySection}>
        <div className={styles.activityHeader}>
          <h2 className={styles.sectionTitle}>Recent Orders</h2>
          <button 
            className={styles.viewAllButton}
            onClick={() => navigate('/owner/orders')}
          >
            View All →
          </button>
        </div>
        <div className={styles.activityList}>
          {recentOrders.length > 0 ? (
            recentOrders.slice(0, 5).map((order) => (
              <div key={order.id} className={styles.activityItem}>
                <div className={styles.activityIcon} style={{
                  background: order.status === 'completed' ? '#d1fae5' : 
                              order.status === 'preparing' ? '#fef3c7' : '#dbeafe'
                }}>
                  {order.status === 'completed' ? '✓' : 
                   order.status === 'preparing' ? '🔥' : '📦'}
                </div>
                <div className={styles.activityContent}>
                  <h3 className={styles.activityTitle}>
                    {order.orderId} — {order.customerName}
                  </h3>
                  <p className={styles.activityDetails}>
                    Table {order.tableNumber} • {formatCurrency(order.totalAmount)}
                  </p>
                </div>
                <div className={styles.activityStatus}>
                  <span className={`${styles.statusBadge} ${styles[order.status]}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyIcon}>📦</p>
              <p className={styles.emptyText}>No recent orders</p>
            </div>
          )}
        </div>
      </div>

      {/* Stock Status Overview */}
      {inventory.length > 0 && (
        <div className={styles.stockSection}>
          <div className={styles.stockHeader}>
            <h2 className={styles.sectionTitle}>Inventory Overview</h2>
            <button 
              className={styles.viewAllButton}
              onClick={() => navigate('/owner/dashboard')}
            >
              Manage Inventory →
            </button>
          </div>
          <div className={styles.stockGrid}>
            {inventory.slice(0, 6).map((item) => {
              const isLow = item.minStock > 0 && item.quantity <= item.minStock;
              const isCritical = item.minStock > 0 && item.quantity <= item.minStock * 0.5;
              return (
                <div key={item._id} className={styles.stockItem}>
                  <div className={styles.stockItemHeader}>
                    <span className={styles.stockItemName}>{item.name}</span>
                    <span className={`${styles.stockItemBadge} ${isCritical ? styles.critical : isLow ? styles.low : styles.good}`}>
                      {isCritical ? '🔴' : isLow ? '🟡' : '🟢'}
                    </span>
                  </div>
                  <div className={styles.stockItemQuantity}>
                    <span className={styles.quantity}>{item.quantity}</span>
                    <span className={styles.unit}>{item.unit}</span>
                  </div>
                  {item.minStock > 0 && (
                    <div className={styles.stockProgress}>
                      <div 
                        className={styles.stockProgressBar}
                        style={{ 
                          width: `${Math.min(100, (item.quantity / (item.minStock * 2)) * 100)}%`,
                          background: isCritical ? '#ef4444' : isLow ? '#f59e0b' : '#10b981'
                        }}
                      ></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
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
