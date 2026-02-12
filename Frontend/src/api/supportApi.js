const BASE = "http://localhost:3000";

const json = (res) => {
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
};

const opts = (method, body) => ({
  method,
  credentials: "include",
  headers: body ? { "Content-Type": "application/json" } : {},
  ...(body ? { body: JSON.stringify(body) } : {}),
});


export const customerApi = {
  getOrders: () =>
    fetch(`${BASE}/api/customer/support/orders`, opts("GET")).then(json),

  getCategories: () =>
    fetch(`${BASE}/api/customer/support/categories`, opts("GET")).then(json),

  getTickets: (status) => {
    const params = new URLSearchParams();
    if (status && status !== "all") params.set("status", status);
    return fetch(`${BASE}/api/customer/support/tickets?${params}`, opts("GET")).then(json);
  },

  getTicket: (ticketId) =>
    fetch(`${BASE}/api/customer/support/tickets/${ticketId}`, opts("GET")).then(json),

  /** Create ticket from an order */
  createTicket: (data) =>
    fetch(`${BASE}/api/customer/support/tickets`, opts("POST", data)).then(json),

  postMessage: (ticketId, message) =>
    fetch(
      `${BASE}/api/customer/support/tickets/${ticketId}/messages`,
      opts("POST", { message })
    ).then(json),

  rateTicket: (ticketId, rating, comment) =>
    fetch(
      `${BASE}/api/customer/support/tickets/${ticketId}/rate`,
      opts("PATCH", { rating, comment })
    ).then(json),

  closeTicket: (ticketId) =>
    fetch(
      `${BASE}/api/customer/support/tickets/${ticketId}/close`,
      opts("PATCH")
    ).then(json),
};


export const ownerApi = {
  getStats: () =>
    fetch(`${BASE}/api/owner/support/stats`, opts("GET")).then(json),

  getTickets: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== "all") params.set("status", filters.status);
    if (filters.priority && filters.priority !== "all") params.set("priority", filters.priority);
    if (filters.category && filters.category !== "all") params.set("category", filters.category);
    return fetch(`${BASE}/api/owner/support/tickets?${params}`, opts("GET")).then(json);
  },

  getTicket: (ticketId) =>
    fetch(`${BASE}/api/owner/support/tickets/${ticketId}`, opts("GET")).then(json),

  postMessage: (ticketId, message) =>
    fetch(
      `${BASE}/api/owner/support/tickets/${ticketId}/messages`,
      opts("POST", { message })
    ).then(json),

  updateStatus: (ticketId, status) =>
    fetch(
      `${BASE}/api/owner/support/tickets/${ticketId}/status`,
      opts("PATCH", { status })
    ).then(json),

  updatePriority: (ticketId, priority) =>
    fetch(
      `${BASE}/api/owner/support/tickets/${ticketId}/priority`,
      opts("PATCH", { priority })
    ).then(json),

  addNote: (ticketId, text) =>
    fetch(
      `${BASE}/api/owner/support/tickets/${ticketId}/notes`,
      opts("POST", { text })
    ).then(json),
};

export const adminApi = {
  getStats: () =>
    fetch(`${BASE}/api/admin/support/stats`, opts("GET")).then(json),

  getTickets: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== "all") params.set("status", filters.status);
    if (filters.priority && filters.priority !== "all") params.set("priority", filters.priority);
    if (filters.category && filters.category !== "all") params.set("category", filters.category);
    if (filters.rest_id) params.set("rest_id", filters.rest_id);
    return fetch(`${BASE}/api/admin/support/tickets?${params}`, opts("GET")).then(json);
  },

  getTicket: (ticketId) =>
    fetch(`${BASE}/api/admin/support/tickets/${ticketId}`, opts("GET")).then(json),

  postMessage: (ticketId, message) =>
    fetch(
      `${BASE}/api/admin/support/tickets/${ticketId}/messages`,
      opts("POST", { message })
    ).then(json),

  updateStatus: (ticketId, status) =>
    fetch(
      `${BASE}/api/admin/support/tickets/${ticketId}/status`,
      opts("PATCH", { status })
    ).then(json),

  assignTicket: (ticketId, assignedTo, assignedRole) =>
    fetch(
      `${BASE}/api/admin/support/tickets/${ticketId}/assign`,
      opts("PATCH", { assignedTo, assignedRole })
    ).then(json),

  addNote: (ticketId, text) =>
    fetch(
      `${BASE}/api/admin/support/tickets/${ticketId}/notes`,
      opts("POST", { text })
    ).then(json),
};
