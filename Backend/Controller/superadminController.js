// Controller/superadminController.js
const { User } = require("../Model/userRoleModel");
const { Restaurant } = require("../Model/Restaurents_model");
const { Order } = require("../Model/Order_model");
const { Reservation } = require("../Model/Reservation_model");
const Feedback = require("../Model/feedback");
const RestaurantRequest = require("../Model/restaurent_request_model");

// SuperAdmin Dashboard Overview
exports.getDashboard = async (req, res) => {
  try {
    const currentAdmin = req.user;

    const [
      totalUsers,
      totalEmployees,
      totalRestaurants,
      totalOrders,
      totalReservations,
      revenueResult,
      restaurants,
    ] = await Promise.all([
      User.countDocuments({ role: { $nin: ["admin", "employee"] } }),
      User.countDocuments({ role: "employee" }),
      Restaurant.countDocuments(),
      Order.countDocuments(),
      Reservation.countDocuments(),
      Order.aggregate([
        { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
      ]),
      Restaurant.find({}).select("name _id image location amount"),
    ]);

    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
    const platformFee = totalRevenue * 0.1;

    res.json({
      current_admin: currentAdmin,
      totalUsers,
      totalEmployees,
      totalRestaurants,
      totalOrders,
      totalReservations,
      totalRevenue,
      platformFee,
      restaurants_list: restaurants.map((r) => ({
        name: r.name,
        _id: r._id,
        image: r.image,
        location: r.location,
        amount: r.amount,
      })),
    });
  } catch (error) {
    console.error("Error in superadmin getDashboard:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Employee Performance Analytics
exports.getEmployeePerformance = async (req, res) => {
  try {
    const [employees, restaurants, orderStats] = await Promise.all([
      User.find({ role: "employee" })
        .select("username email _id isSuspended")
        .lean(),
      Restaurant.find({}).select("_id").lean(),
      Order.aggregate([
        {
          $group: {
            _id: "$rest_id",
            totalOrders: { $sum: 1 },
            revenueGenerated: { $sum: "$totalAmount" },
          },
        },
      ]),
    ]);

    const orderStatsMap = new Map(
      orderStats.map((row) => [String(row._id), row]),
    );

    const employeeCount = employees.length || 1;

    const performance = employees.map((emp, idx) => {
      // Distribute restaurants among employees for simulation
      const managedRestaurants = restaurants.filter(
        (_, i) => i % employeeCount === idx,
      );
      const managedRestIds = managedRestaurants.map((r) => r._id.toString());

      // Orders from managed restaurants
      const totalApprovals = managedRestaurants.length;
      const totals = managedRestIds.reduce(
        (acc, rid) => {
          const stat = orderStatsMap.get(String(rid));
          if (stat) {
            acc.totalOrdersHandled += stat.totalOrders || 0;
            acc.revenueGenerated += stat.revenueGenerated || 0;
          }
          return acc;
        },
        { totalOrdersHandled: 0, revenueGenerated: 0 },
      );

      const avgResponseTime = Math.floor(Math.random() * 40) + 5;

      return {
        _id: emp._id,
        username: emp.username,
        email: emp.email,
        isSuspended: emp.isSuspended,
        totalApprovals,
        totalOrdersHandled: totals.totalOrdersHandled,
        revenueGenerated: totals.revenueGenerated,
        avgResponseTime,
        rating:
          totalApprovals > 5
            ? 4.5
            : totalApprovals > 2
              ? 3.8
              : totalApprovals > 0
                ? 3.0
                : 0,
      };
    });

    // Sort by approvals desc
    performance.sort((a, b) => b.totalApprovals - a.totalApprovals);

    res.json({ employees: performance });
  } catch (error) {
    console.error("Error in getEmployeePerformance:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Restaurant Revenue Analytics
exports.getRestaurantRevenue = async (req, res) => {
  try {
    const { period = "all" } = req.query;
    const restaurants = await Restaurant.find({}).select(
      "name _id location city image rating isOpen",
    );

    // Build date filter for aggregation
    const now = new Date();
    const dateMatch = {};
    if (period === "today") {
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      dateMatch.date = { $gte: todayStart };
    } else if (period === "week") {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      dateMatch.date = { $gte: weekStart };
    } else if (period === "month") {
      dateMatch.date = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
    } else if (period === "year") {
      dateMatch.date = { $gte: new Date(now.getFullYear(), 0, 1) };
    }

    // Aggregate revenue and order count per restaurant in DB
    const pipeline = [];
    if (Object.keys(dateMatch).length > 0) {
      pipeline.push({ $match: dateMatch });
    }
    pipeline.push({
      $group: {
        _id: "$rest_id",
        revenue: { $sum: "$totalAmount" },
        orders: { $sum: 1 },
      },
    });
    const revenueAgg = await Order.aggregate(pipeline);
    const revenueMap = new Map(
      revenueAgg.map((r) => [
        String(r._id),
        { revenue: r.revenue || 0, orders: r.orders || 0 },
      ]),
    );

    const restaurantData = restaurants
      .map((r) => {
        const data = revenueMap.get(String(r._id)) || { revenue: 0, orders: 0 };
        const platformFee = data.revenue * 0.1;
        return {
          _id: r._id,
          name: r.name,
          location: r.location,
          city: r.city,
          image: r.image,
          rating: r.rating || 0,
          revenue: data.revenue,
          orders: data.orders,
          platformFee,
          avgOrderValue:
            data.orders > 0 ? Math.round(data.revenue / data.orders) : 0,
          isOpen: r.isOpen,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    const totalRevenue = restaurantData.reduce((s, r) => s + r.revenue, 0);
    const totalPlatformFee = restaurantData.reduce(
      (s, r) => s + r.platformFee,
      0,
    );
    const totalOrders = restaurantData.reduce((s, r) => s + r.orders, 0);

    res.json({
      restaurants: restaurantData,
      summary: {
        totalRevenue,
        totalPlatformFee,
        totalOrders,
        avgOrderValue:
          totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      },
    });
  } catch (error) {
    console.error("Error in getRestaurantRevenue:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Category & Dish Trends
exports.getDishTrends = async (req, res) => {
  try {
    const { Dish } = require("../Model/Dishes_model_test");

    const now = new Date();

    // Current month vs previous month
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [allDishes, currentCounts, prevCounts, monthlyAgg, restDishMap] =
      await Promise.all([
        Dish.find({}).lean(),
        Order.aggregate([
          { $match: { date: { $gte: currentMonthStart } } },
          { $unwind: "$dishes" },
          { $group: { _id: "$dishes", count: { $sum: 1 } } },
        ]),
        Order.aggregate([
          { $match: { date: { $gte: prevMonthStart, $lte: prevMonthEnd } } },
          { $unwind: "$dishes" },
          { $group: { _id: "$dishes", count: { $sum: 1 } } },
        ]),
        Order.aggregate([
          { $match: { date: { $gte: sixMonthsAgo } } },
          {
            $facet: {
              revenueByMonth: [
                {
                  $group: {
                    _id: { y: { $year: "$date" }, m: { $month: "$date" } },
                    revenue: { $sum: "$totalAmount" },
                  },
                },
              ],
              dishByMonth: [
                { $unwind: "$dishes" },
                {
                  $group: {
                    _id: { y: { $year: "$date" }, m: { $month: "$date" } },
                    totalDishesOrdered: { $sum: 1 },
                    uniqueDishSet: { $addToSet: "$dishes" },
                  },
                },
                {
                  $project: {
                    _id: 1,
                    totalDishesOrdered: 1,
                    uniqueDishes: { $size: "$uniqueDishSet" },
                  },
                },
              ],
            },
          },
        ]),
        Restaurant.aggregate([
          { $project: { name: 1, dishes: 1 } },
          { $unwind: "$dishes" },
          { $group: { _id: "$dishes", restaurants: { $addToSet: "$name" } } },
        ]),
      ]);

    const currentMap = new Map(
      currentCounts.map((r) => [String(r._id), r.count]),
    );
    const prevMap = new Map(prevCounts.map((r) => [String(r._id), r.count]));
    const restMap = new Map(
      restDishMap.map((r) => [String(r._id), r.restaurants]),
    );

    // Build dish trends
    const dishTrends = allDishes.map((dish) => {
      const current = currentMap.get(String(dish._id)) || 0;
      const previous = prevMap.get(String(dish._id)) || 0;
      const change =
        previous > 0
          ? ((current - previous) / previous) * 100
          : current > 0
            ? 100
            : 0;

      return {
        _id: dish._id,
        name: dish.name,
        price: dish.price,
        image: dish.image,
        currentMonthOrders: current,
        prevMonthOrders: previous,
        changePercent: Math.round(change),
        trend: change > 0 ? "up" : change < 0 ? "down" : "stable",
        restaurants: restMap.get(String(dish._id)) || [],
      };
    });

    // Sort by current month orders desc
    dishTrends.sort((a, b) => b.currentMonthOrders - a.currentMonthOrders);

    // Category aggregation (group by actual dish category)
    const categories = {};

    // Build a dish ID -> category map from allDishes
    const dishCategoryMap = {};
    allDishes.forEach((d) => {
      dishCategoryMap[d._id.toString()] = d.category || "Main Course";
    });

    dishTrends.forEach((d) => {
      const cat = dishCategoryMap[d._id.toString()] || "Main Course";
      if (!categories[cat]) {
        categories[cat] = { current: 0, previous: 0, dishes: 0 };
      }
      categories[cat].current += d.currentMonthOrders;
      categories[cat].previous += d.prevMonthOrders;
      categories[cat].dishes++;
    });

    const categoryTrends = Object.entries(categories).map(([name, data]) => {
      const change =
        data.previous > 0
          ? ((data.current - data.previous) / data.previous) * 100
          : data.current > 0
            ? 100
            : 0;
      return {
        category: name,
        currentMonthOrders: data.current,
        prevMonthOrders: data.previous,
        changePercent: Math.round(change),
        trend: change > 0 ? "up" : change < 0 ? "down" : "stable",
        dishCount: data.dishes,
      };
    });

    // Monthly trend data for chart (last 6 months)
    const monthlyFacet = monthlyAgg[0] || {
      revenueByMonth: [],
      dishByMonth: [],
    };
    const revMonthMap = new Map(
      monthlyFacet.revenueByMonth.map((r) => [
        `${r._id.y}-${r._id.m}`,
        r.revenue,
      ]),
    );
    const dishMonthMap = new Map(
      monthlyFacet.dishByMonth.map((r) => [`${r._id.y}-${r._id.m}`, r]),
    );
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const dishStat = dishMonthMap.get(key) || {
        totalDishesOrdered: 0,
        uniqueDishes: 0,
      };
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      monthlyData.push({
        month: months[d.getMonth()],
        totalDishesOrdered: dishStat.totalDishesOrdered,
        uniqueDishes: dishStat.uniqueDishes,
        revenue: revMonthMap.get(key) || 0,
      });
    }

    res.json({
      dishes: dishTrends.slice(0, 30), // Top 30 dishes
      categoryTrends,
      monthlyData,
      topGainers: dishTrends
        .filter((d) => d.trend === "up")
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, 5),
      topDecliners: dishTrends
        .filter((d) => d.trend === "down")
        .sort((a, b) => a.changePercent - b.changePercent)
        .slice(0, 5),
    });
  } catch (error) {
    console.error("Error in getDishTrends:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Top Customers Analytics
exports.getTopCustomers = async (req, res) => {
  try {
    const { period = "all" } = req.query;
    const customers = await User.find({ role: "customer" }).select(
      "username email _id",
    );

    // Build date filter
    const now = new Date();
    const dateMatch = {};
    if (period === "month") {
      dateMatch.date = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
    } else if (period === "quarter") {
      const quarterStart = new Date(now);
      quarterStart.setMonth(quarterStart.getMonth() - 3);
      dateMatch.date = { $gte: quarterStart };
    } else if (period === "year") {
      dateMatch.date = { $gte: new Date(now.getFullYear(), 0, 1) };
    }

    // Aggregate customer spending in DB instead of loading all orders
    const pipeline = [];
    if (Object.keys(dateMatch).length > 0) {
      pipeline.push({ $match: dateMatch });
    }
    pipeline.push(
      {
        $group: {
          _id: "$customerName",
          totalSpent: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
          totalItems: { $sum: { $size: { $ifNull: ["$dishes", []] } } },
          lastOrderDate: { $max: "$date" },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 50 }, // Get more than needed so we can match with user profiles
    );
    const customerAgg = await Order.aggregate(pipeline);
    const spendingMap = new Map(customerAgg.map((c) => [c._id, c]));

    // Match with user profiles
    const topCustomers = customers
      .map((c) => {
        const data = spendingMap.get(c.username);
        if (!data) return null;
        return {
          _id: c._id,
          username: c.username,
          email: c.email,
          totalSpent: data.totalSpent || 0,
          totalOrders: data.totalOrders || 0,
          totalItems: data.totalItems || 0,
          avgOrderValue:
            data.totalOrders > 0
              ? Math.round(data.totalSpent / data.totalOrders)
              : 0,
          lastOrderDate: data.lastOrderDate || null,
        };
      })
      .filter((c) => c !== null)
      .sort((a, b) => b.totalSpent - a.totalSpent);

    // Summary stats
    const totalCustomerSpend = topCustomers.reduce(
      (s, c) => s + c.totalSpent,
      0,
    );
    const avgSpendPerCustomer =
      topCustomers.length > 0
        ? Math.round(totalCustomerSpend / topCustomers.length)
        : 0;
    const maxSpender = topCustomers[0] || null;

    res.json({
      customers: topCustomers.slice(0, 20),
      summary: {
        totalActiveCustomers: topCustomers.length,
        totalCustomerSpend,
        avgSpendPerCustomer,
        topSpender: maxSpender
          ? { username: maxSpender.username, totalSpent: maxSpender.totalSpent }
          : null,
      },
    });
  } catch (error) {
    console.error("Error in getTopCustomers:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Revenue Over Time (for charts)
exports.getRevenueOverTime = async (req, res) => {
  try {
    const { period = "monthly" } = req.query;
    const now = new Date();
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    let data = [];

    if (period === "daily") {
      // Last 30 days
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      const dailyAgg = await Order.aggregate([
        { $match: { date: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            revenue: { $sum: "$totalAmount" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      const dailyMap = new Map(dailyAgg.map((d) => [d._id, d]));
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const entry = dailyMap.get(key) || { revenue: 0, orders: 0 };
        data.push({
          label: `${d.getMonth() + 1}/${d.getDate()}`,
          revenue: entry.revenue,
          orders: entry.orders,
          platformFee: entry.revenue * 0.1,
        });
      }
    } else if (period === "yearly") {
      // Last 5 years
      const fiveYearsAgo = new Date(now.getFullYear() - 4, 0, 1);
      const yearlyAgg = await Order.aggregate([
        { $match: { date: { $gte: fiveYearsAgo } } },
        {
          $group: {
            _id: { $year: "$date" },
            revenue: { $sum: "$totalAmount" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      const yearlyMap = new Map(yearlyAgg.map((y) => [y._id, y]));
      for (let i = 4; i >= 0; i--) {
        const yr = now.getFullYear() - i;
        const entry = yearlyMap.get(yr) || { revenue: 0, orders: 0 };
        data.push({
          label: String(yr),
          revenue: entry.revenue,
          orders: entry.orders,
          platformFee: entry.revenue * 0.1,
        });
      }
    } else {
      // Monthly (default) - last 12 months
      const twelveMonthsAgo = new Date(
        now.getFullYear(),
        now.getMonth() - 11,
        1,
      );
      const monthlyAgg = await Order.aggregate([
        { $match: { date: { $gte: twelveMonthsAgo } } },
        {
          $group: {
            _id: { year: { $year: "$date" }, month: { $month: "$date" } },
            revenue: { $sum: "$totalAmount" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);
      const monthlyMap = new Map(
        monthlyAgg.map((m) => [`${m._id.year}-${m._id.month}`, m]),
      );
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        const entry = monthlyMap.get(key) || { revenue: 0, orders: 0 };
        data.push({
          label: `${months[d.getMonth()]} ${d.getFullYear()}`,
          revenue: entry.revenue,
          orders: entry.orders,
          platformFee: entry.revenue * 0.1,
        });
      }
    }

    res.json(data);
  } catch (error) {
    console.error("Error in getRevenueOverTime:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
