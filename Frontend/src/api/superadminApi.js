const BASE = "/api/superadmin";

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

// Dashboard overview
export const fetchSuperDashboard = () =>
  fetch(`${BASE}/dashboard`, opts("GET")).then(json);

// Employee performance
export const fetchEmployeePerformance = () =>
  fetch(`${BASE}/employees`, opts("GET")).then(json);

// Restaurant revenue
export const fetchRestaurantRevenue = (period = "all") =>
  fetch(`${BASE}/restaurant-revenue?period=${period}`, opts("GET")).then(json);

// Dish & category trends
export const fetchDishTrends = () =>
  fetch(`${BASE}/dish-trends`, opts("GET")).then(json);

// Top customers
export const fetchTopCustomers = (period = "all") =>
  fetch(`${BASE}/top-customers?period=${period}`, opts("GET")).then(json);

// Revenue chart data
export const fetchRevenueChart = (period = "monthly") =>
  fetch(`${BASE}/revenue-chart?period=${period}`, opts("GET")).then(json);
