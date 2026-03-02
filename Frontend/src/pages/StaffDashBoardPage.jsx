import React, { useEffect, useState, useCallback, useMemo } from "react";
import { redirect, useNavigate } from "react-router-dom";
import { isLogin, logout } from "../util/auth";
import { useToast } from "../components/common/Toast";
import { useConfirm } from "../components/common/ConfirmDialog";
import "./StaffDashBoardPage.css";
import {
  FaUtensils, FaCog, FaSignOutAlt, FaClock, FaCheckCircle,
  FaExclamationTriangle, FaUsers, FaChair, FaClipboardList,
  FaBell, FaConciergeBell, FaCalendarCheck, FaTasks, FaWarehouse,
  FaHome, FaThLarge, FaChartBar, FaPlus, FaTimes, FaArrowRight,
  FaFire, FaCheck, FaBars, FaChevronLeft, FaStar, FaSearch,
  FaSync, FaBroom, FaLock, FaTrash, FaEye, FaBoxOpen, FaGlobe
} from "react-icons/fa";
import { staffApi } from "../api/supportApi";
import { SupportChatPage } from "./SupportChatPage";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr).getTime()) / 60000;
  if (diff < 1) return "just now";
  if (diff < 60) return `${Math.round(diff)}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ${Math.round(diff % 60)}m ago`;
  return new Date(dateStr).toLocaleDateString();
}

function timeUntil(dateStr) {
  if (!dateStr) return "";
  const diff = (new Date(dateStr).getTime() - Date.now()) / 60000;
  if (diff < -5) return `${Math.abs(Math.round(diff))}m overdue`;
  if (diff < 0) return "arriving now";
  if (diff < 60) return `in ${Math.round(diff)}m`;
  return `in ${Math.floor(diff / 60)}h ${Math.round(diff % 60)}m`;
}

function formatCurrency(amount) {
  return `₹${(amount || 0).toLocaleString('en-IN')}`;
}

/** Combine a reservation's date + time fields into a proper Date object */
function parseReservationDateTime(r) {
  if (!r) return null;
  // If date exists, combine date + time
  if (r.date) {
    const dateStr = r.date instanceof Date ? r.date.toISOString().split('T')[0]
      : typeof r.date === 'string' && r.date.includes('T') ? r.date.split('T')[0]
      : String(r.date);
    if (r.time && /^\d{1,2}:\d{2}/.test(r.time)) {
      const combined = new Date(`${dateStr}T${r.time}`);
      if (!isNaN(combined.getTime())) return combined;
    }
    const fallback = new Date(r.date);
    if (!isNaN(fallback.getTime())) return fallback;
  }
  // Try time as full ISO string
  if (r.time) {
    const d = new Date(r.time);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

/** Display just the time portion of a reservation */
function formatReservationTime(r) {
  // If time is already a readable string like "14:30", format it directly
  if (r.time && /^\d{1,2}:\d{2}$/.test(r.time)) {
    const [h, m] = r.time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
  }
  const dt = parseReservationDateTime(r);
  if (dt) return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return r.time || 'N/A';
}

const NAV_ITEMS = [
  { id: 'command', icon: <FaThLarge />, label: 'Command Center' },
  { id: 'orders', icon: <FaUtensils />, label: 'Orders' },
  { id: 'tables', icon: <FaChair />, label: 'Floor Plan' },
  { id: 'reservations', icon: <FaCalendarCheck />, label: 'Reservations' },
  { id: 'inventory', icon: <FaWarehouse />, label: 'Inventory' },
  { id: 'tasks', icon: <FaTasks />, label: 'Tasks' },
  { id: 'support', icon: <FaConciergeBell />, label: 'Support' },
];

const ORDER_FLOW = ['pending', 'preparing', 'ready', 'served'];
const ORDER_COLUMNS = {
  new: { label: 'New Orders', color: '#f59e0b', statuses: ['pending', 'active', 'waiting'] },
  preparing: { label: 'Preparing', color: '#3b82f6', statuses: ['preparing'] },
  ready: { label: 'Ready to Serve', color: '#10b981', statuses: ['ready'] },
  served: { label: 'Served', color: '#8b5cf6', statuses: ['served', 'done', 'completed'] },
};

const TABLE_STATUSES = {
  Available: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Free', icon: '🟢' },
  Occupied: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Occupied', icon: '🔴' },
  Allocated: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: 'Reserved', icon: '🔵' },
  Reserved: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: 'Reserved', icon: '🔵' },
  Cleaning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Cleaning', icon: '🟡' },
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════
export function StaffDashBoardPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  // ─── STATE ───
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('command');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [newTable, setNewTable] = useState({ number: '', capacity: '' });
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });
  const [selectedTableForRes, setSelectedTableForRes] = useState({});
  const [orderFilter, setOrderFilter] = useState('all');
  const [inventoryFilter, setInventoryFilter] = useState('all');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const resp = await fetch("http://localhost:3000/staff/DashboardData", {
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${resp.status}`);
      }

      const json = await resp.json();
      setData(json);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      if (!silent) setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 20000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const stats = useMemo(() => {
    if (!data) return {};
    const ts = data.todayStats || {};
    const tables = data.allTables || [];
    const occupied = tables.filter(t => t.status !== 'Available').length;
    return {
      activeOrders: ts.activeOrders || 0,
      completedOrders: ts.completedOrders || 0,
      totalOrders: ts.totalOrders || 0,
      revenue: ts.revenue || 0,
      occupiedTables: occupied,
      totalTables: tables.length,
      availableTables: tables.length - occupied,
      totalGuests: ts.totalGuests || 0,
      avgServeTime: ts.avgServeTime || 0,
      pendingReservations: ts.pendingReservations || 0,
      totalReservations: ts.totalReservations || 0,
      lowStockCount: (data.inventoryStatus || []).filter(i => i.status === 'Low Stock').length,
      outOfStockCount: (data.inventoryStatus || []).filter(i => i.status === 'Out of Stock').length,
      pendingTasks: (data.staffTasks || []).filter(t => t.status === 'Pending').length,
    };
  }, [data]);

  const ordersByColumn = useMemo(() => {
    if (!data) return { new: [], preparing: [], ready: [], served: [] };
    const today = new Date();
    const startOfDay = new Date(today); startOfDay.setHours(0, 0, 0, 0);
    const todayOrders = (data.orders || []).filter(o => {
      const d = new Date(o.date || o.createdAt);
      return d >= startOfDay;
    });
    const cols = { new: [], preparing: [], ready: [], served: [] };
    todayOrders.forEach(o => {
      const s = (o.status || '').toLowerCase();
      if (['pending', 'active', 'waiting'].includes(s)) cols.new.push(o);
      else if (s === 'preparing') cols.preparing.push(o);
      else if (s === 'ready') cols.ready.push(o);
      else if (['served', 'done', 'completed'].includes(s)) cols.served.push(o);
    });
    return cols;
  }, [data]);

  const tableStatusByNumber = useMemo(() => {
    const map = new Map();
    (data?.allTables || []).forEach((table) => {
      map.set(String(table.number), table.status || 'Available');
    });
    return map;
  }, [data]);

  const reservationTableById = useMemo(() => {
    const map = new Map();
    (data?.reservations || []).forEach((reservation) => {
      const table = reservation.table_id || reservation.tables?.[0] || null;
      if (reservation?._id && table) {
        map.set(String(reservation._id), String(table));
      }
    });
    return map;
  }, [data]);

  const getOrderTableNumber = useCallback((order) => {
    const direct = order?.tableNumber || order?.table_id;
    if (direct && String(direct).trim()) return String(direct);

    const fromReservation = order?.reservation_id
      ? reservationTableById.get(String(order.reservation_id))
      : null;
    return fromReservation || null;
  }, [reservationTableById]);

  const getFeedbackRating = useCallback((feedbackItem) => {
    const rawRating = feedbackItem?.rating ?? feedbackItem?.diningRating ?? feedbackItem?.orderRating ?? 0;
    const numericRating = Number(rawRating) || 0;
    return Math.max(0, Math.min(5, numericRating));
  }, []);

  const filteredInventory = useMemo(() => {
    if (!data) return [];
    let items = data.inventoryStatus || [];
    if (inventoryFilter === 'low') items = items.filter(i => i.status === 'Low Stock');
    else if (inventoryFilter === 'out') items = items.filter(i => i.status === 'Out of Stock');
    else if (inventoryFilter === 'ok') items = items.filter(i => i.status === 'Available');
    return items;
  }, [data, inventoryFilter]);

  const alerts = useMemo(() => {
    if (!data) return [];
    const list = [];
    (data.inventoryStatus || []).forEach(i => {
      if (i.status === 'Out of Stock') {
        list.push({ type: 'critical', icon: '📦', msg: `${i.item} is OUT OF STOCK` });
      } else if (i.status === 'Low Stock') {
        list.push({ type: 'warning', icon: '📦', msg: `${i.item} is running low (${i.quantity})` });
      }
    });
    const now = Date.now();
    (data.reservations || []).forEach(r => {
      if (!r.allocated && r.status !== 'cancelled') {
        const resDt = parseReservationDateTime(r);
        const rTime = resDt ? resDt.getTime() : NaN;
        if (isNaN(rTime)) return;
        const mins = Math.round((rTime - now) / 60000);
        if (mins > 0 && mins <= 30) {
          list.push({ type: 'warning', icon: '📅', msg: `${r.customerName} (${r.guests} guests) arriving in ${mins}m — no table assigned` });
        } else if (mins <= 0 && mins >= -15) {
          list.push({ type: 'critical', icon: '📅', msg: `${r.customerName} reservation overdue by ${Math.abs(mins)}m — no table!` });
        }
      }
    });
    return list.sort((a, b) => (a.type === 'critical' ? -1 : 1));
  }, [data]);

  const handleLogout = async () => {
    try { await logout(); } catch (e) { console.error(e); }
    navigate('/login');
  };

  const handleOrderStatus = async (orderId, newStatus) => {
    setProcessingId(orderId);
    try {
      const resp = await fetch("http://localhost:3000/staff/Dashboard/update-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      if (!resp.ok) throw new Error("Failed to update order");
      await fetchData(true);
    } catch (err) { toast.error(err.message); }
    finally { setProcessingId(null); }
  };

  const handleTableStatus = async (tableNumber, newStatus) => {
    setProcessingId(`table-${tableNumber}`);
    try {
      const resp = await fetch("http://localhost:3000/staff/tables/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tableNumber: String(tableNumber), status: newStatus }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update table");
      }
      await fetchData(true);
    } catch (err) { toast.error(err.message); }
    finally { setProcessingId(null); }
  };

  const handleAssignTable = async (reservationId) => {
    const tableNumber = selectedTableForRes[reservationId];
    if (!tableNumber) { toast.warn('Select a table first'); return; }
    setProcessingId(`res-${reservationId}`);
    try {
      const resp = await fetch("http://localhost:3000/staff/Dashboard/allocate-table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reservationId: String(reservationId), tableNumber: String(tableNumber) }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Failed to assign table");
      }
      setSelectedTableForRes(prev => { const n = { ...prev }; delete n[reservationId]; return n; });
      await fetchData(true);
    } catch (err) { toast.error(err.message); }
    finally { setProcessingId(null); }
  };

  const handleRemoveReservation = async (id) => {
    const ok = await confirm({ title: "Remove Reservation", message: "Remove this reservation and free the table?", variant: "warning", confirmText: "Remove" });
    if (!ok) return;
    setProcessingId(`res-del-${id}`);
    try {
      const resp = await fetch(`http://localhost:3000/staff/Dashboard/remove-reservation/${id}`, {
        method: "DELETE", credentials: "include",
      });
      if (!resp.ok) throw new Error("Failed to remove reservation");
      await fetchData(true);
    } catch (err) { toast.error(err.message); }
    finally { setProcessingId(null); }
  };

  const handleTaskComplete = async (taskId) => {
    setProcessingId(`task-${taskId}`);
    try {
      const resp = await fetch(`http://localhost:3000/staff/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: 'Completed' }),
      });
      if (!resp.ok) throw new Error("Failed to update task");
      await fetchData(true);
    } catch (err) { toast.error(err.message); }
    finally { setProcessingId(null); }
  };

  const handleAddTable = async () => {
    if (!newTable.number || !newTable.capacity) { toast.warn('Enter table number and capacity'); return; }
    setProcessingId('add-table');
    try {
      const resp = await fetch("http://localhost:3000/staff/add-table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ number: parseInt(newTable.number), capacity: parseInt(newTable.capacity) }),
      });
      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error || "Failed to add table");
      setNewTable({ number: '', capacity: '' });
      await fetchData(true);
    } catch (err) { toast.error(err.message); }
    finally { setProcessingId(null); }
  };

  const handleDeleteTable = async (num) => {
    const ok = await confirm({ title: `Delete Table ${num}`, message: "Are you sure you want to delete this table?", variant: "danger", confirmText: "Delete" });
    if (!ok) return;
    setProcessingId(`del-table-${num}`);
    try {
      const resp = await fetch(`http://localhost:3000/staff/tables/${num}`, {
        method: "DELETE", credentials: "include",
      });
      if (!resp.ok) throw new Error("Failed to delete table");
      await fetchData(true);
    } catch (err) { toast.error(err.message); }
    finally { setProcessingId(null); }
  };

  const handlePasswordChange = async () => {
    if (!passwords.old || !passwords.new) { toast.warn('Fill in all fields'); return; }
    if (passwords.new !== passwords.confirm) { toast.warn('Passwords do not match'); return; }
    try {
      const resp = await fetch('http://localhost:3000/staff/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword: passwords.old, newPassword: passwords.new }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Failed to change password');
      }
      toast.success('Password changed successfully!');
      setPasswords({ old: '', new: '', confirm: '' });
      setShowSettings(false);
    } catch (err) { toast.error(err.message); }
  };

  // ─── ORDER CARD SUB-COMPONENT ───
  const OrderCard = ({ order }) => {
    const status = (order.status || '').toLowerCase();
    const currentIdx = ORDER_FLOW.indexOf(status);
    const nextStatus = currentIdx >= 0 && currentIdx < ORDER_FLOW.length - 1 ? ORDER_FLOW[currentIdx + 1] : null;
    const elapsed = timeAgo(order.orderTime || order.date);
    const isProcessing = processingId === order._id;
    const resolvedTableNumber = getOrderTableNumber(order);
    const tableStatus = resolvedTableNumber ? tableStatusByNumber.get(String(resolvedTableNumber)) : null;
    const isDineInOrder = Boolean(resolvedTableNumber);
    const canMarkServed = !isDineInOrder || tableStatus === 'Occupied' || tableStatus === 'Allocated';
    const disableNextAction = isProcessing || (nextStatus === 'served' && !canMarkServed);

    const nextLabels = { preparing: '🔥 Start Cooking', ready: '✅ Mark Ready', served: '🍽️ Serve' };

    return (
      <div className={`sd-order-card sd-order-${status}`}>
        <div className="sd-order-top">
          <span className="sd-order-id">#{String(order._id).slice(-4)}</span>
          <span className="sd-order-elapsed">{elapsed}</span>
        </div>
        <div className="sd-order-table-num">
          <FaChair /> Table {resolvedTableNumber || 'N/A'}
        </div>
        <div className="sd-order-dishes">
          {(order.dishes || []).slice(0, 4).map((d, i) => (
            <span key={i} className="sd-dish-tag">{d}</span>
          ))}
          {(order.dishes || []).length > 4 && (
            <span className="sd-dish-more">+{order.dishes.length - 4}</span>
          )}
        </div>
        <div className="sd-order-bottom">
          <span className="sd-order-customer">{order.customerName || 'Walk-in'}</span>
          {order.totalAmount > 0 && (
            <span className="sd-order-amount">{formatCurrency(order.totalAmount)}</span>
          )}
        </div>
        {nextStatus && (
          <button
            className="sd-order-action-btn"
            disabled={disableNextAction}
            onClick={() => handleOrderStatus(order._id, nextStatus)}
          >
            {isProcessing
              ? <span className="sd-spinner-sm" />
              : (nextStatus === 'served' && !canMarkServed)
                ? '⏳ Awaiting Arrival'
                : (nextLabels[nextStatus] || `→ ${nextStatus}`)
            }
          </button>
        )}
        {!nextStatus && !['served', 'done', 'completed'].includes(status) && (
          <button
            className="sd-order-action-btn"
            disabled={isProcessing}
            onClick={() => handleOrderStatus(order._id, 'done')}
          >
            {isProcessing ? <span className="sd-spinner-sm" /> : '✓ Complete'}
          </button>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════
  // RENDER SECTIONS
  // ═══════════════════════════════════════════

  // ─── COMMAND CENTER ───
  const renderCommandCenter = () => (
    <div className="sd-command">
      {/* Alert Banner */}
      {alerts.filter(a => a.type === 'critical').length > 0 && (
        <div className="sd-alert-banner">
          <span className="sd-alert-banner-icon">🚨</span>
          <div className="sd-alert-banner-msgs">
            {alerts.filter(a => a.type === 'critical').map((a, i) => (
              <span key={i}>{a.msg}</span>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="sd-stats-grid">
        <div className="sd-stat-card sd-stat-blue" onClick={() => setActiveSection('orders')}>
          <div className="sd-stat-icon-wrap"><FaUtensils /></div>
          <div className="sd-stat-info">
            <span className="sd-stat-value">{stats.activeOrders}</span>
            <span className="sd-stat-label">Active Orders</span>
          </div>
        </div>
        <div className="sd-stat-card sd-stat-green" onClick={() => setActiveSection('tables')}>
          <div className="sd-stat-icon-wrap"><FaChair /></div>
          <div className="sd-stat-info">
            <span className="sd-stat-value">{stats.occupiedTables}/{stats.totalTables}</span>
            <span className="sd-stat-label">Tables Occupied</span>
            <span className="sd-stat-sub">{stats.availableTables} free</span>
          </div>
        </div>
        <div className="sd-stat-card sd-stat-purple">
          <div className="sd-stat-icon-wrap"><FaUsers /></div>
          <div className="sd-stat-info">
            <span className="sd-stat-value">{stats.totalGuests}</span>
            <span className="sd-stat-label">Guests Dining</span>
          </div>
        </div>
        <div className="sd-stat-card sd-stat-amber" onClick={() => setActiveSection('reservations')}>
          <div className="sd-stat-icon-wrap"><FaCalendarCheck /></div>
          <div className="sd-stat-info">
            <span className="sd-stat-value">{stats.pendingReservations}</span>
            <span className="sd-stat-label">Pending Reservations</span>
            <span className="sd-stat-sub">{stats.totalReservations} total today</span>
          </div>
        </div>
        <div className="sd-stat-card sd-stat-emerald">
          <div className="sd-stat-icon-wrap"><FaChartBar /></div>
          <div className="sd-stat-info">
            <span className="sd-stat-value">{formatCurrency(stats.revenue)}</span>
            <span className="sd-stat-label">Today's Revenue</span>
            <span className="sd-stat-sub">{stats.completedOrders} orders done</span>
          </div>
        </div>
        <div className="sd-stat-card sd-stat-rose">
          <div className="sd-stat-icon-wrap"><FaClock /></div>
          <div className="sd-stat-info">
            <span className="sd-stat-value">{stats.avgServeTime}m</span>
            <span className="sd-stat-label">Avg Serve Time</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="sd-command-grid">
        {/* Live Order Queue Mini */}
        <div className="sd-card sd-command-orders">
          <div className="sd-card-header">
            <h3><FaFire className="sd-icon-fire" /> Live Orders</h3>
            <button className="sd-link-btn" onClick={() => setActiveSection('orders')}>
              View All <FaArrowRight />
            </button>
          </div>
          <div className="sd-mini-order-cols">
            {Object.entries(ORDER_COLUMNS).filter(([k]) => k !== 'served').map(([key, col]) => (
              <div key={key} className="sd-mini-col">
                <div className="sd-mini-col-header" style={{ borderColor: col.color }}>
                  <span className="sd-mini-col-dot" style={{ background: col.color }} />
                  {col.label} ({ordersByColumn[key]?.length || 0})
                </div>
                <div className="sd-mini-col-body">
                  {(ordersByColumn[key] || []).slice(0, 3).map(o => (
                    <div key={o._id} className="sd-mini-order">
                      <span className="sd-mini-order-id">#{String(o._id).slice(-4)}</span>
                      <span className="sd-mini-order-table">T{getOrderTableNumber(o) || '?'}</span>
                      <span className="sd-mini-order-time">{timeAgo(o.orderTime || o.date)}</span>
                    </div>
                  ))}
                  {(ordersByColumn[key] || []).length === 0 && (
                    <div className="sd-mini-empty">No orders</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Table Overview Mini */}
        <div className="sd-card sd-command-tables">
          <div className="sd-card-header">
            <h3><FaChair /> Floor Overview</h3>
            <button className="sd-link-btn" onClick={() => setActiveSection('tables')}>
              View All <FaArrowRight />
            </button>
          </div>
          <div className="sd-mini-table-grid">
            {(data?.allTables || []).map(t => {
              const cfg = TABLE_STATUSES[t.status] || TABLE_STATUSES.Available;
              return (
                <div key={t.number} className="sd-mini-table" style={{ borderColor: cfg.color, background: cfg.bg }}>
                  <span className="sd-mini-table-num" style={{ color: cfg.color }}>T{t.number}</span>
                  <span className="sd-mini-table-seats">{t.seats}s</span>
                  <span className="sd-mini-table-status">{cfg.icon}</span>
                </div>
              );
            })}
            {(data?.allTables || []).length === 0 && <div className="sd-mini-empty">No tables configured</div>}
          </div>
          <div className="sd-table-legend">
            {Object.entries(TABLE_STATUSES).filter(([k]) => !['Reserved'].includes(k)).map(([key, cfg]) => (
              <span key={key} className="sd-legend-item">
                <span className="sd-legend-dot" style={{ background: cfg.color }} />
                {cfg.label}
              </span>
            ))}
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="sd-card sd-command-alerts">
          <div className="sd-card-header">
            <h3><FaBell /> Alerts & Notifications</h3>
            <span className="sd-badge">{alerts.length}</span>
          </div>
          <div className="sd-alerts-list">
            {alerts.length === 0 && <div className="sd-empty-sm">All clear! No alerts right now.</div>}
            {alerts.slice(0, 6).map((a, i) => (
              <div key={i} className={`sd-alert-item sd-alert-${a.type}`}>
                <span className="sd-alert-icon">{a.icon}</span>
                <span className="sd-alert-msg">{a.msg}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Feedback */}
        <div className="sd-card sd-command-feedback">
          <div className="sd-card-header">
            <h3><FaStar /> Recent Feedback</h3>
          </div>
          <div className="sd-feedback-list">
            {(data?.feedback || []).length === 0 && <div className="sd-empty-sm">No feedback yet</div>}
            {(data?.feedback || []).slice(0, 4).map((f, i) => (
              <div key={i} className="sd-feedback-item">
                <div className="sd-feedback-top">
                  <span className="sd-feedback-name">{f.customerName || 'Guest'}</span>
                  <span className="sd-feedback-stars">
                    {Array.from({ length: 5 }, (_, si) => (
                      <FaStar key={si} className={si < getFeedbackRating(f) ? 'sd-star-filled' : 'sd-star-empty'} />
                    ))}
                  </span>
                </div>
                {f.additionalFeedback && (
                  <p className="sd-feedback-text">"{f.additionalFeedback}"</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Announcements */}
        {(data?.announcements || []).length > 0 && (
          <div className="sd-card sd-command-announce">
            <div className="sd-card-header">
              <h3>📢 Announcements</h3>
            </div>
            <div className="sd-announce-list">
              {data.announcements.map((a, i) => (
                <div key={i} className={`sd-announce-item ${a.priority === 'high' ? 'sd-announce-urgent' : ''}`}>
                  {a.priority === 'high' && <span className="sd-urgent-badge">URGENT</span>}
                  <p>{a.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ─── ORDERS (KANBAN) ───
  const renderOrders = () => (
    <div className="sd-orders-page">
      <div className="sd-orders-topbar">
        <div className="sd-orders-summary">
          <span className="sd-orders-count">{stats.activeOrders} active</span>
          <span className="sd-orders-divider">·</span>
          <span className="sd-orders-done">{stats.completedOrders} completed today</span>
        </div>
      </div>
      <div className="sd-kanban">
        {Object.entries(ORDER_COLUMNS).map(([key, col]) => (
          <div key={key} className="sd-kanban-col">
            <div className="sd-kanban-header" style={{ borderTopColor: col.color }}>
              <span className="sd-kanban-dot" style={{ background: col.color }} />
              <span className="sd-kanban-title">{col.label}</span>
              <span className="sd-kanban-count">{ordersByColumn[key]?.length || 0}</span>
            </div>
            <div className="sd-kanban-body">
              {(ordersByColumn[key] || []).length === 0 && (
                <div className="sd-kanban-empty">
                  <span className="sd-empty-icon-sm">📋</span>
                  <span>No orders</span>
                </div>
              )}
              {(ordersByColumn[key] || []).map(order => (
                <OrderCard key={order._id} order={order} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ─── FLOOR PLAN ───
  const renderFloorPlan = () => {
    const tables = data?.allTables || [];
    return (
      <div className="sd-floor-page">
        {/* Table Grid */}
        <div className="sd-card">
          <div className="sd-card-header">
            <h3><FaChair /> Restaurant Floor</h3>
            <div className="sd-table-legend">
              {Object.entries(TABLE_STATUSES).filter(([k]) => k !== 'Reserved').map(([key, cfg]) => (
                <span key={key} className="sd-legend-item">
                  <span className="sd-legend-dot" style={{ background: cfg.color }} />
                  {cfg.label}
                </span>
              ))}
            </div>
          </div>
          <div className="sd-floor-grid">
            {tables.map(t => {
              const cfg = TABLE_STATUSES[t.status] || TABLE_STATUSES.Available;
              const isProc = processingId === `table-${t.number}`;
              return (
                <div key={t.number} className="sd-floor-table" style={{ borderColor: cfg.color, background: cfg.bg }}>
                  <div className="sd-floor-table-top">
                    <span className="sd-floor-table-num" style={{ color: cfg.color }}>Table {t.number}</span>
                    <span className="sd-floor-table-badge" style={{ background: cfg.color }}>{cfg.label}</span>
                  </div>
                  <div className="sd-floor-table-info">
                    <span><FaUsers /> {t.seats} seats</span>
                  </div>
                  <div className="sd-floor-table-actions">
                    {t.status === 'Available' && (
                      <button className="sd-tbl-btn sd-tbl-occupy" disabled={isProc} onClick={() => handleTableStatus(t.number, 'Occupied')}>
                        {isProc ? '...' : 'Seat Guest'}
                      </button>
                    )}
                    {t.status === 'Occupied' && (
                      <button className="sd-tbl-btn sd-tbl-clean" disabled={isProc} onClick={() => handleTableStatus(t.number, 'Cleaning')}>
                        {isProc ? '...' : <><FaBroom /> Needs Cleaning</>}
                      </button>
                    )}
                    {t.status === 'Cleaning' && (
                      <button className="sd-tbl-btn sd-tbl-free" disabled={isProc} onClick={() => handleTableStatus(t.number, 'Available')}>
                        {isProc ? '...' : <><FaCheck /> Mark Clean</>}
                      </button>
                    )}
                    {(t.status === 'Allocated' || t.status === 'Reserved') && (
                      <button className="sd-tbl-btn sd-tbl-occupy" disabled={isProc} onClick={() => handleTableStatus(t.number, 'Occupied')}>
                        {isProc ? '...' : 'Guest Arrived'}
                      </button>
                    )}
                    <button className="sd-tbl-btn sd-tbl-delete" disabled={isProc} onClick={() => handleDeleteTable(t.number)}>
                      <FaTrash />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {tables.length === 0 && (
            <div className="sd-empty-state">
              <span className="sd-empty-icon">🪑</span>
              <p>No tables configured yet</p>
              <span className="sd-empty-sub">Add your first table below</span>
            </div>
          )}
        </div>

        {/* Add Table */}
        <div className="sd-card">
          <div className="sd-card-header">
            <h3><FaPlus /> Add New Table</h3>
          </div>
          <div className="sd-add-table-form">
            <div className="sd-form-group">
              <label>Table Number</label>
              <input
                type="number" min="1" placeholder="e.g., 1"
                value={newTable.number}
                onChange={e => setNewTable({ ...newTable, number: e.target.value })}
              />
            </div>
            <div className="sd-form-group">
              <label>Capacity</label>
              <input
                type="number" min="1" max="20" placeholder="e.g., 4"
                value={newTable.capacity}
                onChange={e => setNewTable({ ...newTable, capacity: e.target.value })}
              />
            </div>
            <button
              className="sd-add-table-btn"
              disabled={processingId === 'add-table' || !newTable.number || !newTable.capacity}
              onClick={handleAddTable}
            >
              {processingId === 'add-table' ? <span className="sd-spinner-sm" /> : <><FaPlus /> Add Table</>}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── RESERVATIONS ───
  const renderReservations = () => {
    const reservations = data?.reservations || [];
    const pending = reservations
      .filter(r => !r.allocated && r.status !== 'cancelled')
      .sort((a, b) => {
        const dtA = parseReservationDateTime(a);
        const dtB = parseReservationDateTime(b);
        return (dtA?.getTime() || 0) - (dtB?.getTime() || 0);
      });
    const confirmed = reservations
      .filter(r => r.allocated && r.status === 'confirmed')
      .sort((a, b) => {
        const dtA = parseReservationDateTime(a);
        const dtB = parseReservationDateTime(b);
        return (dtA?.getTime() || 0) - (dtB?.getTime() || 0);
      });
    const availTables = data?.availableTables || [];

    return (
      <div className="sd-reservations-page">
        {/* Pending Reservations */}
        <div className="sd-card">
          <div className="sd-card-header">
            <h3><FaConciergeBell /> Pending Reservations</h3>
            <span className="sd-badge">{pending.length}</span>
          </div>
          {pending.length === 0 ? (
            <div className="sd-empty-state">
              <span className="sd-empty-icon">📅</span>
              <p>No pending reservations</p>
            </div>
          ) : (
            <div className="sd-res-list">
              {pending.map(r => {
                const resDt = parseReservationDateTime(r);
                const countdown = resDt ? timeUntil(resDt.toISOString()) : '';
                const isOverdue = countdown.includes('overdue');
                const isProc = processingId === `res-${r._id}`;
                return (
                  <div key={r._id} className={`sd-res-card ${isOverdue ? 'sd-res-overdue' : ''}`}>
                    <div className="sd-res-left">
                      <div className="sd-res-name">{r.customerName || 'Guest'}</div>
                      <div className="sd-res-meta">
                        <span><FaClock /> {formatReservationTime(r)}</span>
                        <span className="sd-res-dot">·</span>
                        <span><FaUsers /> {r.guests} guest{r.guests !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className={`sd-res-countdown ${isOverdue ? 'sd-countdown-danger' : ''}`}>
                      {countdown}
                    </div>
                    <div className="sd-res-assign">
                      <select
                        value={selectedTableForRes[r._id] || ''}
                        onChange={e => setSelectedTableForRes(prev => ({ ...prev, [r._id]: e.target.value }))}
                        disabled={isProc}
                      >
                        <option value="">Assign table...</option>
                        {availTables
                          .filter(t => t.seats >= (r.guests || 1))
                          .map(t => (
                          <option key={t.number} value={t.number}>T{t.number} ({t.seats} seats)</option>
                        ))}
                        {availTables.filter(t => t.seats >= (r.guests || 1)).length === 0 && (
                          <option disabled>No tables with enough seats</option>
                        )}
                      </select>
                      <button
                        className="sd-assign-btn"
                        disabled={!selectedTableForRes[r._id] || isProc}
                        onClick={() => handleAssignTable(r._id)}
                      >
                        {isProc ? '...' : 'Assign'}
                      </button>
                    </div>
                    <button className="sd-res-remove" onClick={() => handleRemoveReservation(r._id)}>
                      <FaTimes />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Confirmed / Seated */}
        <div className="sd-card">
          <div className="sd-card-header">
            <h3><FaCheckCircle /> Confirmed Reservations</h3>
            <span className="sd-badge">{confirmed.length}</span>
          </div>
          {confirmed.length === 0 ? (
            <div className="sd-empty-state">
              <span className="sd-empty-icon">🪑</span>
              <p>No confirmed reservations</p>
            </div>
          ) : (
            <div className="sd-table-responsive">
              <table className="sd-data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Time</th>
                    <th>Guests</th>
                    <th>Table</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {confirmed.map(r => (
                    <tr key={r._id}>
                      <td className="sd-cell-name">{r.customerName}</td>
                      <td>{formatReservationTime(r)}</td>
                      <td>{r.guests}</td>
                      <td><span className="sd-table-badge">T{r.table_id || r.tables?.[0] || '?'}</span></td>
                      <td>
                        <button className="sd-icon-btn sd-btn-danger" onClick={() => handleRemoveReservation(r._id)}>
                          <FaTimes /> Free Table
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── INVENTORY ───
  const renderInventory = () => (
    <div className="sd-inventory-page">
      <div className="sd-card">
        <div className="sd-card-header">
          <h3><FaBoxOpen /> Inventory Status</h3>
          <div className="sd-filter-btns">
            {[
              { id: 'all', label: 'All' },
              { id: 'low', label: `Low Stock (${stats.lowStockCount})` },
              { id: 'out', label: `Out (${stats.outOfStockCount})` },
              { id: 'ok', label: 'In Stock' },
            ].map(f => (
              <button
                key={f.id}
                className={`sd-filter-btn ${inventoryFilter === f.id ? 'active' : ''}`}
                onClick={() => setInventoryFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        {filteredInventory.length === 0 ? (
          <div className="sd-empty-state">
            <span className="sd-empty-icon">📦</span>
            <p>No inventory items {inventoryFilter !== 'all' ? 'matching filter' : 'found'}</p>
          </div>
        ) : (
          <div className="sd-inventory-grid">
            {filteredInventory.map((item, i) => {
              const pct = item.minStock > 0 ? Math.min(100, (item.quantityValue / item.minStock) * 100) : 100;
              const statusColors = { 'Available': '#10b981', 'Low Stock': '#f59e0b', 'Out of Stock': '#ef4444' };
              const color = statusColors[item.status] || '#10b981';
              return (
                <div key={i} className="sd-inv-card" style={{ borderLeftColor: color }}>
                  <div className="sd-inv-header">
                    <span className="sd-inv-name">{item.item}</span>
                    <span className="sd-inv-status" style={{ color, background: `${color}15` }}>{item.status}</span>
                  </div>
                  <div className="sd-inv-qty">{item.quantity}</div>
                  {item.minStock > 0 && (
                    <div className="sd-inv-bar-wrap">
                      <div className="sd-inv-bar" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  )}
                  {item.minStock > 0 && (
                    <div className="sd-inv-min">Min: {item.minStock}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ─── TASKS ───
  const renderTasks = () => {
    const tasks = data?.staffTasks || [];
    const pending = tasks.filter(t => t.status === 'Pending');
    const done = tasks.filter(t => ['Done', 'Completed'].includes(t.status));

    return (
      <div className="sd-tasks-page">
        {/* Pending Tasks */}
        <div className="sd-card">
          <div className="sd-card-header">
            <h3><FaTasks /> Pending Tasks</h3>
            <span className="sd-badge">{pending.length}</span>
          </div>
          {pending.length === 0 ? (
            <div className="sd-empty-state">
              <span className="sd-empty-icon">✅</span>
              <p>All tasks completed!</p>
            </div>
          ) : (
            <div className="sd-tasks-grid">
              {pending.map((task, i) => {
                const isProc = processingId === `task-${task.id}`;
                const priorityColors = { high: '#ef4444', urgent: '#ef4444', medium: '#f59e0b', low: '#3b82f6' };
                const pColor = priorityColors[(task.priority || 'medium').toLowerCase()] || '#f59e0b';
                return (
                  <div key={i} className="sd-task-card" style={{ borderLeftColor: pColor }}>
                    <div className="sd-task-top">
                      <span className="sd-task-priority" style={{ color: pColor, background: `${pColor}15` }}>
                        {task.priority || 'Medium'}
                      </span>
                    </div>
                    <p className="sd-task-desc">{task.name}</p>
                    {task.assignedTo && task.assignedTo.length > 0 && (
                      <div className="sd-task-assigned">
                        <FaUsers /> {task.assignedTo.join(', ')}
                      </div>
                    )}
                    <button
                      className="sd-task-done-btn"
                      disabled={isProc}
                      onClick={() => handleTaskComplete(task.id)}
                    >
                      {isProc ? <span className="sd-spinner-sm" /> : <><FaCheck /> Mark Complete</>}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed Tasks */}
        {done.length > 0 && (
          <div className="sd-card">
            <div className="sd-card-header">
              <h3><FaCheckCircle /> Completed Tasks</h3>
              <span className="sd-badge sd-badge-green">{done.length}</span>
            </div>
            <div className="sd-tasks-grid">
              {done.slice(0, 6).map((task, i) => (
                <div key={i} className="sd-task-card sd-task-completed">
                  <div className="sd-task-top">
                    <span className="sd-task-status-done"><FaCheck /> Done</span>
                  </div>
                  <p className="sd-task-desc">{task.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── LOADING STATE ───
  if (loading) {
    return (
      <div className="sd-loading">
        <div className="sd-loading-spinner" />
        <p>Setting up your command center...</p>
      </div>
    );
  }

  // ─── ERROR STATE ───
  if (error) {
    return (
      <div className="sd-error">
        <FaExclamationTriangle className="sd-error-icon" />
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <button className="sd-retry-btn" onClick={() => fetchData()}>Try Again</button>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════
  const sectionTitles = {
    command: 'Command Center',
    orders: 'Order Management',
    tables: 'Floor Plan & Tables',
    reservations: 'Reservations',
    inventory: 'Inventory Status',
    tasks: 'Task Management',
    support: 'Support & Contact Owner',
  };

  return (
    <div className={`sd-app ${sidebarOpen ? '' : 'sd-sidebar-collapsed'}`}>
      {/* ─── SIDEBAR ─── */}
      <aside className="sd-sidebar">
        <div className="sd-sidebar-top">
          <div className="sd-logo">
            <FaUtensils className="sd-logo-icon" />
            {sidebarOpen && <span className="sd-logo-text">RestoConnect</span>}
          </div>
          <button className="sd-collapse-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <FaChevronLeft /> : <FaBars />}
          </button>
        </div>

        <nav className="sd-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`sd-nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
              title={item.label}
            >
              <span className="sd-nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="sd-nav-label">{item.label}</span>}
              {item.id === 'orders' && stats.activeOrders > 0 && (
                <span className="sd-nav-badge">{stats.activeOrders}</span>
              )}
              {item.id === 'reservations' && stats.pendingReservations > 0 && (
                <span className="sd-nav-badge sd-nav-badge-amber">{stats.pendingReservations}</span>
              )}
              {item.id === 'tasks' && stats.pendingTasks > 0 && (
                <span className="sd-nav-badge sd-nav-badge-purple">{stats.pendingTasks}</span>
              )}
              {item.id === 'inventory' && (stats.lowStockCount + stats.outOfStockCount) > 0 && (
                <span className="sd-nav-badge sd-nav-badge-red">{stats.lowStockCount + stats.outOfStockCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sd-sidebar-bottom">
          <button className="sd-nav-item" onClick={() => setShowSettings(true)} title="Settings">
            <span className="sd-nav-icon"><FaCog /></span>
            {sidebarOpen && <span className="sd-nav-label">Settings</span>}
          </button>
          <button className="sd-nav-item sd-nav-logout" onClick={handleLogout} title="Logout">
            <span className="sd-nav-icon"><FaSignOutAlt /></span>
            {sidebarOpen && <span className="sd-nav-label">Logout</span>}
          </button>
          {sidebarOpen && (
            <div className="sd-sidebar-user">
              <div className="sd-user-avatar">{(data?.staff?.name || 'S')[0].toUpperCase()}</div>
              <div className="sd-user-info">
                <span className="sd-user-name">{data?.staff?.name || 'Staff'}</span>
                <span className="sd-user-role">{data?.staff?.role || 'staff'}</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="sd-main">
        {/* Top Header */}
        <header className="sd-header">
          <div className="sd-header-left">
            <h1 className="sd-page-title">{sectionTitles[activeSection]}</h1>
          </div>
          <div className="sd-header-center">
            <div className="sd-live-indicator">
              <span className="sd-live-dot" />
              LIVE
            </div>
            <span className="sd-header-clock">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="sd-header-date">
              {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div className="sd-header-right">
            <span className="sd-header-branch">{data?.rest_name || 'Restaurant'}</span>
            <button
              className={`sd-refresh-btn ${refreshing ? 'sd-spinning' : ''}`}
              onClick={() => fetchData(true)}
              title="Refresh data"
            >
              <FaSync />
            </button>
            <div className="sd-notif-wrap">
              <button
                className="sd-notif-btn"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <FaBell />
                {alerts.length > 0 && <span className="sd-notif-dot">{alerts.length}</span>}
              </button>
              {showNotifications && (
                <div className="sd-notif-dropdown">
                  <div className="sd-notif-header">
                    <h4>Notifications</h4>
                    <button onClick={() => setShowNotifications(false)}><FaTimes /></button>
                  </div>
                  {alerts.length === 0 && <div className="sd-notif-empty">No notifications</div>}
                  {alerts.map((a, i) => (
                    <div key={i} className={`sd-notif-item sd-notif-${a.type}`}>
                      <span>{a.icon}</span>
                      <span>{a.msg}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="sd-content">
          {activeSection === 'command' && renderCommandCenter()}
          {activeSection === 'orders' && renderOrders()}
          {activeSection === 'tables' && renderFloorPlan()}
          {activeSection === 'reservations' && renderReservations()}
          {activeSection === 'inventory' && renderInventory()}
          {activeSection === 'tasks' && renderTasks()}
          {activeSection === 'support' && <SupportChatPage mode="staff" />}
        </div>
      </main>

      {/* ─── SETTINGS MODAL ─── */}
      {showSettings && (
        <div className="sd-modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="sd-modal" onClick={e => e.stopPropagation()}>
            <div className="sd-modal-header">
              <h2><FaLock /> Change Password</h2>
              <button onClick={() => setShowSettings(false)}><FaTimes /></button>
            </div>
            <div className="sd-modal-body">
              <div className="sd-form-group">
                <label>Current Password</label>
                <input type="password" value={passwords.old} onChange={e => setPasswords({ ...passwords, old: e.target.value })} placeholder="Enter current password" />
              </div>
              <div className="sd-form-group">
                <label>New Password</label>
                <input type="password" value={passwords.new} onChange={e => setPasswords({ ...passwords, new: e.target.value })} placeholder="Enter new password" />
              </div>
              <div className="sd-form-group">
                <label>Confirm New Password</label>
                <input type="password" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} placeholder="Confirm new password" />
              </div>
            </div>
            <div className="sd-modal-footer">
              <button className="sd-btn-cancel" onClick={() => setShowSettings(false)}>Cancel</button>
              <button className="sd-btn-primary" onClick={handlePasswordChange}>Save Password</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export async function loader() {
  let role = await isLogin();
  if (role !== "staff") {
    return redirect("/login");
  }
  return null;
}
