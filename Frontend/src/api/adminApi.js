const BASE = "http://localhost:3000/api/admin";

const json = async (res) => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
};

const opts = (method, body) => ({
  method,
  credentials: "include",
  headers: body ? { "Content-Type": "application/json" } : {},
  ...(body ? { body: JSON.stringify(body) } : {}),
});

// Dashboard
export const fetchDashboard = () =>
  fetch(`${BASE}/dashboard`, opts("GET")).then(json);

export const fetchStatistics = () =>
  fetch(`${BASE}/statistics`, opts("GET")).then(json);

export const fetchChartStats = (period = "monthly") =>
  fetch(`${BASE}/chartstats?period=${period}`, opts("GET")).then(json);

export const fetchActivities = () =>
  fetch(`${BASE}/activities`, opts("GET")).then(json);

// Users
export const fetchUsers = () =>
  fetch(`${BASE}/users`, opts("GET")).then(json);

export const deleteUser = (id) =>
  fetch(`${BASE}/delete_user/${id}`, opts("POST")).then(json);

export const suspendUser = (id, data) =>
  fetch(`${BASE}/suspend_user/${id}`, opts("POST", data)).then(json);

export const unsuspendUser = (id) =>
  fetch(`${BASE}/unsuspend_user/${id}`, opts("POST")).then(json);

// Restaurants
export const fetchRestaurants = () =>
  fetch(`${BASE}/restaurants`, opts("GET")).then(json);

export const deleteRestaurant = (id) =>
  fetch(`${BASE}/delete_restaurant/${id}`, opts("GET")).then(json);

export const suspendRestaurant = (id, data) =>
  fetch(`${BASE}/suspend_restaurant/${id}`, opts("POST", data)).then(json);

export const unsuspendRestaurant = (id) =>
  fetch(`${BASE}/unsuspend_restaurant/${id}`, opts("POST")).then(json);

// Requests
export const fetchRequests = () =>
  fetch(`${BASE}/requests`, opts("GET")).then(json);

export const acceptRequest = (ownerUsername) =>
  fetch(`${BASE}/accept_request/${ownerUsername}`, opts("GET")).then(json);

export const rejectRequest = (ownerUsername) =>
  fetch(`${BASE}/reject_request/${ownerUsername}`, opts("GET")).then(json);

// Orders
export const fetchOrders = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (params.restaurant) qs.set("restaurant", params.restaurant);
  if (params.date) qs.set("date", params.date);
  if (params.page) qs.set("page", params.page);
  return fetch(`${BASE}/orders?${qs}`, opts("GET")).then(json);
};

// Reservations
export const fetchReservations = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (params.restaurant) qs.set("restaurant", params.restaurant);
  if (params.date) qs.set("date", params.date);
  if (params.page) qs.set("page", params.page);
  return fetch(`${BASE}/reservations?${qs}`, opts("GET")).then(json);
};

// Feedback
export const fetchFeedback = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (params.restaurant) qs.set("restaurant", params.restaurant);
  if (params.page) qs.set("page", params.page);
  return fetch(`${BASE}/feedback?${qs}`, opts("GET")).then(json);
};

// Analytics
export const fetchAnalytics = () =>
  fetch(`${BASE}/analytics`, opts("GET")).then(json);

// Profile
export const editProfile = (data) =>
  fetch(`${BASE}/edit_profile`, opts("POST", data)).then(json);

export const changePassword = (data) =>
  fetch(`${BASE}/change_password`, opts("POST", data)).then(json);

export const deleteAccount = () =>
  fetch(`${BASE}/delete_account`, { method: "DELETE", credentials: "include" }).then(json);
