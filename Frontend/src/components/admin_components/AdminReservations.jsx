import { useEffect, useState } from "react";
import { fetchReservations, fetchRestaurants } from "../../api/adminApi";

const STATUS_COLORS = {
  Pending: "warning",
  Confirmed: "info",
  confirmed: "info",
  Seated: "primary",
  seated: "primary",
  Completed: "success",
  completed: "success",
  Cancelled: "danger",
  cancelled: "danger",
  "No Show": "danger",
};

export function AdminReservations() {
  const [data, setData] = useState({ reservations: [], total: 0, page: 1, totalPages: 1, stats: {} });
  const [restaurants, setRestaurants] = useState([]);
  const [filters, setFilters] = useState({ status: "all", restaurant: "", date: "" });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurants().then(setRestaurants).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchReservations({ ...filters, page })
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filters, page]);

  const s = data.stats || {};

  return (
    <>
      {/* Stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon cyan">📅</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Total Reservations</div>
            <div className="admin-stat-value">{(s.totalReservations || 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon green">🟢</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Today's Reservations</div>
            <div className="admin-stat-value">{s.todayReservations || 0}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon purple">👥</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Total Guests</div>
            <div className="admin-stat-value">{(s.totalGuests || 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon orange">📊</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Avg Guests/Reservation</div>
            <div className="admin-stat-value">
              {s.totalReservations ? (s.totalGuests / s.totalReservations).toFixed(1) : "—"}
            </div>
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

      {/* Filters + Table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>All Reservations</h3>
          <div className="admin-filter-bar">
            <select className="admin-select" value={filters.status} onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1); }}>
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="confirmed">confirmed</option>
              <option value="Seated">Seated</option>
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
            <div className="admin-loading"><div className="spinner"></div> Loading reservations...</div>
          ) : data.reservations.length === 0 ? (
            <div className="admin-empty-state"><div className="icon">📅</div><p>No reservations found</p></div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Guests</th>
                    <th>Table</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.reservations.map((res) => (
                    <tr key={res._id}>
                      <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                        #{(res._id || "").slice(-6).toUpperCase()}
                      </td>
                      <td>{res.customerName || "—"}</td>
                      <td>{res.date ? new Date(res.date).toLocaleDateString() : "—"}</td>
                      <td>{res.time || "—"}</td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          👥 {res.guests || 1}
                        </span>
                      </td>
                      <td>{res.table_id || "—"}</td>
                      <td>
                        <span className={`admin-badge ${STATUS_COLORS[res.status] || "neutral"}`}>
                          {res.status || "Unknown"}
                        </span>
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
