import { redirect, useLoaderData } from "react-router-dom";
import { isLogin, logout } from "../util/auth";
import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
  LineChart, Line, Legend,
} from "recharts";
import {
  fetchAdminOverview,
  fetchEmployeePerformance,
  fetchRestaurantRevenue,
  fetchDishTrends,
  fetchTopCustomers,
  fetchRevenueChart,
  addEmployee,
} from "../api/adminApi";
import "../styles/admin.css";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#e11d48", "#84cc16", "#6366f1", "#14b8a6"];

const NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: "📊", section: "main" },
  { key: "employees", label: "Employees", icon: "👨‍💼", section: "analytics" },
  { key: "restaurants", label: "Revenue", icon: "🍽️", section: "analytics" },
  { key: "dishes", label: "Dish Trends", icon: "🍛", section: "analytics" },
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
  employees: { title: "Employee Performance", subtitle: "Track employee productivity and approval speed" },
  restaurants: { title: "Restaurant Revenue", subtitle: "Platform fees, profits, and restaurant rankings" },
  dishes: { title: "Dish & Category Trends", subtitle: "Which items are trending up or down" },
  customers: { title: "Top Customers", subtitle: "Highest spenders and most active buyers" },
  settings: { title: "Settings", subtitle: "Admin account settings" },
};

/* ═══════════════════════════════
   SIDEBAR
   ═══════════════════════════════ */
function AdminSidebar({ subPage, setSubPage, adminName }) {
  const sections = [...new Set(NAV_ITEMS.map((n) => n.section))];

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <h2>
          <span className="brand-resto">RESTO</span>
          <span className="brand-connect">CONNECT</span>
        </h2>
        <div className="brand-tag">Admin Dashboard</div>
      </div>

      <nav className="admin-sidebar-nav">
        {sections.map((section) => (
          <div key={section} className="admin-nav-section">
            <div className="admin-nav-section-title">{SECTION_LABELS[section]}</div>
            {NAV_ITEMS.filter((n) => n.section === section).map((item) => (
              <div
                key={item.key}
                className={`admin-nav-item${subPage === item.key ? " active" : ""}`}
                onClick={() => setSubPage(item.key)}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-user-info">
          <div className="admin-avatar">{(adminName || "A").charAt(0).toUpperCase()}</div>
          <div className="admin-user-details">
            <div className="name">{adminName || "Admin"}</div>
            <div className="role">Administrator</div>
          </div>
        </div>
        <button
          className="admin-logout-btn"
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
function AdminTopbar({ subPage }) {
  const meta = PAGE_META[subPage] || { title: "", subtitle: "" };
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="admin-topbar">
      <div className="admin-topbar-title">
        <h1>{meta.title}</h1>
        <p>{meta.subtitle}</p>
      </div>
      <div className="admin-topbar-actions">
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
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon green">💰</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Total Revenue</div>
            <div className="admin-stat-value">₹{(dashData.totalRevenue || 0).toLocaleString()}</div>
            <div className="admin-stat-change up">All-time earnings</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon blue">🏦</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Platform Fee (10%)</div>
            <div className="admin-stat-value">₹{(dashData.platformFee || 0).toLocaleString()}</div>
            <div className="admin-stat-change up">Your revenue</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon purple">🍽️</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Restaurants</div>
            <div className="admin-stat-value">{dashData.totalRestaurants || 0}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon orange">🧾</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Total Orders</div>
            <div className="admin-stat-value">{(dashData.totalOrders || 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon cyan">👥</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Users</div>
            <div className="admin-stat-value">{dashData.totalUsers || 0}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon red">👨‍💼</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Employees</div>
            <div className="admin-stat-value">{dashData.totalEmployees || 0}</div>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Revenue & Platform Fee Over Time</h3>
          <div className="admin-period-toggle">
            {["daily", "monthly", "yearly"].map((p) => (
              <button key={p} className={`admin-period-btn${period === p ? " active" : ""}`} onClick={() => setPeriod(p)}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="admin-card-body">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevAdmin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorFeeAdmin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="url(#colorRevAdmin)" name="Revenue" />
              <Area type="monotone" dataKey="platformFee" stroke="#16a34a" fill="url(#colorFeeAdmin)" name="Platform Fee" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header"><h3>Order Volume</h3></div>
        <div className="admin-card-body">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
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

/* ═══════════════════════════════
   ADD EMPLOYEE FORM
   ═══════════════════════════════ */
function AddEmployeeForm({ onAdded }) {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) {
      setMessage({ type: "error", text: "All fields are required" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await addEmployee(form);
      setMessage({ type: "success", text: res.message || "Employee added!" });
      setForm({ username: "", email: "", password: "" });
      if (onAdded) onAdded();
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to add employee" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="admin-card-header">
        <h3>➕ Add New Employee</h3>
      </div>
      <div className="admin-card-body">
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: 4 }}>Username</label>
            <input
              type="text" name="username" value={form.username} onChange={handleChange}
              placeholder="e.g. john_doe"
              style={{
                width: "100%", padding: "0.55rem 0.75rem", borderRadius: 8,
                border: "1.5px solid #e2e8f0", fontSize: "0.9rem", outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: 4 }}>Email</label>
            <input
              type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="e.g. john@example.com"
              style={{
                width: "100%", padding: "0.55rem 0.75rem", borderRadius: 8,
                border: "1.5px solid #e2e8f0", fontSize: "0.9rem", outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: 4 }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange}
                placeholder="Min 6 characters"
                style={{
                  width: "100%", padding: "0.55rem 0.75rem", paddingRight: "2.5rem", borderRadius: 8,
                  border: "1.5px solid #e2e8f0", fontSize: "0.9rem", outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", fontSize: "1rem", color: "#64748b",
                }}>
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          {message && (
            <div style={{
              padding: "0.5rem 0.75rem", borderRadius: 8, fontSize: "0.85rem", fontWeight: 500,
              background: message.type === "success" ? "#f0fdf4" : "#fef2f2",
              color: message.type === "success" ? "#16a34a" : "#dc2626",
              border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`,
            }}>
              {message.text}
            </div>
          )}
          <button type="submit" disabled={submitting}
            style={{
              padding: "0.6rem 1.2rem", borderRadius: 8, border: "none",
              background: submitting ? "#94a3b8" : "#2563eb", color: "#fff",
              fontWeight: 600, fontSize: "0.9rem", cursor: submitting ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}>
            {submitting ? "Adding..." : "Add Employee"}
          </button>
        </form>
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

  if (loading) return <div className="admin-loading"><div className="spinner"></div> Loading employee data...</div>;
  if (!data?.employees?.length) return <div className="admin-empty-state"><div className="icon">👨‍💼</div><p>No employee data available</p></div>;

  const employees = data.employees;

  return (
    <>
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon blue">👨‍💼</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Total Employees</div>
            <div className="admin-stat-value">{employees.length}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon green">✅</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Total Approvals</div>
            <div className="admin-stat-value">{employees.reduce((s, e) => s + e.totalApprovals, 0)}</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon purple">💰</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Revenue Handled</div>
            <div className="admin-stat-value">₹{employees.reduce((s, e) => s + e.revenueGenerated, 0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="admin-grid-2">
        <div className="admin-card">
          <AddEmployeeForm onAdded={() => {
            setLoading(true);
            fetchEmployeePerformance()
              .then((d) => { setData(d); setLoading(false); })
              .catch(() => setLoading(false));
          }} />
        </div>

        <div className="admin-card">
          <div className="admin-card-header"><h3>Approvals & Orders Comparison</h3></div>
          <div className="admin-card-body">
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


      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Employee Leaderboard</h3>
          <span className="admin-badge primary">{employees.length} employees</span>
        </div>
        <div className="admin-card-body no-pad">
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Employee</th>
                  <th>Approvals</th>
                  <th>Orders Handled</th>
                  <th>Revenue Generated</th>
                  <th>Rating</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, i) => (
                  <tr key={emp._id}>
                    <td>
                      <span style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 28, height: 28, borderRadius: "50%",
                        background: i < 3 ? ["#fef3c7", "#f1f5f9", "#fed7aa"][i] : "#f8fafc",
                        fontWeight: 700, fontSize: "0.8rem",
                        color: i < 3 ? ["#b45309", "#475569", "#c2410c"][i] : "#64748b",
                      }}>{i + 1}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{emp.username}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{emp.email}</div>
                    </td>
                    <td><span className="admin-badge success">{emp.totalApprovals}</span></td>
                    <td>{emp.totalOrdersHandled}</td>
                    <td style={{ fontWeight: 600, color: "#16a34a" }}>₹{emp.revenueGenerated.toLocaleString()}</td>
                    <td>
                      <span className="admin-stars">{"★".repeat(Math.round(emp.rating))}</span>
                      <span style={{ color: "#64748b", fontSize: "0.8rem", marginLeft: 4 }}>{emp.rating}</span>
                    </td>
                    <td>
                      <span className={`admin-badge ${emp.isSuspended ? "danger" : "success"}`}>
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

  if (loading) return <div className="admin-loading"><div className="spinner"></div> Loading restaurant revenue...</div>;
  if (!data) return <div className="admin-empty-state"><div className="icon">🍽️</div><p>No revenue data available</p></div>;

  const { restaurants, summary } = data;
  const pieData = restaurants.slice(0, 8).map((r) => ({ name: r.name, value: r.platformFee }));

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <div className="admin-period-toggle">
          {["all", "today", "week", "month", "year"].map((p) => (
            <button key={p} className={`admin-period-btn${period === p ? " active" : ""}`} onClick={() => setPeriod(p)}>
              {p === "all" ? "All Time" : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon green">💰</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Total Revenue</div>
            <div className="admin-stat-value">₹{(summary.totalRevenue || 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon blue">🏦</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Platform Fee Earned</div>
            <div className="admin-stat-value">₹{(summary.totalPlatformFee || 0).toLocaleString()}</div>
            <div className="admin-stat-change up">10% of revenue</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon orange">🧾</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Total Orders</div>
            <div className="admin-stat-value">{(summary.totalOrders || 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon purple">📈</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Avg Order Value</div>
            <div className="admin-stat-value">₹{summary.avgOrderValue || 0}</div>
          </div>
        </div>
      </div>

      <div className="admin-grid-2">
        <div className="admin-card">
          <div className="admin-card-header"><h3>Revenue by Restaurant</h3></div>
          <div className="admin-card-body">
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

        <div className="admin-card">
          <div className="admin-card-header"><h3>Platform Fee Distribution</h3></div>
          <div className="admin-card-body" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            {pieData.length === 0 ? (
              <div className="admin-empty-state"><div className="icon">📊</div><p>No data</p></div>
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

      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Restaurant Leaderboard</h3>
          <span className="admin-badge primary">{restaurants.length} restaurants</span>
        </div>
        <div className="admin-card-body no-pad">
          <div className="admin-table-container">
            <table className="admin-table">
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
                    <td>
                      <span style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 28, height: 28, borderRadius: "50%",
                        background: i < 3 ? ["#fef3c7", "#f1f5f9", "#fed7aa"][i] : "#f8fafc",
                        fontWeight: 700, fontSize: "0.8rem",
                        color: i < 3 ? ["#b45309", "#475569", "#c2410c"][i] : "#64748b",
                      }}>{i + 1}</span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{r.name}</td>
                    <td>{r.city || "—"}</td>
                    <td>{r.orders}</td>
                    <td style={{ fontWeight: 600, color: "#2563eb" }}>₹{r.revenue.toLocaleString()}</td>
                    <td style={{ fontWeight: 600, color: "#16a34a" }}>₹{r.platformFee.toLocaleString()}</td>
                    <td>₹{r.avgOrderValue}</td>
                    <td>
                      <span className="admin-stars">{"★".repeat(Math.round(r.rating))}</span>
                      <span style={{ color: "#64748b", fontSize: "0.8rem", marginLeft: 4 }}>{r.rating || "—"}</span>
                    </td>
                    <td><span className={`admin-badge ${r.isOpen ? "success" : "danger"}`}>{r.isOpen ? "Open" : "Closed"}</span></td>
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

  if (loading) return <div className="admin-loading"><div className="spinner"></div> Loading dish trends...</div>;
  if (!data) return <div className="admin-empty-state"><div className="icon">🍛</div><p>No trend data available</p></div>;

  const { dishes, categoryTrends, monthlyData, topGainers, topDecliners } = data;

  return (
    <>
      <div className="admin-stats-grid">
        {categoryTrends.map((cat) => (
          <div className="admin-stat-card" key={cat.category}>
            <div className={`admin-stat-icon ${cat.trend === "up" ? "green" : cat.trend === "down" ? "red" : "blue"}`}>
              {cat.trend === "up" ? "📈" : cat.trend === "down" ? "📉" : "➡️"}
            </div>
            <div className="admin-stat-info">
              <div className="admin-stat-label">{cat.category}</div>
              <div className="admin-stat-value">{cat.currentMonthOrders} orders</div>
              <div className={`admin-stat-change ${cat.trend === "up" ? "up" : cat.trend === "down" ? "down" : ""}`}>
                {cat.changePercent > 0 ? "+" : ""}{cat.changePercent}% vs last month · {cat.dishCount} dishes
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-card">
        <div className="admin-card-header"><h3>Monthly Dish Order Volume (6 Months)</h3></div>
        <div className="admin-card-body">
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

      <div className="admin-grid-2">
        <div className="admin-card" style={{ borderLeft: "3px solid #16a34a" }}>
          <div className="admin-card-header">
            <h3>Top Gainers</h3>
            <span className="admin-badge success">Trending Up</span>
          </div>
          <div className="admin-card-body" style={{ padding: "8px 22px" }}>
            {topGainers.length === 0 ? (
              <div className="admin-empty-state"><p>No gainers this month</p></div>
            ) : (
              topGainers.map((d, i) => (
                <div key={d._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < topGainers.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 24, height: 24, borderRadius: "50%", background: "#dcfce7",
                      fontWeight: 700, fontSize: "0.7rem", color: "#16a34a",
                    }}>{i + 1}</span>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{d.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>₹{d.price} · {d.currentMonthOrders} orders this month</div>
                    </div>
                  </div>
                  <span className="admin-badge success">+{d.changePercent}%</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="admin-card" style={{ borderLeft: "3px solid #dc2626" }}>
          <div className="admin-card-header">
            <h3>Top Decliners</h3>
            <span className="admin-badge danger">Trending Down</span>
          </div>
          <div className="admin-card-body" style={{ padding: "8px 22px" }}>
            {topDecliners.length === 0 ? (
              <div className="admin-empty-state"><p>No decliners this month</p></div>
            ) : (
              topDecliners.map((d, i) => (
                <div key={d._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < topDecliners.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 24, height: 24, borderRadius: "50%", background: "#fee2e2",
                      fontWeight: 700, fontSize: "0.7rem", color: "#dc2626",
                    }}>{i + 1}</span>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{d.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>₹{d.price} · {d.currentMonthOrders} orders this month</div>
                    </div>
                  </div>
                  <span className="admin-badge danger">{d.changePercent}%</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header"><h3>Category Comparison (This vs Last Month)</h3></div>
        <div className="admin-card-body">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={categoryTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="category" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="currentMonthOrders" fill="#2563eb" radius={[4, 4, 0, 0]} name="This Month" />
              <Bar dataKey="prevMonthOrders" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Last Month" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3>All Dish Performance</h3>
          <span className="admin-badge primary">{dishes.length} dishes</span>
        </div>
        <div className="admin-card-body no-pad">
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Dish</th>
                  <th>Category</th>
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
                    <td><span className="admin-badge info">{d.category || "—"}</span></td>
                    <td>₹{d.price}</td>
                    <td>{d.currentMonthOrders}</td>
                    <td>{d.prevMonthOrders}</td>
                    <td>
                      <span className={`admin-badge ${d.trend === "up" ? "success" : d.trend === "down" ? "danger" : "neutral"}`}>
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

  if (loading) return <div className="admin-loading"><div className="spinner"></div> Loading customer data...</div>;
  if (!data) return <div className="admin-empty-state"><div className="icon">🛒</div><p>No customer data available</p></div>;

  const { customers, summary } = data;
  const chartCustomers = customers.slice(0, 10);

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <div className="admin-period-toggle">
          {["all", "month", "quarter", "year"].map((p) => (
            <button key={p} className={`admin-period-btn${period === p ? " active" : ""}`} onClick={() => setPeriod(p)}>
              {p === "all" ? "All Time" : p === "quarter" ? "Last 3 Months" : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon blue">👥</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Active Customers</div>
            <div className="admin-stat-value">{summary.totalActiveCustomers}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon green">💰</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Total Customer Spend</div>
            <div className="admin-stat-value">₹{(summary.totalCustomerSpend || 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon orange">📊</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Avg Spend / Customer</div>
            <div className="admin-stat-value">₹{summary.avgSpendPerCustomer || 0}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon purple">👑</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Top Spender</div>
            <div className="admin-stat-value" style={{ fontSize: "1.1rem" }}>{summary.topSpender?.username || "—"}</div>
            <div className="admin-stat-change up">₹{(summary.topSpender?.totalSpent || 0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="admin-grid-2">
        <div className="admin-card">
          <div className="admin-card-header"><h3>Top 10 Customer Spend</h3></div>
          <div className="admin-card-body">
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

        <div className="admin-card">
          <div className="admin-card-header"><h3>Orders vs Items</h3></div>
          <div className="admin-card-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartCustomers}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="username" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalOrders" fill="#f59e0b" name="Orders" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalItems" fill="#7c3aed" name="Items Bought" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Customer Rankings</h3>
          <span className="admin-badge primary">{customers.length} active</span>
        </div>
        <div className="admin-card-body no-pad">
          <div className="admin-table-container">
            <table className="admin-table">
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
                    <td>
                      <span style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 28, height: 28, borderRadius: "50%",
                        background: i < 3 ? ["#fef3c7", "#f1f5f9", "#fed7aa"][i] : "#f8fafc",
                        fontWeight: 700, fontSize: "0.8rem",
                        color: i < 3 ? ["#b45309", "#475569", "#c2410c"][i] : "#64748b",
                      }}>{i + 1}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{c.username}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{c.email}</div>
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
   SETTINGS
   ═══════════════════════════════ */
function AdminSettingsSection({ adminData }) {
  return (
    <div className="admin-card">
      <div className="admin-card-header"><h3>Admin Account</h3></div>
      <div className="admin-card-body">
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
              {adminData?.email || "—"}
            </div>
          </div>
          <div>
            <label style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>Role</label>
            <div style={{ marginTop: 4 }}>
              <span className="admin-badge primary">Administrator</span>
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
export function AdminPage() {
  const data = useLoaderData();
  const [subPage, setSubPage] = useState("overview");
  const adminName = data.current_admin?.username || "Admin";

  return (
    <div className="admin-layout">
      <AdminSidebar subPage={subPage} setSubPage={setSubPage} adminName={adminName} />
      <div className="admin-main">
        <AdminTopbar subPage={subPage} />
        <div className="admin-content">
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

  const res = await fetch("http://localhost:3000/api/admin/overview", {
    credentials: "include",
  });
  if (!res.ok) return redirect("/login");
  return res.json();
}
