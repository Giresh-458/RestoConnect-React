import { useEffect, useState } from "react";
import { isLogin } from "../util/auth";
import { redirect } from "react-router-dom";
import * as api from "../api/ownerApi";
import styles from "./OwnerReservations.module.css";

const FLOW_STEPS = ["pending", "confirmed", "seated", "completed"];
const STATUS_ACTIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["seated", "cancelled"],
  seated: ["completed"],
  completed: [],
  cancelled: [],
};
const STATUS_META = {
  pending:   { color: "#f59e0b", bg: "#fffbeb", icon: "⏳", label: "Pending" },
  confirmed: { color: "#10b981", bg: "#ecfdf5", icon: "✓",  label: "Confirmed" },
  seated:    { color: "#3b82f6", bg: "#eff6ff", icon: "🪑", label: "Seated" },
  completed: { color: "#6b7280", bg: "#f9fafb", icon: "✔",  label: "Completed" },
  cancelled: { color: "#ef4444", bg: "#fef2f2", icon: "✕",  label: "Cancelled" },
};
const ACTION_LABELS = {
  confirmed: { icon: "✓", label: "Confirm", desc: "Accept this reservation" },
  seated:    { icon: "🪑", label: "Seat Guest", desc: "Assign table & seat" },
  completed: { icon: "✔", label: "Complete", desc: "Mark visit complete" },
  cancelled: { icon: "✕", label: "Cancel", desc: "Cancel reservation" },
};

export function OwnerReservations() {
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [view, setView] = useState("upcoming");
  const [restInfo, setRestInfo] = useState({ name: "", cuisine: [], isOpen: true, operatingHours: {} });
  const [time] = useState(new Date());

  const [assignModal, setAssignModal] = useState(null);
  const [selectedTables, setSelectedTables] = useState([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [resData, floorData, settings] = await Promise.all([
        api.fetchReservations(),
        api.fetchLiveFloor(),
        api.fetchSettings(),
      ]);
      setReservations(Array.isArray(resData) ? resData : []);
      setTables(floorData.tables || []);
      if (settings) setRestInfo({ name: settings.name || "", cuisine: settings.cuisine || [], isOpen: settings.isOpen !== undefined ? settings.isOpen : true, operatingHours: settings.operatingHours || {} });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openAssignModal = (resId, targetStatus, guests) => {
    setSelectedTables([]);
    setAssignModal({ resId, targetStatus, guests });
  };

  const toggleTableSelection = (tableNum) => {
    setSelectedTables((prev) =>
      prev.includes(tableNum) ? prev.filter((n) => n !== tableNum) : [...prev, tableNum]
    );
  };

  const confirmAssign = async () => {
    if (!assignModal) return;
    const { resId, targetStatus } = assignModal;
    if (selectedTables.length === 0 && targetStatus === "seated") {
      alert("Please select at least one table to seat the customer.");
      return;
    }
    setUpdating(resId);
    setAssignModal(null);
    try {
      await api.updateReservationStatus(resId, targetStatus, selectedTables.length > 0 ? selectedTables : undefined);
      await load();
    } catch (e) { alert("Failed: " + e.message); }
    finally { setUpdating(null); }
  };

  const handleStatus = async (id, status) => {
    if (status === "confirmed" || status === "seated") {
      const res = reservations.find((r) => r._id === id);
      openAssignModal(id, status, res?.guests || 1);
      return;
    }
    setUpdating(id);
    try {
      await api.updateReservationStatus(id, status);
      await load();
    } catch (e) { alert("Failed: " + e.message); }
    finally { setUpdating(null); }
  };

  const now = new Date();
  const upcoming = reservations.filter((r) => new Date(r.date) >= new Date(now.toDateString()));
  const past = reservations.filter((r) => new Date(r.date) < new Date(now.toDateString()));
  const display = view === "upcoming" ? upcoming : past;
  const filtered = filter === "all" ? display : display.filter((r) => r.status === filter);

  const todayCount = reservations.filter((r) => new Date(r.date).toDateString() === now.toDateString()).length;
  const pendingCount = reservations.filter((r) => r.status === "pending").length;
  const seatedCount = reservations.filter((r) => r.status === "seated").length;
  const totalGuests = upcoming.reduce((sum, r) => sum + (r.guests || 0), 0);

  if (loading) {
    return <div className={styles.loader}><div className={styles.spinner} /><p>Loading reservations...</p></div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroLeft}>
          <h1 className={styles.heroTitle}>📋 Reservations</h1>
          {restInfo.name && <p className={styles.heroRestName}>{restInfo.name}</p>}
          <p className={styles.heroDate}>
            {time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            <span className={styles.heroTime}>{time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
          </p>
        </div>
        <div className={styles.heroRight}>
          <div className={`${styles.statusPill} ${restInfo.isOpen ? styles.statusOpen : styles.statusClosed}`}>
            <span className={styles.statusDot} />
            <span>{restInfo.isOpen ? "OPEN" : "CLOSED"}</span>
            <span className={styles.statusHours}>{restInfo.operatingHours?.open || "09:00"} - {restInfo.operatingHours?.close || "22:00"}</span>
          </div>
          <button className={styles.refreshBtnHero} onClick={load}>↻ Refresh</button>
        </div>
      </header>

      {/* Status Flow Guide */}
      <div className={styles.flowGuide}>
        <span className={styles.flowLabel}>Booking Flow:</span>
        {FLOW_STEPS.map((step, i) => (
          <span key={step} className={styles.flowStep}>
            <span className={styles.flowDot} style={{ background: STATUS_META[step].color }}>{STATUS_META[step].icon}</span>
            <span className={styles.flowText}>{STATUS_META[step].label}</span>
            {i < FLOW_STEPS.length - 1 && <span className={styles.flowArrow}>→</span>}
          </span>
        ))}
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={`${styles.statCard} ${styles.statToday}`}>
          <span className={styles.statIcon}>📅</span>
          <div><span className={styles.statVal}>{todayCount}</span><span className={styles.statLbl}>Today</span></div>
        </div>
        <div className={`${styles.statCard} ${styles.statPending}`}>
          <span className={styles.statIcon}>⏳</span>
          <div><span className={styles.statVal}>{pendingCount}</span><span className={styles.statLbl}>Need Action</span></div>
        </div>
        <div className={`${styles.statCard} ${styles.statSeated}`}>
          <span className={styles.statIcon}>🪑</span>
          <div><span className={styles.statVal}>{seatedCount}</span><span className={styles.statLbl}>Seated Now</span></div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statIcon}>👥</span>
          <div><span className={styles.statVal}>{totalGuests}</span><span className={styles.statLbl}>Expected Guests</span></div>
        </div>
      </div>

      {/* View Toggle + Filters */}
      <div className={styles.controls}>
        <div className={styles.viewToggle}>
          <button className={view === "upcoming" ? styles.active : ""} onClick={() => setView("upcoming")}>📅 Upcoming ({upcoming.length})</button>
          <button className={view === "past" ? styles.active : ""} onClick={() => setView("past")}>📜 Past ({past.length})</button>
        </div>
        <div className={styles.filterGroup}>
          <button className={`${styles.filterBtn} ${filter === "all" ? styles.activeFilter : ""}`} onClick={() => setFilter("all")}>All</button>
          {Object.keys(STATUS_ACTIONS).map((s) => (
            <button
              key={s}
              className={`${styles.filterBtn} ${filter === s ? styles.activeFilter : ""}`}
              style={filter === s ? { background: STATUS_META[s].color, borderColor: STATUS_META[s].color } : {}}
              onClick={() => setFilter(s)}
            >
              {STATUS_META[s].icon} {STATUS_META[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Reservations List */}
      <div className={styles.list}>
        {filtered.length === 0 && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📭</span>
            <p>No reservations found</p>
            <span className={styles.emptyHint}>Try a different filter or check back later</span>
          </div>
        )}
        {filtered.map((r) => {
          const actions = STATUS_ACTIONS[r.status] || [];
          const isToday = new Date(r.date).toDateString() === now.toDateString();
          const meta = STATUS_META[r.status];
          const stepIndex = FLOW_STEPS.indexOf(r.status);
          const isCancelled = r.status === "cancelled";

          return (
            <div
              key={r._id}
              className={`${styles.card} ${isToday ? styles.today : ""} ${isCancelled ? styles.cancelled : ""}`}
              style={{ "--card-color": meta.color }}
            >
              {/* Left: Date */}
              <div className={styles.cardLeft}>
                <div className={styles.dateBox}>
                  <span className={styles.dateDay}>{new Date(r.date).getDate()}</span>
                  <span className={styles.dateMonth}>{new Date(r.date).toLocaleString("en", { month: "short" })}</span>
                  <span className={styles.dateWeekday}>{new Date(r.date).toLocaleString("en", { weekday: "short" })}</span>
                </div>
                {isToday && <span className={styles.todayTag}>TODAY</span>}
              </div>

              {/* Center: Info + Progress */}
              <div className={styles.cardCenter}>
                <div className={styles.cardMain}>
                  <span className={styles.customerName}>{r.customerName}</span>
                  <span className={styles.statusBadge} style={{ background: meta.bg, color: meta.color }}>
                    {meta.icon} {meta.label}
                  </span>
                </div>

                <div className={styles.cardDetails}>
                  <span className={styles.detailChip}>🕐 {r.time}</span>
                  <span className={styles.detailChip}>👥 {r.guests} guest{r.guests !== 1 ? "s" : ""}</span>
                  {r.tables && r.tables.length > 0 && (
                    <span className={`${styles.detailChip} ${styles.tableChip}`}>🪑 Table {r.tables.join(", ")}</span>
                  )}
                </div>

                {/* Mini progress bar */}
                {!isCancelled && (
                  <div className={styles.progressBar}>
                    {FLOW_STEPS.map((step, i) => (
                      <div key={step} className={styles.progressStep}>
                        <div
                          className={`${styles.progressDot} ${i <= stepIndex ? styles.progressDone : ""}`}
                          style={i <= stepIndex ? { background: STATUS_META[step].color } : {}}
                        />
                        {i < FLOW_STEPS.length - 1 && (
                          <div className={`${styles.progressLine} ${i < stepIndex ? styles.progressLineDone : ""}`} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Actions */}
              <div className={styles.cardRight}>
                {actions.length > 0 ? (
                  <div className={styles.actions}>
                    {actions.map((a) => {
                      const act = ACTION_LABELS[a];
                      const isPrimary = a !== "cancelled";
                      return (
                        <button
                          key={a}
                          className={`${styles.actionBtn} ${isPrimary ? styles.actionPrimary : styles.actionDanger}`}
                          style={isPrimary ? { "--a-color": STATUS_META[a].color } : {}}
                          onClick={() => handleStatus(r._id, a)}
                          disabled={updating === r._id}
                          title={act.desc}
                        >
                          {updating === r._id ? "..." : <><span>{act.icon}</span> {act.label}</>}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <span className={styles.doneLabel}>{isCancelled ? "Cancelled" : "Done"}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Table Assignment Modal ─── */}
      {assignModal && (
        <div className={styles.modalOverlay} onClick={() => setAssignModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3>{assignModal.targetStatus === "seated" ? "🪑 Seat Customer" : "✓ Confirm & Assign Table"}</h3>
                <p className={styles.modalSubtitle}>
                  {assignModal.targetStatus === "seated"
                    ? "Choose which table(s) to seat the guest at"
                    : "Confirm the booking and optionally pre-assign a table"}
                </p>
              </div>
              <button className={styles.modalClose} onClick={() => setAssignModal(null)}>✕</button>
            </div>

            <div className={styles.modalGuestInfo}>
              <span className={styles.guestIcon}>👥</span>
              <span><strong>{assignModal.guests}</strong> guest{assignModal.guests !== 1 ? "s" : ""} need seating</span>
            </div>

            <div className={styles.tableLegend}>
              <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: "#10b981" }} /> Available</span>
              <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: "#f59e0b" }} /> Reserved</span>
              <span className={styles.legendItem}><span className={styles.legendDot} style={{ background: "#ef4444" }} /> Occupied</span>
            </div>

            <div className={styles.tablePickerGrid}>
              {tables.length === 0 && <p className={styles.emptyState}>No tables configured — add tables in Live Floor</p>}
              {tables.map((t) => {
                const isSelected = selectedTables.includes(t.number);
                const isAvailable = t.status === "Available" || t.status === "Reserved";
                return (
                  <button
                    key={t.number}
                    className={`${styles.tablePick} ${isSelected ? styles.tablePickSelected : ""} ${!isAvailable ? styles.tablePickOccupied : ""}`}
                    onClick={() => isAvailable && toggleTableSelection(t.number)}
                    disabled={!isAvailable}
                    title={`Table ${t.number} — ${t.seats} seats — ${t.status}`}
                  >
                    <span className={styles.tablePickIcon}>🍽️</span>
                    <span className={styles.tablePickNum}>T{t.number}</span>
                    <span className={styles.tablePickSeats}>{t.seats} seats</span>
                    <span className={styles.tablePickStatus} style={{ color: isAvailable ? "#10b981" : "#ef4444" }}>
                      {t.status}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedTables.length > 0 && (
              <div className={styles.selectedInfo}>
                <span>✓ Selected:</span> Table {selectedTables.join(", ")} — {tables.filter(t => selectedTables.includes(t.number)).reduce((s, t) => s + (t.seats || 0), 0)} total seats
              </div>
            )}

            {assignModal.targetStatus === "confirmed" && selectedTables.length === 0 && (
              <p className={styles.optionalHint}>💡 Table assignment is optional for confirmation. You can assign when seating.</p>
            )}

            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={() => setAssignModal(null)}>Cancel</button>
              <button className={styles.modalConfirm} onClick={confirmAssign}>
                {assignModal.targetStatus === "seated" ? "🪑 Seat Now" : "✓ Confirm Reservation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export async function loader() {
  const role = await isLogin();
  if (role !== "owner") return redirect("/login");
  return null;
}
