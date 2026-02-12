import { useEffect, useState, useCallback, useMemo } from "react";
import { isLogin } from "../util/auth";
import { redirect, useNavigate } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import * as api from "../api/ownerApi";
import styles from "./OwnerHomePage.module.css";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const pctChange = (today, yesterday) => {
  if (!yesterday) return today > 0 ? 100 : 0;
  return Math.round(((today - yesterday) / yesterday) * 100);
};

const rushLevel = (occupancy) => {
  if (occupancy >= 85) return { label: "Peak Rush", color: "#ef4444", bg: "#fef2f2" };
  if (occupancy >= 60) return { label: "Busy", color: "#f59e0b", bg: "#fffbeb" };
  if (occupancy >= 30) return { label: "Moderate", color: "#10b981", bg: "#ecfdf5" };
  return { label: "Quiet", color: "#6b7280", bg: "#f9fafb" };
};

export function OwnerHomePage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const [toggling, setToggling] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState(true);

  useEffect(() => {
    loadAll();
    const t = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [summary, trendData] = await Promise.all([
        api.fetchDashboardSummary(),
        api.fetchTrend(),
      ]);
      setData(summary);
      const formatted = (trendData.days || []).map((d, i) => ({
        day: d,
        Revenue: trendData.revenue[i] || 0,
        Orders: trendData.orders[i] || 0,
      }));
      setTrend(formatted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggleStatus = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      const newStatus = !data.restaurantStatus.isOpen;
      await api.toggleRestaurantStatus(newStatus);
      setData((prev) => ({
        ...prev,
        restaurantStatus: { ...prev.restaurantStatus, isOpen: newStatus },
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setToggling(false);
    }
  };

  const s = data?.stats || {};
  const alerts = data?.alerts || [];
  const recent = data?.recentOrders || [];
  const reservations = data?.upcomingReservations || [];
  const lowStock = data?.lowStockItems || [];
  const popular = data?.popularDishes || [];
  const tables = data?.tables || [];
  const todayRes = data?.todayReservations || [];
  const hourly = data?.hourlyOrders || [];
  const feedback = data?.recentFeedback || [];
  const restStatus = data?.restaurantStatus || {};
  const rush = rushLevel(s.tableOccupancy || 0);

  const revChange = pctChange(s.totalRevenueToday, s.totalRevenueYesterday);
  const orderChange = pctChange(s.ordersToday, s.ordersYesterday);
  const guestChange = pctChange(s.guestsToday, s.guestsYesterday);

  const greeting = useMemo(() => {
    const h = time.getHours();
    return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
  }, [time]);

  // Hourly chart data (only operating hours)
  const hourlyData = useMemo(() => {
    const openH = parseInt(restStatus.operatingHours?.open || "9");
    const closeH = parseInt(restStatus.operatingHours?.close || "22");
    const result = [];
    for (let h = openH; h <= closeH; h++) {
      result.push({
        hour: `${h > 12 ? h - 12 : h}${h >= 12 ? "pm" : "am"}`,
        orders: hourly[h] || 0,
        isNow: h === time.getHours(),
      });
    }
    return result;
  }, [hourly, restStatus, time]);

  if (loading) {
    return (
      <div className={styles.loader}>
        <div className={styles.spinner} />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  // Active orders breakdown for the pipeline
  const pipeline = [
    { label: "Pending", count: s.pendingOrders || 0, color: "#f59e0b", icon: "⏳" },
    { label: "Preparing", count: s.preparingOrders || 0, color: "#3b82f6", icon: "🔥" },
    { label: "Served", count: s.servedOrders || 0, color: "#8b5cf6", icon: "🍽️" },
    { label: "Completed", count: s.completedOrdersToday || 0, color: "#10b981", icon: "✓" },
  ];

  return (
    <div className={styles.page}>
      {/* ─── HERO HEADER ─── */}
      <header className={styles.hero}>
        <div className={styles.heroLeft}>
          <div className={styles.heroTitle}>
            <h1>{greeting}, <span className={styles.restName}>{data?.restaurantName || "Owner"}</span></h1>
            {restStatus.cuisine?.length > 0 && (
              <div className={styles.cuisineTags}>
                {restStatus.cuisine.slice(0, 3).map((c) => (
                  <span key={c} className={styles.cuisineTag}>{c}</span>
                ))}
              </div>
            )}
          </div>
          <p className={styles.heroDate}>
            {time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            <span className={styles.heroTime}>{time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
          </p>
        </div>
        <div className={styles.heroRight}>
          <div className={`${styles.statusPill} ${restStatus.isOpen ? styles.statusOpen : styles.statusClosed}`}>
            <span className={styles.statusDot} />
            <span>{restStatus.isOpen ? "OPEN" : "CLOSED"}</span>
            <span className={styles.statusHours}>
              {restStatus.operatingHours?.open} - {restStatus.operatingHours?.close}
            </span>
          </div>
          <button
            className={`${styles.toggleBtn} ${restStatus.isOpen ? styles.toggleClose : styles.toggleOpen}`}
            onClick={handleToggleStatus}
            disabled={toggling}
          >
            {toggling ? "..." : restStatus.isOpen ? "Close Now" : "Open Now"}
          </button>
          <button className={styles.refreshBtn} onClick={loadAll} title="Refresh dashboard">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
          </button>
        </div>
      </header>

      {/* ─── ALERT BANNER ─── */}
      {alerts.length > 0 && activeAlerts && (
        <div className={styles.alertBanner}>
          <div className={styles.alertScroll}>
            {alerts.map((a, i) => (
              <div key={i} className={`${styles.alertChip} ${styles[`alert_${a.type}`]}`}>
                <span className={styles.alertDot} />
                <span>{a.message}</span>
                <button className={styles.alertAction} onClick={() => navigate(`/owner/${a.action === "inventory" ? "inventory" : a.action}`)}>
                  View
                </button>
              </div>
            ))}
          </div>
          <button className={styles.alertDismiss} onClick={() => setActiveAlerts(false)}>✕</button>
        </div>
      )}

      {/* ─── LIVE STATUS BAR ─── */}
      <div className={styles.liveBar}>
        <div className={styles.rushIndicator} style={{ background: rush.bg }}>
          <span className={styles.rushDot} style={{ background: rush.color }} />
          <span style={{ color: rush.color, fontWeight: 600 }}>{rush.label}</span>
        </div>
        <div className={styles.liveStats}>
          <div className={styles.liveStat}>
            <span className={styles.liveNum}>{s.occupiedTables || 0}</span>
            <span className={styles.liveLabel}>/ {s.totalTables || 0} Tables</span>
          </div>
          <div className={styles.liveDivider} />
          <div className={styles.liveStat}>
            <span className={styles.liveNum}>{(s.pendingOrders || 0) + (s.preparingOrders || 0)}</span>
            <span className={styles.liveLabel}>Active Orders</span>
          </div>
          <div className={styles.liveDivider} />
          <div className={styles.liveStat}>
            <span className={styles.liveNum}>{todayRes.filter((r) => r.status === "pending").length}</span>
            <span className={styles.liveLabel}>Awaiting Confirm</span>
          </div>
          <div className={styles.liveDivider} />
          <div className={styles.liveStat}>
            <span className={styles.liveNum}>{s.activeStaff || 0}</span>
            <span className={styles.liveLabel}>Staff On Duty</span>
          </div>
        </div>
        <button className={styles.floorBtn} onClick={() => navigate("/owner/floor")}>
          View Live Floor →
        </button>
      </div>

      {/* ─── TODAY'S PERFORMANCE KPIs ─── */}
      <section className={styles.perfSection}>
        <h2 className={styles.secTitle}>Today's Performance</h2>
        <div className={styles.perfGrid}>
          <div className={styles.perfCard}>
            <div className={styles.perfIcon} style={{ background: "#eef2ff" }}>💰</div>
            <div className={styles.perfBody}>
              <span className={styles.perfLabel}>Revenue</span>
              <span className={styles.perfValue}>{fmt(s.totalRevenueToday)}</span>
              <div className={styles.perfCompare}>
                <span className={`${styles.perfBadge} ${revChange >= 0 ? styles.perfUp : styles.perfDown}`}>
                  {revChange >= 0 ? "↑" : "↓"} {Math.abs(revChange)}%
                </span>
                <span className={styles.perfVs}>vs yesterday</span>
              </div>
            </div>
          </div>
          <div className={styles.perfCard}>
            <div className={styles.perfIcon} style={{ background: "#ecfdf5" }}>📋</div>
            <div className={styles.perfBody}>
              <span className={styles.perfLabel}>Orders</span>
              <span className={styles.perfValue}>{s.ordersToday || 0}</span>
              <div className={styles.perfCompare}>
                <span className={`${styles.perfBadge} ${orderChange >= 0 ? styles.perfUp : styles.perfDown}`}>
                  {orderChange >= 0 ? "↑" : "↓"} {Math.abs(orderChange)}%
                </span>
                <span className={styles.perfVs}>vs yesterday</span>
              </div>
            </div>
          </div>
          <div className={styles.perfCard}>
            <div className={styles.perfIcon} style={{ background: "#fefce8" }}>👥</div>
            <div className={styles.perfBody}>
              <span className={styles.perfLabel}>Guests</span>
              <span className={styles.perfValue}>{s.guestsToday || 0}</span>
              <div className={styles.perfCompare}>
                <span className={`${styles.perfBadge} ${guestChange >= 0 ? styles.perfUp : styles.perfDown}`}>
                  {guestChange >= 0 ? "↑" : "↓"} {Math.abs(guestChange)}%
                </span>
                <span className={styles.perfVs}>vs yesterday</span>
              </div>
            </div>
          </div>
          <div className={styles.perfCard}>
            <div className={styles.perfIcon} style={{ background: "#fef2f2" }}>⭐</div>
            <div className={styles.perfBody}>
              <span className={styles.perfLabel}>Rating</span>
              <span className={styles.perfValue}>{s.avgRating?.toFixed(1) || "—"}</span>
              <div className={styles.perfCompare}>
                <span className={styles.perfMuted}>{s.totalRatings || 0} reviews</span>
              </div>
            </div>
          </div>
          <div className={styles.perfCard}>
            <div className={styles.perfIcon} style={{ background: "#f5f3ff" }}>📈</div>
            <div className={styles.perfBody}>
              <span className={styles.perfLabel}>Avg Order Value</span>
              <span className={styles.perfValue}>{fmt(s.avgOrderValue)}</span>
              <div className={styles.perfCompare}>
                <span className={styles.perfMuted}>this month</span>
              </div>
            </div>
          </div>
          <div className={styles.perfCard}>
            <div className={styles.perfIcon} style={{ background: "#ecfeff" }}>🪑</div>
            <div className={styles.perfBody}>
              <span className={styles.perfLabel}>Table Occupancy</span>
              <span className={styles.perfValue}>{s.tableOccupancy || 0}%</span>
              <div className={styles.perfCompare}>
                <span className={styles.perfMuted}>{s.occupiedTables}/{s.totalTables} occupied</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ORDER PIPELINE ─── */}
      <section className={styles.pipelineSection}>
        <h2 className={styles.secTitle}>Order Pipeline</h2>
        <div className={styles.pipeline}>
          {pipeline.map((step, i) => (
            <div key={step.label} className={styles.pipeStep}>
              <div className={styles.pipeIcon} style={{ background: `${step.color}18`, color: step.color }}>
                {step.icon}
              </div>
              <div className={styles.pipeCount} style={{ color: step.color }}>{step.count}</div>
              <div className={styles.pipeLabel}>{step.label}</div>
              {i < pipeline.length - 1 && <div className={styles.pipeArrow}>→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ─── QUICK ACTIONS ─── */}
      <section className={styles.quickSection}>
        <h2 className={styles.secTitle}>Quick Actions</h2>
        <div className={styles.quickGrid}>
          {[
            { icon: "🪑", label: "Live Floor", to: "/owner/floor", count: `${s.availableTables || 0} free`, accent: "#10b981" },
            { icon: "📋", label: "Orders", to: "/owner/orders", count: `${s.pendingOrders || 0} pending`, accent: "#f59e0b" },
            { icon: "📅", label: "Reservations", to: "/owner/reservations", count: `${s.pendingReservations || 0} pending`, accent: "#6366f1" },
            { icon: "🍽️", label: "Menu", to: "/owner/menumanagement", count: "manage", accent: "#8b5cf6" },
            { icon: "📦", label: "Inventory", to: "/owner/inventory", count: `${lowStock.length} alerts`, accent: "#ef4444" },
            { icon: "📊", label: "Analytics", to: "/owner/dashboard", count: "reports", accent: "#06b6d4" },
            { icon: "👥", label: "Staff", to: "/owner/staffmanagement", count: `${s.activeStaff || 0} active`, accent: "#3b82f6" },
            { icon: "💬", label: "Feedback", to: "/owner/feedback", count: `${feedback.length} new`, accent: "#f59e0b" },
          ].map((a) => (
            <button key={a.to} className={styles.quickCard} onClick={() => navigate(a.to)}>
              <span className={styles.quickIcon}>{a.icon}</span>
              <span className={styles.quickLabel}>{a.label}</span>
              <span className={styles.quickCount} style={{ color: a.accent }}>{a.count}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ─── TABLE MAP MINI + HOURLY HEATMAP ─── */}
      <div className={styles.midRow}>
        {/* Mini Table Map */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h3>Table Status</h3>
            <button className={styles.cardLink} onClick={() => navigate("/owner/floor")}>Manage →</button>
          </div>
          <div className={styles.tableGrid}>
            {tables.length === 0 && <p className={styles.emptyMsg}>No tables configured</p>}
            {tables.map((t) => (
              <div
                key={t.number}
                className={`${styles.tableDot} ${styles[`table_${t.status}`]}`}
                title={`Table ${t.number} (${t.seats} seats) — ${t.status}`}
              >
                <span className={styles.tableNum}>{t.number}</span>
                <span className={styles.tableSeats}>{t.seats}s</span>
              </div>
            ))}
          </div>
          <div className={styles.tableLegend}>
            <span><span className={`${styles.legendDot} ${styles.table_available}`} /> Available</span>
            <span><span className={`${styles.legendDot} ${styles.table_occupied}`} /> Occupied</span>
            <span><span className={`${styles.legendDot} ${styles.table_reserved}`} /> Reserved</span>
          </div>
        </div>

        {/* Hourly Traffic */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h3>Today's Traffic</h3>
            <span className={styles.cardSubtitle}>Orders by hour</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hourlyData} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="hour" stroke="#9ca3af" fontSize={10} tickLine={false} />
              <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                formatter={(v) => [`${v} orders`, "Orders"]}
              />
              <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                {hourlyData.map((entry, i) => (
                  <Cell key={i} fill={entry.isNow ? "#6366f1" : "#c7d2fe"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── CHARTS ROW: Revenue + Orders + Popular ─── */}
      <div className={styles.chartsRow}>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h3>Revenue Trend</h3>
            <span className={styles.cardSubtitle}>Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} tickLine={false} />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                formatter={(v) => [fmt(v), "Revenue"]}
              />
              <Area type="monotone" dataKey="Revenue" stroke="#6366f1" fill="url(#revGrad)" strokeWidth={2.5} dot={{ r: 3, fill: "#6366f1" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h3>Orders Trend</h3>
            <span className={styles.cardSubtitle}>Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trend} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} tickLine={false} />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                formatter={(v) => [`${v}`, "Orders"]}
              />
              <Bar dataKey="Orders" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {popular.length > 0 && (
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h3>Top Dishes</h3>
              <span className={styles.cardSubtitle}>Last 30 days</span>
            </div>
            <div className={styles.pieWrapper}>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={popular} dataKey="orderCount" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
                    {popular.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, name) => [`${v} orders`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.pieLegend}>
                {popular.map((d, i) => (
                  <div key={d.name} className={styles.pieLegendItem}>
                    <span className={styles.pieLegendDot} style={{ background: COLORS[i % COLORS.length] }} />
                    <span className={styles.pieLegendName}>{d.name}</span>
                    <span className={styles.pieLegendCount}>{d.orderCount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── TODAY'S RESERVATION TIMELINE ─── */}
      <section className={styles.card} style={{ marginBottom: "1rem" }}>
        <div className={styles.cardHead}>
          <h3>Today's Reservation Timeline</h3>
          <button className={styles.cardLink} onClick={() => navigate("/owner/reservations")}>
            View All →
          </button>
        </div>
        {todayRes.length === 0 ? (
          <p className={styles.emptyMsg}>No reservations for today</p>
        ) : (
          <div className={styles.timeline}>
            {todayRes.map((r) => (
              <div key={r._id} className={`${styles.timeSlot} ${styles[`ts_${r.status}`]}`}>
                <div className={styles.timeLabel}>{r.time}</div>
                <div className={styles.timeLine}>
                  <span className={styles.timeDotBig} />
                </div>
                <div className={styles.timeCard}>
                  <span className={styles.timeGuest}>{r.customerName}</span>
                  <span className={styles.timeInfo}>{r.guests} guests</span>
                  <span className={`${styles.timeBadge} ${styles[`badge_${r.status}`]}`}>{r.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── BOTTOM TRIPLE GRID ─── */}
      <div className={styles.triGrid}>
        {/* Recent Orders */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h3>Recent Orders</h3>
            <button className={styles.cardLink} onClick={() => navigate("/owner/orders")}>View All →</button>
          </div>
          <div className={styles.listBody}>
            {recent.length === 0 && <p className={styles.emptyMsg}>No recent orders</p>}
            {recent.slice(0, 6).map((o) => (
              <div key={o.id} className={styles.listRow}>
                <div className={styles.listLeft}>
                  <div className={`${styles.orderDot} ${styles[`dot_${o.status}`]}`} />
                  <div>
                    <p className={styles.rowMain}>{o.customerName}</p>
                    <p className={styles.rowSub}>Table {o.tableNumber} · {o.orderId}</p>
                  </div>
                </div>
                <div className={styles.listRight}>
                  <span className={styles.rowAmt}>{fmt(o.totalAmount)}</span>
                  <span className={`${styles.badge} ${styles[`badge_${o.status}`]}`}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Reservations */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h3>Upcoming Reservations</h3>
            <button className={styles.cardLink} onClick={() => navigate("/owner/reservations")}>View All →</button>
          </div>
          <div className={styles.listBody}>
            {reservations.length === 0 && <p className={styles.emptyMsg}>No upcoming reservations</p>}
            {reservations.slice(0, 6).map((r) => (
              <div key={r._id} className={styles.listRow}>
                <div className={styles.listLeft}>
                  <div className={styles.resAvatar}>{r.customerName?.[0] || "?"}</div>
                  <div>
                    <p className={styles.rowMain}>{r.customerName}</p>
                    <p className={styles.rowSub}>
                      {new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {r.time} · {r.guests} guests
                    </p>
                  </div>
                </div>
                <span className={`${styles.badge} ${styles[`badge_${r.status}`]}`}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock + Feedback */}
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <h3>Alerts & Feedback</h3>
          </div>
          <div className={styles.listBody}>
            {/* Low Stock */}
            {lowStock.length > 0 && (
              <>
                <div className={styles.subHeader}>
                  <span>🔴 Low Stock ({lowStock.length})</span>
                  <button className={styles.cardLink} onClick={() => navigate("/owner/inventory")}>Fix →</button>
                </div>
                {lowStock.slice(0, 3).map((item, i) => (
                  <div key={i} className={styles.listRow}>
                    <div className={styles.listLeft}>
                      <div>
                        <p className={styles.rowMain}>{item.name}</p>
                        <p className={styles.rowSub}>{item.quantity} {item.unit} left (min: {item.minStock})</p>
                      </div>
                    </div>
                    <div className={styles.stockBar}>
                      <div
                        className={styles.stockFill}
                        style={{
                          width: `${Math.min((item.quantity / Math.max(item.minStock, 1)) * 100, 100)}%`,
                          background: item.quantity <= item.minStock * 0.5 ? "#ef4444" : "#f59e0b"
                        }}
                      />
                    </div>
                  </div>
                ))}
              </>
            )}
            {/* Feedback */}
            {feedback.length > 0 && (
              <>
                <div className={styles.subHeader} style={{ marginTop: lowStock.length > 0 ? "0.75rem" : 0 }}>
                  <span>⭐ Recent Feedback</span>
                  <button className={styles.cardLink} onClick={() => navigate("/owner/feedback")}>View →</button>
                </div>
                {feedback.slice(0, 3).map((fb, i) => (
                  <div key={i} className={styles.listRow}>
                    <div className={styles.listLeft}>
                      <div>
                        <p className={styles.rowMain}>{fb.customerName}</p>
                        <p className={styles.rowSub}>
                          Dining: {"★".repeat(fb.diningRating || 0)}{"☆".repeat(5 - (fb.diningRating || 0))}
                          {fb.orderRating ? ` · Order: ${"★".repeat(fb.orderRating)}${"☆".repeat(5 - fb.orderRating)}` : ""}
                        </p>
                      </div>
                    </div>
                    <span className={`${styles.badge} ${fb.status === "Pending" ? styles.badge_pending : styles.badge_completed}`}>
                      {fb.status}
                    </span>
                  </div>
                ))}
              </>
            )}
            {lowStock.length === 0 && feedback.length === 0 && (
              <p className={styles.emptyMsg}>All clear — no alerts!</p>
            )}
          </div>
        </div>
      </div>

      {/* ─── MONTH SUMMARY FOOTER ─── */}
      <div className={styles.footerBar}>
        <div className={styles.footerStat}>
          <span className={styles.footerLabel}>Monthly Revenue</span>
          <span className={styles.footerValue}>{fmt(s.totalRevenueThisMonth)}</span>
        </div>
        <div className={styles.footerStat}>
          <span className={styles.footerLabel}>Weekly Revenue</span>
          <span className={styles.footerValue}>{fmt(s.totalRevenueThisWeek)}</span>
        </div>
        <div className={styles.footerStat}>
          <span className={styles.footerLabel}>Monthly Orders</span>
          <span className={styles.footerValue}>{s.totalOrdersThisMonth || 0}</span>
        </div>
        <div className={styles.footerStat}>
          <span className={styles.footerLabel}>Stock Health</span>
          <span className={styles.footerValue}>{s.stockStatus || 100}%</span>
        </div>
      </div>
    </div>
  );
}

export async function loader() {
  const role = await isLogin();
  if (role !== "owner") return redirect("/login");
  return null;
}
