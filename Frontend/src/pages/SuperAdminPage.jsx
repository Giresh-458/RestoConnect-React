import { redirect, useLoaderData } from "react-router-dom";
import { isLogin, logout } from "../util/auth";
import { maskEmail } from "../util/maskEmail";
import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
  LineChart, Line, Legend,
} from "recharts";
import {
  fetchSuperDashboard,
  fetchEmployeePerformance,
  fetchRestaurantRevenue,
  fetchDishTrends,
  fetchTopCustomers,
  fetchRevenueChart,
} from "../api/superadminApi";
import "../styles/superadmin.css";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#e11d48", "#84cc16", "#6366f1", "#14b8a6"];

const NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: "📊", section: "main" },
  { key: "employees", label: "Employee Performance", icon: "👨‍💼", section: "analytics" },
  { key: "restaurants", label: "Restaurant Revenue", icon: "🍽️", section: "analytics" },
  { key: "dishes", label: "Dish & Category Trends", icon: "🍛", section: "analytics" },
  { key: "customers", label: "Top Customers", icon: "🛒", section: "analytics" },
  { key: "settings", label: "Settings", icon: "⚙️", section: "system" },
];

const SECTION_LABELS = {
  main: "Dashboard",
  analytics: "Analytics",
  system: "System",
};

const PAGE_META = {
  overview: { title: "Admin Overview", subtitle: "Platform-wide metrics and insights" },
  employees: { title: "Employee Performance", subtitle: "Track employee productivity and approval metrics" },
  restaurants: { title: "Restaurant Revenue", subtitle: "Platform fees, profits, and restaurant rankings" },
  dishes: { title: "Dish & Category Trends", subtitle: "Which items are trending up or down" },
  customers: { title: "Top Customers", subtitle: "Highest spenders and most active buyers" },
  settings: { title: "Settings", subtitle: "Admin account settings" },
};

/* ═══════════════════════════════
   SIDEBAR
   ═══════════════════════════════ */
function SuperAdminSidebar({ subPage, setSubPage, adminName }) {
  const sections = [...new Set(NAV_ITEMS.map((n) => n.section))];

  return (
    <aside className="sa-sidebar">
      <div className="sa-sidebar-brand">
        <h2>
          <span className="sa-brand-resto">RESTO</span>
          <span className="sa-brand-connect">CONNECT</span>
        </h2>
        <div className="sa-brand-tag">Admin Dashboard</div>
      </div>

      <nav className="sa-sidebar-nav">
        {sections.map((section) => (
          <div key={section} className="sa-nav-section">
            <div className="sa-nav-section-title">{SECTION_LABELS[section]}</div>
            {NAV_ITEMS.filter((n) => n.section === section).map((item) => (
              <div
                key={item.key}
                className={`sa-nav-item${subPage === item.key ? " active" : ""}`}
                onClick={() => setSubPage(item.key)}
              >
                <span className="sa-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        ))}
      </nav>

      <div className="sa-sidebar-footer">
        <div className="sa-user-info">
          <div className="sa-avatar">{(adminName || "A").charAt(0).toUpperCase()}</div>
          <div className="sa-user-details">
            <div className="name">{adminName || "Admin"}</div>
            <div className="role">Super Admin</div>
          </div>
        </div>
        <button
          className="sa-logout-btn"
          onClick={async () => {
            try { await logout(); } catch (e) { console.error(e); }
            window.location.href = "/login";
          }}
        >
          <span>🚪</span> <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

/* ═══════════════════════════════
   TOPBAR
   ═══════════════════════════════ */
function SuperAdminTopbar({ subPage }) {
  const meta = PAGE_META[subPage] || { title: "", subtitle: "" };
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="sa-topbar">
      <div className="sa-topbar-title">
        <h1>{meta.title}</h1>
        <p>{meta.subtitle}</p>
      </div>
      <div className="sa-topbar-actions">
        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>{dateStr}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════
   OVERVIEW SECTION
   ═══════════════════════════════ */
function OverviewSection({ dashData }) {
  const [chartData, setChartData] = useState([]);
  const [period, setPeriod] = useState("monthly");

  useEffect(() => {
    fetchRevenueChart(period).then(setChartData).catch(console.error);
  }, [period]);

  return (
    <>
      <div className="sa-stats-grid">
        <div className="sa-stat-card">
          <div className="sa-stat-icon blue">💰</div>
          <div className="sa-stat-info">
            <div className="sa-stat-label">Total Revenue</div>
            <div className="sa-stat-value">₹{(dashData.totalRevenue || 0).toLocaleString()}</div>
            <div className="sa-stat-change up">All-time earnings</div>
          </div>
        </div>
        <div className="sa-stat-card">
          <div className="sa-stat-icon green">🏦</div>
          <div className="sa-stat-info">
            <div className="sa-stat-label">Platform Fee (10%)</div>
            <div className="sa-stat-value">₹{(dashData.platformFee || 0).toLocaleString()}</div>
            <div className="sa-stat-change up">Your revenue</div>
          </div>
        </div>
        <div className="sa-stat-card">
          <div className="sa-stat-icon purple">🍽️</div>
          <div className="sa-stat-info">
            <div className="sa-stat-label">Restaurants</div>
            <div className="sa-stat-value">{dashData.totalRestaurants || 0}</div>
          </div>
        </div>
        <div className="sa-stat-card">
          <div className="sa-stat-icon orange">🧾</div>
          <div className="sa-stat-info">
            <div className="sa-stat-label">Total Orders</div>
            <div className="sa-stat-value">{(dashData.totalOrders || 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="sa-stat-card">
          <div className="sa-stat-icon cyan">👥</div>
          <div className="sa-stat-info">
            <div className="sa-stat-label">Users</div>
            <div className="sa-stat-value">{dashData.totalUsers || 0}</div>
          </div>
        </div>
        <div className="sa-stat-card">
          <div className="sa-stat-icon red">👨‍💼</div>
          <div className="sa-stat-info">
            <div className="sa-stat-label">Employees</div>
            <div className="sa-stat-value">{dashData.totalEmployees || 0}</div>
          </div>
        </div>
      </div>

      <div className="sa-card">
        <div className="sa-card-header">
          <h3>Revenue & Platform Fee Over Time</h3>
          <div className="sa-period-toggle">
            {["daily", "monthly", "yearly"].map((p) => (
              <button key={p} className={`sa-period-btn${period === p ? " active" : ""}`} onClick={() => setPeriod(p)}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="sa-card-body">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevSA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorFeeSA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="url(#colorRevSA)" name="Revenue" />
              <Area type="monotone" dataKey="platformFee" stroke="#16a34a" fill="url(#colorFeeSA)" name="Platform Fee" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════
   EMPLOYEE PERFORMANCE
   ═══════════════════════════════ */
function EmployeePerformanceSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployeePerformance()
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="sa-loading"><div className="spinner"></div> Loading employee data...</div>;
  if (!data?.employees?.length) return <div className="sa-empty-state"><div className="icon">👨‍💼</div><p>No employee data available</p></div>;

  const employees = data.employees;

  return (
    <>
      {/* Summary Stats */}
      <div className="sa-stats-grid">
        <div className="sa-stat-card">
          <div className="sa-stat-icon blue">👨‍💼</div>
          <div className="sa-stat-info">
            <div className="sa-stat-label">Total Employees</div>
            <div className="sa-stat-value">{employees.length}</div>
          </div>
        </div>
        <div className="sa-stat-card">
          <div className="sa-stat-icon green">✅</div>
          <div className="sa-stat-info">
            <div className="sa-stat-label">Total Approvals</div>
            <div className="sa-stat-value">{employees.reduce((s, e) => s + e.totalApprovals, 0)}</div>
          </div>
        </div>
        <div className="sa-stat-card">
          <div className="sa-stat-icon orange">⏱️</div>
          <div className="sa-stat-info">
            <div className="sa-stat-label">Avg Response Time</div>
            <div className="sa-stat-value">
              {employees.length > 0 ? Math.round(employees.reduce((s, e) => s + e.avgResponseTime, 0) / employees.length) : 0} min
            </div>
          </div>
        </div>
        <div className="sa-stat-card">
          <div className="sa-stat-icon purple">💰</div>
          <div className="sa-stat-info">
            <div className="sa-stat-label">Revenue Handled</div>
            <div className="sa-stat-value">₹{employees.reduce((s, e) => s + e.revenueGenerated, 0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="sa-card">
        <div className="sa-card-header">
          <h3>Employee Performance Comparison</h3>
        </div>
        <div className="sa-card-body">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={employees}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="username" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalApprovals" fill="#2563eb" name="Approvals" radius={[4, 4, 0, 0]} />
              <Bar dataKey="totalOrdersHandled" fill="#16a34a" name="Orders Handled" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Employee Table */}
      <div className="sa-card">
        <div className="sa-card-header">
          <h3>Employee Details</h3>
          <span className="sa-badge primary">{employees.length} employees</span>
        </div>
        <div className="sa-card-body no-pad">
          <div className="sa-table-container">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Employee</th>
                  <th>Approvals</th>
                  <th>Orders Handled</th>
                  <th>Avg Response</th>
                  <th>Revenue Generated</th>
                  <th>Rating</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, i) => (
                  <tr key={emp._id}>
                    <td>
                      <span className={`sa-rank ${i < 3 ? ["gold", "silver", "bronze"][i] : ""}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{emp.username}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{maskEmail(emp.email)}</div>
                    </td>
                    <td><span className="sa-badge success">{emp.totalApprovals}</span></td>
                    <td>{emp.totalOrdersHandled}</td>
                    <td>
                      <span className={`sa-badge ${emp.avgResponseTime < 15 ? "success" : emp.avgResponseTime < 30 ? "warning" : "danger"}`}>
                        {emp.avgResponseTime} min
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: "#16a34a" }}>₹{emp.revenueGenerated.toLocaleString()}</td>
                    <td>
                      <span className="sa-stars">{"★".repeat(Math.round(emp.rating))}</span>
                      <span style={{ color: "#64748b", fontSize: "0.8rem", marginLeft: 4 }}>{emp.rating}</span>
                    </td>
                    <td>
                      <span className={`sa-badge ${emp.isSuspended ? "danger" : "success"}`}>
                        {emp.isSuspended ? "Suspended" : "Active"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════
   RESTAURANT REVENUE
   ═══════════════════════════════ */
function RestaurantRevenueSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");

  useEffect(() => {
    setLoading(true);
    fetchRestaurantRevenue(period)
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  if (loading) return <div className="sa-loading"><div className="spinner"></div> Loading restaurant revenue...</div>;
  if (!data) return <div className="sa-empty-state"><div className="icon">🍽️</div><p>No revenue data available</p></div>;

  const { restaurants, summary } = data;
  const pieData = restaurants.slice(0, 8).map((r) => ({ name: r.name, value: r.platformFee }));

  return (
    <>
      {/* Filters */}
      <div className="sa-filter-bar" style={{ marginBottom: 20 }}>
        <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>Period:</span>
        {["all", "today", "week", "month", "year"].map((p) => (
          <button key={p} className={`sa-period-btn${period === p ? " active" : ""}`} onClick={() => setPeriod(p)}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="sa-stats-grid">
        <div className="sa-stat-card">
          <div className="sa-stat-icon blue">💰</div>
          <div className="sa-stat-info">
            <div className="sa-stat-label">Total Revenue</div>
            <div className="sa-stat-value">₹{(summary.totalRevenue || 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="sa-stat-card">
          <div className="sa-stat-icon green">🏦</div>
          <div className="sa-stat-info">
            <div className="sa-stat-label">Platform Fee Earned</div>
            <div className="sa-stat-value">₹{(summary.totalPlatformFee || 0).toLocaleString()}</div>
            <div className="sa-stat-change up">10% of revenue</div>
          </div>
        </div>
        <div className="sa-stat-card">
          <div className="sa-stat-icon orange">🧾</div>
          <div className="sa-stat-info">
            <div className="sa-stat-label">Total Orders</div>
            <div className="sa-stat-value">{(summary.totalOrders || 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="sa-stat-card">
          <div className="sa-stat-icon purple">📈</div>
          <div className="sa-stat-info">
            <div className="sa-stat-label">Avg Order Value</div>
            <div className="sa-stat-value">₹{summary.avgOrderValue || 0}</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="sa-grid-2">
        {/* Revenue Bar Chart */}
        <div className="sa-card">
          <div className="sa-card-header"><h3>Revenue by Restaurant</h3></div>
          <div className="sa-card-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={restaurants.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="revenue" fill="#2563eb" name="Revenue" radius={[0, 4, 4, 0]} />
                <Bar dataKey="platformFee" fill="#16a34a" name="Platform Fee" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Fee Pie */}
        <div className="sa-card">
          <div className="sa-card-header"><h3>Platform Fee Distribution</h3></div>
          <div className="sa-card-body" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            {pieData.length === 0 ? (
              <div className="sa-empty-state"><div className="icon">📊</div><p>No data</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110}
                    label={({ name, percent }) => `${name.slice(0, 10)} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Restaurant Table */}
      <div className="sa-card">
        <div className="sa-card-header">
          <h3>Restaurant Leaderboard</h3>
          <span className="sa-badge primary">{restaurants.length} restaurants</span>
        </div>
        <div className="sa-card-body no-pad">
          <div className="sa-table-container">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Restaurant</th>
                  <th>City</th>
                  <th>Orders</th>
                  <th>Revenue</th>
                  <th>Platform Fee</th>
                  <th>Avg Order</th>
                  <th>Rating</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map((r, i) => (
                  <tr key={r._id}>
                    <td><span className={`sa-rank ${i < 3 ? ["gold", "silver", "bronze"][i] : ""}`}>{i + 1}</span></td>
                    <td style={{ fontWeight: 500 }}>{r.name}</td>
                    <td>{r.city || "—"}</td>
                    <td>{r.orders}</td>
                    <td style={{ fontWeight: 600, color: "#2563eb" }}>₹{r.revenue.toLocaleString()}</td>
                    <td style={{ fontWeight: 600, color: "#16a34a" }}>₹{r.platformFee.toLocaleString()}</td>
                    <td>₹{r.avgOrderValue}</td>
                    <td>
                      <span className="sa-stars">{"★".repeat(Math.round(r.rating))}</span>
                      <span style={{ color: "#64748b", fontSize: "0.8rem", marginLeft: 4 }}>{r.rating || "—"}</span>
                    </td>
                    <td><span className={`sa-badge ${r.isOpen ? "success" : "danger"}`}>{r.isOpen ? "Open" : "Closed"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════
   DISH & CATEGORY TRENDS
   ═══════════════════════════════ */
function DishTrendsSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDishTrends()
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="sa-loading"><div className="spinner"></div> Loading dish trends...</div>;
  if (!data) return <div className="sa-empty-state"><div className="icon">🍛</div><p>No trend data available</p></div>;

  const { dishes, categoryTrends, monthlyData, topGainers, topDecliners } = data;

  return (
    <>
      {/* Category Cards */}
      <div className="sa-stats-grid">
        {categoryTrends.map((cat) => (
          <div className="sa-stat-card" key={cat.category}>
            <div className={`sa-stat-icon ${cat.trend === "up" ? "green" : cat.trend === "down" ? "red" : "blue"}`}>
              {cat.trend === "up" ? "📈" : cat.trend === "down" ? "📉" : "➡️"}
            </div>
            <div className="sa-stat-info">
              <div className="sa-stat-label">{cat.category}</div>
              <div className="sa-stat-value">{cat.currentMonthOrders} orders</div>
              <div className={`sa-stat-change ${cat.trend === "up" ? "up" : cat.trend === "down" ? "down" : ""}`}>
                {cat.changePercent > 0 ? "+" : ""}{cat.changePercent}% vs last month · {cat.dishCount} dishes
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Trend Chart */}
      <div className="sa-card">
        <div className="sa-card-header"><h3>Monthly Dish Order Volume (Last 6 Months)</h3></div>
        <div className="sa-card-body">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="totalDishesOrdered" stroke="#2563eb" strokeWidth={2} name="Total Dishes Ordered" />
              <Line type="monotone" dataKey="uniqueDishes" stroke="#f59e0b" strokeWidth={2} name="Unique Dishes" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gainers & Decliners */}
      <div className="sa-grid-2">
        <div className="sa-card">
          <div className="sa-card-header">
            <h3>🔥 Top Gainers</h3>
            <span className="sa-badge success">Trending Up</span>
          </div>
          <div className="sa-card-body" style={{ padding: "8px 22px" }}>
            {topGainers.length === 0 ? (
              <div className="sa-empty-state"><p>No gainers this month</p></div>
            ) : (
              topGainers.map((d, i) => (
                <div key={d._id} className="sa-trend-item">
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span className="sa-rank gold" style={{ width: 24, height: 24, fontSize: "0.7rem" }}>{i + 1}</span>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{d.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>₹{d.price} · {d.currentMonthOrders} orders</div>
                    </div>
                  </div>
                  <span className="sa-badge success">+{d.changePercent}%</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="sa-card">
          <div className="sa-card-header">
            <h3>📉 Top Decliners</h3>
            <span className="sa-badge danger">Trending Down</span>
          </div>
          <div className="sa-card-body" style={{ padding: "8px 22px" }}>
            {topDecliners.length === 0 ? (
              <div className="sa-empty-state"><p>No decliners this month</p></div>
            ) : (
              topDecliners.map((d, i) => (
                <div key={d._id} className="sa-trend-item">
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span className="sa-rank" style={{ width: 24, height: 24, fontSize: "0.7rem", background: "#fee2e2", color: "#dc2626" }}>{i + 1}</span>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{d.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>₹{d.price} · {d.currentMonthOrders} orders</div>
                    </div>
                  </div>
                  <span className="sa-badge danger">{d.changePercent}%</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* All Dishes Table */}
      <div className="sa-card">
        <div className="sa-card-header">
          <h3>Dish Performance</h3>
          <span className="sa-badge primary">{dishes.length} dishes</span>
        </div>
        <div className="sa-card-body no-pad">
          <div className="sa-table-container">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Dish</th>
                  <th>Price</th>
                  <th>This Month</th>
                  <th>Last Month</th>
                  <th>Change</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                {dishes.map((d, i) => (
                  <tr key={d._id}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{d.name}</td>
                    <td>₹{d.price}</td>
                    <td>{d.currentMonthOrders}</td>
                    <td>{d.prevMonthOrders}</td>
                    <td>
                      <span className={`sa-badge ${d.trend === "up" ? "success" : d.trend === "down" ? "danger" : "neutral"}`}>
                        {d.changePercent > 0 ? "+" : ""}{d.changePercent}%
                      </span>
                    </td>
                    <td style={{ fontSize: "1.1rem" }}>
                      {d.trend === "up" ? "📈" : d.trend === "down" ? "📉" : "➡️"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════
   TOP CUSTOMERS
   ═══════════════════════════════ */
function TopCustomersSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");

  useEffect(() => {
    setLoading(true);
    fetchTopCustomers(period)
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  if (loading) return <div className="sa-loading"><div className="spinner"></div> Loading customer data...</div>;
  if (!data) return <div className="sa-empty-state"><div className="icon">🛒</div><p>No customer data available</p></div>;

  const { customers, summary } = data;

  // Prepare chart data for top 10
  const chartCustomers = customers.slice(0, 10);

  return (
    <>
      {/* Filters */}
      <div className="sa-filter-bar" style={{ marginBottom: 20 }}>
        <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>Period:</span>
        {["all", "month", "quarter", "year"].map((p) => (
          <button key={p} className={`sa-period-btn${period === p ? " active" : ""}`} onClick={() => setPeriod(p)}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="sa-stats-grid">
        <div className="sa-stat-card">
          <div className="sa-stat-icon blue">👥</div>
          <div className="sa-stat-info">
            <div className="sa-stat-label">Active Customers</div>
            <div className="sa-stat-value">{summary.totalActiveCustomers}</div>
          </div>
        </div>
        <div className="sa-stat-card">
          <div className="sa-stat-icon green">💰</div>
          <div className="sa-stat-info">
            <div className="sa-stat-label">Total Customer Spend</div>
            <div className="sa-stat-value">₹{(summary.totalCustomerSpend || 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="sa-stat-card">
          <div className="sa-stat-icon orange">📊</div>
          <div className="sa-stat-info">
            <div className="sa-stat-label">Avg Spend / Customer</div>
            <div className="sa-stat-value">₹{summary.avgSpendPerCustomer || 0}</div>
          </div>
        </div>
        <div className="sa-stat-card">
          <div className="sa-stat-icon purple">👑</div>
          <div className="sa-stat-info">
            <div className="sa-stat-label">Top Spender</div>
            <div className="sa-stat-value">{summary.topSpender?.username || "—"}</div>
            <div className="sa-stat-change up">₹{(summary.topSpender?.totalSpent || 0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="sa-card">
        <div className="sa-card-header"><h3>Top 10 Customer Spend</h3></div>
        <div className="sa-card-body">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartCustomers}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="username" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="totalSpent" fill="#2563eb" name="Total Spent" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Customer Table */}
      <div className="sa-card">
        <div className="sa-card-header">
          <h3>Customer Rankings</h3>
          <span className="sa-badge primary">{customers.length} active</span>
        </div>
        <div className="sa-card-body no-pad">
          <div className="sa-table-container">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Customer</th>
                  <th>Orders</th>
                  <th>Items Bought</th>
                  <th>Total Spent</th>
                  <th>Avg Order</th>
                  <th>Last Order</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, i) => (
                  <tr key={c._id}>
                    <td><span className={`sa-rank ${i < 3 ? ["gold", "silver", "bronze"][i] : ""}`}>{i + 1}</span></td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{c.username}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{maskEmail(c.email)}</div>
                    </td>
                    <td>{c.totalOrders}</td>
                    <td>{c.totalItems}</td>
                    <td style={{ fontWeight: 600, color: "#2563eb" }}>₹{c.totalSpent.toLocaleString()}</td>
                    <td>₹{c.avgOrderValue}</td>
                    <td style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════
   SETTINGS (Minimal)
   ═══════════════════════════════ */
function AdminSettingsSection({ adminData }) {
  return (
    <div className="sa-card">
      <div className="sa-card-header"><h3>Admin Account</h3></div>
      <div className="sa-card-body">
        <div style={{ display: "grid", gap: 16, maxWidth: 400 }}>
          <div>
            <label style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>Username</label>
            <div style={{ fontSize: "1rem", fontWeight: 600, color: "#1e293b", marginTop: 4 }}>
              {adminData?.username || "admin"}
            </div>
          </div>
          <div>
            <label style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>Email</label>
            <div style={{ fontSize: "1rem", fontWeight: 600, color: "#1e293b", marginTop: 4 }}>
              {maskEmail(adminData?.email) || "—"}
            </div>
          </div>
          <div>
            <label style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>Role</label>
            <div style={{ marginTop: 4 }}>
              <span className="sa-badge primary">Super Admin</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════
   MAIN PAGE
   ═══════════════════════════════ */
export function SuperAdminPage() {
  const data = useLoaderData();
  const [subPage, setSubPage] = useState("overview");
  const adminName = data.current_admin?.username || "Admin";

  return (
    <div className="sa-layout">
      <SuperAdminSidebar subPage={subPage} setSubPage={setSubPage} adminName={adminName} />
      <div className="sa-main">
        <SuperAdminTopbar subPage={subPage} />
        <div className="sa-content">
          {subPage === "overview" && <OverviewSection dashData={data} />}
          {subPage === "employees" && <EmployeePerformanceSection />}
          {subPage === "restaurants" && <RestaurantRevenueSection />}
          {subPage === "dishes" && <DishTrendsSection />}
          {subPage === "customers" && <TopCustomersSection />}
          {subPage === "settings" && <AdminSettingsSection adminData={data.current_admin} />}
        </div>
      </div>
    </div>
  );
}

export async function loader() {
  let role = await isLogin();
  if (role !== "admin") return redirect("/login");

  const res = await fetch("/api/superadmin/dashboard", {
    credentials: "include",
  });
  if (!res.ok) return redirect("/login");
  return res.json();
}
