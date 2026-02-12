import { useEffect, useState } from "react";
import { fetchOrders, fetchRestaurants } from "../../api/adminApi";

const STATUS_COLORS = {
  Pending: "warning",
  Preparing: "info",
  "In Progress": "info",
  Ready: "primary",
  Served: "success",
  Completed: "success",
  Cancelled: "danger",
  Delivered: "success",
};

export function AdminOrders() {
  const [data, setData] = useState({ orders: [], total: 0, page: 1, totalPages: 1, stats: {} });
  const [restaurants, setRestaurants] = useState([]);
  const [filters, setFilters] = useState({ status: "all", restaurant: "", date: "" });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadOrders = () => {
    setLoading(true);
    fetchOrders({ ...filters, page })
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchRestaurants().then((r) => setRestaurants(r)).catch(console.error);
  }, []);

  useEffect(() => { loadOrders(); }, [filters, page]);

  const s = data.stats || {};

  return (
    <>
      {/* Stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon blue">🧾</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Total Orders</div>
            <div className="admin-stat-value">{(s.totalOrders || 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon green">📅</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Today's Orders</div>
            <div className="admin-stat-value">{s.todayOrders || 0}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon purple">💰</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Total Revenue</div>
            <div className="admin-stat-value">₹{(s.totalRevenue || 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon orange">📊</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Avg Order Value</div>
            <div className="admin-stat-value">₹{s.avgOrderValue || 0}</div>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      {s.statusBreakdown && Object.keys(s.statusBreakdown).length > 0 && (
        <div className="admin-card" style={{ marginBottom: 20 }}>
          <div className="admin-card-body" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {Object.entries(s.statusBreakdown).map(([status, count]) => (
              <span key={status} className={`admin-badge ${STATUS_COLORS[status] || "neutral"}`} style={{ padding: "6px 14px", fontSize: "0.82rem" }}>
                {status}: {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>All Orders</h3>
          <div className="admin-filter-bar">
            <select className="admin-select" value={filters.status} onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1); }}>
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Preparing">Preparing</option>
              <option value="Ready">Ready</option>
              <option value="Served">Served</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <select className="admin-select" value={filters.restaurant} onChange={(e) => { setFilters((f) => ({ ...f, restaurant: e.target.value })); setPage(1); }}>
              <option value="">All Restaurants</option>
              {restaurants.map((r) => (
                <option key={r._id} value={r._id}>{r.name}</option>
              ))}
            </select>
            <input type="date" className="admin-input" value={filters.date} onChange={(e) => { setFilters((f) => ({ ...f, date: e.target.value })); setPage(1); }} />
          </div>
        </div>
        <div className="admin-card-body no-pad">
          {loading ? (
            <div className="admin-loading"><div className="spinner"></div> Loading orders...</div>
          ) : data.orders.length === 0 ? (
            <div className="admin-empty-state"><div className="icon">🧾</div><p>No orders found</p></div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Restaurant</th>
                    <th>Table</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.orders.map((order) => (
                    <tr key={order._id}>
                      <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                        #{(order._id || "").slice(-6).toUpperCase()}
                      </td>
                      <td>{order.customerName || "—"}</td>
                      <td>{order.restaurant || "—"}</td>
                      <td>{order.tableNumber || order.table_id || "—"}</td>
                      <td>{order.dishes?.length || 0} items</td>
                      <td style={{ fontWeight: 600 }}>₹{order.totalAmount || 0}</td>
                      <td>
                        <span className={`admin-badge ${STATUS_COLORS[order.status] || "neutral"}`}>
                          {order.status || "Unknown"}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.82rem", color: "#64748b" }}>
                        {order.date ? new Date(order.date).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="admin-pagination">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <span className="page-info">Page {data.page} of {data.totalPages} ({data.total} total)</span>
          <button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      )}
    </>
  );
}
