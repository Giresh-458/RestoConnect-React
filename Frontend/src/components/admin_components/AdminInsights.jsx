import { useEffect, useState } from "react";
import { maskEmail } from "../../util/maskEmail";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
  LineChart, Line, Legend,
} from "recharts";
import {
  fetchEmployeePerformance,
  fetchRestaurantRevenue,
  fetchDishTrends,
  fetchTopCustomers,
} from "../../api/adminApi";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#e11d48", "#84cc16"];

const TABS = [
  { key: "employees", label: "Employee Performance", icon: "👨‍💼" },
  { key: "revenue", label: "Restaurant Revenue", icon: "💰" },
  { key: "dishes", label: "Dish & Category Trends", icon: "🍽️" },
  { key: "customers", label: "Top Customers", icon: "👥" },
];

/* ─────────────────────────────────────────────
   Employee Performance Tab
   ───────────────────────────────────────────── */
function EmployeeTab() {
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

  // Chart data
  const chartData = employees.map((e) => ({
    name: e.username.length > 10 ? e.username.slice(0, 10) + "…" : e.username,
    approvals: e.totalApprovals,
    orders: e.totalOrdersHandled,
    responseTime: e.avgResponseTime,
  }));

  return (
    <>
      {/* KPI row */}
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
          <div className="admin-stat-icon orange">⏱️</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Avg Response Time</div>
            <div className="admin-stat-value">
              {employees.length ? Math.round(employees.reduce((s, e) => s + e.avgResponseTime, 0) / employees.length) : 0} min
            </div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon purple">💵</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Revenue Managed</div>
            <div className="admin-stat-value">₹{employees.reduce((s, e) => s + e.revenueGenerated, 0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="admin-grid-2">
        <div className="admin-card">
          <div className="admin-card-header"><h3>Approvals & Orders Handled</h3></div>
          <div className="admin-card-body">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="approvals" fill="#2563eb" radius={[4, 4, 0, 0]} name="Approvals" />
                <Bar dataKey="orders" fill="#16a34a" radius={[4, 4, 0, 0]} name="Orders Handled" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header"><h3>Avg Response Time (minutes)</h3></div>
          <div className="admin-card-body">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="responseTime" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Avg Response (min)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="admin-card">
        <div className="admin-card-header"><h3>Employee Performance Leaderboard</h3></div>
        <div className="admin-card-body no-pad">
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Approvals</th>
                  <th>Orders</th>
                  <th>Revenue</th>
                  <th>Avg Response</th>
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
                    <td style={{ fontWeight: 500 }}>{emp.username}</td>
                    <td style={{ color: "#64748b", fontSize: "0.8rem" }}>{maskEmail(emp.email)}</td>
                    <td>{emp.totalApprovals}</td>
                    <td>{emp.totalOrdersHandled}</td>
                    <td style={{ fontWeight: 600, color: "#16a34a" }}>₹{emp.revenueGenerated.toLocaleString()}</td>
                    <td>{emp.avgResponseTime} min</td>
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

/* ─────────────────────────────────────────────
   Restaurant Revenue Tab
   ───────────────────────────────────────────── */
function RevenueTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");

  useEffect(() => {
    setLoading(true);
    fetchRestaurantRevenue(period)
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  if (loading) return <div className="admin-loading"><div className="spinner"></div> Loading revenue data...</div>;
  if (!data) return <div className="admin-empty-state"><div className="icon">💰</div><p>Could not load revenue data</p></div>;

  const { restaurants, summary } = data;

  const pieData = restaurants.slice(0, 8).map((r) => ({
    name: r.name,
    value: r.platformFee,
  }));

  const barData = restaurants.slice(0, 12).map((r) => ({
    name: r.name.length > 12 ? r.name.slice(0, 12) + "…" : r.name,
    revenue: r.revenue,
    platformFee: r.platformFee,
  }));

  return (
    <>
      {/* Period filter */}
      <div style={{ marginBottom: 20 }}>
        <div className="admin-period-toggle">
          {["all", "today", "week", "month", "year"].map((p) => (
            <button key={p} className={`admin-period-btn${period === p ? " active" : ""}`} onClick={() => setPeriod(p)}>
              {p === "all" ? "All Time" : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
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
            <div className="admin-stat-label">Platform Fee (10%)</div>
            <div className="admin-stat-value">₹{(summary.totalPlatformFee || 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon orange">📦</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Total Orders</div>
            <div className="admin-stat-value">{(summary.totalOrders || 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon purple">📊</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Avg Order Value</div>
            <div className="admin-stat-value">₹{(summary.avgOrderValue || 0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="admin-grid-2">
        <div className="admin-card">
          <div className="admin-card-header"><h3>Revenue & Platform Fee by Restaurant</h3></div>
          <div className="admin-card-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="revenue" fill="#16a34a" radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar dataKey="platformFee" fill="#2563eb" radius={[4, 4, 0, 0]} name="Platform Fee" />
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

      {/* Revenue Table */}
      <div className="admin-card">
        <div className="admin-card-header"><h3>Restaurant Revenue Rankings</h3></div>
        <div className="admin-card-body no-pad">
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Restaurant</th>
                  <th>Location</th>
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
                    <td style={{ color: "#64748b", fontSize: "0.8rem" }}>{r.location || r.city || "—"}</td>
                    <td>{r.orders}</td>
                    <td style={{ fontWeight: 600, color: "#16a34a" }}>₹{r.revenue.toLocaleString()}</td>
                    <td style={{ fontWeight: 600, color: "#2563eb" }}>₹{r.platformFee.toLocaleString()}</td>
                    <td>₹{r.avgOrderValue.toLocaleString()}</td>
                    <td>
                      <span className="admin-stars">{"★".repeat(Math.round(r.rating))}</span>
                      <span style={{ color: "#64748b", fontSize: "0.8rem", marginLeft: 4 }}>{r.rating || "—"}</span>
                    </td>
                    <td>
                      <span className={`admin-badge ${r.isOpen ? "success" : "neutral"}`}>
                        {r.isOpen ? "Open" : "Closed"}
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

/* ─────────────────────────────────────────────
   Dish & Category Trends Tab
   ───────────────────────────────────────────── */
function DishTrendsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dishes"); // dishes | categories

  useEffect(() => {
    fetchDishTrends()
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading"><div className="spinner"></div> Loading dish trends...</div>;
  if (!data) return <div className="admin-empty-state"><div className="icon">🍽️</div><p>Could not load dish data</p></div>;

  const { dishes, categoryTrends, monthlyData, topGainers, topDecliners } = data;

  return (
    <>
      {/* Toggle */}
      <div style={{ marginBottom: 20 }}>
        <div className="admin-period-toggle">
          <button className={`admin-period-btn${view === "dishes" ? " active" : ""}`} onClick={() => setView("dishes")}>Dishes</button>
          <button className={`admin-period-btn${view === "categories" ? " active" : ""}`} onClick={() => setView("categories")}>Categories</button>
        </div>
      </div>

      {/* Gainers & Decliners */}
      <div className="admin-grid-2" style={{ marginBottom: 24 }}>
        <div className="admin-card" style={{ borderLeft: "3px solid #16a34a" }}>
          <div className="admin-card-header"><h3>🔥 Top Gainers (This Month)</h3></div>
          <div className="admin-card-body no-pad">
            {topGainers.length === 0 ? (
              <div className="admin-empty-state"><p>No upward trending dishes</p></div>
            ) : (
              <table className="admin-table">
                <thead><tr><th>Dish</th><th>This Month</th><th>Last Month</th><th>Change</th></tr></thead>
                <tbody>
                  {topGainers.map((d) => (
                    <tr key={d._id}>
                      <td style={{ fontWeight: 500 }}>{d.name}</td>
                      <td>{d.currentMonthOrders}</td>
                      <td>{d.prevMonthOrders}</td>
                      <td><span className="admin-badge success">▲ {d.changePercent}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div className="admin-card" style={{ borderLeft: "3px solid #dc2626" }}>
          <div className="admin-card-header"><h3>📉 Top Decliners (This Month)</h3></div>
          <div className="admin-card-body no-pad">
            {topDecliners.length === 0 ? (
              <div className="admin-empty-state"><p>No declining dishes</p></div>
            ) : (
              <table className="admin-table">
                <thead><tr><th>Dish</th><th>This Month</th><th>Last Month</th><th>Change</th></tr></thead>
                <tbody>
                  {topDecliners.map((d) => (
                    <tr key={d._id}>
                      <td style={{ fontWeight: 500 }}>{d.name}</td>
                      <td>{d.currentMonthOrders}</td>
                      <td>{d.prevMonthOrders}</td>
                      <td><span className="admin-badge danger">▼ {Math.abs(d.changePercent)}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="admin-card">
        <div className="admin-card-header"><h3>Monthly Dish Order Volume (Last 6 Months)</h3></div>
        <div className="admin-card-body">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyData || []}>
              <defs>
                <linearGradient id="colorDish" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="totalDishesOrdered" stroke="#7c3aed" fill="url(#colorDish)" name="Dishes Ordered" />
              <Line type="monotone" dataKey="uniqueDishes" stroke="#f59e0b" name="Unique Dishes" dot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category view */}
      {view === "categories" && (
        <div className="admin-grid-2">
          <div className="admin-card">
            <div className="admin-card-header"><h3>Category Performance</h3></div>
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
            <div className="admin-card-header"><h3>Category Breakdown</h3></div>
            <div className="admin-card-body no-pad">
              <table className="admin-table">
                <thead>
                  <tr><th>Category</th><th>Dishes</th><th>This Month</th><th>Last Month</th><th>Trend</th></tr>
                </thead>
                <tbody>
                  {categoryTrends.map((c) => (
                    <tr key={c.category}>
                      <td style={{ fontWeight: 500 }}>{c.category}</td>
                      <td>{c.dishCount}</td>
                      <td>{c.currentMonthOrders}</td>
                      <td>{c.prevMonthOrders}</td>
                      <td>
                        <span className={`admin-badge ${c.trend === "up" ? "success" : c.trend === "down" ? "danger" : "neutral"}`}>
                          {c.trend === "up" ? "▲" : c.trend === "down" ? "▼" : "—"} {Math.abs(c.changePercent)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Dish-level table */}
      {view === "dishes" && (
        <div className="admin-card">
          <div className="admin-card-header"><h3>Individual Dish Trends</h3></div>
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
                    <th>Restaurants</th>
                  </tr>
                </thead>
                <tbody>
                  {dishes.map((d, i) => (
                    <tr key={d._id}>
                      <td>{i + 1}</td>
                      <td style={{ fontWeight: 500 }}>{d.name}</td>
                      <td><span className="admin-badge info">{d.category}</span></td>
                      <td>₹{d.price}</td>
                      <td>{d.currentMonthOrders}</td>
                      <td>{d.prevMonthOrders}</td>
                      <td>
                        <span className={`admin-badge ${d.trend === "up" ? "success" : d.trend === "down" ? "danger" : "neutral"}`}>
                          {d.trend === "up" ? "▲" : d.trend === "down" ? "▼" : "—"} {Math.abs(d.changePercent)}%
                        </span>
                      </td>
                      <td style={{ fontSize: "0.78rem", color: "#64748b" }}>{d.restaurants.join(", ") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────
   Top Customers Tab
   ───────────────────────────────────────────── */
function CustomersTab() {
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
  if (!data) return <div className="admin-empty-state"><div className="icon">👥</div><p>Could not load customer data</p></div>;

  const { customers, summary } = data;

  const barData = customers.slice(0, 10).map((c) => ({
    name: c.username.length > 10 ? c.username.slice(0, 10) + "…" : c.username,
    totalSpent: c.totalSpent,
    totalOrders: c.totalOrders,
    totalItems: c.totalItems,
  }));

  const pieData = customers.slice(0, 6).map((c) => ({
    name: c.username,
    value: c.totalSpent,
  }));

  return (
    <>
      {/* Period filter */}
      <div style={{ marginBottom: 20 }}>
        <div className="admin-period-toggle">
          {["all", "month", "quarter", "year"].map((p) => (
            <button key={p} className={`admin-period-btn${period === p ? " active" : ""}`} onClick={() => setPeriod(p)}>
              {p === "all" ? "All Time" : p === "quarter" ? "Last 3 Months" : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon blue">👥</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Active Customers</div>
            <div className="admin-stat-value">{summary.totalActiveCustomers}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon green">💵</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Total Spending</div>
            <div className="admin-stat-value">₹{(summary.totalCustomerSpend || 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon orange">📊</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Avg Spend/Customer</div>
            <div className="admin-stat-value">₹{(summary.avgSpendPerCustomer || 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon purple">🏆</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Top Spender</div>
            <div className="admin-stat-value" style={{ fontSize: "1.1rem" }}>
              {summary.topSpender ? `${summary.topSpender.username} (₹${summary.topSpender.totalSpent.toLocaleString()})` : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="admin-grid-2">
        <div className="admin-card">
          <div className="admin-card-header"><h3>Top Customers by Spending</h3></div>
          <div className="admin-card-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                <Bar dataKey="totalSpent" fill="#16a34a" radius={[0, 4, 4, 0]} name="Total Spent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header"><h3>Customer Revenue Share</h3></div>
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

      {/* Customer Table */}
      <div className="admin-card">
        <div className="admin-card-header"><h3>Customer Spending Leaderboard</h3></div>
        <div className="admin-card-body no-pad">
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Customer</th>
                  <th>Email</th>
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
                    <td style={{ fontWeight: 500 }}>{c.username}</td>
                    <td style={{ color: "#64748b", fontSize: "0.8rem" }}>{maskEmail(c.email)}</td>
                    <td>{c.totalOrders}</td>
                    <td>{c.totalItems}</td>
                    <td style={{ fontWeight: 600, color: "#16a34a" }}>₹{c.totalSpent.toLocaleString()}</td>
                    <td>₹{c.avgOrderValue.toLocaleString()}</td>
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

/* ─────────────────────────────────────────────
   Main Insights Component
   ───────────────────────────────────────────── */
export function AdminInsights() {
  const [activeTab, setActiveTab] = useState("employees");

  return (
    <>
      {/* Tab navigation */}
      <div className="admin-card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 0, borderBottom: "none", overflow: "auto" }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: "14px 20px",
                background: activeTab === tab.key ? "#2563eb" : "transparent",
                color: activeTab === tab.key ? "#fff" : "#64748b",
                border: "none",
                cursor: "pointer",
                fontWeight: activeTab === tab.key ? 600 : 400,
                fontSize: "0.875rem",
                fontFamily: "inherit",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                borderBottom: activeTab === tab.key ? "none" : "2px solid transparent",
                borderRadius: activeTab === tab.key ? "8px" : 0,
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "employees" && <EmployeeTab />}
      {activeTab === "revenue" && <RevenueTab />}
      {activeTab === "dishes" && <DishTrendsTab />}
      {activeTab === "customers" && <CustomersTab />}
    </>
  );
}
