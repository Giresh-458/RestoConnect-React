const mongoose = require("mongoose");
const { User } = require("../Model/userRoleModel");
let Restaurant = require("../Model/Restaurents_model").Restaurant;
let Dish = require("../Model/Dishes_model_test").Dish;
const { Order } = require("../Model/Order_model");
const { Reservation } = require("../Model/Reservation_model");
const Feedback = require('../Model/feedback');
const { PromoCode } = require("../Model/PromoCode_model");
exports.getOwnerHomepage = async (req, res, next) => {
  try {
    let username = req.user.username;
    console.log("Looking for user with username:", username);
    let user = await User.findOne({ username });
    console.log("Found user:", user);
    if (!user) return res.status(404).send("User not found");

    let restaurant = user.restaurantName;

    const staffList = await User.find({ rest_id: user.rest_id, role: "staff" });

    const restPopulated = await Restaurant.findById(user.rest_id)
      .populate("dishes")
      .populate("orders");

    const tables = restPopulated ? restPopulated.tables : [];

    res.render("ownerHomepage", {
      restaurant: restaurant,
      staffList: staffList,
      tables: tables,
      tasks: restPopulated ? restPopulated.tasks || [] : [],
    });
  } catch (error) {
    console.error("Error in getOwnerHomepage:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.getTables = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).send("User not found");

    const restPopulated = await Restaurant.findById(user.rest_id)
      .populate("dishes")
      .populate("orders");

    res.json({ tables: restPopulated ? restPopulated.tables : [] });
  } catch (error) {
    console.error("Error in getTables:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.addTable = async (req, res, next) => {
  try {
    const { number, seats } = req.body;
    if (!number || !seats)
      return res
        .status(400)
        .send("Table number and number of seats are required");

    const user = req.user;
    if (!user) return res.status(404).send("User not found");

    const rest = await Restaurant.findById(user.rest_id);
    if (!rest) return res.status(404).send("Restaurant not found");

    if (rest.tables.some((table) => table.number === number))
      return res.status(400).send("Table number already exists");

    rest.tables.push({ number, seats: parseInt(seats), status: "Available" });
    rest.totalTables = rest.tables.length;
    await rest.save();

    res.redirect("/owner");
  } catch (error) {
    console.error("Error in addTable:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.deleteTable = async (req, res, next) => {
  try {
    const { number } = req.params;
    const user = req.user;
    if (!user) return res.status(404).send("User not found");

    const rest = await Restaurant.findById(user.rest_id);
    if (!rest) return res.status(404).send("Restaurant not found");

    rest.tables = rest.tables.filter((table) => table.number !== number);
    rest.totalTables = rest.tables.length;
    await rest.save();

    res.redirect("/owner");
  } catch (error) {
    console.error("Error in deleteTable:", error);
    res.status(500).send("Internal Server Error");
  }
};
// Add this to ownerController.js
exports.getFeedback = async (req, res, next) => {
  try {
    const username = req.user.username;
    const user = await User.findOne({ username });

    if (!user || !user.rest_id) {
      return res.status(404).json({ message: "User or Restaurant not found" });
    }

    const rest_id = user.rest_id;

    const feedbackList = await Feedback.find({ rest_id })
      .sort({ createdAt: -1 })
      .select("-rest_id -__v");

    // Format the data to match the dashboard table columns
    const formattedFeedback = feedbackList.map(item => ({
        id: item._id, 
        customer: item.customerName,
        rating: {
            dining: item.diningRating || null,
            order: item.orderRating || null
        },
        // Use additionalFeedback as the main comment.
        comment: item.additionalFeedback || (item.lovedItems ? `Liked: ${item.lovedItems}` : 'No specific comment'),
        lovedItems: item.lovedItems || '',
        status: item.status, 
        date: item.createdAt
    }));
    
    res.json(formattedFeedback);
  } catch (error) {
    console.error("Error in getFeedback:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
// Add this to ownerController.js
exports.updateFeedbackStatus = async (req, res, next) => {
  try {
    const { id } = req.params; // Feedback ID
    const { status } = req.body; // New status (e.g., 'Resolved')
    
    if (!status || (status !== 'Resolved' && status !== 'Pending')) {
        return res.status(400).json({ error: "Invalid status. Must be 'Resolved' or 'Pending'" });
    }

    const user = req.user;
    if (!user || !user.rest_id) {
        return res.status(404).json({ message: "User or Restaurant not found" });
    }

    // Find and update the item, ensuring it belongs to the correct restaurant for security
    const updatedFeedback = await Feedback.findOneAndUpdate(
        { _id: id, rest_id: user.rest_id }, 
        { $set: { status: status } },
        { new: true } // Return the updated document
    );

    if (!updatedFeedback) {
      return res.status(404).json({ message: "Feedback item not found or unauthorized" });
    }

    res.json({ 
        success: true, 
        feedback: updatedFeedback
    });

  } catch (error) {
    console.error("Error in updateFeedbackStatus:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// API endpoint to get user and restaurant info
exports.getOwnerInfo = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const rest = await Restaurant.findById(user.rest_id);
    if (!rest) return res.status(404).json({ error: "Restaurant not found" });

    res.json({
      username: user.username,
      restaurantName: user.restaurantName || rest.name
    });
  } catch (error) {
    console.error("Error in getOwnerInfo:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// API endpoint for dashboard stats (KPIs)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const rest = await Restaurant.findById(user.rest_id);
    if (!rest) return res.status(404).json({ error: "Restaurant not found" });

    // Get current month's start and end dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Calculate total revenue this month
    let totalRevenueThisMonth = 0;
    const payments = rest.payments || [];
    payments.forEach((payment) => {
      if (payment.date && payment.date >= startOfMonth && payment.date <= endOfMonth) {
        totalRevenueThisMonth += payment.amount || 0;
      }
    });

    // Get orders today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const tomorrow = new Date(startOfToday);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const ordersToday = await Order.countDocuments({
      rest_id: user.rest_id,
      date: { $gte: startOfToday, $lt: tomorrow }
    });

    // Get active staff count
    const activeStaff = await User.countDocuments({
      rest_id: user.rest_id,
      role: "staff"
    });

    // Calculate stock status (percentage of items above minimum stock) from inventoryData
    let stockStatus = 100; // Default to 100%
    if (rest.inventoryData && rest.inventoryData.labels && rest.inventoryData.labels.length > 0) {
      const itemsAboveMin = rest.inventoryData.values.filter((value, index) =>
        value >= (rest.inventoryData.minStocks[index] || 0)
      ).length;
      stockStatus = Math.round((itemsAboveMin / rest.inventoryData.labels.length) * 100);
    }

    res.json({
      totalRevenueThisMonth: totalRevenueThisMonth,
      ordersToday: ordersToday,
      activeStaff: activeStaff,
      stockStatus: stockStatus
    });
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// API endpoint for dashboard summary (KPIs + operational insights)
exports.getDashboardSummary = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const rest = await Restaurant.findById(user.rest_id);
    if (!rest) return res.status(404).json({ error: "Restaurant not found" });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const tomorrow = new Date(startOfToday);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    // Revenue calculations
    let totalRevenueThisMonth = 0;
    let totalRevenueToday = 0;
    let totalRevenueThisWeek = 0;
    let totalRevenueYesterday = 0;
    const payments = rest.payments || [];
    payments.forEach((payment) => {
      if (payment.date) {
        if (payment.date >= startOfMonth && payment.date <= endOfMonth) {
          totalRevenueThisMonth += payment.amount || 0;
        }
        if (payment.date >= startOfToday && payment.date < tomorrow) {
          totalRevenueToday += payment.amount || 0;
        }
        if (payment.date >= startOfWeek) {
          totalRevenueThisWeek += payment.amount || 0;
        }
        if (payment.date >= startOfYesterday && payment.date < startOfToday) {
          totalRevenueYesterday += payment.amount || 0;
        }
      }
    });

    // Orders metrics
    const ordersToday = await Order.countDocuments({
      rest_id: user.rest_id,
      date: { $gte: startOfToday, $lt: tomorrow }
    });

    const pendingOrders = await Order.countDocuments({
      rest_id: user.rest_id,
      status: "pending"
    });

    const completedOrdersToday = await Order.countDocuments({
      rest_id: user.rest_id,
      date: { $gte: startOfToday, $lt: tomorrow },
      status: "completed"
    });

    const ordersYesterday = await Order.countDocuments({
      rest_id: user.rest_id,
      date: { $gte: startOfYesterday, $lt: startOfToday }
    });

    const preparingOrders = await Order.countDocuments({
      rest_id: user.rest_id,
      status: "preparing"
    });

    const servedOrders = await Order.countDocuments({
      rest_id: user.rest_id,
      status: "served"
    });

    // Hourly order distribution for today
    const todayAllOrders = await Order.find({
      rest_id: user.rest_id,
      date: { $gte: startOfToday, $lt: tomorrow }
    }).select("date orderTime");

    const hourlyOrders = Array(24).fill(0);
    todayAllOrders.forEach((order) => {
      const d = new Date(order.orderTime || order.date);
      if (!isNaN(d.getTime())) hourlyOrders[d.getHours()]++;
    });

    // Today's reservations for timeline
    const todayReservations = await Reservation.find({
      rest_id: String(user.rest_id),
      date: { $gte: startOfToday, $lt: tomorrow },
      status: { $nin: ["cancelled"] }
    }).sort({ time: 1 }).select("_id customerName time guests status");

    const guestsToday = todayReservations.reduce((sum, r) => sum + (r.guests || 0), 0);

    // Yesterday guests
    const yesterdayReservations = await Reservation.find({
      rest_id: String(user.rest_id),
      date: { $gte: startOfYesterday, $lt: startOfToday },
      status: { $nin: ["cancelled"] }
    });
    const guestsYesterday = yesterdayReservations.reduce((sum, r) => sum + (r.guests || 0), 0);

    const totalOrdersThisMonth = await Order.countDocuments({
      rest_id: user.rest_id,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // Average order value
    const ordersThisMonth = await Order.find({
      rest_id: user.rest_id,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    }).select("totalAmount");

    const avgOrderValue = ordersThisMonth.length > 0
      ? ordersThisMonth.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / ordersThisMonth.length
      : 0;

    // Staff metrics
    const activeStaff = await User.countDocuments({
      rest_id: user.rest_id,
      role: "staff"
    });

    // Table occupancy
    const totalTables = rest.tables ? rest.tables.length : 0;
    const occupiedTables = rest.tables
      ? rest.tables.filter((t) => t.status && t.status.toLowerCase() === "occupied").length
      : 0;
    const tableOccupancy = totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0;

    // Inventory status
    let stockStatus = 100;
    let lowStockItems = [];
    let criticalStockCount = 0;
    if (rest.inventoryData && rest.inventoryData.labels && rest.inventoryData.labels.length > 0) {
      const itemsAboveMin = rest.inventoryData.values.filter((value, index) =>
        value >= (rest.inventoryData.minStocks[index] || 0)
      ).length;
      stockStatus = Math.round((itemsAboveMin / rest.inventoryData.labels.length) * 100);

      lowStockItems = rest.inventoryData.labels
        .map((label, index) => ({
          name: label,
          quantity: rest.inventoryData.values[index] || 0,
          unit: rest.inventoryData.units[index] || "units",
          minStock: rest.inventoryData.minStocks[index] || 0
        }))
        .filter((item) => item.minStock > 0 && item.quantity <= item.minStock);

      criticalStockCount = rest.inventoryData.values.filter((value, index) =>
        value <= (rest.inventoryData.minStocks[index] || 0) * 0.5
      ).length;
    }

    // Customer satisfaction (average rating from orders)
    const ratedOrders = await Order.find({
      rest_id: user.rest_id,
      rating: { $exists: true, $ne: null }
    }).select("rating");

    const avgRating = ratedOrders.length > 0
      ? ratedOrders.reduce((sum, order) => sum + (order.rating || 0), 0) / ratedOrders.length
      : 0;

    // Recent orders with more details
    const recentOrders = await Order.find({ rest_id: user.rest_id })
      .sort({ date: -1 })
      .limit(8)
      .select("_id customerName totalAmount status tableNumber date orderTime");

    const formattedOrders = recentOrders.map((order) => {
      let hash = 0;
      for (let i = 0; i < order._id.length; i++) {
        const char = order._id.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      const orderNumber = (Math.abs(hash) % 900 + 100).toString();
      return {
        id: order._id,
        orderId: `OR${orderNumber}`,
        customerName: order.customerName,
        tableNumber: order.tableNumber || "N/A",
        totalAmount: order.totalAmount,
        status: order.status || "pending",
        date: order.date,
        orderTime: order.orderTime
      };
    });

    // Upcoming reservations with better filtering
    const upcomingReservations = await Reservation.find({
      rest_id: String(user.rest_id),
      date: { $gte: startOfToday },
      status: { $nin: ["cancelled", "completed"] }
    })
      .sort({ date: 1 })
      .limit(8)
      .select("_id customerName time guests status date");

    // Pending reservations count
    const pendingReservations = await Reservation.countDocuments({
      rest_id: String(user.rest_id),
      status: "pending"
    });

    // Popular dishes (most ordered in last 30 days)
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const recentOrdersWithDishes = await Order.find({
      rest_id: user.rest_id,
      date: { $gte: thirtyDaysAgo }
    }).populate("dishes");

    const dishFrequency = {};
    recentOrdersWithDishes.forEach((order) => {
      if (order.dishes && Array.isArray(order.dishes)) {
        order.dishes.forEach((dish) => {
          const name = (typeof dish === 'string') ? dish : (dish && dish.name);
          if (name) {
            dishFrequency[name] = (dishFrequency[name] || 0) + 1;
          }
        });
      }
    });

    const popularDishes = Object.entries(dishFrequency)
      .map(([name, count]) => ({ name, orderCount: count }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 5);

    // Recent feedback
    const recentFeedback = await Feedback.find({ rest_id: user.rest_id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("customerName diningRating orderRating status createdAt");

    const pendingFeedback = await Feedback.countDocuments({
      rest_id: user.rest_id,
      status: "Pending"
    });

    // Operational alerts
    const alerts = [];
    if (criticalStockCount > 0) {
      alerts.push({
        type: "critical",
        message: `${criticalStockCount} items critically low on stock`,
        action: "inventory"
      });
    }
    if (pendingOrders > 5) {
      alerts.push({
        type: "warning",
        message: `${pendingOrders} orders pending`,
        action: "orders"
      });
    }
    if (pendingReservations > 3) {
      alerts.push({
        type: "info",
        message: `${pendingReservations} reservations awaiting confirmation`,
        action: "reservations"
      });
    }
    if (pendingFeedback > 0) {
      alerts.push({
        type: "info",
        message: `${pendingFeedback} customer feedback needs review`,
        action: "feedback"
      });
    }

    res.json({
      restaurantName: user.restaurantName || rest.name,
      restaurantStatus: {
        isOpen: rest.isOpen !== undefined ? rest.isOpen : true,
        operatingHours: rest.operatingHours || { open: "09:00", close: "22:00" },
        cuisine: rest.cuisine || [],
        location: rest.location || "",
        city: rest.city || ""
      },
      stats: {
        totalRevenueThisMonth,
        totalRevenueToday,
        totalRevenueYesterday,
        totalRevenueThisWeek,
        ordersToday,
        ordersYesterday,
        pendingOrders,
        preparingOrders,
        servedOrders,
        completedOrdersToday,
        totalOrdersThisMonth,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        activeStaff,
        stockStatus,
        criticalStockCount,
        tableOccupancy,
        totalTables,
        occupiedTables,
        availableTables: totalTables - occupiedTables,
        avgRating: Math.round(avgRating * 10) / 10,
        totalRatings: ratedOrders.length,
        pendingReservations,
        guestsToday,
        guestsYesterday
      },
      tables: (rest.tables || []).map(t => ({
        number: t.number,
        seats: t.seats || 4,
        status: (t.status || "available").toLowerCase()
      })),
      hourlyOrders,
      todayReservations,
      recentOrders: formattedOrders,
      upcomingReservations,
      lowStockItems,
      popularDishes,
      recentFeedback,
      alerts
    });
  } catch (error) {
    console.error("Error in getDashboardSummary:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// API endpoint for revenue & orders trend (last 7 days)
exports.getRevenueOrdersTrend = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const rest = await Restaurant.findById(user.rest_id);
    if (!rest) return res.status(404).json({ error: "Restaurant not found" });

    // Get last 7 days
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    // Initialize data for last 7 days
    const days = [];
    const revenueData = [];
    const ordersData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(todayStart);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      // Get day name (Mon, Tue, etc.)
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      days.push(dayNames[date.getDay()]);

      // Calculate revenue for this day
      let dayRevenue = 0;
      const payments = rest.payments || [];
      payments.forEach((payment) => {
        if (payment.date && payment.date >= date && payment.date < nextDate) {
          dayRevenue += payment.amount || 0;
        }
      });
      revenueData.push(dayRevenue);

      // Count orders for this day
      const dayOrders = await Order.countDocuments({
        rest_id: user.rest_id,
        date: { $gte: date, $lt: nextDate }
      });
      ordersData.push(dayOrders);
    }

    res.json({
      days: days,
      revenue: revenueData,
      orders: ordersData
    });
  } catch (error) {
    console.error("Error in getRevenueOrdersTrend:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// API endpoint for recent orders
exports.getRecentOrders = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const recentOrders = await Order.find({ rest_id: user.rest_id })
      .sort({ date: -1 })
      .limit(10)
      .select('_id customerName totalAmount status tableNumber date');

    // Format orders for frontend
    const formattedOrders = recentOrders.map((order, index) => {
      // Generate a numeric order ID (OR123, OR124, etc.)
      // Use a simple hash of the order ID to get consistent 3-digit number
      let hash = 0;
      for (let i = 0; i < order._id.length; i++) {
        const char = order._id.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      // Convert to positive 3-digit number (100-999)
      const orderNumber = (Math.abs(hash) % 900 + 100).toString();

      return {
        id: order._id,
        orderId: `OR${orderNumber}`,
        customerName: order.customerName,
        tableNumber: order.tableNumber || 'N/A',
        totalAmount: order.totalAmount,
        status: order.status || 'pending',
        date: order.date
      };
    });

    res.json({ orders: formattedOrders });
  } catch (error) {
    console.error("Error in getRecentOrders:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// API endpoint to get inventory (using restaurant inventoryData)
exports.getInventoryAPI = async (req, res, next) => {
  try {
    console.log("getInventoryAPI called for user:", req.user.username);
    const user = req.user;
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ error: "User not found" });
    }
    console.log("User found, rest_id:", user.rest_id);

    const restaurant = await Restaurant.findById(user.rest_id);
    if (!restaurant || !restaurant.inventoryData) {
      console.log("Restaurant not found or no inventoryData");
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Convert inventoryData arrays to array of objects
    const inventoryItems = [];
    if (restaurant.inventoryData.labels && restaurant.inventoryData.labels.length > 0) {
      for (let i = 0; i < restaurant.inventoryData.labels.length; i++) {
        inventoryItems.push({
          _id: `item_${i}`, // Generate a simple ID for frontend compatibility
          name: restaurant.inventoryData.labels[i],
          quantity: restaurant.inventoryData.values[i] || 0,
          unit: restaurant.inventoryData.units[i] || 'pieces',
          minStock: restaurant.inventoryData.minStocks[i] || 0,
          rest_id: user.rest_id
        });
      }
    }

    console.log("Inventory items from inventoryData:", inventoryItems);
    res.json({ inventory: inventoryItems });
  } catch (error) {
    console.error("Error in getInventoryAPI:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// API endpoint to update inventory quantity (using restaurant inventoryData)
exports.updateInventoryQuantity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { change } = req.body; // change can be +1 or -1

    if (!change || (change !== 1 && change !== -1)) {
      return res.status(400).json({ error: "Invalid change value. Must be 1 or -1" });
    }

    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const restaurant = await Restaurant.findById(user.rest_id);
    if (!restaurant || !restaurant.inventoryData) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Parse the item index from the ID (format: item_0, item_1, etc.)
    const itemIndex = parseInt(id.replace('item_', ''));
    if (isNaN(itemIndex) || itemIndex < 0 || itemIndex >= restaurant.inventoryData.labels.length) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    // Update quantity
    const currentQuantity = restaurant.inventoryData.values[itemIndex] || 0;
    const newQuantity = Math.max(0, currentQuantity + change);
    restaurant.inventoryData.values[itemIndex] = newQuantity;

    await restaurant.save();

    // Return updated item in the same format as the Inventory model
    const updatedItem = {
      _id: id,
      name: restaurant.inventoryData.labels[itemIndex],
      quantity: newQuantity,
      unit: restaurant.inventoryData.units[itemIndex] || 'pieces',
      minStock: restaurant.inventoryData.minStocks[itemIndex] || 0,
      rest_id: user.rest_id
    };

    res.json({
      success: true,
      inventory: updatedItem
    });
  } catch (error) {
    console.error("Error in updateInventoryQuantity:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// API endpoint to create inventory item (using restaurant inventoryData)
exports.createInventoryItem = async (req, res, next) => {
  try {
    const { name, unit, quantity, minStock, supplier } = req.body;

    if (!name || !unit) {
      return res.status(400).json({ error: "Name and unit are required" });
    }

    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const restaurant = await Restaurant.findById(user.rest_id);
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    if (!restaurant.inventoryData) {
      restaurant.inventoryData = {
        labels: [],
        values: [],
        units: [],
        suppliers: [],
        minStocks: []
      };
    }

    const inventoryData = restaurant.inventoryData;
    inventoryData.labels = Array.isArray(inventoryData.labels) ? inventoryData.labels : [];
    inventoryData.values = Array.isArray(inventoryData.values) ? inventoryData.values : [];
    inventoryData.units = Array.isArray(inventoryData.units) ? inventoryData.units : [];
    inventoryData.suppliers = Array.isArray(inventoryData.suppliers) ? inventoryData.suppliers : [];
    inventoryData.minStocks = Array.isArray(inventoryData.minStocks) ? inventoryData.minStocks : [];

    const normalizedQuantity = Number.isFinite(Number(quantity)) ? Number(quantity) : 0;
    const normalizedMinStock = Number.isFinite(Number(minStock)) ? Number(minStock) : 0;

    inventoryData.labels.push(name);
    inventoryData.values.push(normalizedQuantity);
    inventoryData.units.push(unit);
    inventoryData.suppliers.push(supplier || "");
    inventoryData.minStocks.push(normalizedMinStock);

    await restaurant.save();

    const itemIndex = inventoryData.labels.length - 1;
    res.json({
      success: true,
      inventory: {
        _id: `item_${itemIndex}`,
        name,
        quantity: inventoryData.values[itemIndex],
        unit: inventoryData.units[itemIndex],
        minStock: inventoryData.minStocks[itemIndex],
        supplier: inventoryData.suppliers[itemIndex],
        rest_id: user.rest_id
      }
    });
  } catch (error) {
    console.error("Error in createInventoryItem:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// API endpoint to delete inventory item (using restaurant inventoryData)
exports.deleteInventoryItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const restaurant = await Restaurant.findById(user.rest_id);
    if (!restaurant || !restaurant.inventoryData) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Parse the item index from the ID (format: item_0, item_1, etc.)
    const itemIndex = parseInt(id.replace('item_', ''));
    if (isNaN(itemIndex) || itemIndex < 0 || itemIndex >= restaurant.inventoryData.labels.length) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    // Remove item from all inventoryData arrays
    restaurant.inventoryData.labels.splice(itemIndex, 1);
    restaurant.inventoryData.values.splice(itemIndex, 1);
    restaurant.inventoryData.units.splice(itemIndex, 1);
    restaurant.inventoryData.suppliers.splice(itemIndex, 1);
    restaurant.inventoryData.minStocks.splice(itemIndex, 1);

    await restaurant.save();

    res.json({
      success: true,
      message: "Inventory item deleted successfully"
    });
  } catch (error) {
    console.error("Error in deleteInventoryItem:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getownerDashboard_dashboard = async (req, res, next) => {

  try {
    // Get user from session
    let username = req.user.username;
    if (!username) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    let user = await User.findOne({ username });
    if (!user || !user.rest_id) {
      return res.status(404).json({ error: 'User or restaurant not found' });
    }

    let restaurant = user.restaurantName;
    let rest = await Restaurant.findById(user.rest_id).populate('dishes');

    if (!rest) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const restaurantId = user.rest_id;

    // 1. Total Revenue (This Month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyOrders = await Order.find({
      rest_id: restaurantId,
      date: { $gte: startOfMonth }
    });

    const totalRevenue = monthlyOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // 2. Total Orders Today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayOrders = await Order.countDocuments({
      rest_id: restaurantId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    // 3. Staff Count (users with role 'staff' for this restaurant)
    const staffCount = await User.countDocuments({
      rest_id: restaurantId,
      role: 'staff'
    });

    // 4. Low Stock Items (from inventoryData)
    const lowStockThreshold = 10;
    const lowStockItems = rest.inventoryData?.values?.filter(val => val < lowStockThreshold).length || 0;

    // 5. Revenue Chart Data (Last 7 days)
    const last7Days = [];
    const revenueByDay = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayOrders = await Order.find({
        rest_id: restaurantId,
        date: { $gte: date, $lt: nextDate }
      });

      const dayRevenue = dayOrders.reduce((sum, order) => sum + order.totalAmount, 0);

      last7Days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      revenueByDay.push(dayRevenue);
    }

    // 6. Popular Dishes (Top 5)
    const allOrders = await Order.find({ rest_id: restaurantId });

    const dishCount = {};
    allOrders.forEach(order => {
      if (order.dishes && Array.isArray(order.dishes)) {
        order.dishes.forEach(dishId => {
          dishCount[dishId] = (dishCount[dishId] || 0) + 1;
        });
      }
    });

    const sortedDishes = Object.entries(dishCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const popularDishes = await Promise.all(
      sortedDishes.map(async ([dishId, count]) => {
        const dish = await Dish.findOne({ _id: dishId });
        return {
          name: dish?.name || 'Unknown',
          orders: count,
          price: dish?.price || 0
        };
      })
    );

    // Response
    res.json({
      success: true,
      data: {
        restaurantName: restaurant,
        totalRevenue,
        totalOrdersToday: todayOrders,
        staffCount,
        lowStockItems,
        revenueChart: {
          labels: last7Days,
          values: revenueByDay
        },
        popularDishes,
        inventoryData: rest.inventoryData || { labels: [], values: [] }
      }
    });

  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      message: error.message
    });
  }
};

// UTILITY
function getWeekNumber(date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
}

exports.getMenuManagement = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    let rest = await Restaurant.findById(user.rest_id)
      .populate("dishes")
      .populate("orders");

    if (!rest) return res.status(404).json({ error: "Restaurant not found" });

    // Format dishes with proper image URLs
    const { getImageUrl } = require('../util/fileUpload');
    const formattedDishes = rest.dishes.map(dish => {
      const dishObj = dish.toObject ? dish.toObject() : dish;
      return {
        ...dishObj,
        imageUrl: getImageUrl(req, dish.image) || null
      };
    });

    res.json({ products: formattedDishes });
  } catch (error) {
    console.error("Error in getMenuManagement:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.addProduct = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const { name, price, description, serves } = req.body;
    console.log(`Owner ${user.username} adding dish: ${name} for restaurant ${user.rest_id}`);
    
    // Handle image upload - if file was uploaded, use the filename
    let imagePath = 'default-dish.jpg'; // default image
    if (req.file) {
      imagePath = req.file.filename; // multer saves to /public/uploads/
    }
    
    let dish = new Dish({ 
      name, 
      price, 
      description: description,
      serves: serves ? parseInt(serves) : 1,
      image: imagePath
    });
    await dish.addDish(user.rest_id);
    console.log(`Dish ${name} added successfully to restaurant ${user.rest_id}`);
    res.json({ success: true, message: "Dish added successfully" });
  } catch (error) {
    console.error("Error in addProduct:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.editProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, imageUrl, serves } = req.body;

    let dish = await Dish.find_by_id(id);
    if (!dish) {
      return res.status(404).send("Dish not found");
    }
    dish.name = name;
    dish.price = price;
    dish.description = description;
    if (serves !== undefined) {
      dish.serves = parseInt(serves) || 1;
    }
    // Update image if a new file was uploaded
    if (req.file) {
      dish.image = req.file.filename;
    } else if (imageUrl) {
      // If imageUrl is provided in body (for EJS form), use it
      dish.image = imageUrl;
    }
    await dish.updateDish();
    res.redirect("/owner");
  } catch (error) {
    console.error("Error in editProduct:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Dish.removeDish(req.user.rest_id, id);
    res.redirect("/owner/menuManagement");
  } catch (error) {
    console.error("Error in deleteProduct:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.getStaffList = async (req, res, next) => {
  try {
    const rest_id = req.user.rest_id;
    const staffList = await User.find({ rest_id: rest_id, role: "staff" });
    res.json(staffList);
  } catch (error) {
    console.error("Error in getStaffList:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.addStaff = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    const rest_id = user.rest_id;
    const { username, password, restaurantName, email } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const newStaff = new User({
      username,
      password,
      role: "staff",
      rest_id,
      restaurantName: restaurantName || user.restaurantName,
      email,
    });
    await newStaff.save();
    res.json({ success: true, staff: { _id: newStaff._id, username: newStaff.username, email: newStaff.email, role: "staff" } });
  } catch (error) {
    console.error("Error in addStaff:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.editStaff = async (req, res, next) => {
  try {
    const staffId = req.params.id;
    const { username, password } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const updateData = { username };
    if (password && password.trim() !== "") {
      updateData.password = password;
    }
    await User.updateOne({ _id: staffId }, { $set: updateData });
    res.json({ success: true, message: "Staff updated successfully" });
  } catch (error) {
    console.error("Error in editStaff:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.deleteStaff = async (req, res, next) => {
  try {
    const staffId = req.params.id;
    await User.deleteOne({ _id: staffId });
    res.json({ success: true, message: "Staff removed successfully" });
  } catch (error) {
    console.error("Error in deleteStaff:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getTasks = async (req, res, next) => {
  const rest_id = req.user.rest_id;

  const rest = await Restaurant.findById(rest_id).select("tasks");

  res.json({ tasks: rest.tasks });
};

exports.deleteTask = async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    const rest = await Restaurant.findById(user.rest_id);
    if (!rest) {
      return res.status(404).json({ error: "Restaurant not found" });
    }
    rest.tasks = rest.tasks.filter((task) => task.id !== parseInt(taskId));
    await rest.save();
    res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error in deleteTask:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.deleteRestaurant = async (req, res, next) => {
  try {
    const restaurantId = req.params.id;
    const restaurant = await Restaurant.findByIdAndDelete(restaurantId);
    if (!restaurant) {
      return res.status(404).send("Restaurant not found");
    }
    await User.deleteMany({ rest_id: restaurantId });
    res.redirect("/owner");
  } catch (error) {
    console.error("Error deleting restaurant and related users:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.getOrders = async (req, res, next) => {
  try {
    const username = req.user.username;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    const rest_id = user.rest_id;

    // âœ… Fetch only that restaurant's orders, excluding rest_id and __v
    const orders = await Order.find({ rest_id })
      .sort({ date: -1 })
      .select("-rest_id -__v"); // <-- Exclude internal fields

    // Format orders to match frontend expectations
    const formattedOrders = await Promise.all(orders.map(async (order) => {
      // Count dish quantities (since dishes array contains names, duplicates for quantity)
      const dishCounts = {};
      order.dishes.forEach(dishName => {
        dishCounts[dishName] = (dishCounts[dishName] || 0) + 1;
      });

      // Get dish details with quantities
      const dishDetails = await Promise.all(Object.entries(dishCounts).map(async ([dishName, quantity]) => {
        // Try to find by name first, then by ID if not found
        let dish = await Dish.findOne({ name: dishName });
        if (!dish) {
          dish = await Dish.findById(dishName);
        }
        return {
          name: dish ? dish.name : (dishName.length === 9 && /^[a-zA-Z0-9]+$/.test(dishName) ? "Unknown Dish" : dishName),
          quantity: quantity,
          price: dish ? dish.price : 0
        };
      }));

      // Calculate subtotal (sum of dish prices * quantities)
      const subtotal = dishDetails.reduce((sum, dish) => sum + (dish.price * dish.quantity), 0);

      // Assume tax rate of 10% if not stored
      const taxRate = 10;
      const taxAmount = subtotal * (taxRate / 100);
      const totalAmount = subtotal + taxAmount;

      return {
        ...order.toObject(),
        dishes: dishDetails,
        subtotal: parseFloat(subtotal.toFixed(2)),
        taxRate: taxRate,
        taxAmount: parseFloat(taxAmount.toFixed(2)),
        totalAmount: parseFloat(totalAmount.toFixed(2))
      };
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error("Error in getOrders:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getReservations = async (req, res, next) => {
  try {
    const username = req.user.username;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    const rest_id = user.rest_id;
    // Ensure rest_id is a string for consistent querying
    const restIdString = String(rest_id);
    console.log('ðŸ” Owner querying reservations for rest_id:', restIdString);
    
    const reservations = await Reservation.find({ rest_id: restIdString })
      .sort({ date: -1 })
      .select("-rest_id -__v");

    console.log(`âœ… Owner found ${reservations.length} reservations for rest_id: ${restIdString}`);
    res.json(reservations);
  } catch (error) {
    console.error("Error in getReservations:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getInventory = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const restaurant = await Restaurant.findById(user.rest_id);
    if (!restaurant)
      return res.status(404).json({ error: "Restaurant not found" });
   
    // Return inventory data
    res.json({
      inventory: restaurant.inventoryData || {
        labels: [],
        values: [],
        units: [],
        suppliers: [],
      },
    });
  } catch (error) {
    console.error("Error in getInventory:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.updateInventory = async (req, res, next) => {
  try {
    const { item, action } = req.body;
    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const restaurant = await Restaurant.findById(user.rest_id);
    if (!restaurant || !restaurant.inventoryData)
      return res.status(404).json({ error: "Restaurant not found" });

    const index = restaurant.inventoryData.labels.indexOf(item);
    if (index === -1) return res.status(404).json({ error: "Item not found" });

    // Safe quantity update
    if (action === "increase") {
      restaurant.inventoryData.values[index] += 1;
    } else if (
      action === "decrease" &&
      restaurant.inventoryData.values[index] > 0
    ) {
      restaurant.inventoryData.values[index] -= 1;
    }

    await restaurant.save();
    res.json({
      success: true,
      inventory: restaurant.inventoryData,
    });
  } catch (error) {
    console.error("Error updating inventory:", error);
    res.status(500).json({ error: "Error updating inventory" });
  }
};

exports.getReportsData = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const restaurant = await Restaurant.findById(user.rest_id);
    if (!restaurant)
      return res.status(404).json({ error: "Restaurant not found" });

    let totalRevenue = 0;
    let payments = restaurant.payments || [];
    payments.forEach((payment) => {
      totalRevenue += payment.amount || 0;
    });

    let dailyRevenueMap = {};
    let weeklyRevenueMap = {};

    payments.forEach((payment) => {
      if (!payment.date) return;

      let day = payment.date.toISOString().slice(0, 10);
      dailyRevenueMap[day] =
        (dailyRevenueMap[day] || 0) + (payment.amount || 0);

      let week = getWeekNumber(payment.date);
      weeklyRevenueMap[week] =
        (weeklyRevenueMap[week] || 0) + (payment.amount || 0);
    });

    let dailyLabels = Object.keys(dailyRevenueMap).sort();
    let dailyValues = dailyLabels.map((label) => dailyRevenueMap[label]);
    if (dailyLabels.length > 14) {
      dailyLabels = dailyLabels.slice(-14);
      dailyValues = dailyValues.slice(-14);
    }

    let weeklyLabels = Object.keys(weeklyRevenueMap).sort();
    let weeklyValues = weeklyLabels.map((label) => weeklyRevenueMap[label]);
    if (weeklyLabels.length > 12) {
      weeklyLabels = weeklyLabels.slice(-12);
      weeklyValues = weeklyValues.slice(-12);
    }

    const Order = require("../Model/Order_model").Order;
    const orders = await Order.find({ rest_id: user.rest_id });

    const hourCounts = {};
    const dayCounts = {};

    orders.forEach((order) => {
      if (order.date) {
        const orderDate = new Date(order.date);

        const hour = orderDate.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;

        const day = orderDate.getDay();
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      }
    });

    const hourLabels = Array.from({ length: 24 }, (_, i) => {
      const hour = i % 12 || 12;
      const period = i < 12 ? "AM" : "PM";
      return `${hour} ${period}`;
    });

    const hourValues = hourLabels.map((_, index) => hourCounts[index] || 0);

    const dayLabels = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayValues = dayLabels.map((_, index) => dayCounts[index] || 0);

    res.json({
      revenue: {
        daily: { labels: dailyLabels, values: dailyValues },
        weekly: { labels: weeklyLabels, values: weeklyValues },
        total: totalRevenue,
      },
      peakHours: {
        byHour: { labels: hourLabels, values: hourValues },
        byDay: { labels: dayLabels, values: dayValues },
      },
      totalOrders: orders.length,
    });
  } catch (error) {
    console.error("Error in getReportsData:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Staff Management Methods
exports.addTask = async (req, res, next) => {
  try {
    const { description, assignedTo, priority } = req.body;
    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const restaurant = await Restaurant.findById(user.rest_id);
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

    const newTask = {
      description,
      assignedTo: assignedTo || [],
      priority: priority || "medium",
      status: "Pending",
      createdAt: new Date()
    };

    restaurant.staffTasks.push(newTask);
    await restaurant.save();

    res.json({ success: true, message: "Task added successfully", task: newTask });
  } catch (error) {
    console.error("Error in addTask:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.addAnnouncement = async (req, res, next) => {
  try {
    const { message, priority } = req.body;
    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const restaurant = await Restaurant.findById(user.rest_id);
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

    const newAnnouncement = {
      message,
      priority: priority || "normal",
      active: true,
      createdAt: new Date()
    };

    restaurant.announcements.push(newAnnouncement);
    await restaurant.save();

    res.json({ success: true, message: "Announcement added successfully", announcement: newAnnouncement });
  } catch (error) {
    console.error("Error in addAnnouncement:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.addShift = async (req, res, next) => {
  try {
    const { name, date, startTime, endTime, assignedStaff } = req.body;
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });

    const restaurant = await Restaurant.findById(user.rest_id);
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

    const newShift = {
      name,
      date: new Date(date),
      startTime,
      endTime,
      assignedStaff: assignedStaff || [],
      completed: false
    };

    restaurant.staffShifts.push(newShift);
    await restaurant.save();

    res.json({ success: true, message: "Shift added successfully", shift: newShift });
  } catch (error) {
    console.error("Error in addShift:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getSupportMessages = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const restaurant = await Restaurant.findById(user.rest_id);
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

    const supportMessages = restaurant.supportMessages || [];
    res.json({ supportMessages });
  } catch (error) {
    console.error("Error in getSupportMessages:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Customer support chat threads
exports.getCustomerSupportThreads = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const restaurant = await Restaurant.findById(user.rest_id);
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

    const threads = (restaurant.customerSupportThreads || [])
      .map((thread) => ({
        id: thread._id,
        customerName: thread.customerName,
        status: thread.status || "pending",
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        messages: thread.messages || [],
      }))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json({ threads });
  } catch (error) {
    console.error("Error in getCustomerSupportThreads:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.postCustomerSupportMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    const { threadId } = req.params;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const restaurant = await Restaurant.findById(user.rest_id);
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

    const thread = restaurant.customerSupportThreads?.id(threadId);
    if (!thread) {
      return res.status(404).json({ error: "Support thread not found" });
    }

    thread.messages = thread.messages || [];
    thread.messages.push({
      senderRole: "owner",
      senderName: user.username,
      text: message.trim(),
      timestamp: new Date(),
    });
    thread.status = "pending";
    thread.updatedAt = new Date();

    await restaurant.save();

    res.json({
      success: true,
      thread: {
        id: thread._id,
        customerName: thread.customerName,
        status: thread.status,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        messages: thread.messages,
      },
    });
  } catch (error) {
    console.error("Error in postCustomerSupportMessage:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.updateCustomerSupportStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const { threadId } = req.params;

    if (!status || !["pending", "resolved"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const restaurant = await Restaurant.findById(user.rest_id);
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

    const thread = restaurant.customerSupportThreads?.id(threadId);
    if (!thread) {
      return res.status(404).json({ error: "Support thread not found" });
    }

    thread.status = status;
    thread.updatedAt = new Date();

    await restaurant.save();

    res.json({
      success: true,
      thread: {
        id: thread._id,
        customerName: thread.customerName,
        status: thread.status,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        messages: thread.messages || [],
      },
    });
  } catch (error) {
    console.error("Error in updateCustomerSupportStatus:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getAnnouncements = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const restaurant = await Restaurant.findById(user.rest_id);
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

    const announcements = restaurant.announcements || [];
    res.json({ announcements });
  } catch (error) {
    console.error("Error in getAnnouncements:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.deleteAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const restaurant = await Restaurant.findById(user.rest_id);
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

    // Find the announcement by index or ID
    const announcementIndex = restaurant.announcements.findIndex((ann, index) =>
      ann._id ? ann._id.toString() === id : index.toString() === id
    );

    if (announcementIndex === -1) {
      return res.status(404).json({ error: "Announcement not found" });
    }

    // Remove the announcement
    restaurant.announcements.splice(announcementIndex, 1);
    await restaurant.save();

    res.json({ success: true, message: "Announcement deleted successfully" });
  } catch (error) {
    console.error("Error in deleteAnnouncement:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};




exports.getStaffTasks = async (req, res, next) => {
  try {
    const { staffId } = req.params;

    const user = req.user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });

    const restaurant = await Restaurant.findById(user.rest_id);
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

    // ðŸ”¥ find staff to get username
   const staff = await User.findById(staffId);


    if (!staff) {
      return res.status(404).json({ error: "Staff not found" });
    }
    console.log(restaurant.staffTasks+" "+staff.username)
    const staffTasks = restaurant.staffTasks.filter(task =>
      Array.isArray(task.assignedTo) &&
      task.assignedTo.includes(staff.username)
    );


    console.log("Filtered tasks:", staffTasks);
    res.json({ tasks: staffTasks });

  } catch (error) {
    console.error("Error in getStaffTasks:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.deleteStaffTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });

    const restaurant = await Restaurant.findById(user.rest_id);
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

    // Find the task by ID
    const taskIndex = restaurant.staffTasks.findIndex((task, index) =>
      task._id ? task._id.toString() === taskId : index.toString() === taskId
    );

    if (taskIndex === -1) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Remove the task
    restaurant.staffTasks.splice(taskIndex, 1);
    await restaurant.save();

    res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error in deleteStaffTask:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ========== NEW API ENDPOINTS FOR ENHANCED OWNER DASHBOARD ==========

// Update order status (pending â†’ preparing â†’ served â†’ completed)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ["pending", "preparing", "ready", "served", "done", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const order = await Order.findOne({ _id: id, rest_id: user.rest_id });
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.status = status;
    if (status === "completed") {
      order.completionTime = new Date();
    }
    await order.save();
    res.json({ success: true, order });
  } catch (error) {
    console.error("Error in updateOrderStatus:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update reservation status (pending â†’ confirmed â†’ seated â†’ completed / cancelled)
exports.updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tables: assignedTables } = req.body;
    const validStatuses = ["pending", "confirmed", "seated", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const reservation = await Reservation.findOne({ _id: id, rest_id: String(user.rest_id) });
    if (!reservation) return res.status(404).json({ error: "Reservation not found" });

    const rest = await Restaurant.findById(user.rest_id);

    // Assign tables if provided
    if (assignedTables && Array.isArray(assignedTables) && assignedTables.length > 0) {
      // Validate total seats across assigned tables vs reservation guests
      if (rest) {
        const totalSeats = assignedTables.reduce((sum, tableNum) => {
          const table = rest.tables.find(t => String(t.number) === String(tableNum));
          return sum + (table ? (table.seats || 0) : 0);
        }, 0);
        if (totalSeats > 0 && reservation.guests && totalSeats < reservation.guests) {
          return res.status(400).json({
            error: `Selected tables have ${totalSeats} total seats but the reservation is for ${reservation.guests} guests. Please assign tables with enough seating.`
          });
        }
      }
      reservation.tables = assignedTables;
      reservation.table_id = assignedTables[0];
      reservation.allocated = true;

      // Update table statuses in the restaurant
      if (rest) {
        const newTableStatus = status === "seated" ? "Occupied" : "Reserved";
        assignedTables.forEach(tableNum => {
          const table = rest.tables.find(t => String(t.number) === String(tableNum));
          if (table) table.status = newTableStatus;
        });
      }
    }

    // When completing or cancelling, free the tables
    if ((status === "completed" || status === "cancelled") && rest && reservation.tables?.length > 0) {
      reservation.tables.forEach(tableNum => {
        const table = rest.tables.find(t => String(t.number) === String(tableNum));
        if (table) table.status = "Available";
      });
    }

    // When seating without new tables provided, mark existing assigned tables as Occupied
    if (status === "seated" && !assignedTables?.length && reservation.tables?.length > 0 && rest) {
      reservation.tables.forEach(tableNum => {
        const table = rest.tables.find(t => String(t.number) === String(tableNum));
        if (table) table.status = "Occupied";
      });
    }

    reservation.status = status;
    if (status === "confirmed") {
      reservation.allocated = true;
    }

    await reservation.save();
    if (rest) await rest.save();
    res.json({ success: true, reservation });
  } catch (error) {
    console.error("Error in updateReservationStatus:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update table status (Available, Occupied, Reserved, Cleaning)
exports.updateTableStatus = async (req, res) => {
  try {
    const { number } = req.params;
    const { status } = req.body;
    const validStatuses = ["Available", "Occupied", "Reserved", "Cleaning"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid table status" });
    }
    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const rest = await Restaurant.findById(user.rest_id);
    if (!rest) return res.status(404).json({ error: "Restaurant not found" });

    const table = rest.tables.find(t => t.number === number);
    if (!table) return res.status(404).json({ error: "Table not found" });

    table.status = status;
    await rest.save();
    res.json({ success: true, tables: rest.tables });
  } catch (error) {
    console.error("Error in updateTableStatus:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Add table (JSON API version)
exports.addTableAPI = async (req, res) => {
  try {
    const { number, seats } = req.body;
    if (!number || !seats) return res.status(400).json({ error: "Table number and seats required" });

    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const rest = await Restaurant.findById(user.rest_id);
    if (!rest) return res.status(404).json({ error: "Restaurant not found" });

    if (rest.tables.some(t => t.number === number)) {
      return res.status(400).json({ error: "Table number already exists" });
    }

    rest.tables.push({ number, seats: parseInt(seats), status: "Available" });
    rest.totalTables = rest.tables.length;
    await rest.save();
    res.json({ success: true, tables: rest.tables });
  } catch (error) {
    console.error("Error in addTableAPI:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete table (JSON API version)
exports.deleteTableAPI = async (req, res) => {
  try {
    const { number } = req.params;
    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const rest = await Restaurant.findById(user.rest_id);
    if (!rest) return res.status(404).json({ error: "Restaurant not found" });

    rest.tables = rest.tables.filter(t => t.number !== number);
    rest.totalTables = rest.tables.length;
    await rest.save();
    res.json({ success: true, tables: rest.tables });
  } catch (error) {
    console.error("Error in deleteTableAPI:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Edit dish (JSON API version)
exports.editProductAPI = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, serves, isAvailable } = req.body;

    const dish = await Dish.findById(id);
    if (!dish) return res.status(404).json({ error: "Dish not found" });

    if (name !== undefined) dish.name = name;
    if (price !== undefined) dish.price = price;
    if (description !== undefined) dish.description = description;
    if (serves !== undefined) dish.serves = parseInt(serves) || 1;
    if (isAvailable !== undefined) dish.isAvailable = isAvailable;
    if (req.file) dish.image = req.file.filename;

    await dish.save();

    const { getImageUrl } = require('../util/fileUpload');
    const dishObj = dish.toObject();
    dishObj.imageUrl = getImageUrl(req, dish.image) || null;

    res.json({ success: true, dish: dishObj });
  } catch (error) {
    console.error("Error in editProductAPI:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete dish (JSON API version)
exports.deleteProductAPI = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    await Dish.removeDish(user.rest_id, id);
    res.json({ success: true, message: "Dish deleted" });
  } catch (error) {
    console.error("Error in deleteProductAPI:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get restaurant settings
exports.getRestaurantSettings = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const rest = await Restaurant.findById(user.rest_id);
    if (!rest) return res.status(404).json({ error: "Restaurant not found" });

    res.json({
      name: rest.name,
      cuisine: rest.cuisine || [],
      isOpen: rest.isOpen !== undefined ? rest.isOpen : true,
      operatingHours: rest.operatingHours || { open: "09:00", close: "22:00" },
      location: rest.location || "",
      city: rest.city || "",
      tables: rest.tables || [],
      totalTables: rest.totalTables || 0
    });
  } catch (error) {
    console.error("Error in getRestaurantSettings:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update restaurant settings
exports.updateRestaurantSettings = async (req, res) => {
  try {
    const { isOpen, operatingHours, location, city, cuisine, name, phone, email, description, taxRate, serviceCharge } = req.body;
    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const rest = await Restaurant.findById(user.rest_id);
    if (!rest) return res.status(404).json({ error: "Restaurant not found" });

    if (name !== undefined) rest.name = name;
    if (isOpen !== undefined) rest.isOpen = isOpen;
    if (operatingHours) rest.operatingHours = operatingHours;
    if (location !== undefined) rest.location = location;
    if (city !== undefined) rest.city = city;
    if (cuisine) rest.cuisine = cuisine;
    if (phone !== undefined) rest.phone = phone;
    if (email !== undefined) rest.email = email;
    if (description !== undefined) rest.description = description;
    if (taxRate !== undefined) rest.taxRate = taxRate;
    if (serviceCharge !== undefined) rest.serviceCharge = serviceCharge;

    await rest.save();
    res.json({ success: true, message: "Settings updated" });
  } catch (error) {
    console.error("Error in updateRestaurantSettings:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Promo code CRUD
exports.getPromoCodes = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const promos = await PromoCode.find({ rest_id: user.rest_id }).sort({ createdAt: -1 });
    res.json({ promoCodes: promos });
  } catch (error) {
    console.error("Error in getPromoCodes:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.createPromoCode = async (req, res) => {
  try {
    const { code, description, discountType, discountValue, minAmount, maxDiscount, validFrom, validUntil, usageLimit } = req.body;
    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const promo = new PromoCode({
      code: code.toUpperCase(),
      description,
      discountType: discountType || "percentage",
      discountValue,
      minAmount: minAmount || 0,
      maxDiscount: maxDiscount || 0,
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      validUntil: validUntil ? new Date(validUntil) : null,
      usageLimit: usageLimit || 0,
      rest_id: user.rest_id,
      isActive: true
    });

    await promo.save();
    res.json({ success: true, promoCode: promo });
  } catch (error) {
    console.error("Error in createPromoCode:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};

exports.togglePromoCode = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const promo = await PromoCode.findById(id);
    if (!promo) return res.status(404).json({ error: "Promo code not found" });

    promo.isActive = !promo.isActive;
    await promo.save();
    res.json({ success: true, promoCode: promo });
  } catch (error) {
    console.error("Error in togglePromoCode:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.deletePromoCode = async (req, res) => {
  try {
    const { id } = req.params;
    await PromoCode.findByIdAndDelete(id);
    res.json({ success: true, message: "Promo code deleted" });
  } catch (error) {
    console.error("Error in deletePromoCode:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Add staff (JSON API version)
exports.addStaffAPI = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });

    const { username, password, email } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: "Email is required for staff accounts" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: "Username already exists" });

    const existingEmail = await User.findOne({ email: email.trim() });
    if (existingEmail) return res.status(400).json({ error: "Email already in use" });

    const newStaff = new User({
      username,
      password,
      role: "staff",
      rest_id: user.rest_id,
      restaurantName: user.restaurantName,
      email: email.trim()
    });
    await newStaff.save();
    res.json({ success: true, staff: { _id: newStaff._id, username: newStaff.username, email: newStaff.email, role: "staff" } });
  } catch (error) {
    console.error("Error in addStaffAPI:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete staff (JSON API version)
exports.deleteStaffAPI = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) return res.status(401).json({ error: "Not authenticated" });

    const staff = await User.findOneAndDelete({ _id: id, rest_id: user.rest_id, role: "staff" });
    if (!staff) return res.status(404).json({ error: "Staff not found" });

    res.json({ success: true, message: "Staff member removed" });
  } catch (error) {
    console.error("Error in deleteStaffAPI:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get live floor data (tables + active orders + current reservations)
exports.getLiveFloor = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(404).json({ error: "User not found" });

    const rest = await Restaurant.findById(user.rest_id);
    if (!rest) return res.status(404).json({ error: "Restaurant not found" });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [rawOrders, todayReservations] = await Promise.all([
      Order.find({
        rest_id: user.rest_id,
        status: { $in: ["pending", "preparing", "served"] }
      }).sort({ date: -1 }),
      Reservation.find({
        rest_id: String(user.rest_id),
        date: { $gte: startOfToday, $lte: endOfToday },
        status: { $nin: ["cancelled"] }
      }).sort({ time: 1 })
    ]);

    // Resolve dish names for active orders
    const allDishRefs = [...new Set(rawOrders.flatMap(o => o.dishes || []))];
    const dishDocs = await Dish.find({ $or: [
      { _id: { $in: allDishRefs } },
      { name: { $in: allDishRefs } }
    ] });
    const dishMap = {};
    dishDocs.forEach(d => { dishMap[d._id] = d; dishMap[d.name] = d; });

    const activeOrders = rawOrders.map(o => {
      const obj = o.toObject();
      const dishCounts = {};
      (obj.dishes || []).forEach(ref => {
        const key = ref;
        dishCounts[key] = (dishCounts[key] || 0) + 1;
      });
      obj.dishes = Object.entries(dishCounts).map(([ref, qty]) => {
        const d = dishMap[ref];
        return { name: d ? d.name : ref, price: d ? d.price : 0, quantity: qty };
      });
      return obj;
    });

    res.json({
      tables: rest.tables || [],
      activeOrders,
      todayReservations,
      isOpen: rest.isOpen !== undefined ? rest.isOpen : true,
      operatingHours: rest.operatingHours || { open: "09:00", close: "22:00" }
    });
  } catch (error) {
    console.error("Error in getLiveFloor:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
