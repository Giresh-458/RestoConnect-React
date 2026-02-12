import { useEffect, useState } from "react";
import { fetchFeedback, fetchRestaurants } from "../../api/adminApi";

export function AdminFeedback() {
  const [data, setData] = useState({ feedback: [], total: 0, page: 1, totalPages: 1, stats: {} });
  const [restaurants, setRestaurants] = useState([]);
  const [filters, setFilters] = useState({ status: "all", restaurant: "" });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurants().then(setRestaurants).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchFeedback({ ...filters, page })
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filters, page]);

  const s = data.stats || {};

  const renderStars = (rating) => {
    if (!rating) return <span style={{ color: "#94a3b8" }}>—</span>;
    return (
      <span className="admin-stars">
        {"★".repeat(Math.round(rating))}{"☆".repeat(5 - Math.round(rating))}
        <span style={{ color: "#64748b", fontSize: "0.8rem", marginLeft: 4 }}>{rating}</span>
      </span>
    );
  };

  return (
    <>
      {/* Stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon purple">⭐</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Total Reviews</div>
            <div className="admin-stat-value">{(s.totalFeedback || 0).toLocaleString()}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon green">🍽️</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Avg Dining Rating</div>
            <div className="admin-stat-value">{s.avgDiningRating || "—"}</div>
            <div className="admin-stat-change up">out of 5.0</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon blue">🧾</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Avg Order Rating</div>
            <div className="admin-stat-value">{s.avgOrderRating || "—"}</div>
            <div className="admin-stat-change up">out of 5.0</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon orange">⏳</div>
          <div className="admin-stat-info">
            <div className="admin-stat-label">Pending</div>
            <div className="admin-stat-value">{s.pending || 0}</div>
          </div>
        </div>
      </div>

      {/* Rating Visual Bar */}
      {(s.avgDiningRating > 0 || s.avgOrderRating > 0) && (
        <div className="admin-card" style={{ marginBottom: 20 }}>
          <div className="admin-card-body">
            <div style={{ display: "flex", gap: 40, alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "#f59e0b" }}>{s.avgDiningRating || "0.0"}</div>
                <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Dining Experience</div>
                <div className="admin-stars" style={{ fontSize: "1.2rem" }}>
                  {"★".repeat(Math.round(s.avgDiningRating || 0))}{"☆".repeat(5 - Math.round(s.avgDiningRating || 0))}
                </div>
              </div>
              <div style={{ width: 1, height: 60, background: "#e2e8f0" }}></div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", fontWeight: 700, color: "#2563eb" }}>{s.avgOrderRating || "0.0"}</div>
                <div style={{ fontSize: "0.85rem", color: "#64748b" }}>Order Quality</div>
                <div className="admin-stars" style={{ fontSize: "1.2rem" }}>
                  {"★".repeat(Math.round(s.avgOrderRating || 0))}{"☆".repeat(5 - Math.round(s.avgOrderRating || 0))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters + Table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>All Reviews</h3>
          <div className="admin-filter-bar">
            <select className="admin-select" value={filters.status} onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1); }}>
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
            </select>
            <select className="admin-select" value={filters.restaurant} onChange={(e) => { setFilters((f) => ({ ...f, restaurant: e.target.value })); setPage(1); }}>
              <option value="">All Restaurants</option>
              {restaurants.map((r) => (
                <option key={r._id} value={r._id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="admin-card-body no-pad">
          {loading ? (
            <div className="admin-loading"><div className="spinner"></div> Loading reviews...</div>
          ) : data.feedback.length === 0 ? (
            <div className="admin-empty-state"><div className="icon">⭐</div><p>No reviews found</p></div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Dining Rating</th>
                    <th>Order Rating</th>
                    <th>Loved Items</th>
                    <th>Feedback</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.feedback.map((fb) => (
                    <tr key={fb._id}>
                      <td style={{ fontWeight: 500 }}>{fb.customerName || "—"}</td>
                      <td>{renderStars(fb.diningRating)}</td>
                      <td>{renderStars(fb.orderRating)}</td>
                      <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {fb.lovedItems || "—"}
                      </td>
                      <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {fb.additionalFeedback || "—"}
                      </td>
                      <td>
                        <span className={`admin-badge ${fb.status === "Resolved" ? "success" : "warning"}`}>
                          {fb.status || "Pending"}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.82rem", color: "#64748b" }}>
                        {fb.createdAt ? new Date(fb.createdAt).toLocaleDateString() : "—"}
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
