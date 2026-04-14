const BASE = "/api/admin";

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
  fetch(`${BASE}/users/${id}`, opts("DELETE")).then(json);

export const suspendUser = (id, data) =>
  fetch(`${BASE}/users/${id}/suspension`, opts("PATCH", data)).then(json);

export const unsuspendUser = (id) =>
  fetch(`${BASE}/users/${id}/suspension/clear`, opts("PATCH")).then(json);

// Restaurants
export const fetchRestaurants = () =>
  fetch(`${BASE}/restaurants`, opts("GET")).then(json);

export const deleteRestaurant = (id) =>
  fetch(`${BASE}/restaurants/${id}`, opts("DELETE")).then(json);

export const suspendRestaurant = (id, data) =>
  fetch(`${BASE}/restaurants/${id}/suspension`, opts("PATCH", data)).then(json);

export const unsuspendRestaurant = (id) =>
  fetch(`${BASE}/restaurants/${id}/suspension/clear`, opts("PATCH")).then(json);

// Requests
export const fetchRequests = () =>
  fetch(`${BASE}/restaurant-requests`, opts("GET")).then(json);

export const acceptRequest = (ownerUsername) =>
  fetch(`${BASE}/restaurant-requests/${ownerUsername}/accept`, opts("POST")).then(json);

export const rejectRequest = (ownerUsername) =>
  fetch(`${BASE}/restaurant-requests/${ownerUsername}/reject`, opts("POST")).then(json);

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

// Employee management
export const addEmployee = (data) =>
  fetch(`${BASE}/employees`, opts("POST", data)).then(json);

// Insights
export const fetchEmployeePerformance = () =>
  fetch(`${BASE}/insights/employees`, opts("GET")).then(json);

export const fetchRestaurantRevenue = (period = "all") =>
  fetch(`${BASE}/insights/restaurant-revenue?period=${period}`, opts("GET")).then(json);

export const fetchDishTrends = () =>
  fetch(`${BASE}/insights/dish-trends`, opts("GET")).then(json);

export const fetchTopCustomers = (period = "all") =>
  fetch(`${BASE}/insights/top-customers?period=${period}`, opts("GET")).then(json);

// Admin Overview
export const fetchAdminOverview = () =>
  fetch(`${BASE}/overview`, opts("GET")).then(json);

export const fetchRevenueChart = (period = "monthly") =>
  fetch(`${BASE}/revenue-chart?period=${period}`, opts("GET")).then(json);

// Profile
export const editProfile = (data) =>
  fetch(`${BASE}/profile`, opts("PUT", data)).then(json);

export const changePassword = (data) =>
  fetch(`${BASE}/password`, opts("PUT", data)).then(json);

export const deleteAccount = () =>
  fetch(`${BASE}/account`, { method: "DELETE", credentials: "include" }).then(json);
