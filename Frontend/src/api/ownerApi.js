import { getCsrfToken } from "../util/csrf";

const BASE = "/api/owner";
const opts = { credentials: "include" };

const json = (res) => {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

// Dashboard & Info
export const fetchOwnerInfo = () => fetch(`${BASE}/info`, opts).then(json);
export const fetchDashboardStats = () => fetch(`${BASE}/dashboard/stats`, opts).then(json);
export const fetchDashboardSummary = () => fetch(`${BASE}/dashboard/summary`, opts).then(json);
export const fetchTrend = () => fetch(`${BASE}/dashboard/trend`, opts).then(json);
export const fetchRecentOrders = () => fetch(`${BASE}/orders/recent`, opts).then(json);
export const fetchReports = () => fetch(`${BASE}/reports`, opts).then(json);

// Restaurant Status
export const toggleRestaurantStatus = async (isOpen) => {
  const csrfToken = await getCsrfToken();
  return fetch(`${BASE}/settings`, {
    ...opts,
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({ isOpen }),
  }).then(json);
};

// Orders
export const fetchOrders = () => fetch(`${BASE}/orders`, opts).then(json);
export const updateOrderStatus = (id, status) =>
  fetch(`${BASE}/orders/${id}/status`, {
    ...opts,
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  }).then(json);

// Reservations
export const fetchReservations = () => fetch(`${BASE}/reservations`, opts).then(json);
export const updateReservationStatus = (id, status, tables, extra = {}) =>
  fetch(`${BASE}/reservations/${id}/status`, {
    ...opts,
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status,
      ...(Array.isArray(tables) ? { tables } : {}),
      ...extra,
    }),
  }).then(json);

// Menu
export const fetchMenu = () => fetch(`${BASE}/menuManagement`, opts).then(json);
export const addDish = (formData) =>
  fetch(`${BASE}/menuManagement/add`, { ...opts, method: "POST", body: formData }).then(json);
export const editDish = (id, formData) =>
  fetch(`${BASE}/menuManagement/api/edit/${id}`, { ...opts, method: "PUT", body: formData }).then(json);
export const deleteDish = (id) =>
  fetch(`${BASE}/menuManagement/api/delete/${id}`, { ...opts, method: "DELETE" }).then(json);

// Tables
export const fetchTables = () => fetch(`${BASE}/tables`, opts).then(json);
export const addTable = (number, seats) =>
  fetch(`${BASE}/tables/api/add`, {
    ...opts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ number, seats }),
  }).then(json);
export const deleteTable = (number) =>
  fetch(`${BASE}/tables/api/${number}`, { ...opts, method: "DELETE" }).then(json);
export const updateTableStatus = (number, status) =>
  fetch(`${BASE}/tables/${number}/status`, {
    ...opts,
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  }).then(json);

// Live Floor
export const fetchLiveFloor = () => fetch(`${BASE}/live-floor`, opts).then(json);

// Inventory
export const fetchInventory = () => fetch(`${BASE}/inventory`, opts).then(json);
export const createInventoryItem = (data) =>
  fetch(`${BASE}/inventory`, {
    ...opts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(json);
export const updateInventoryQty = (id, change) =>
  fetch(`${BASE}/inventory/${id}/quantity`, {
    ...opts,
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ change }),
  }).then(json);
export const deleteInventoryItem = (id) =>
  fetch(`${BASE}/inventory/${id}`, { ...opts, method: "DELETE" }).then(json);

// Feedback
export const fetchFeedback = () => fetch(`${BASE}/feedback`, opts).then(json);
export const updateFeedbackStatus = (id, status) =>
  fetch(`${BASE}/feedback/${id}/status`, {
    ...opts,
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  }).then(json);

// Staff
export const fetchStaff = () => fetch(`${BASE}/staffManagement`, opts).then(json);
export const addStaff = (data) =>
  fetch(`${BASE}/staffManagement/api/add`, {
    ...opts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(json);
export const deleteStaff = (id) =>
  fetch(`${BASE}/staffManagement/api/${id}`, { ...opts, method: "DELETE" }).then(json);
export const fetchStaffTasks = (staffId) =>
  fetch(`${BASE}/staffManagement/tasks/${staffId}`, opts).then(json);
export const deleteStaffTask = (taskId) =>
  fetch(`${BASE}/staffManagement/tasks/${taskId}`, { ...opts, method: "DELETE" }).then(json);
export const addTask = (data) =>
  fetch(`${BASE}/add-task`, {
    ...opts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(json);
export const addShift = (data) =>
  fetch(`${BASE}/add-shift`, {
    ...opts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(json);

// Announcements
export const fetchAnnouncements = () => fetch(`${BASE}/announcements`, opts).then(json);
export const addAnnouncement = (data) =>
  fetch(`${BASE}/add-announcement`, {
    ...opts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(json);
export const deleteAnnouncement = (id) =>
  fetch(`${BASE}/announcements/${id}`, { ...opts, method: "DELETE" }).then(json);

// Settings
export const fetchSettings = () => fetch(`${BASE}/settings`, opts).then(json);
export const updateSettings = (data) =>
  fetch(`${BASE}/settings`, {
    ...opts,
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(json);

export const updateOwnerAccount = (data) =>
  fetch(`${BASE}/account`, {
    ...opts,
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(json);

// Promo Codes
export const fetchPromoCodes = () => fetch(`${BASE}/promo-codes`, opts).then(json);
export const createPromoCode = (data) =>
  fetch(`${BASE}/promo-codes`, {
    ...opts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(json);
export const togglePromoCode = (id) =>
  fetch(`${BASE}/promo-codes/${id}/toggle`, { ...opts, method: "PATCH" }).then(json);
export const deletePromoCodeApi = (id) =>
  fetch(`${BASE}/promo-codes/${id}`, { ...opts, method: "DELETE" }).then(json);

// Support
export const fetchSupportThreads = () => fetch(`${BASE}/support-threads`, opts).then(json);
export const postSupportMessage = (threadId, message) =>
  fetch(`${BASE}/support-threads/${threadId}/messages`, {
    ...opts,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  }).then(json);
export const updateSupportStatus = (threadId, status) =>
  fetch(`${BASE}/support-threads/${threadId}/status`, {
    ...opts,
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  }).then(json);
