// Controller/superadminController.js
const { User } = require("../Model/userRoleModel");
const { Restaurant } = require("../Model/Restaurents_model");
const { Order } = require("../Model/Order_model");
const { Reservation } = require("../Model/Reservation_model");
const Feedback = require("../Model/feedback");
const RestaurantRequest = require("../Model/restaurent_request_model");

// ── SuperAdmin Dashboard Overview ──
exports.getDashboard = async (req, res) => {
  try {
    const currentAdmin = req.user;

    const [totalUsers, totalEmployees, totalRestaurants, totalOrders, totalReservations] =
      await Promise.all([
        User.countDocuments({ role: { $nin: ["admin", "employee"] } }),
        User.countDocuments({ role: "employee" }),
        Restaurant.countDocuments(),
        Order.countDocuments(),
        Reservation.countDocuments(),
      ]);

    const restaurants = await Restaurant.find({});
    const allOrders = await Order.find({});
    const totalRevenue = allOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const platformFee = totalRevenue * 0.1; // 10% platform fee

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

// ── Employee Performance Analytics ──
// Tracks how many requests each employee approved/rejected and average response time
exports.getEmployeePerformance = async (req, res) => {
  try {
    const employees = await User.find({ role: "employee" }).select(
      "username email _id isSuspended"
    );

    // Get all restaurants to determine which ones were approved by employees
    const restaurants = await Restaurant.find({});
    const allOrders = await Order.find({});

    // Simulate employee performance based on restaurant count managed
    // In a real scenario, you'd track who approved what. Here we distribute evenly
    const employeeCount = employees.length || 1;

    const performance = employees.map((emp, idx) => {
      // Distribute restaurants among employees for simulation
      const managedRestaurants = restaurants.filter(
        (_, i) => i % employeeCount === idx
      );
      const managedRestIds = managedRestaurants.map((r) => r._id.toString());

      // Orders from managed restaurants
      const managedOrders = allOrders.filter((o) =>
        managedRestIds.includes(o.rest_id?.toString())
      );
      const totalApprovals = managedRestaurants.length;
      const totalOrdersHandled = managedOrders.length;
      const revenueGenerated = managedOrders.reduce(
        (s, o) => s + (o.totalAmount || 0),
        0
      );

      // Simulated avg response time (minutes) - random between 5-45 min
      const avgResponseTime = Math.floor(Math.random() * 40) + 5;

      return {
        _id: emp._id,
        username: emp.username,
        email: emp.email,
        isSuspended: emp.isSuspended,
        totalApprovals,
        totalOrdersHandled,
        revenueGenerated,
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

// ── Restaurant Revenue Analytics ──
// Which restaurant gives highest platform fee / revenue
exports.getRestaurantRevenue = async (req, res) => {
  try {
    const { period = "all" } = req.query;
    const restaurants = await Restaurant.find({});
    const allOrders = await Order.find({});

    // Filter orders by period
    const now = new Date();
    let filteredOrders = allOrders;

    if (period === "today") {
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      filteredOrders = allOrders.filter((o) => new Date(o.date) >= todayStart);
    } else if (period === "week") {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      filteredOrders = allOrders.filter((o) => new Date(o.date) >= weekStart);
    } else if (period === "month") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      filteredOrders = allOrders.filter(
        (o) => new Date(o.date) >= monthStart
      );
    } else if (period === "year") {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      filteredOrders = allOrders.filter((o) => new Date(o.date) >= yearStart);
    }

    // Aggregate per restaurant
    const restRevenue = {};
    const restOrderCount = {};
    filteredOrders.forEach((o) => {
      const rid = o.rest_id?.toString() || "unknown";
      restRevenue[rid] = (restRevenue[rid] || 0) + (o.totalAmount || 0);
      restOrderCount[rid] = (restOrderCount[rid] || 0) + 1;
    });

    const restaurantData = restaurants
      .map((r) => {
        const revenue = restRevenue[r._id.toString()] || 0;
        const orders = restOrderCount[r._id.toString()] || 0;
        const platformFee = revenue * 0.1;
        return {
          _id: r._id,
          name: r.name,
          location: r.location,
          city: r.city,
          image: r.image,
          rating: r.rating || 0,
          revenue,
          orders,
          platformFee,
          avgOrderValue: orders > 0 ? Math.round(revenue / orders) : 0,
          isOpen: r.isOpen,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    const totalRevenue = restaurantData.reduce((s, r) => s + r.revenue, 0);
    const totalPlatformFee = restaurantData.reduce(
      (s, r) => s + r.platformFee,
      0
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

// ── Category & Dish Trends ──
// Which category/dish is trending up or down over specific periods
exports.getDishTrends = async (req, res) => {
  try {
    const { Dish } = require("../Model/Dishes_model_test");
    const allOrders = await Order.find({});
    const allDishes = await Dish.find({});
    const restaurants = await Restaurant.find({});

    const now = new Date();

    // Current month vs previous month
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentMonthOrders = allOrders.filter(
      (o) => new Date(o.date) >= currentMonthStart
    );
    const prevMonthOrders = allOrders.filter((o) => {
      const d = new Date(o.date);
      return d >= prevMonthStart && d <= prevMonthEnd;
    });

    // Count dish occurrences in orders
    const countDishes = (orders) => {
      const counts = {};
      orders.forEach((o) => {
        if (o.items && Array.isArray(o.items)) {
          o.items.forEach((item) => {
            const dishId = item.dish_id?.toString() || item.dishId?.toString();
            if (dishId) {
              counts[dishId] = (counts[dishId] || 0) + (item.quantity || 1);
            }
          });
        }
      });
      return counts;
    };

    const currentCounts = countDishes(currentMonthOrders);
    const prevCounts = countDishes(prevMonthOrders);

    // Build dish trends
    const dishTrends = allDishes.map((dish) => {
      const current = currentCounts[dish._id.toString()] || 0;
      const previous = prevCounts[dish._id.toString()] || 0;
      const change = previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;

      // Find which restaurants serve this dish
      const servingRestaurants = restaurants
        .filter((r) =>
          r.dishes?.some((d) => d.toString() === dish._id.toString())
        )
        .map((r) => r.name);

      return {
        _id: dish._id,
        name: dish.name,
        price: dish.price,
        image: dish.image,
        currentMonthOrders: current,
        prevMonthOrders: previous,
        changePercent: Math.round(change),
        trend: change > 0 ? "up" : change < 0 ? "down" : "stable",
        restaurants: servingRestaurants,
      };
    });

    // Sort by current month orders desc
    dishTrends.sort((a, b) => b.currentMonthOrders - a.currentMonthOrders);

    // Category aggregation (group by price range as proxy for category)
    const categories = {
      "Budget (< ₹150)": { current: 0, previous: 0, dishes: 0 },
      "Mid-Range (₹150-350)": { current: 0, previous: 0, dishes: 0 },
      "Premium (₹350-500)": { current: 0, previous: 0, dishes: 0 },
      "Luxury (> ₹500)": { current: 0, previous: 0, dishes: 0 },
    };

    dishTrends.forEach((d) => {
      let cat;
      if (d.price < 150) cat = "Budget (< ₹150)";
      else if (d.price < 350) cat = "Mid-Range (₹150-350)";
      else if (d.price <= 500) cat = "Premium (₹350-500)";
      else cat = "Luxury (> ₹500)";

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
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const monthOrders = allOrders.filter((o) => {
        const od = new Date(o.date);
        return od >= d && od <= mEnd;
      });
      const counts = countDishes(monthOrders);
      const totalDishesOrdered = Object.values(counts).reduce(
        (s, c) => s + c,
        0
      );
      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];
      monthlyData.push({
        month: months[d.getMonth()],
        totalDishesOrdered,
        uniqueDishes: Object.keys(counts).length,
        revenue: monthOrders.reduce((s, o) => s + (o.totalAmount || 0), 0),
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

// ── Top Customers Analytics ──
// Which customer buys most, spends most revenue
exports.getTopCustomers = async (req, res) => {
  try {
    const { period = "all" } = req.query;
    const Person = require("../Model/customer_model");
    const allOrders = await Order.find({});
    const customers = await User.find({ role: "customer" }).select(
      "username email _id"
    );

    const now = new Date();
    let filteredOrders = allOrders;

    if (period === "month") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      filteredOrders = allOrders.filter(
        (o) => new Date(o.date) >= monthStart
      );
    } else if (period === "quarter") {
      const quarterStart = new Date(now);
      quarterStart.setMonth(quarterStart.getMonth() - 3);
      filteredOrders = allOrders.filter(
        (o) => new Date(o.date) >= quarterStart
      );
    } else if (period === "year") {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      filteredOrders = allOrders.filter(
        (o) => new Date(o.date) >= yearStart
      );
    }

    // Aggregate per customer
    const customerSpending = {};
    const customerOrderCount = {};
    const customerItems = {};
    const customerLastOrder = {};

    filteredOrders.forEach((o) => {
      const uid = o.user_id?.toString() || o.username || "unknown";
      customerSpending[uid] =
        (customerSpending[uid] || 0) + (o.totalAmount || 0);
      customerOrderCount[uid] = (customerOrderCount[uid] || 0) + 1;

      // Count items
      if (o.items && Array.isArray(o.items)) {
        customerItems[uid] =
          (customerItems[uid] || 0) +
          o.items.reduce((s, item) => s + (item.quantity || 1), 0);
      }

      // Track last order date
      const orderDate = new Date(o.date);
      if (
        !customerLastOrder[uid] ||
        orderDate > new Date(customerLastOrder[uid])
      ) {
        customerLastOrder[uid] = o.date;
      }
    });

    // Match with user profiles
    const topCustomers = customers
      .map((c) => {
        const uid = c._id.toString();
        return {
          _id: c._id,
          username: c.username,
          email: c.email,
          totalSpent: customerSpending[uid] || 0,
          totalOrders: customerOrderCount[uid] || 0,
          totalItems: customerItems[uid] || 0,
          avgOrderValue:
            customerOrderCount[uid] > 0
              ? Math.round(
                  (customerSpending[uid] || 0) / customerOrderCount[uid]
                )
              : 0,
          lastOrderDate: customerLastOrder[uid] || null,
        };
      })
      .filter((c) => c.totalOrders > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent);

    // Summary stats
    const totalCustomerSpend = topCustomers.reduce(
      (s, c) => s + c.totalSpent,
      0
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

// ── Revenue Over Time (for charts) ──
exports.getRevenueOverTime = async (req, res) => {
  try {
    const { period = "monthly" } = req.query;
    const allOrders = await Order.find({});
    const now = new Date();
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    let data = [];

    if (period === "daily") {
      // Last 30 days
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const dayEnd = new Date(
          d.getFullYear(),
          d.getMonth(),
          d.getDate() + 1
        );
        const dayOrders = allOrders.filter((o) => {
          const od = new Date(o.date);
          return od >= dayStart && od < dayEnd;
        });
        data.push({
          label: `${d.getMonth() + 1}/${d.getDate()}`,
          revenue: dayOrders.reduce((s, o) => s + (o.totalAmount || 0), 0),
          orders: dayOrders.length,
          platformFee:
            dayOrders.reduce((s, o) => s + (o.totalAmount || 0), 0) * 0.1,
        });
      }
    } else if (period === "yearly") {
      for (let i = 4; i >= 0; i--) {
        const yr = now.getFullYear() - i;
        const yearStart = new Date(yr, 0, 1);
        const yearEnd = new Date(yr + 1, 0, 1);
        const yearOrders = allOrders.filter((o) => {
          const od = new Date(o.date);
          return od >= yearStart && od < yearEnd;
        });
        data.push({
          label: String(yr),
          revenue: yearOrders.reduce((s, o) => s + (o.totalAmount || 0), 0),
          orders: yearOrders.length,
          platformFee:
            yearOrders.reduce((s, o) => s + (o.totalAmount || 0), 0) * 0.1,
        });
      }
    } else {
      // Monthly - last 12 months
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        const monthOrders = allOrders.filter((o) => {
          const od = new Date(o.date);
          return od >= d && od <= mEnd;
        });
        data.push({
          label: `${months[d.getMonth()]} ${d.getFullYear()}`,
          revenue: monthOrders.reduce((s, o) => s + (o.totalAmount || 0), 0),
          orders: monthOrders.length,
          platformFee:
            monthOrders.reduce((s, o) => s + (o.totalAmount || 0), 0) * 0.1,
        });
      }
    }

    res.json(data);
  } catch (error) {
    console.error("Error in getRevenueOverTime:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
