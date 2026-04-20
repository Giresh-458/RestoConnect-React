const { Restaurant } = require("../Model/Restaurents_model");

const parsePositiveInteger = (value, fallback, max = Number.MAX_SAFE_INTEGER) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.min(parsed, max);
};

const parseBooleanFilter = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "open"].includes(normalized)) return true;
  if (["false", "0", "no", "closed"].includes(normalized)) return false;
  return null;
};

const normalizeOptionalFilter = (value) => {
  const normalized = String(value || "").trim();
  if (!normalized || normalized.toLowerCase() === "all") {
    return "";
  }
  return normalized;
};

const buildRestaurantSearchQuery = (params = {}) => {
  const searchTerm = normalizeOptionalFilter(params.query || params.q || params.search);
  const city = normalizeOptionalFilter(params.city || params.location);
  const cuisine = normalizeOptionalFilter(params.cuisine);
  const openFilter = parseBooleanFilter(params.open ?? params.openNow ?? params.isOpen);

  if (openFilter === null) {
    const error = new Error("Invalid open filter. Use true/false, 1/0, yes/no, or open/closed.");
    error.status = 400;
    throw error;
  }

  const filter = {};
  if (searchTerm) {
    filter.$text = { $search: searchTerm };
  }
  if (city) {
    filter.city = city;
  }
  if (cuisine) {
    filter.cuisine = cuisine;
  }
  if (openFilter !== undefined) {
    filter.isOpen = openFilter;
  }

  return { filter, searchTerm };
};

const getRestaurantSearchSort = (searchTerm, sortBy) => {
  if (searchTerm) {
    return { score: { $meta: "textScore" }, rating: -1 };
  }

  if (sortBy === "name") return { name: 1 };
  if (sortBy === "distance") return { distance: 1 };
  if (sortBy === "newest") return { date: -1 };
  return { rating: -1, name: 1 };
};

const searchRestaurants = async (req, res, next) => {
  try {
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, 10, 50);
    const skip = (page - 1) * limit;
    const { filter, searchTerm } = buildRestaurantSearchQuery(req.query);
    const projection = searchTerm ? { score: { $meta: "textScore" } } : {};
    const sort = getRestaurantSearchSort(searchTerm, req.query.sortBy);

    const [results, total] = await Promise.all([
      Restaurant.find(filter, projection).sort(sort).skip(skip).limit(limit).lean(),
      Restaurant.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return res.json({
      page,
      limit,
      totalPages,
      totalResults: total,
      results,
    });
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) {
      console.error("Search failed:", err);
    }
    return res.status(status).json({ error: err.message || "Search failed" });
  }
};

module.exports = {
  buildRestaurantSearchQuery,
  getRestaurantSearchSort,
  searchRestaurants,
};
