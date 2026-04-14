import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
} from "recharts";
import { fetchAnalytics } from "../../api/adminApi";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#e11d48", "#84cc16"];

export function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics()
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="admin-loading"><div className="spinner"></div> Loading analytics...</div>;
  }

  if (!data) {
    return <div className="admin-empty-state"><div className="icon">📈</div><p>Could not load analytics data</p></div>;
  }

  const { overview, topRestaurants, peakHours, monthlyRevenue } = data;

  // Prepare pie chart data from topRestaurants
  const pieData = (topRestaurants || []).slice(0, 6).map((r) => ({
    name: r.name,
    value: r.revenue || 0,
  }));

  return (
    <>
      {/* Overview Stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon blue">🍽️</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Restaurants</div>
            <div className="admin-stat-value">{overview?.totalRestaurants || 0}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon green">💰</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Total Revenue</div>
            <div className="admin-stat-value">₹{(overview?.totalRevenue || 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon orange">🧾</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Total Orders</div>
            <div className="admin-stat-value">{(overview?.totalOrders || 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon cyan">📅</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Reservations</div>
            <div className="admin-stat-value">{(overview?.totalReservations || 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon purple">👥</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Users</div>
            <div className="admin-stat-value">{(overview?.totalUsers || 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon red">⭐</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Avg Rating</div>
            <div className="admin-stat-value">{overview?.avgRating || "—"}</div>
          </div>
        </div>
      </div>

      {/* Revenue Trend */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Revenue Trend (Last 12 Months)</h3>
        </div>
        <div className="admin-card-body">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyRevenue || []}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="url(#colorRev)" name="Revenue (₹)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="admin-grid-2">
        {/* Peak Dining Hours */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Peak Dining Hours</h3>
          </div>
          <div className="admin-card-body">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={(peakHours || []).filter((h) => h.count > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Restaurant (Pie) */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>Revenue by Restaurant</h3>
          </div>
          <div className="admin-card-body" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            {pieData.length === 0 ? (
              <div className="admin-empty-state"><div className="icon">📊</div><p>No revenue data</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name.slice(0, 12)} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Top Restaurants Table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Restaurant Performance Leaderboard</h3>
        </div>
        <div className="admin-card-body no-pad">
          {(topRestaurants || []).length === 0 ? (
            <div className="admin-empty-state"><div className="icon">🏆</div><p>No performance data yet</p></div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Restaurant</th>
                  <th>Orders</th>
                  <th>Revenue</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {topRestaurants.map((r, i) => (
                  <tr key={r._id}>
                    <td>
                      <span style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 28, height: 28, borderRadius: "50%",
                        background: i < 3 ? ["#fef3c7", "#f1f5f9", "#fed7aa"][i] : "#f8fafc",
                        fontWeight: 700, fontSize: "0.8rem",
                        color: i < 3 ? ["#b45309", "#475569", "#c2410c"][i] : "#64748b",
                      }}>
                        {i + 1}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{r.name}</td>
                    <td>{r.orders}</td>
                    <td style={{ fontWeight: 600, color: "#16a34a" }}>₹{(r.revenue || 0).toLocaleString()}</td>
                    <td>
                      <span className="admin-stars">{"★".repeat(Math.round(r.rating || 0))}</span>
                      <span style={{ color: "#64748b", fontSize: "0.8rem", marginLeft: 4 }}>{r.rating || "—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Monthly Orders Trend */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Monthly Order Volume</h3>
        </div>
        <div className="admin-card-body">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyRevenue || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="orders" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
