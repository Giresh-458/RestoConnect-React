const mongoose = require("mongoose");
const { User } = require("../Model/userRoleModel");
let Restaurant = require("../Model/Restaurents_model").Restaurant;
let Dish = require("../Model/Dishes_model_test").Dish;
const { Order } = require("../Model/Order_model");
const { Reservation } = require("../Model/Reservation_model");
const { Inventory } = require("../Model/Inventory_model");
const Feedback = require('../Model/feedback');
exports.getOwnerHomepage = async (req, res) => {
  try {
    let username = req.session.username;
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

exports.getTables = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.session.username });
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

exports.addTable = async (req, res) => {
  try {
    const { number, seats } = req.body;
    if (!number || !seats)
      return res
        .status(400)
        .send("Table number and number of seats are required");

    const user = await User.findOne({ username: req.session.username });
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

exports.deleteTable = async (req, res) => {
  try {
    const { number } = req.params;
    const user = await User.findOne({ username: req.session.username });
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
exports.getFeedback = async (req, res) => {
  try {
    const username = req.session.username;
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
exports.updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params; // Feedback ID
    const { status } = req.body; // New status (e.g., 'Resolved')
    
    if (!status || (status !== 'Resolved' && status !== 'Pending')) {
        return res.status(400).json({ error: "Invalid status. Must be 'Resolved' or 'Pending'" });
    }

    const user = await User.findOne({ username: req.session.username });
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
exports.getOwnerInfo = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.session.username });
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
exports.getDashboardStats = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.session.username });
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

    // Calculate stock status (percentage of items above minimum stock)
    const inventoryItems = await Inventory.findByRestaurant(user.rest_id);
    let stockStatus = 0;
    if (inventoryItems.length > 0) {
      const itemsAboveMin = inventoryItems.filter(item => item.quantity >= item.minStock).length;
      stockStatus = Math.round((itemsAboveMin / inventoryItems.length) * 100);
    } else {
      // If no inventory items, default to 100%
      stockStatus = 100;
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

// API endpoint for revenue & orders trend (last 7 days)
exports.getRevenueOrdersTrend = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.session.username });
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
exports.getRecentOrders = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.session.username });
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

// API endpoint to get inventory (new system)
exports.getInventoryAPI = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.session.username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const inventoryItems = await Inventory.findByRestaurant(user.rest_id);

    res.json({ inventory: inventoryItems });
  } catch (error) {
    console.error("Error in getInventoryAPI:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// API endpoint to update inventory quantity
exports.updateInventoryQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { change } = req.body; // change can be +1 or -1

    if (!change || (change !== 1 && change !== -1)) {
      return res.status(400).json({ error: "Invalid change value. Must be 1 or -1" });
    }

    const user = await User.findOne({ username: req.session.username });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Verify the inventory item belongs to this restaurant
    const inventoryItem = await Inventory.findById(id);
    if (!inventoryItem) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    if (inventoryItem.rest_id !== user.rest_id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Update quantity
    await Inventory.updateQuantity(id, change);
    const updatedItem = await Inventory.findById(id);

    res.json({
      success: true,
      inventory: updatedItem
    });
  } catch (error) {
    console.error("Error in updateInventoryQuantity:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// API endpoint to create inventory item
exports.createInventoryItem = async (req, res) => {
  try {
    const { name, unit, quantity, minStock } = req.body;

    if (!name || !unit) {
      return res.status(400).json({ error: "Name and unit are required" });
    }

    const user = await User.findOne({ username: req.session.username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const inventoryItem = new Inventory({
      name,
      unit,
      quantity: quantity || 0,
      minStock: minStock || 0,
      rest_id: user.rest_id
    });

    await inventoryItem.save();

    res.json({
      success: true,
      inventory: inventoryItem
    });
  } catch (error) {
    console.error("Error in createInventoryItem:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// API endpoint to delete inventory item
exports.deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ username: req.session.username });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Verify the inventory item belongs to this restaurant
    const inventoryItem = await Inventory.findById(id);
    if (!inventoryItem) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    if (inventoryItem.rest_id !== user.rest_id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await Inventory.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Inventory item deleted successfully"
    });
  } catch (error) {
    console.error("Error in deleteInventoryItem:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getownerDashboard_dashboard = async (req, res) => {

  try {
    // Get user from session
    let username = req.session.username;
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

exports.getMenuManagement = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.session.username });
    if (!user) return res.status(404).json({ error: "User not found" });

    let rest = await Restaurant.findById(user.rest_id)
      .populate("dishes")
      .populate("orders");

    if (!rest) return res.status(404).json({ error: "Restaurant not found" });

    res.json({ products: rest.dishes });
  } catch (error) {
    console.error("Error in getMenuManagement:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.addProduct = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.session.username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const { name, price, description } = req.body;
    console.log(`Owner ${user.username} adding dish: ${name} for restaurant ${user.rest_id}`);
    let dish = new Dish({ name, price, description: description });
    await dish.addDish(user.rest_id);
    console.log(`Dish ${name} added successfully to restaurant ${user.rest_id}`);
    res.json({ success: true, message: "Dish added successfully" });
  } catch (error) {
    console.error("Error in addProduct:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, imageUrl } = req.body;

    let dish = await Dish.find_by_id(id);
    if (!dish) {
      return res.status(404).send("Dish not found");
    }
    dish.name = name;
    dish.price = price;
    dish.description = description;
    await dish.updateDish();
    res.redirect("/owner");
  } catch (error) {
    console.error("Error in editProduct:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await Dish.removeDish(req.session.rest_id, id);
    res.redirect("/owner/menuManagement");
  } catch (error) {
    console.error("Error in deleteProduct:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.getStaffList = async (req, res) => {
  try {
    const rest_id = req.user.rest_id;
    const staffList = await User.find({ rest_id: rest_id, role: "staff" });
    res.json(staffList);
  } catch (error) {
    console.error("Error in getStaffList:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.addStaff = async (req, res) => {
  try {
    const rest_id = req.session.rest_id;
    const { username, password, restaurantName, email } = req.body;
    if (!username || !password) {
      return res.status(400).send("Missing required fields");
    }
    const newStaff = new User({
      username,
      password,
      role: "staff",
      rest_id,
      restaurantName,
      email,
    });
    await newStaff.save();
    res.redirect("/owner/staffManagement");
  } catch (error) {
    console.error("Error in addStaff:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.editStaff = async (req, res) => {
  try {
    const staffId = req.params.id;
    const { username, password } = req.body;
    if (!username) {
      return res.status(400).send("Missing required fields");
    }
    const updateData = { username };
    if (password && password.trim() !== "") {
      updateData.password = password;
    }
    await User.updateOne({ _id: staffId }, { $set: updateData });
    res.redirect("/owner/staffManagement");
  } catch (error) {
    console.error("Error in editStaff:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const staffId = req.params.id;
    await User.deleteOne({ _id: staffId });
    res.redirect("/owner/staffManagement");
  } catch (error) {
    console.error("Error in deleteStaff:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.getTasks = async (req, res) => {
  const rest_id = req.user.rest_id;

  const rest = await Restaurant.findById(rest_id).select("tasks");

  res.json({ tasks: rest.tasks });
};

exports.deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const rest_id = req.session.rest_id;
    const rest = await Restaurant.find_by_id(rest_id);
    if (!rest) {
      return res.status(404).send("Restaurant not found");
    }
    rest.tasks = rest.tasks.filter((task) => task.id !== parseInt(taskId));
    await rest.save();
    res.redirect("/owner/staffManagement");
  } catch (error) {
    console.error("Error in deleteTask:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.deleteRestaurant = async (req, res) => {
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

exports.getOrders = async (req, res) => {
  try {
    const username = req.session.username;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    const rest_id = user.rest_id;

    // ✅ Fetch only that restaurant's orders, excluding rest_id and __v
    const orders = await Order.find({ rest_id })
      .sort({ date: -1 })
      .select("-rest_id -__v"); // <-- Exclude internal fields

    res.json(orders);
  } catch (error) {
    console.error("Error in getOrders:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getReservations = async (req, res) => {
  try {
    const username = req.session.username;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    const rest_id = user.rest_id;
    // Ensure rest_id is a string for consistent querying
    const restIdString = String(rest_id);
    console.log('🔍 Owner querying reservations for rest_id:', restIdString);
    
    const reservations = await Reservation.find({ rest_id: restIdString })
      .sort({ date: -1 })
      .select("-rest_id -__v");

    console.log(`✅ Owner found ${reservations.length} reservations for rest_id: ${restIdString}`);
    res.json(reservations);
  } catch (error) {
    console.error("Error in getReservations:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getInventory = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.session.username });
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

exports.updateInventory = async (req, res) => {
  try {
    const { item, action } = req.body;
    const user = await User.findOne({ username: req.session.username });
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

exports.getReportsData = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.session.username });
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
exports.addTask = async (req, res) => {
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

exports.addAnnouncement = async (req, res) => {
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

exports.addShift = async (req, res) => {
  try {
    const { name, date, startTime, endTime, assignedStaff } = req.body;
    const user = await User.findOne({ username: req.session.username });
    if (!user) return res.status(404).json({ error: "User not found" });

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

exports.getSupportMessages = async (req, res) => {
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

exports.getAnnouncements = async (req, res) => {
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

exports.deleteAnnouncement = async (req, res) => {
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

/*exports.getStaffTasks = async (req, res) => {
  try {
    const { staffId } = req.params;
    const user = await User.findOne({ username: req.session.username });
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const restaurant = await Restaurant.findById(user.rest_id);
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

    // Filter tasks assigned to the specific staff member
    const staffTasks = restaurant.staffTasks.filter(task =>
      task.assignedTo && task.assignedTo.includes(staffId)
    );
    console.log(staffTasks)
    res.json({ tasks: staffTasks });
  } catch (error) {
    console.error("Error in getStaffTasks:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};*/


exports.getStaffTasks = async (req, res) => {
  try {
    const { staffId } = req.params;

    const user = await User.findOne({ username: req.session.username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const restaurant = await Restaurant.findById(user.rest_id);
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

    // 🔥 find staff to get username
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


exports.deleteStaffTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const user = await User.findOne({ username: req.session.username });
    if (!user) return res.status(404).json({ error: "User not found" });

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
