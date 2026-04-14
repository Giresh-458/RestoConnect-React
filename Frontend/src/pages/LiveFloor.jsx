import { useEffect, useState } from "react";
import { isLogin } from "../util/auth";
import { redirect } from "react-router-dom";
import * as api from "../api/ownerApi";
import styles from "./LiveFloor.module.css";
import { useToast } from "../components/common/Toast";
import { useConfirm } from "../components/common/ConfirmDialog";

const TABLE_STATUSES = ["Available", "Occupied", "Reserved", "Cleaning"];
const STATUS_COLORS = { Available: "#10b981", Occupied: "#ef4444", Reserved: "#f59e0b", Cleaning: "#6366f1" };
const STATUS_ICONS = { Available: "🟢", Occupied: "🔴", Reserved: "🟡", Cleaning: "🟣" };

export function LiveFloor() {
  const [tables, setTables] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [todayReservations, setTodayReservations] = useState([]);
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showAddTable, setShowAddTable] = useState(false);
  const [newTable, setNewTable] = useState({ number: "", seats: "" });
  const [selectedTable, setSelectedTable] = useState(null);
  const [restInfo, setRestInfo] = useState({ name: "", cuisine: [], operatingHours: {} });
  const [time] = useState(new Date());
  const toast = useToast();
  const confirmDlg = useConfirm();

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const load = async () => {
    try {
      const [data, settings] = await Promise.all([api.fetchLiveFloor(), api.fetchSettings()]);
      setTables(data.tables || []);
      setActiveOrders(data.activeOrders || []);
      setTodayReservations(data.todayReservations || []);
      setIsOpen(data.isOpen !== undefined ? data.isOpen : true);
      if (settings) setRestInfo({ name: settings.name || "", cuisine: settings.cuisine || [], operatingHours: settings.operatingHours || {} });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleStatusChange = async (tableNum, newStatus) => {
    try {
      const result = await api.updateTableStatus(tableNum, newStatus);
      setTables(result.tables || []);
    } catch (e) { console.error(e); }
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!newTable.number || !newTable.seats) return;
    try {
      const result = await api.addTable(newTable.number, parseInt(newTable.seats));
      setTables(result.tables || []);
      setNewTable({ number: "", seats: "" });
      setShowAddTable(false);
    } catch (e) { toast.error(e.message || "Failed to add table"); }
  };

  const handleDeleteTable = async (number) => {
    const ok = await confirmDlg({ title: "Delete Table", message: `Delete Table ${number}?`, variant: "danger", confirmText: "Delete" });
    if (!ok) return;
    try {
      const result = await api.deleteTable(number);
      setTables(result.tables || []);
      setSelectedTable(null);
    } catch (e) { toast.error(e.message); }
  };

  const toggleRestaurant = async () => {
    try {
      await api.updateSettings({ isOpen: !isOpen });
      setIsOpen(!isOpen);
    } catch (e) { console.error(e); }
  };

  const getTableOrders = (tableNum) =>
    activeOrders.filter((o) => o.tableNumber === String(tableNum));

  const getTableReservation = (tableNum) =>
    todayReservations.find(
      (r) => r.tables && r.tables.includes(String(tableNum)) && r.status !== "completed"
    );

  const stats = {
    total: tables.length,
    available: tables.filter((t) => t.status === "Available").length,
    occupied: tables.filter((t) => t.status === "Occupied").length,
    reserved: tables.filter((t) => t.status === "Reserved").length,
    cleaning: tables.filter((t) => t.status === "Cleaning").length,
  };

  const occupancyRate = stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0;

  if (loading) {
    return <div className={styles.loader}><div className={styles.spinner} /><p>Loading floor...</p></div>;
  }

  return (
    <div className={styles.page}>
      {/* ─── Hero Header ─── */}
      <header className={styles.hero}>
        <div className={styles.heroLeft}>
          <h1 className={styles.heroTitle}>🍽️ Live Floor</h1>
          {restInfo.name && <p className={styles.heroRestName}>{restInfo.name}</p>}
          <p className={styles.heroDate}>
            {time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            <span className={styles.heroTime}>{time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
          </p>
        </div>
        <div className={styles.heroRight}>
          <div className={`${styles.statusPill} ${isOpen ? styles.statusOpen : styles.statusClosed}`}>
            <span className={styles.statusDot} />
            <span>{isOpen ? "OPEN" : "CLOSED"}</span>
            <span className={styles.statusHours}>{restInfo.operatingHours?.open || "09:00"} - {restInfo.operatingHours?.close || "22:00"}</span>
          </div>
          <button
            className={`${styles.toggleBtn} ${isOpen ? styles.toggleClose : styles.toggleOpen}`}
            onClick={toggleRestaurant}
          >
            {isOpen ? "Close Now" : "Open Now"}
          </button>
          <button className={styles.addBtnHero} onClick={() => setShowAddTable(!showAddTable)}>+ Add Table</button>
          <button className={styles.refreshBtnHero} onClick={load}>↻</button>
        </div>
      </header>

      {/* Legend + Quick Stats */}
      <div className={styles.statsBar}>
        <div className={styles.occupancy}>
          <div className={styles.occupancyBar}>
            <div className={styles.occupancyFill} style={{ width: `${occupancyRate}%` }} />
          </div>
          <span className={styles.occupancyLabel}>{occupancyRate}% occupied</span>
        </div>
        <div className={styles.legendGroup}>
          {TABLE_STATUSES.map((st) => (
            <div key={st} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: STATUS_COLORS[st] }} />
              <span className={styles.legendCount}>{stats[st.toLowerCase()]}</span>
              <span className={styles.legendText}>{st}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add Table Form */}
      {showAddTable && (
        <form className={styles.addForm} onSubmit={handleAddTable}>
          <span className={styles.addFormLabel}>New Table:</span>
          <input placeholder="Table Number" value={newTable.number} onChange={(e) => setNewTable({ ...newTable, number: e.target.value })} required />
          <input placeholder="Seats" type="number" min="1" value={newTable.seats} onChange={(e) => setNewTable({ ...newTable, seats: e.target.value })} required />
          <button type="submit">Add</button>
          <button type="button" onClick={() => setShowAddTable(false)} className={styles.cancelBtn}>Cancel</button>
        </form>
      )}

      {/* ─── Floor Grid ─── */}
      <section className={styles.floorSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>📐 Table Layout</h2>
          <span className={styles.sectionHint}>Click a table to change its status or remove it</span>
        </div>

        <div className={styles.floorGrid}>
          {tables.length === 0 && (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🪑</span>
              <p>No tables yet</p>
              <span className={styles.emptyHint}>Click "+ Add Table" above to set up your floor plan</span>
            </div>
          )}
          {tables.map((table) => {
            const orders = getTableOrders(table.number);
            const reservation = getTableReservation(table.number);
            const isSelected = selectedTable === table.number;
            const color = STATUS_COLORS[table.status] || "#9ca3af";

            return (
              <div
                key={table.number}
                className={`${styles.tableCard} ${isSelected ? styles.selected : ""}`}
                style={{ "--table-color": color }}
                onClick={() => setSelectedTable(isSelected ? null : table.number)}
              >
                {/* Status indicator strip */}
                <div className={styles.tableStrip} style={{ background: color }} />

                <div className={styles.tableBody}>
                  <div className={styles.tableTop}>
                    <span className={styles.tableNum}>T{table.number}</span>
                    <span className={styles.tableSeats}>
                      <span className={styles.seatIcon}>💺</span> {table.seats}
                    </span>
                  </div>

                  <div className={styles.tableStatusRow}>
                    <span className={styles.tableStatusDot} style={{ background: color }} />
                    <span className={styles.tableStatusText} style={{ color }}>{table.status}</span>
                  </div>

                  {/* Linked order */}
                  {orders.length > 0 && (
                    <div className={styles.tableInfo}>
                      {orders.map((o) => (
                        <div key={o._id} className={styles.infoRow}>
                          <span className={styles.infoIcon}>🧾</span>
                          <span className={styles.infoText}>{o.customerName}</span>
                          <span className={styles.infoBadge}>{o.status}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Linked reservation */}
                  {reservation && (
                    <div className={styles.tableResInfo}>
                      <span className={styles.infoIcon}>📅</span>
                      <span className={styles.infoText}>{reservation.customerName} • {reservation.time}</span>
                    </div>
                  )}
                </div>

                {/* Expanded actions when selected */}
                {isSelected && (
                  <div className={styles.tableActions} onClick={(e) => e.stopPropagation()}>
                    <span className={styles.actionsLabel}>Change status:</span>
                    <div className={styles.statusButtons}>
                      {TABLE_STATUSES.map((st) => (
                        <button
                          key={st}
                          className={`${styles.statusBtn} ${table.status === st ? styles.current : ""}`}
                          style={{ "--btn-color": STATUS_COLORS[st] }}
                          onClick={() => handleStatusChange(table.number, st)}
                          disabled={table.status === st}
                        >
                          {STATUS_ICONS[st]} {st}
                        </button>
                      ))}
                    </div>
                    <button className={styles.deleteTableBtn} onClick={() => handleDeleteTable(table.number)}>🗑️ Remove Table</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Today's Reservations ─── */}
      {todayReservations.length > 0 && (
        <section className={styles.sideSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>📅 Today's Reservations ({todayReservations.length})</h2>
            <span className={styles.sectionHint}>Bookings scheduled for today</span>
          </div>
          <div className={styles.reservationsList}>
            {todayReservations.map((r) => (
              <div key={r._id} className={styles.resCard}>
                <div className={styles.resTime}>{r.time}</div>
                <div className={styles.resInfo}>
                  <span className={styles.resName}>{r.customerName}</span>
                  <span className={styles.resGuests}>👥 {r.guests} guest{r.guests !== 1 ? "s" : ""}</span>
                  {r.tables && r.tables.length > 0 && (
                    <span className={styles.resTable}>🪑 Table {r.tables.join(", ")}</span>
                  )}
                </div>
                <span className={`${styles.resBadge} ${styles["badge_" + r.status]}`}>{r.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Active Orders ─── */}
      {activeOrders.length > 0 && (
        <section className={styles.sideSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>🧾 Active Orders ({activeOrders.length})</h2>
            <span className={styles.sectionHint}>In-progress orders across tables</span>
          </div>
          <div className={styles.ordersList}>
            {activeOrders.map((o) => (
              <div key={o._id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <span className={styles.orderCustomer}>{o.customerName}</span>
                  <span className={`${styles.resBadge} ${styles["badge_" + o.status]}`}>{o.status}</span>
                </div>
                <div className={styles.orderMeta}>
                  <span className={styles.orderTable}>🪑 Table {o.tableNumber || "N/A"}</span>
                  <span className={styles.orderAmount}>₹{o.totalAmount}</span>
                </div>
                <div className={styles.orderDishes}>
                  {o.dishes && o.dishes.filter(Boolean).map((d, i) => (
                    <span key={i} className={styles.dishTag}>
                      {typeof d === "string" ? d : d.name || "Dish"}
                      {d.quantity > 1 ? ` ×${d.quantity}` : ""}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export async function loader() {
  const role = await isLogin();
  if (role !== "owner") return redirect("/login");
  return null;
}
