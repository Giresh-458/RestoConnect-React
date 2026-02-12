import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, AreaChart, Area,
} from "recharts";
import { fetchStatistics, fetchChartStats, fetchActivities, fetchAnalytics } from "../../api/adminApi";

export function AdminDashBoard({ totalusers, totalrestaurants, restaurants }) {
  const [chartData, setChartData] = useState([]);
  const [period, setPeriod] = useState("monthly");
  const [stats, setStats] = useState({
    totalUsers: 0, totalRestaurants: 0, totalRevenue: 0,
    newUsers: 0, activeRestaurants: 0,
  });
  const [activities, setActivities] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const processChartData = (rawData, periodType) => {
    if (periodType === "daily") {
      const days = [];
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        const yr = d.getFullYear(), mo = d.getMonth() + 1, dy = d.getDate();
        const found = rawData.find((r) => r.year === yr && r.month === mo && r.day === dy);
        days.push({
          label: `${mo}/${dy}`,
          totalPayments: found?.totalPayments || 0,
          countPayments: found?.countPayments || 0,
        });
      }
      return days;
    } else if (periodType === "yearly") {
      const years = []; const curYear = new Date().getFullYear();
      for (let i = 4; i >= 0; i--) {
        const yr = curYear - i;
        const found = rawData.find((r) => r.year === yr);
        years.push({ label: String(yr), totalPayments: found?.totalPayments || 0, countPayments: found?.countPayments || 0 });
      }
      return years;
    } else {
      const curMonth = new Date().getMonth();
      return Array.from({ length: curMonth + 1 }, (_, i) => {
        const found = rawData.find((r) => r.month === i + 1);
        return { label: monthNames[i], totalPayments: found?.totalPayments || 0, countPayments: found?.countPayments || 0 };
      });
    }
  };

  useEffect(() => {
    fetchChartStats(period).then((d) => setChartData(processChartData(d, period))).catch(console.error);
  }, [period]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchStatistics().catch(() => ({})),
      fetchActivities().catch(() => []),
      fetchAnalytics().catch(() => null),
    ]).then(([s, a, an]) => {
      setStats({
        totalUsers: s.totalUsers || totalusers || 0,
        totalRestaurants: s.totalRestaurants || totalrestaurants || 0,
        totalRevenue: s.totalRevenue || 0,
        newUsers: s.newUsers || 0,
        activeRestaurants: s.activeRestaurants || 0,
      });
      setActivities(a);
      setAnalytics(an);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="admin-loading"><div className="spinner"></div> Loading dashboard...</div>;
  }

  const totalOrders = analytics?.overview?.totalOrders || 0;
  const totalReservations = analytics?.overview?.totalReservations || 0;
  const avgRating = analytics?.overview?.avgRating || 0;
  const topRestaurants = analytics?.topRestaurants || [];

  return (
    <>
      {/* KPI Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon blue">🍽️</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Total Restaurants</div>
            <div className="admin-stat-value">{stats.totalRestaurants}</div>
            <div className="admin-stat-change up">{stats.activeRestaurants || stats.totalRestaurants} active</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon green">💰</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Total Revenue</div>
            <div className="admin-stat-value">₹{(stats.totalRevenue || 0).toLocaleString()}</div>
            <div className="admin-stat-change up">Platform earnings</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon purple">👥</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Total Users</div>
            <div className="admin-stat-value">{stats.totalUsers}</div>
            <div className="admin-stat-change up">+{stats.newUsers || 0} this month</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon orange">🧾</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Total Orders</div>
            <div className="admin-stat-value">{totalOrders.toLocaleString()}</div>
            <div className="admin-stat-change up">All time</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon cyan">📅</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Reservations</div>
            <div className="admin-stat-value">{totalReservations.toLocaleString()}</div>
            <div className="admin-stat-change up">All time</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon red">⭐</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Avg Rating</div>
            <div className="admin-stat-value">{avgRating || "—"}</div>
            <div className="admin-stat-change up">Across all restaurants</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Revenue & Orders</h3>
          <div className="admin-period-toggle">
            {["daily", "monthly", "yearly"].map((p) => (
              <button
                key={p}
                className={`admin-period-btn${period === p ? " active" : ""}`}
                onClick={() => setPeriod(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="admin-card-body">
          <div className="admin-grid-2">
            <div>
              <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: 12 }}>
                {period === "daily" ? "Daily Revenue (Last 30 Days)" : period === "yearly" ? "Yearly Revenue" : "Monthly Revenue"}
              </p>
              <div className="admin-chart-wrap">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="totalPayments" stroke="#2563eb" fill="url(#colorRevenue)" name="Revenue (₹)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155", marginBottom: 12 }}>
                {period === "daily" ? "Daily Orders (Last 30 Days)" : period === "yearly" ? "Yearly Orders" : "Monthly Orders"}
              </p>
              <div className="admin-chart-wrap">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="countPayments" fill="#16a34a" radius={[4, 4, 0, 0]} name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Top Restaurants + Activity */}
      <div className="admin-grid-2">
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Top Performing Restaurants</h3>
            <span className="admin-badge primary">{topRestaurants.length} restaurants</span>
          </div>
          <div className="admin-card-body" style={{ padding: "8px 22px" }}>
            {topRestaurants.length === 0 ? (
              <div className="admin-empty-state"><div className="icon">🍽️</div><p>No data yet</p></div>
            ) : (
              topRestaurants.slice(0, 6).map((r, i) => (
                <div key={r._id} className="admin-top-restaurant">
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div className="rank">{i + 1}</div>
                    <div className="info">
                      <div className="name">{r.name}</div>
                      <div className="meta">{r.orders} orders · ⭐ {r.rating || "—"}</div>
                    </div>
                  </div>
                  <div className="revenue">₹{(r.revenue || 0).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Recent Activity</h3>
            <span className="admin-badge neutral">{activities.length} events</span>
          </div>
          <div className="admin-card-body" style={{ padding: "8px 22px", maxHeight: 380, overflowY: "auto" }}>
            {activities.length === 0 ? (
              <div className="admin-empty-state"><div className="icon">📋</div><p>No recent activity</p></div>
            ) : (
              <ul className="admin-activity-list">
                {activities.map((act, i) => (
                  <li key={i} className="admin-activity-item">
                    <div className={`admin-activity-dot ${act.description?.includes("Restaurant") ? "green" : "blue"}`}></div>
                    <div>
                      <div className="admin-activity-text">{act.description}</div>
                      <div className="admin-activity-time">{act.time}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
