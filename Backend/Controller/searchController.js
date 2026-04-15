const { Restaurant } = require("../Model/Restaurents_model");
const redis = require("../config/redis");

const searchRestaurants = async (req, res) => {
  try {
    console.time("search");

    const cacheKey = "search:" + JSON.stringify(req.query);

    // ✅ CHECK CACHE FIRST
    const cached = await redis.get(cacheKey);

    if (cached) {
      console.log("Cache Status: HIT");
      console.timeEnd("search");
      return res.json(JSON.parse(cached));
    }

    console.log("Cache Status: MISS");

    const {
      q,
      city,
      cuisine,
      open,
      page = 1,
      limit = 10
    } = req.query;

    let query = {};

    if (q) query.$text = { $search: q };
    if (city) query.city = city;
    if (cuisine) query.cuisine = cuisine;
    if (open !== undefined) query.isOpen = open === "true";

    const skip = (page - 1) * limit;

    let resultsQuery;

    if (q) {
      resultsQuery = Restaurant.find(query, {
        score: { $meta: "textScore" }
      }).sort({ score: { $meta: "textScore" } });
    } else {
      resultsQuery = Restaurant.find(query);
    }

    const results = await resultsQuery
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Restaurant.countDocuments(query);

    const responseData = {
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      totalResults: total,
      results
    };

    // ✅ STORE IN REDIS
    await redis.setEx(cacheKey, 60, JSON.stringify(responseData));

    console.timeEnd("search");

    res.json(responseData);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
};

module.exports = { searchRestaurants };