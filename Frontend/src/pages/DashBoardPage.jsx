import { useState, useEffect, useRef } from "react";
import { isLogin } from "../util/auth";
import { getFavourites } from "../util/favourites";
import { redirect, useNavigate, useLocation } from "react-router-dom";
import { logout } from "../util/auth";
import { useDispatch } from "react-redux";
import { replaceCart, setRestaurant } from "../store/CartSlice";
import styles from "./DashBoardPage.module.css";

export async function loader() {
  const role = await isLogin();
  if (role !== "customer") {
    throw redirect("/login");
  }
  return null;
}

/* ─── tiny helpers ───────────────────────────────────── */
const fmt = (n) => {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isNaN(v) ? "₹0" : `₹${v.toFixed(0)}`;
};
const fmtDate = (v) => {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? v
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};
const fmtTime = (v) => {
  if (!v) return "";
  if (/am|pm/i.test(v)) return v;
  const [h, m] = v.split(":").map(Number);
  if (Number.isNaN(h)) return v;
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m || 0).padStart(2, "0")} ${ampm}`;
};
const stars = (r) => {
  if (typeof r !== "number" || Number.isNaN(r)) return "☆☆☆☆☆";
  const c = Math.max(0, Math.min(5, Math.round(r)));
  return "★".repeat(c) + "☆".repeat(5 - c);
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export const DashBoardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  /* sidebar / section */
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* data */
  const [userData, setUserData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [pastOrders, setPastOrders] = useState([]);
  const [favoriteRestaurants, setFavoriteRestaurants] = useState([]);
  const [upcomingReservations, setUpcomingReservations] = useState([]);
  const [pastReservations, setPastReservations] = useState([]);
  const [weeklySpending, setWeeklySpending] = useState(Array(7).fill(0));
  const [orderFrequency, setOrderFrequency] = useState([0, 0, 0, 0]);
  const [feedbackStats, setFeedbackStats] = useState({ satisfactionRate: 0, totalReviews: 0, recentReviews: [] });
  const [notifications, setNotifications] = useState([]);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [switchFocused, setSwitchFocused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [favoriteDishes, setFavoriteDishes] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

  /* edit profile */
  const [showEditModal, setShowEditModal] = useState(false);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [selectedProfileFile, setSelectedProfileFile] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: "", email: "", phone: "", img_url: "", newPassword: "", confirmPassword: "" });
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [reorderingOrderId, setReorderingOrderId] = useState(null);
  const [notificationSaving, setNotificationSaving] = useState(false);
  const [activeOrderTab, setActiveOrderTab] = useState("active");

  /* ─── fetch ──────────────────────────────────────── */
  useEffect(() => { fetchDashboardData(); fetchFavoriteDishes(); }, []);
  useEffect(() => { if (location.pathname === "/customer/dashboard") { const t = setTimeout(() => fetchFavoriteDishes(), 100); return () => clearTimeout(t); } }, [location.pathname]);
  useEffect(() => { const h = () => { if (!document.hidden) fetchFavoriteDishes(); }; document.addEventListener("visibilitychange", h); return () => document.removeEventListener("visibilitychange", h); }, []);

  const fetchDashboardData = async () => {
    try {
      setFetchError("");
      const response = await fetch("http://localhost:3000/api/customer/customerDashboard", { method: "GET", credentials: "include", headers: { Accept: "application/json" } });
      if (response.status === 401) { navigate("/login?message=Please login again"); return; }
      if (response.status === 403) { navigate("/login?message=Access denied"); return; }
      if (!response.ok) throw new Error(`Failed (${response.status})`);
      const data = await response.json();
      setUserData(data.user || null);
      const allOrders = Array.isArray(data.recentOrders) ? data.recentOrders : [];
      setRecentOrders(allOrders.filter((o) => ["pending", "preparing"].includes((o.status || "").toLowerCase())));
      setPastOrders(allOrders.filter((o) => ["completed", "delivered"].includes((o.status || "").toLowerCase())));
      setFavoriteRestaurants(Array.isArray(data.favoriteRestaurants) ? data.favoriteRestaurants : []);
      setUpcomingReservations(Array.isArray(data.upcomingReservations) ? data.upcomingReservations : []);
      setPastReservations(Array.isArray(data.pastReservations) ? data.pastReservations : []);
      setWeeklySpending(Array.isArray(data.weeklySpending) && data.weeklySpending.length === 7 ? data.weeklySpending.map((v) => (Number.isFinite(Number(v)) ? Number(v) : 0)) : Array(7).fill(0));
      setOrderFrequency(Array.isArray(data.orderFrequency) && data.orderFrequency.length === 4 ? data.orderFrequency.map((v) => (Number.isFinite(Number(v)) ? Number(v) : 0)) : [0, 0, 0, 0]);
      setFeedbackStats({ satisfactionRate: data.feedbackStats?.satisfactionRate ?? 0, totalReviews: data.feedbackStats?.totalReviews ?? 0, recentReviews: Array.isArray(data.feedbackStats?.recentReviews) ? data.feedbackStats.recentReviews : [] });
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setEmailNotificationsEnabled(typeof data.emailNotificationsEnabled === "boolean" ? data.emailNotificationsEnabled : true);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      setFetchError("We had trouble loading your dashboard. Please refresh to try again.");
      setLoading(false);
    }
  };

  const fetchFavoriteDishes = async () => {
    try { setLoadingFavorites(true); const f = await getFavourites(); setFavoriteDishes(Array.isArray(f) ? f.filter(Boolean) : []); }
    catch { setFavoriteDishes([]); }
    finally { setLoadingFavorites(false); }
  };

  /* ─── actions ────────────────────────────────────── */
  const handleReorder = async (entity) => {
    if (!entity) { navigate("/customer/order"); return; }
    const recordId = entity.recordId || entity._id || entity.id;
    if (!recordId) { alert("Could not identify order."); return; }
    try {
      setReorderingOrderId(recordId);
      const response = await fetch(`http://localhost:3000/api/customer/orders/${recordId}/reorder`, { method: "POST", headers: { Accept: "application/json" }, credentials: "include" });
      if (response.status === 401) { navigate("/login?message=Please login again"); return; }
      if (!response.ok) { const e = await response.json().catch(() => ({})); throw new Error(e.error || `Failed (${response.status})`); }
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to reorder");
      let items = Array.isArray(data.items) ? data.items : [];
      if (items.some((i) => !i.name || !i.price) && data.restaurant?.id) {
        try {
          const menuResp = await fetch(`http://localhost:3000/api/customer/menu/${data.restaurant.id}`, { credentials: "include" });
          if (menuResp.ok) {
            const menuData = await menuResp.json();
            const menuDishes = Array.isArray(menuData.dishes) ? menuData.dishes : [];
            const grouped = {};
            for (const item of items) {
              let dish = menuDishes.find((d) => [d.id, d._id].some((did) => [item.id, item._id].some((iid) => String(did) === String(iid)))) || {};
              const dishId = dish.id || dish._id || item.id || item._id || "unknown";
              const key = `${dishId}-${dish.price || item.price || 0}`;
              if (!grouped[key]) { grouped[key] = { ...dish, ...item, id: dish.id || item.id, _id: dish._id || item._id, name: dish.name || item.name || "Unknown", price: item.price || dish.price || 0, image: item.image || dish.image || "", quantity: item.quantity ?? 1 }; }
              else { grouped[key].quantity += item.quantity ?? 1; }
            }
            items = Object.values(grouped);
          }
        } catch { /* fallback */ }
      }
      dispatch(replaceCart(items));
      if (data.restaurant?.id) { dispatch(setRestaurant({ restId: data.restaurant.id, restName: data.restaurant.name || "Restaurant" })); navigate(`/customer/restaurant/${data.restaurant.id}?reorder=true`); }
      else { navigate("/customer/order"); }
    } catch (error) { alert(`Could not reorder: ${error.message}`); }
    finally { setReorderingOrderId(null); }
  };

  const handleRateOrder = (order) => {
    if (!order.recordId && !order.orderId) return;
    navigate("/customer/feedback", { state: { restId: order?.restId, orderId: order?.recordId || order?.orderId, restaurant: order?.restaurant, dishName: order?.dishName } });
  };

  const handleNotificationToggle = async () => {
    const next = !emailNotificationsEnabled;
    setEmailNotificationsEnabled(next);
    setNotificationSaving(true);
    try {
      const r = await fetch("http://localhost:3000/api/customer/preferences/email-notifications", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, credentials: "include", body: JSON.stringify({ enabled: next }) });
      if (r.status === 401) { navigate("/login?message=Please login again"); return; }
      if (!r.ok) throw new Error();
      const d = await r.json(); if (!d.success) throw new Error();
    } catch { alert("Could not update preference."); setEmailNotificationsEnabled((p) => !p); }
    finally { setNotificationSaving(false); }
  };

  /* ─── edit profile ───────────────────────────────── */
  const handleEditProfileClick = () => {
    if (userData) { setEditFormData((p) => ({ ...p, name: userData.name || "", email: userData.email || "", phone: userData.phone || "", img_url: userData.img_url || "" })); setProfilePicPreview(userData.img_url); }
    setSelectedProfileFile(null); setShowEditModal(true); setUpdateError("");
  };
  const handleCloseModal = () => { setShowEditModal(false); setUpdateError(""); setUpdateSuccess(""); setEditFormData((p) => ({ ...p, newPassword: "", confirmPassword: "" })); };
  const handleProfilePicClick = () => fileInputRef.current?.click();
  const handleProfilePicChange = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please select an image"); return; }
    if (file.size > 2 * 1024 * 1024) { alert("Max 2MB"); return; }
    setSelectedProfileFile(file);
    const reader = new FileReader(); reader.onloadend = () => setProfilePicPreview(reader.result); reader.readAsDataURL(file);
  };
  const handleInputChange = (e) => { setEditFormData((p) => ({ ...p, [e.target.name]: e.target.value })); setUpdateError(""); };
  const handleUpdateProfile = async (e) => {
    e.preventDefault(); setUpdateError(""); setUpdateSuccess(""); setIsUpdating(true);
    if (editFormData.newPassword || editFormData.confirmPassword) {
      if (!editFormData.newPassword || !editFormData.confirmPassword) { setUpdateError("Both password fields required"); setIsUpdating(false); return; }
      if (editFormData.newPassword !== editFormData.confirmPassword) { setUpdateError("Passwords don't match"); setIsUpdating(false); return; }
      if (editFormData.newPassword.length < 6) { setUpdateError("Min 6 characters"); setIsUpdating(false); return; }
    }
    try {
      const fd = new FormData(); fd.append("name", editFormData.name); fd.append("email", editFormData.email); fd.append("phone", editFormData.phone);
      if (selectedProfileFile) fd.append("profilePicture", selectedProfileFile);
      if (editFormData.newPassword) { fd.append("newPassword", editFormData.newPassword); fd.append("confirmPassword", editFormData.confirmPassword); }
      const r = await fetch("http://localhost:3000/api/customer/edit", { method: "POST", credentials: "include", body: fd });
      if (r.status === 401) { navigate("/login?message=Please login again"); return; }
      const data = await r.json();
      if (data.success) {
        setUserData((p) => ({ ...p, name: data.data.name || p.name, email: data.data.email || p.email, phone: data.data.phone || p.phone, img_url: data.data.img_url || p.img_url }));
        setUpdateSuccess("Profile updated!"); setTimeout(() => { handleCloseModal(); setUpdateSuccess(""); }, 2000);
      } else { setUpdateError(data.error || "Update failed"); }
    } catch { setUpdateError("An error occurred"); }
    finally { setIsUpdating(false); }
  };

  /* ─── derived ────────────────────────────────────── */
  const weeklyAmounts = weeklySpending.map((v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; });
  const maxWeekly = Math.max(...weeklyAmounts, 1);
  const monthlyOrders = orderFrequency.reduce((s, c) => s + c, 0);
  const totalVisits = userData?.totalVisits ?? 0;
  const totalSpent = Number(userData?.totalSpent ?? 0);
  const avgSpend = Number(userData?.avgSpend ?? 0);
  const topRestaurant = userData?.topRestaurant && userData.topRestaurant !== "N/A" ? userData.topRestaurant : null;
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const satisfactionRate = feedbackStats?.satisfactionRate ?? 0;
  const totalReviews = feedbackStats?.totalReviews ?? 0;
  const recentReviewsList = Array.isArray(feedbackStats?.recentReviews) ? feedbackStats.recentReviews : [];
  const unreadNotifications = notifications.length;

  const sidebarItems = [
    { id: "overview", icon: "📊", label: "Overview" },
    { id: "reservations", icon: "🪑", label: "Reservations" },
    { id: "orders", icon: "🧾", label: "Orders" },
    { id: "favorites", icon: "❤️", label: "Favorites" },
    { id: "analytics", icon: "📈", label: "Analytics" },
    { id: "reviews", icon: "⭐", label: "Reviews" },
    { id: "notifications", icon: "🔔", label: "Notifications", badge: unreadNotifications },
    { id: "profile", icon: "👤", label: "Profile" },
  ];

  if (loading) return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingSpinner} />
      <p className={styles.loadingText}>Loading your dashboard...</p>
    </div>
  );

  /* ═══════ SECTION RENDERERS ════════════════════════ */

  const renderOverview = () => (
    <div className={styles.overviewGrid}>
      {/* Quick Stats */}
      <div className={styles.statsStrip}>
        {[
          { icon: "🧾", value: totalVisits, label: "Total Orders" },
          { icon: "💰", value: fmt(totalSpent), label: "Total Spent" },
          { icon: "📊", value: fmt(avgSpend), label: "Avg per Visit" },
          { icon: "🪑", value: upcomingReservations.length, label: "Upcoming Tables" },
        ].map((s, i) => (
          <div key={i} className={styles.statCard}>
            <div className={styles.statIcon}>{s.icon}</div>
            <div><p className={styles.statNumber}>{s.value}</p><p className={styles.statLabel}>{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h3 className={styles.sectionHeading}>Quick Actions</h3>
        <div className={styles.actionGrid}>
          {[
            { icon: "🍽️", text: "Browse Restaurants", action: () => navigate("/customer/") },
            { icon: "📅", text: "My Reservations", action: () => setActiveSection("reservations") },
            { icon: "🧾", text: "Order History", action: () => setActiveSection("orders") },
            { icon: "💬", text: "Get Support", action: () => navigate("/customer/support") },
          ].map((a, i) => (
            <button key={i} className={styles.actionCard} onClick={a.action}>
              <span className={styles.actionIcon}>{a.icon}</span>
              <span className={styles.actionText}>{a.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Orders */}
      {recentOrders.length > 0 && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionHeading}><span className={styles.pulseGreen} /> Active Orders</h3>
            <button className={styles.seeAll} onClick={() => setActiveSection("orders")}>See all →</button>
          </div>
          <div className={styles.activeOrdersStrip}>
            {recentOrders.slice(0, 3).map((order, i) => (
              <div key={order.recordId || i} className={styles.activeOrderCard}>
                <div className={styles.activeOrderTop}>
                  <img src={order.image || "/dish-placeholder.png"} alt="" className={styles.activeOrderImg} />
                  <div className={styles.activeOrderInfo}>
                    <h4>{order.restaurant || "Restaurant"}</h4>
                    <p className={styles.activeOrderDish}>{order.dishName || "Order"}</p>
                    <p className={styles.activeOrderPrice}>{fmt(order.price)}</p>
                  </div>
                </div>
                <div className={styles.activeOrderStatus}>
                  <div className={styles.statusBar}><div className={styles.statusFill} style={{ width: order.status?.toLowerCase() === "preparing" ? "60%" : "30%" }} /></div>
                  <span className={styles.statusText}>{order.status?.toLowerCase() === "preparing" ? "🍳 Being Prepared" : "⏳ Order Placed"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Reservations */}
      {upcomingReservations.length > 0 && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionHeading}>🪑 Upcoming Reservations</h3>
            <button className={styles.seeAll} onClick={() => setActiveSection("reservations")}>See all →</button>
          </div>
          <div className={styles.reservationStrip}>
            {upcomingReservations.slice(0, 3).map((res, i) => (
              <div key={res.id || res._id || i} className={styles.reservationCard}>
                <div className={styles.resDate}>
                  <span className={styles.resDay}>{new Date(res.date).getDate()}</span>
                  <span className={styles.resMonth}>{new Date(res.date).toLocaleString("en", { month: "short" })}</span>
                </div>
                <div className={styles.resInfo}>
                  <h4>{res.restaurant}</h4>
                  <p>{fmtTime(res.time)} · {res.guests} {res.guests === 1 ? "Guest" : "Guests"}</p>
                </div>
                <div className={`${styles.resStatus} ${styles[`res_${(res.status || "pending").toLowerCase()}`]}`}>
                  {(res.status || "pending").charAt(0).toUpperCase() + (res.status || "pending").slice(1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Restaurant */}
      {topRestaurant && (
        <div className={styles.topRestaurantBanner}>
          <span className={styles.trophyIcon}>🏆</span>
          <div><p className={styles.topLabel}>Your Favorite Spot</p><p className={styles.topName}>{topRestaurant}</p></div>
        </div>
      )}

      {/* Fav Dishes Preview */}
      {favoriteDishes.length > 0 && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionHeading}>❤️ Favorite Dishes</h3>
            <button className={styles.seeAll} onClick={() => setActiveSection("favorites")}>See all →</button>
          </div>
          <div className={styles.favPreviewGrid}>
            {favoriteDishes.slice(0, 4).map((dish, i) => (
              <div key={dish._id || i} className={styles.favPreviewCard} onClick={() => (dish.restaurantId || dish.rest_id) && navigate(`/customer/restaurant/${dish.restaurantId || dish.rest_id}`)}>
                <img src={dish.image || dish.imageUrl || "https://via.placeholder.com/80"} alt={dish.name} className={styles.favPreviewImg} />
                <div className={styles.favPreviewInfo}>
                  <h4>{dish.name}</h4>
                  {(dish.restaurantName || dish.restaurant) && <p className={styles.favPreviewRest}>{dish.restaurantName || dish.restaurant}</p>}
                  {dish.price && <p className={styles.favPreviewPrice}>₹{Number(dish.price).toFixed(0)}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderReservations = () => (
    <div className={styles.fullSection}>
      <div className={styles.sectionPageHeader}>
        <h2>🪑 My Reservations</h2>
        <button className={styles.primaryBtn} onClick={() => navigate("/customer/")}>Book a New Table</button>
      </div>
      {upcomingReservations.length > 0 && (
        <div className={styles.subSection}>
          <h3 className={styles.subHeading}>Upcoming</h3>
          <div className={styles.reservationList}>
            {upcomingReservations.map((res, i) => (
              <div key={res.id || res._id || i} className={styles.reservationFullCard}>
                <div className={styles.resFullDate}>
                  <span className={styles.resFullDay}>{new Date(res.date).getDate()}</span>
                  <span className={styles.resFullMonth}>{new Date(res.date).toLocaleString("en", { month: "short", year: "numeric" })}</span>
                </div>
                <div className={styles.resFullInfo}>
                  <h4>{res.restaurant}</h4>
                  <div className={styles.resFullMeta}>
                    <span>🕐 {fmtTime(res.time)}</span>
                    <span>👥 {res.guests} {res.guests === 1 ? "Guest" : "Guests"}</span>
                    {res.table_id && <span>🪑 Table {res.table_id}</span>}
                  </div>
                </div>
                <div className={`${styles.resStatusBadge} ${styles[`res_${(res.status || "pending").toLowerCase()}`]}`}>
                  {(res.status || "pending").charAt(0).toUpperCase() + (res.status || "pending").slice(1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {pastReservations.length > 0 && (
        <div className={styles.subSection}>
          <h3 className={styles.subHeading}>Past Reservations</h3>
          <div className={styles.reservationList}>
            {pastReservations.map((res, i) => (
              <div key={res.id || res._id || `past-${i}`} className={`${styles.reservationFullCard} ${styles.pastCard}`}>
                <div className={styles.resFullDate}>
                  <span className={styles.resFullDay}>{new Date(res.date).getDate()}</span>
                  <span className={styles.resFullMonth}>{new Date(res.date).toLocaleString("en", { month: "short" })}</span>
                </div>
                <div className={styles.resFullInfo}>
                  <h4>{res.restaurant}</h4>
                  <div className={styles.resFullMeta}>
                    <span>🕐 {fmtTime(res.time)}</span>
                    <span>👥 {res.guests} Guests</span>
                  </div>
                </div>
                <div className={styles.resStatusBadge} style={{ background: "#f3f4f6", color: "#6b7280" }}>Completed</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {upcomingReservations.length === 0 && pastReservations.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🪑</div>
          <h3>No Reservations Yet</h3>
          <p>Book a table at your favorite restaurant to get started!</p>
          <button className={styles.primaryBtn} onClick={() => navigate("/customer/")}>Browse Restaurants</button>
        </div>
      )}
    </div>
  );

  const renderOrders = () => (
    <div className={styles.fullSection}>
      <div className={styles.sectionPageHeader}>
        <h2>🧾 My Orders</h2>
        <div className={styles.orderTabs}>
          <button className={`${styles.tabBtn} ${activeOrderTab === "active" ? styles.tabBtnActive : ""}`} onClick={() => setActiveOrderTab("active")}>
            Active {recentOrders.length > 0 && <span className={styles.tabBadge}>{recentOrders.length}</span>}
          </button>
          <button className={`${styles.tabBtn} ${activeOrderTab === "past" ? styles.tabBtnActive : ""}`} onClick={() => setActiveOrderTab("past")}>Past Orders</button>
        </div>
      </div>
      <div className={styles.ordersList}>
        {(activeOrderTab === "active" ? recentOrders : pastOrders).map((order, i) => {
          const status = (order.status || "pending").toLowerCase();
          const isActive = status === "pending" || status === "preparing";
          return (
            <div key={order.recordId || i} className={`${styles.orderCard} ${!isActive ? styles.pastCard : ""}`}>
              <img src={order.image || "/dish-placeholder.png"} alt="" className={styles.orderImg} />
              <div className={styles.orderDetails}>
                <div className={styles.orderTop}><h4>{order.restaurant || "Restaurant"}</h4><span className={styles.orderAmount}>{fmt(order.price)}</span></div>
                <p className={styles.orderDishName}>{order.dishName || "Order"}</p>
                <div className={styles.orderMeta}>
                  <span className={`${styles.orderStatusBadge} ${isActive ? styles.statusActive : styles.statusDone}`}>
                    {isActive ? (status === "preparing" ? "🍳 Preparing" : "⏳ Pending") : "✓ Completed"}
                  </span>
                  {order.date && <span className={styles.orderDate}>{fmtDate(order.date)}</span>}
                </div>
              </div>
              <div className={styles.orderActions}>
                {!isActive && <button className={styles.rateBtn} onClick={() => handleRateOrder(order)}>⭐ Rate</button>}
                <button className={styles.reorderBtn} onClick={() => handleReorder(order)} disabled={reorderingOrderId === order.recordId}>
                  {reorderingOrderId === order.recordId ? "..." : "🔄 Reorder"}
                </button>
              </div>
            </div>
          );
        })}
        {(activeOrderTab === "active" ? recentOrders : pastOrders).length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>{activeOrderTab === "active" ? "🍽️" : "📋"}</div>
            <h3>{activeOrderTab === "active" ? "No Active Orders" : "No Past Orders"}</h3>
            <p>{activeOrderTab === "active" ? "Place an order to see it here!" : "Completed orders appear here."}</p>
            <button className={styles.primaryBtn} onClick={() => navigate("/customer/")}>Order Now</button>
          </div>
        )}
      </div>
    </div>
  );

  const renderFavorites = () => (
    <div className={styles.fullSection}>
      <div className={styles.sectionPageHeader}><h2>❤️ My Favorites</h2></div>
      {loadingFavorites ? (
        <div className={styles.loadingInline}><div className={styles.loadingSpinner} /><p>Loading favorites...</p></div>
      ) : favoriteDishes.length > 0 ? (
        <div className={styles.favoritesGrid}>
          {favoriteDishes.map((dish, i) => (
            <div key={dish._id || i} className={styles.favoriteCard} onClick={() => (dish.restaurantId || dish.rest_id) && navigate(`/customer/restaurant/${dish.restaurantId || dish.rest_id}`)}>
              <div className={styles.favImgWrap}>
                <img src={dish.image || dish.imageUrl || "https://via.placeholder.com/180"} alt={dish.name} className={styles.favImg} />
                <div className={styles.favHeart}>❤️</div>
              </div>
              <div className={styles.favInfo}>
                <h4 className={styles.favName}>{dish.name}</h4>
                {(dish.restaurantName || dish.restaurant) && <p className={styles.favRest}>🍽️ {dish.restaurantName || dish.restaurant}</p>}
                {dish.description && <p className={styles.favDesc}>{dish.description}</p>}
                {dish.price && <p className={styles.favPrice}>₹{Number(dish.price).toFixed(0)}</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>❤️</div>
          <h3>No Favorites Yet</h3>
          <p>Heart dishes from restaurant menus to save them here!</p>
          <button className={styles.primaryBtn} onClick={() => navigate("/customer/")}>Explore Restaurants</button>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className={styles.fullSection}>
      <div className={styles.sectionPageHeader}><h2>📈 Spending Analytics</h2></div>
      <div className={styles.analyticsGrid}>
        <div className={styles.analyticsCard}>
          <h3>Weekly Spending</h3>
          <div className={styles.barChart}>
            {weeklyAmounts.map((amount, i) => (
              <div key={i} className={styles.barCol}>
                <div className={styles.barTooltip}>{fmt(amount)}</div>
                <div className={styles.barTrack}><div className={styles.barFill} style={{ height: `${(amount / maxWeekly) * 100}%` }} /></div>
                <span className={styles.barDayLabel}>{dayNames[i]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.analyticsCard}>
          <h3>Monthly Order Frequency</h3>
          <div className={styles.freqCenter}><div className={styles.bigNumber}>{monthlyOrders}</div><p className={styles.bigLabel}>orders this month</p></div>
          <div className={styles.weekBreakdown}>
            {["Week 1", "Week 2", "Week 3", "Week 4"].map((w, i) => (
              <div key={w} className={styles.weekRow}>
                <span className={styles.weekLabel}>{w}</span>
                <div className={styles.weekBarTrack}><div className={styles.weekBarFill} style={{ width: `${Math.max((orderFrequency[i] / (Math.max(...orderFrequency) || 1)) * 100, 4)}%` }} /></div>
                <span className={styles.weekCount}>{orderFrequency[i]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.analyticsSummary}>
          {[
            { icon: "🧾", val: totalVisits, label: "Total Orders" },
            { icon: "💳", val: fmt(totalSpent), label: "Total Spent" },
            { icon: "📊", val: fmt(avgSpend), label: "Avg Spend" },
            ...(topRestaurant ? [{ icon: "🏆", val: topRestaurant, label: "Top Restaurant", small: true }] : []),
          ].map((s, i) => (
            <div key={i} className={styles.summaryCard}>
              <span className={styles.summaryIcon}>{s.icon}</span>
              <div><p className={styles.summaryNum} style={s.small ? { fontSize: "1rem" } : {}}>{s.val}</p><p className={styles.summaryLabel}>{s.label}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReviews = () => (
    <div className={styles.fullSection}>
      <div className={styles.sectionPageHeader}><h2>⭐ My Reviews</h2></div>
      <div className={styles.satisfactionBanner}>
        <div className={styles.satisfactionRing}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
            <circle cx="60" cy="60" r="50" fill="none" stroke="#f59e0b" strokeWidth="10" strokeDasharray="314" strokeDashoffset={314 * (1 - Math.min(satisfactionRate / 100, 1))} transform="rotate(-90 60 60)" strokeLinecap="round" />
          </svg>
          <div className={styles.satisfactionValue}>{Math.round(satisfactionRate)}%</div>
        </div>
        <div className={styles.satisfactionInfo}>
          <h3>Satisfaction Score</h3>
          <p>{totalReviews > 0 ? `Based on ${totalReviews} review${totalReviews === 1 ? "" : "s"}` : "Leave your first review to see your score"}</p>
        </div>
      </div>
      {recentReviewsList.length > 0 ? (
        <div className={styles.reviewsList}>
          {recentReviewsList.map((review, i) => (
            <div key={review.createdAt || i} className={styles.reviewCard}>
              <div className={styles.reviewTop}><h4>{review.restaurant}</h4>
                <div className={styles.reviewRating}><span className={styles.reviewStars}>{stars(review.rating)}</span>{typeof review.rating === "number" && <span>{review.rating.toFixed(1)}</span>}</div>
              </div>
              {review.comment && <p className={styles.reviewComment}>"{review.comment}"</p>}
              {review.lovedItems && <p className={styles.reviewLoved}>Loved: {review.lovedItems}</p>}
              {review.createdAt && <p className={styles.reviewDate}>{fmtDate(review.createdAt)}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}><div className={styles.emptyIcon}>⭐</div><h3>No Reviews Yet</h3><p>Rate your orders to build your review history!</p></div>
      )}
    </div>
  );

  const renderNotifications = () => (
    <div className={styles.fullSection}>
      <div className={styles.sectionPageHeader}>
        <h2>🔔 Notifications</h2>
        <div className={styles.notifToggle}>
          <span>Email Notifications</span>
          <label className={styles.switch} style={{ opacity: notificationSaving ? 0.6 : 1 }}>
            <input type="checkbox" checked={emailNotificationsEnabled} onChange={handleNotificationToggle} disabled={notificationSaving} role="switch" aria-label="Email notifications" onFocus={() => setSwitchFocused(true)} onBlur={() => setSwitchFocused(false)} />
            <span className={styles.slider} style={{ backgroundColor: emailNotificationsEnabled ? "#22c55e" : "#d1d5db", boxShadow: switchFocused ? (emailNotificationsEnabled ? "0 0 0 4px rgba(34,197,94,0.15)" : "0 0 0 4px rgba(0,0,0,0.08)") : undefined }}>
              <span className={styles.sliderKnob} style={{ left: emailNotificationsEnabled ? "28px" : "3px" }} />
            </span>
          </label>
        </div>
      </div>
      {notifications.length > 0 ? (
        <div className={styles.notifList}>
          {notifications.map((n) => (
            <div key={n.id} className={styles.notifCard}>
              <div className={`${styles.notifIcon} ${n.type === "order" ? styles.notifGreen : n.type === "reservation" ? styles.notifBlue : styles.notifGray}`}>{n.icon || "ℹ️"}</div>
              <div className={styles.notifContent}><p className={styles.notifMsg}>{n.message}</p>{n.timeAgo && <p className={styles.notifTime}>{n.timeAgo}</p>}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}><div className={styles.emptyIcon}>🔔</div><h3>All Caught Up!</h3><p>No new notifications.</p></div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className={styles.fullSection}>
      <div className={styles.sectionPageHeader}><h2>👤 My Profile</h2></div>
      <div className={styles.profileCard}>
        <div className={styles.profileTop}>
          <img src={userData?.img_url || "/default-avatar.png"} alt="Profile" className={styles.profileAvatar} />
          <div className={styles.profileInfo}><h3>{userData?.name || "User"}</h3><p>{userData?.email}</p>{userData?.phone && <p>📱 {userData.phone}</p>}</div>
        </div>
        <div className={styles.profileStats}>
          {[
            { val: totalVisits, label: "Orders" },
            { val: fmt(totalSpent), label: "Spent" },
            { val: upcomingReservations.length + pastReservations.length, label: "Reservations" },
            { val: totalReviews, label: "Reviews" },
          ].map((s, i) => (
            <div key={i} className={styles.profileStat}><span className={styles.profileStatNum}>{s.val}</span><span className={styles.profileStatLabel}>{s.label}</span></div>
          ))}
        </div>
        <button className={styles.primaryBtn} onClick={handleEditProfileClick} style={{ width: "100%", marginTop: "1.5rem" }}>Edit Profile</button>
      </div>
    </div>
  );

  const sectionMap = { overview: renderOverview, reservations: renderReservations, orders: renderOrders, favorites: renderFavorites, analytics: renderAnalytics, reviews: renderReviews, notifications: renderNotifications, profile: renderProfile };

  /* ═══════ MAIN RENDER ══════════════════════════════ */
  return (
    <div className={styles.dashboard}>
      {/* Mobile hamburger */}
      <button className={styles.hamburger} onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
        <span /><span /><span />
      </button>
      {sidebarOpen && <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarProfile}>
          <img src={userData?.img_url || "/default-avatar.png"} alt="" className={styles.sidebarAvatar} />
          <div className={styles.sidebarUser}><h4>{userData?.name || "User"}</h4><p>{userData?.email || ""}</p></div>
        </div>
        <nav className={styles.sidebarNav}>
          {sidebarItems.map((item) => (
            <button key={item.id} className={`${styles.sidebarItem} ${activeSection === item.id ? styles.sidebarItemActive : ""}`} onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}>
              <span className={styles.sidebarItemIcon}>{item.icon}</span>
              <span className={styles.sidebarItemLabel}>{item.label}</span>
              {item.badge > 0 && <span className={styles.sidebarBadge}>{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <button className={styles.sidebarLogout} onClick={async () => { try { await logout(); } catch {} navigate("/login"); }}>🚪 Logout</button>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.mainArea}>
        <div className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <h1 className={styles.pageTitle}>{sidebarItems.find((s) => s.id === activeSection)?.icon} {sidebarItems.find((s) => s.id === activeSection)?.label}</h1>
          </div>
          <div className={styles.topBarRight}>
            <button className={styles.topBarBtn} onClick={() => navigate("/customer/")} title="Browse Restaurants">🍽️ Restaurants</button>
            <button className={styles.topBarBtn} onClick={() => setActiveSection("notifications")} title="Notifications" style={{ position: "relative" }}>
              🔔{unreadNotifications > 0 && <span className={styles.topBadge}>{unreadNotifications}</span>}
            </button>
          </div>
        </div>
        {fetchError && <div className={styles.errorBanner}>{fetchError}</div>}
        <div className={styles.content}>{sectionMap[activeSection]?.()}</div>
      </main>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}><h2>Edit Profile</h2><button className={styles.modalClose} onClick={handleCloseModal}>×</button></div>
            <form onSubmit={handleUpdateProfile} className={styles.modalForm}>
              {updateError && <div className={styles.formError}>{updateError}</div>}
              {updateSuccess && <div className={styles.formSuccess}>{updateSuccess}</div>}
              <div className={styles.modalAvatarSection}>
                <div className={styles.modalAvatarWrap} onClick={handleProfilePicClick} style={{ backgroundImage: profilePicPreview ? `url('${profilePicPreview}')` : "none", backgroundSize: "cover", backgroundPosition: "center" }}>
                  {!profilePicPreview && "📷"}
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleProfilePicChange} style={{ display: "none" }} />
                <button type="button" onClick={handleProfilePicClick} className={styles.changePicBtn}>{selectedProfileFile ? "✓ Selected" : "Change Photo"}</button>
              </div>
              <label className={styles.formLabel}>Name<input type="text" name="name" value={editFormData.name} onChange={handleInputChange} required className={styles.formInput} /></label>
              <label className={styles.formLabel}>Email<input type="email" name="email" value={editFormData.email} onChange={handleInputChange} required className={styles.formInput} /></label>
              <label className={styles.formLabel}>Phone<input type="text" name="phone" value={editFormData.phone} onChange={handleInputChange} className={styles.formInput} /></label>
              <div className={styles.formDivider}>Change Password (optional)</div>
              <label className={styles.formLabel}>New Password<input type="password" name="newPassword" value={editFormData.newPassword} onChange={handleInputChange} placeholder="Leave empty to keep current" className={styles.formInput} /></label>
              <label className={styles.formLabel}>Confirm Password<input type="password" name="confirmPassword" value={editFormData.confirmPassword} onChange={handleInputChange} placeholder="Leave empty to keep current" className={styles.formInput} /></label>
              <div className={styles.modalActions}>
                <button type="button" onClick={handleCloseModal} className={styles.cancelBtn} disabled={isUpdating}>Cancel</button>
                <button type="submit" className={styles.saveBtn} disabled={isUpdating}>{isUpdating ? "Saving..." : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
