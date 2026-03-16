import { getCsrfToken } from "../util/csrf";

const BASE = "http://localhost:3000/api/staff";
const opts = { credentials: "include" };

const json = async (res) => {
  if (!res.ok) {
    // Try to parse error message from server response
    let message = `HTTP ${res.status}`;
    try {
      const errData = await res.json();
      message = errData.message || errData.error || message;
    } catch (_) {}
    throw new Error(message);
  }
  return res.json();
};

// Helper to get cache-busting query param (only for GET requests)
const bust = () => `?_=${Date.now()}`;

// ===========================================
// LEFTOVERS MANAGEMENT
// ===========================================

export const fetchLeftovers = () => {
  return fetch(`${BASE}/leftovers${bust()}`, opts).then(json);
};

export const addLeftover = async (data) => {
  const csrfToken = await getCsrfToken();
  return fetch(`${BASE}/leftovers`, {
    ...opts,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify(data),
  }).then(json);
};

export const updateLeftover = async (id, data) => {
  const csrfToken = await getCsrfToken();
  return fetch(`${BASE}/leftovers/${id}`, {
    ...opts,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify(data),
  }).then(json);
};

export const deleteLeftover = async (id) => {
  const csrfToken = await getCsrfToken();
  return fetch(`${BASE}/leftovers/${id}`, {
    ...opts,
    method: "DELETE",
    headers: {
      "X-CSRF-Token": csrfToken,
    },
  }).then(json);
};

export const deleteExpiredLeftovers = async () => {
  const csrfToken = await getCsrfToken();
  return fetch(`${BASE}/leftovers/expired`, {
    ...opts,
    method: "DELETE",
    headers: {
      "X-CSRF-Token": csrfToken,
    },
  }).then(json);
};

// ===========================================
// DASHBOARD & HOMEPAGE
// ===========================================

export const fetchDashboardSummary = () =>
  fetch(`${BASE}/dashboard/summary${bust()}`, opts).then(json);

export const fetchHomepageSummary = () =>
  fetch(`${BASE}/homepage/summary${bust()}`, opts).then(json);

// ===========================================
// ORDERS
// ===========================================

export const fetchOrders = () =>
  fetch(`${BASE}/orders${bust()}`, opts).then(json);

export const updateOrderStatus = async (orderId, status) => {
  const csrfToken = await getCsrfToken();
  return fetch(`${BASE}/orders/${orderId}/status`, {
    ...opts,
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({ status }),
  }).then(json);
};

// ===========================================
// RESERVATIONS
// ===========================================

export const fetchReservations = () =>
  fetch(`${BASE}/reservations${bust()}`, opts).then(json);

export const allocateTable = async (reservationId, tableNumber) => {
  const csrfToken = await getCsrfToken();
  return fetch(`${BASE}/reservations/${reservationId}/allocate`, {
    ...opts,
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({ tableNumber }),
  }).then(json);
};

export const removeReservation = async (id) => {
  const csrfToken = await getCsrfToken();
  return fetch(`${BASE}/reservations/${id}`, {
    ...opts,
    method: "DELETE",
    headers: {
      "X-CSRF-Token": csrfToken,
    },
  }).then(json);
};

// ===========================================
// TABLES
// ===========================================

export const fetchTables = () =>
  fetch(`${BASE}/tables${bust()}`, opts).then(json);

export const addTable = async (number, capacity) => {
  const csrfToken = await getCsrfToken();
  return fetch(`${BASE}/tables`, {
    ...opts,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({ number, capacity }),
  }).then(json);
};

export const updateTableStatus = async (tableNumber, status) => {
  const csrfToken = await getCsrfToken();
  return fetch(`${BASE}/tables/status`, {
    ...opts,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({ tableNumber, status }),
  }).then(json);
};

export const deleteTable = async (tableNumber) => {
  const csrfToken = await getCsrfToken();
  return fetch(`${BASE}/tables/${tableNumber}`, {
    ...opts,
    method: "DELETE",
    headers: {
      "X-CSRF-Token": csrfToken,
    },
  }).then(json);
};

// ===========================================
// INVENTORY
// ===========================================

export const fetchInventory = () =>
  fetch(`${BASE}/inventory${bust()}`, opts).then(json);

// ===========================================
// TASKS
// ===========================================

export const fetchTasks = () =>
  fetch(`${BASE}/tasks${bust()}`, opts).then(json);

export const updateTaskStatus = async (id, status) => {
  const csrfToken = await getCsrfToken();
  return fetch(`${BASE}/tasks/${id}`, {
    ...opts,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({ status }),
  }).then(json);
};

// ===========================================
// FEEDBACK
// ===========================================

export const fetchFeedback = () =>
  fetch(`${BASE}/feedback${bust()}`, opts).then(json);

// ===========================================
// ANNOUNCEMENTS
// ===========================================

export const fetchAnnouncements = () =>
  fetch(`${BASE}/announcements${bust()}`, opts).then(json);

// ===========================================
// SUPPORT
// ===========================================

export const fetchSupportMessages = () =>
  fetch(`${BASE}/homepage/support-messages${bust()}`, opts).then(json);

export const sendSupportMessage = async (data) => {
  const csrfToken = await getCsrfToken();
  return fetch(`${BASE}/support-message`, {
    ...opts,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify(data),
  }).then(json);
};

// ===========================================
// PROFILE
// ===========================================

export const changePassword = async (currentPassword, newPassword) => {
  const csrfToken = await getCsrfToken();
  return fetch(`${BASE}/change-password`, {
    ...opts,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  }).then(json);
};