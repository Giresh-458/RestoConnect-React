/**
 * Maps HTTP requests to Redis cache tags for read-through caching and targeted invalidation.
 * Tag format: "namespace:identifier" (sanitized in dataCache).
 */

/**
 * Express sets req.path relative to the mounted router (e.g. "/dashboard" under "/api/owner").
 * Use baseUrl + path so rules match the real URL (e.g. "/api/owner/dashboard").
 */
const getFullPath = (req) => {
  const joined = `${req.baseUrl || ""}${req.path || ""}`;
  if (joined) return joined;
  return String(req.originalUrl || "").split("?")[0] || "";
};

const sanitizeId = (value) => {
  if (value === undefined || value === null) return "";
  const s = String(value).trim();
  if (!s) return "";
  return s.length > 128 ? s.slice(0, 128) : s;
};

const extractRestaurantId = (req) =>
  sanitizeId(req.auth?.rest_id) ||
  sanitizeId(req.params?.restid) ||
  sanitizeId(req.params?.id) ||
  pickBodyRestaurantId(req);

const getRestaurantDomainTags = (path, rid) => {
  const tags = new Set();
  if (!rid) return tags;

  if (path.includes("/orders")) tags.add(`orders:${rid}`);
  if (path.includes("/reservations")) tags.add(`reservations:${rid}`);
  if (path.includes("/tables")) tags.add(`tables:${rid}`);
  if (path.includes("/menu") || path.includes("/menumanagement")) tags.add(`menu:${rid}`);

  return tags;
};

const addRestaurantDashboardTags = (tags, rid) => {
  if (!rid) return;
  tags.add(`orders:${rid}`);
  tags.add(`reservations:${rid}`);
  tags.add(`tables:${rid}`);
};

const addGlobalDomainTagsFromRestaurantDomainTags = (tags, domainTags) => {
  for (const tag of domainTags) {
    if (tag.startsWith("orders:")) tags.add("orders:global");
    if (tag.startsWith("reservations:")) tags.add("reservations:global");
    if (tag.startsWith("tables:")) tags.add("tables:global");
  }
};

/**
 * Tags attached to cached GET responses (same response may belong to multiple tags).
 */
const getReadTags = (req) => {
  const path = getFullPath(req);
  const lowerPath = path.toLowerCase();
  const tags = new Set();

  if (path.startsWith("/menu/")) {
    const rid = sanitizeId(req.params?.restid);
    if (rid) tags.add(`restaurant:${rid}`);
    tags.add("public:discovery");
    return [...tags];
  }

  if (path === "/api/restaurants") {
    tags.add("public:restaurants");
    tags.add("public:discovery");
    return [...tags];
  }

  if (path.startsWith("/api/superadmin")) {
    tags.add("superadmin:data");
    if (lowerPath.includes("/dashboard") || lowerPath.includes("/analytics")) {
      tags.add("orders:global");
      tags.add("reservations:global");
      tags.add("tables:global");
    }
    return [...tags];
  }

  if (path.startsWith("/api/admin/support") || path.startsWith("/api/employee/support")) {
    const u = sanitizeId(req.auth?.username);
    if (u) tags.add(`admin:user:${u}`);
    tags.add("admin:data");
    return [...tags];
  }

  if (path.startsWith("/api/customer/support")) {
    const u = sanitizeId(req.auth?.username);
    if (u) {
      tags.add(`user:${u}`);
    }
    return [...tags];
  }

  if (path.startsWith("/api/owner/support")) {
    const rid = sanitizeId(req.auth?.rest_id);
    if (rid) tags.add(`restaurant:${rid}`);
    return [...tags];
  }

  if (path.startsWith("/api/owner")) {
    const rid = sanitizeId(req.auth?.rest_id);
    if (rid) {
      tags.add(`restaurant:${rid}`);
      const domainTags = getRestaurantDomainTags(lowerPath, rid);
      domainTags.forEach((t) => tags.add(t));
      if (lowerPath.includes("/dashboard") || lowerPath.includes("/analytics")) {
        addRestaurantDashboardTags(tags, rid);
      }
    }
    return [...tags];
  }

  if (path.startsWith("/api/staff")) {
    const rid = sanitizeId(req.auth?.rest_id);
    if (rid) {
      tags.add(`restaurant:${rid}`);
      const domainTags = getRestaurantDomainTags(lowerPath, rid);
      domainTags.forEach((t) => tags.add(t));
      if (lowerPath.includes("/dashboard") || lowerPath.includes("/analytics")) {
        addRestaurantDashboardTags(tags, rid);
      }
    }
    return [...tags];
  }

  if (path.startsWith("/api/admin") || path.startsWith("/api/employee")) {
    const u = sanitizeId(req.auth?.username);
    if (u) tags.add(`admin:user:${u}`);
    tags.add("admin:data");
    if (lowerPath.includes("/dashboard") || lowerPath.includes("/analytics")) {
      tags.add("orders:global");
      tags.add("reservations:global");
      tags.add("tables:global");
    }
    return [...tags];
  }

  if (path.startsWith("/api/customer")) {
    const u = sanitizeId(req.auth?.username);
    if (u) {
      tags.add(`user:${u}`);
    }
    if (
      path.includes("/restaurants/public-cuisines") ||
      path.includes("/restaurants/search")
    ) {
      tags.add("public:discovery");
    }
    if (!req.auth?.username) {
      tags.add("public:discovery");
    }
    return [...tags];
  }

  return [];
};

const pickBodyRestaurantId = (req) => {
  const b = req.body && typeof req.body === "object" ? req.body : {};
  return (
    sanitizeId(b.restaurantId) ||
    sanitizeId(b.rest_id) ||
    sanitizeId(b.restId) ||
    sanitizeId(b.restid)
  );
};

/**
 * Tags to invalidate after a successful mutating request.
 * @returns {{ tags: string[], fallbackClearAll: boolean }}
 */
const getMutationInvalidation = (req) => {
  const path = getFullPath(req);
  const method = req.method || "";
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return { tags: [], fallbackClearAll: false };
  }

  const tags = new Set();

  if (path.startsWith("/api/owner")) {
    const rid = extractRestaurantId(req);
    const lowerPath = path.toLowerCase();
    const domainTags = getRestaurantDomainTags(lowerPath, rid);
    domainTags.forEach((t) => tags.add(t));
    addGlobalDomainTagsFromRestaurantDomainTags(tags, domainTags);

    if (lowerPath.includes("/menu") || lowerPath.includes("/menumanagement")) {
      tags.add("public:discovery");
    }

    // Safe fallback for owner routes that don't map to a specific domain yet.
    if (tags.size === 0 && rid) {
      tags.add(`restaurant:${rid}`);
      tags.add("public:discovery");
    }

    return { tags: [...tags], fallbackClearAll: false };
  }

  if (path.startsWith("/api/staff")) {
    const rid = extractRestaurantId(req);
    const lowerPath = path.toLowerCase();
    const domainTags = getRestaurantDomainTags(lowerPath, rid);
    domainTags.forEach((t) => tags.add(t));
    addGlobalDomainTagsFromRestaurantDomainTags(tags, domainTags);

    if (lowerPath.includes("/menu")) {
      tags.add("public:discovery");
    }

    // Safe fallback for staff routes that don't map to a specific domain yet.
    if (tags.size === 0 && rid) {
      tags.add(`restaurant:${rid}`);
      tags.add("public:discovery");
    }

    return { tags: [...tags], fallbackClearAll: false };
  }

  if (path.startsWith("/api/customer")) {
    const u = sanitizeId(req.auth?.username);
    if (u) {
      tags.add(`user:${u}`);
    }
    const bodyR = pickBodyRestaurantId(req);
    if (bodyR) tags.add(`restaurant:${bodyR}`);
    const paramR = sanitizeId(req.params?.restid);
    if (paramR) tags.add(`restaurant:${paramR}`);
    if (path.includes("/favourites") || path.includes("/cart") || path.includes("/menu/")) {
      tags.add("public:discovery");
    }
    if (path.includes("/order") || path.includes("/orders") || path.includes("/reservation")) {
      tags.add("orders:global");
      tags.add("reservations:global");
    }
    if (path.startsWith("/api/customer/support")) {
      tags.add("admin:data");
    }
    return { tags: [...tags], fallbackClearAll: false };
  }

  if (path.startsWith("/api/admin") || path.startsWith("/api/employee")) {
    tags.add("admin:data");
    if (
      path.includes("/restaurant-requests") ||
      path.includes("/requests") ||
      path.includes("/accept_request") ||
      path.includes("/reject_request")
    ) {
      tags.add("public:discovery");
    }
    if (path.includes("/restaurants")) {
      tags.add("public:discovery");
      tags.add("public:restaurants");
    }
    return { tags: [...tags], fallbackClearAll: false };
  }

  if (path.startsWith("/api/superadmin")) {
    tags.add("superadmin:data");
    tags.add("admin:data");
    return { tags: [...tags], fallbackClearAll: false };
  }

  if (path.startsWith("/api/auth")) {
    tags.add("admin:data");
    if (path.includes("/signup")) tags.add("public:discovery");
    return { tags: [...tags], fallbackClearAll: false };
  }

  if (path.startsWith("/api/create-payment-intent")) {
    return { tags: [], fallbackClearAll: false };
  }

  if (path.startsWith("/api/")) {
    return { tags: [], fallbackClearAll: true };
  }

  return { tags: [], fallbackClearAll: false };
};

module.exports = {
  getFullPath,
  getReadTags,
  getMutationInvalidation,
};
