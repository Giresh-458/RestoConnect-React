const Restaurant = require("../Model/Restaurents_model").Restaurant;
const { User } = require("../Model/userRoleModel");
const { Order } = require("../Model/Order_model");
const bcrypt = require("bcrypt");

// Dashboard Methods
exports.getDashBoard = async (req, res) => {
  try {
    let r_name = await Restaurant.findById(req.session.rest_id);
    let rest = await Restaurant.findById(req.session.rest_id).populate(
      "orders"
    );
    if (!rest) {
      return res.status(404).send("Restaurant not found");
    }

    // Process orders data
    const orders = rest.orders || [];
    const orderStatusCount = {};
    orders.forEach((order) => {
      const status = order.status || "Unknown";
      orderStatusCount[status] = (orderStatusCount[status] || 0) + 1;
    });
    const ordersData = Object.entries(orderStatusCount).map(
      ([label, value]) => ({ label, value })
    );

    // Process inventory data - FIXED: Use the correct structure
    let inventoryItems = [];
    let inventoryDataForTable = { labels: [], values: [] }; // For the table
    let inventoryDataForChart = []; // For the chart

    if (
      rest.inventoryData &&
      rest.inventoryData.labels &&
      rest.inventoryData.values
    ) {
      inventoryItems = rest.inventoryData.labels.map((label, index) => {
        return {
          name: label,
          quantity: rest.inventoryData.values[index] || 0,
        };
      });

      // Data for the chart
      inventoryDataForChart = inventoryItems.map((item) => ({
        label: item.name,
        value: item.quantity,
      }));

      // Data for the table - use the same structure as restaurant.inventoryData
      inventoryDataForTable = {
        labels: rest.inventoryData.labels,
        values: rest.inventoryData.values,
      };
    }

    // Get recent reservations (last 10)
    const recentReservations = rest.reservations.slice(-10);

    res.render("staffDashboard", {
      orders: orders,
      reservations: recentReservations,
      inventory: inventoryItems.filter((item) => item.quantity < 10), // Show only low stock items
      ordersData,
      inventoryData: inventoryDataForChart, // For the chart
      inventoryDataForTable: inventoryDataForTable, // For the table
      restaurant: rest,
      rest_name: r_name.name,
    });
  } catch (error) {
    console.error("Error in getDashBoard:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.postUpdateOrder = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    // Update order in the Order collection
    const Order = require("../Model/Order_model").Order;
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status: status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Also update the order in the Restaurant's orders array
    let rest = await Restaurant.findById(req.session.rest_id);
    if (rest && rest.orders) {
      // Find the order in the restaurant's orders array
      const orderIndex = rest.orders.findIndex((order) => {
        // Handle both object ID references and embedded order objects
        if (order && order._id) {
          return order._id.toString() === orderId;
        }
        return false;
      });

      if (orderIndex !== -1) {
        // Update the status of the order in the restaurant's array
        rest.orders[orderIndex].status = status;
        await rest.save();
      }
    }

    res.json({ success: true, message: "Order status updated successfully", order: updatedOrder });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.postAllocateTable = async (req, res) => {
  try {
    const { Reservation } = require("../Model/Reservation_model");
    const { reservationId, tableNumber } = req.body;

    const rest = await Restaurant.findById(req.session.rest_id);
    if (!rest) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    const reservation = await Reservation.findById(reservationId);
    if (!reservation || reservation.rest_id !== String(rest._id)) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    // If table is not part of the restaurant -> reject
    const table = rest.tables.find((t) => String(t.number) === String(tableNumber));
    if (!table) {
      return res.status(400).json({ error: "Table does not exist in this restaurant" });
    }

    if (table.status !== "Available") {
      return res
        .status(400)
        .json({ error: "Table is not available. Please choose another table." });
    }

    // Mark reservation as allocated / confirmed
    reservation.allocated = true;
    reservation.status = "confirmed";
    reservation.table_id = String(tableNumber);

    if (!Array.isArray(reservation.tables)) {
      reservation.tables = [];
    }
    if (!reservation.tables.includes(String(tableNumber))) {
      reservation.tables.push(String(tableNumber));
    }

    // Update table status so it is no longer available
    table.status = "Allocated";

    await reservation.save();
    await rest.save();

    return res.json({
      success: true,
      message: "Table allocated successfully",
      reservation,
      tables: rest.tables,
    });
  } catch (error) {
    console.error("Error allocating table:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// HomePage Methods - Legacy route that renders HTML (for backward compatibility)
exports.getHomePage = async (req, res) => {
 
  // Only render HTML if this is NOT an API route


  let rest = await Restaurant.findById(req.user.rest_id);
  if (!rest) {
    return res.status(404).send("Restaurant not found");
  }

  let allocatedTables = [];
  let reservationsNeedingAllocation = [];
  let availableTables = [];

  if (rest.tables && rest.tables.length > 0) {
    availableTables = rest.tables.filter(
      (table) => table.status === "Available"
    );
  }

  if (rest.reservations && rest.reservations.length > 0) {
    for (let reservation of rest.reservations) {
      if (reservation.allocated) {
        if (reservation.tables && reservation.tables.length > 0) {
          for (let t of reservation.tables) {
            allocatedTables.push({
              table: t,
              reservationName: reservation.name,
              reservationId: reservation.id,
            });
          }
        }
      } else {
        reservationsNeedingAllocation.push(reservation);
      }
    }
  }
  let rest_name = rest.name;
  res.json({
    tasks: rest.tasks || [],
    allocatedTables,
    reservationsNeedingAllocation,
    availableTables
  });
};

exports.postHomePageTask = async (req, res) => {
  const restaurant = await Restaurant.findById(req.session.rest_id);
  if (!restaurant) {
    return res.status(404).send("Restaurant not found");
  }

  restaurant.tasks.push({
    id: Date.now(),
    name: req.body.name,
  });

  await restaurant.save();

  res.redirect("/staff/Homepage");
};

exports.deleteHomePageTasks = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.session.rest_id);
    if (!restaurant) {
      console.error("Restaurant not found");
      return res.status(404).send("Restaurant not found");
    }

    const taskId = parseInt(req.params.id);
    const initialTaskCount = restaurant.tasks.length;
    restaurant.tasks = restaurant.tasks.filter((task) => task.id !== taskId);
    const finalTaskCount = restaurant.tasks.length;

    console.log(`Deleted tasks count: ${initialTaskCount - finalTaskCount}`);

    await restaurant.save();
    console.log("Restaurant saved after task deletion");

    res.redirect("/staff/HomePage");
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).send("Internal server error");
  }
};

exports.postRemoveReservation = async (req, res) => {
  try {
    const { Reservation } = require("../Model/Reservation_model");
    const reservationId = req.params.id;

    const rest = await Restaurant.findById(req.session.rest_id);
    if (!rest) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    const reservation = await Reservation.findById(reservationId);
    if (!reservation || reservation.rest_id !== String(rest._id)) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    // Determine which tables to free
    const tablesToFree = Array.isArray(reservation.tables) && reservation.tables.length
      ? reservation.tables
      : reservation.table_id
      ? [reservation.table_id]
      : [];

    // Free the tables in the restaurant document
    for (const table of rest.tables) {
      if (tablesToFree.includes(String(table.number))) {
        table.status = "Available";
      }
    }

    await Reservation.findByIdAndDelete(reservationId);
    await rest.save();

    return res.json({
      success: true,
      message: "Reservation removed and tables freed",
      freedTables: tablesToFree,
    });
  } catch (error) {
    console.error("Error removing reservation:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.postAddTable = async (req, res) => {
  try {
    const { number, capacity } = req.body;
    const rest = await Restaurant.findById(req.session.rest_id);
    if (!rest) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Check if table number already exists
    const existingTable = rest.tables.find(t => t.number == number);
    if (existingTable) {
      return res.status(400).json({ error: "Table number already exists" });
    }

    // Add new table
    rest.tables.push({
      number: number,
      seats: capacity || 4,
      status: "Available"
    });

    await rest.save();
    res.json({ success: true, message: "Table added successfully" });
  } catch (error) {
    console.error("Error adding table:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.postUpdateInventory = async (req, res) => {
  try {
    const { item, action } = req.body;

    const restaurant = await Restaurant.findById(req.session.rest_id);
    if (!restaurant || !restaurant.inventoryData)
      return res.status(404).send("Restaurant not found");

    const index = restaurant.inventoryData.labels.indexOf(item);
    if (index === -1) return res.status(404).send("Item not found");

    // Safe quantity update
    if (action === "increase") {
      restaurant.inventoryData.values[index] = (restaurant.inventoryData.values[index] || 0) + 1;
    } else if (action === "decrease" && (restaurant.inventoryData.values[index] || 0) > 0) {
      restaurant.inventoryData.values[index] = (restaurant.inventoryData.values[index] || 0) - 1;
    }

    await restaurant.save();
    res.redirect("/staff/Dashboard");
  } catch (err) {
    console.error("Error updating inventory:", err);
    res.status(500).send("Error updating inventory");
  }
};

exports.postAutoAllocateTable = async (req, res) => {
  // Stub implementation for postAutoAllocateTable
  res.status(200).send("postAutoAllocateTable endpoint is under construction");
};

exports.getStaffHomepageData = async (req, res) => {
  // Explicitly set Content-Type to JSON for all responses
  res.setHeader('Content-Type', 'application/json');
  
  console.log("...........................................")
  console.log("getStaffHomepageData endpoint called");
  console.log("Request path:", req.path);
  console.log("Request URL:", req.url);
  console.log("Request originalUrl:", req.originalUrl);
  console.log("Request baseUrl:", req.baseUrl);
  console.log("Session username:", req.session.username);
  console.log("Session rest_id:", req.session.rest_id);
  
  try {
    if (!req.session.username) {
      console.error("❌ No username in session");
      return res.status(401).json({ error: "Not authenticated" });
    }

    const staffMember = await User.findOne({ username: req.session.username });
    if (!staffMember) {
      console.error("❌ Staff member not found in database");
      return res.status(404).json({ error: "Staff member not found" });
    }

    // Ensure rest_id is set in session if available (important for first visit)
    if (!req.session.rest_id && staffMember.rest_id) {
      req.session.rest_id = String(staffMember.rest_id);
      console.log("✅ Set rest_id in session for homepage:", req.session.rest_id);
    }

    const restaurant = await Restaurant.findById(staffMember.rest_id);
    if (!restaurant) {
      console.warn(
        "Staff homepage: restaurant not found for rest_id",
        staffMember.rest_id,
        "– returning fallback JSON so frontend can render"
      );

      const fallbackStaffData = {
        staff: {
          name: staffMember.username,
          role: staffMember.role,
          branch: "Unassigned",
        },
        announcements: [],
        shifts: [],
        tasks: [],
        performance: {
          ordersServed: 0,
          avgRating: 4.5,
          avgServeTime: 7,
          efficiencyScore: 90,
        },
      };

      return res.status(200).json(fallbackStaffData);
    }

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`Looking for orders for restaurant: ${restaurant._id}`);
    console.log(`Date range: ${startOfDay} to ${endOfDay}`);

    const activeAnnouncements = (restaurant.announcements || [])
      .filter((a) => a.active)
      .map((a) => ({
        id: a._id,
        text: a.message,
        priority: a.priority,
      }));

    const todayShifts = (restaurant.staffShifts || [])
      .filter((shift) => {
        const shiftDate = new Date(shift.date);
        return (
          shiftDate.toDateString() === new Date().toDateString() &&
          shift.assignedStaff.includes(staffMember.username)
        );
      })
      .map((shift) => ({
        id: shift._id,
        name: shift.name,
        time: `${shift.startTime} - ${shift.endTime}`,
        staff: shift.assignedStaff,
      }));

    
    const staffTasks = (restaurant.staffTasks || [])
      .filter((task) => task.assignedTo.includes(staffMember.username))
      .map((task) => ({
        id: task._id,
        name: task.description,
        status: task.status,
        priority: task.priority,
      }));

    const todaysOrders = await Order.find({
      rest_id: restaurant._id,
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    console.log(
      `Found ${todaysOrders.length} orders for today from Order collection`
    );

    const staffOrders = todaysOrders.filter(
      (order) =>
        order.assignedStaff &&
        order.assignedStaff.includes(staffMember.username)
    );

    console.log(
      `Found ${staffOrders.length} orders assigned to ${staffMember.username}`
    );

    staffOrders.forEach((order, index) => {
      console.log(`Order ${index + 1}:`, {
        rating: order.rating,
        orderTime: order.orderTime,
        completionTime: order.completionTime,
        estimatedTime: order.estimatedTime,
        assignedStaff: order.assignedStaff,
      });
    });

    const performance = {
      ordersServed: staffOrders.length,
      avgRating: calculateAverageRating(staffOrders),
      avgServeTime: calculateAverageServeTime(staffOrders),
      efficiencyScore: calculateEfficiencyScore(staffOrders),
    };

    console.log("Performance data:", performance);

    const staffData = {
      staff: {
        name: staffMember.username,
        role: staffMember.role,
        branch: restaurant.name,
      },
      announcements: activeAnnouncements,
      shifts: todayShifts,
      tasks: staffTasks,
      performance,
    };

    console.log("Sending staff data successfully");
    res.json(staffData);
  } catch (error) {
    console.error("Error fetching staff homepage data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.postSupportMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const staffMember = await User.findOne({ username: req.session.username });

    const restaurant = await Restaurant.findById(staffMember.rest_id);
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    if (!restaurant.supportMessages) {
      restaurant.supportMessages = [];
    }

    restaurant.supportMessages.push({
      from: staffMember.username,
      message: message,
      timestamp: new Date(),
      status: "pending",
    });

    await restaurant.save();

    res.json({
      success: true,
      message: "Message sent to manager successfully",
    });
  } catch (error) {
    console.error("Error sending support message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

exports.changePassword = async (req, res) => {
  const currentStaffUsername = req.session.username;
  if (!currentStaffUsername) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Missing password fields" });
    }

    const user = await User.findOne({ username: currentStaffUsername });
    if (!user) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect current password" });
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne(
      { username: currentStaffUsername },
      { $set: { password: hashedPassword } }
    );

    res.status(200).json({ message: "Password changed successfully!" });
  } catch (error) {
    console.error("Error in changePassword:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const staffMember = await User.findOne({ username: req.session.username });

    const restaurant = await Restaurant.findById(staffMember.rest_id);
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    const task = restaurant.staffTasks.id(id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    task.status = status;
    task.updatedAt = new Date();

    if (status === "Done" && !task.completedBy) {
      task.completedBy = [staffMember.username];
    }

    await restaurant.save();

    res.json({ success: true, message: "Task updated successfully", task });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
};

function calculateAverageRating(orders) {
  if (!orders.length) return 4.5;
  const totalRating = orders.reduce(
    (sum, order) => sum + (order.rating || 4.5),
    0
  );
  return Math.round((totalRating / orders.length) * 10) / 10;
}

function calculateAverageServeTime(orders) {
  if (!orders.length) return 7;
  const totalTime = orders.reduce((sum, order) => {
    if (order.orderTime && order.completionTime) {
      return (
        sum +
        (new Date(order.completionTime) - new Date(order.orderTime)) /
          (1000 * 60)
      );
    }
    return sum + 7;
  }, 0);
  return Math.round(totalTime / orders.length);
}

function calculateEfficiencyScore(orders) {
  if (!orders.length) return 90;
  const onTimeOrders = orders.filter((order) => {
    if (order.estimatedTime && order.completionTime) {
      const actualTime =
        (new Date(order.completionTime) - new Date(order.orderTime)) /
        (1000 * 60);
      return actualTime <= order.estimatedTime + 5;
    }
    return true;
  });
  return Math.round((onTimeOrders.length / orders.length) * 100);
}

exports.getDashBoardData = async (req, res) => {
   console.log("==============================================================")
  // console.log("🚀🚀🚀 getDashBoardData function called!");
  // console.log("Request method:", req.method);
  // console.log("Request path:", req.path);
  // console.log("Request URL:", req.url);
  // console.log("Session username:", req.session?.username);
  // console.log("Session rest_id:", req.session?.rest_id);

  try {
    const { Restaurant } = require("../Model/Restaurents_model");
    const { User } = require("../Model/userRoleModel");
    const Feedback = require("../Model/feedback");
    const { Order } = require("../Model/Order_model");
    const { Reservation } = require("../Model/Reservation_model");
    const { Inventory } = require("../Model/Inventory_model"); // ✅ include inventory

    // console.log("------ STAFF DASHBOARD DEBUG START ------");
    // console.log("Session data:", req.session);

    // Recover rest_id if missing - ensure it's always set for staff
    if (!req.session.rest_id && req.session.username) {
      const staffUser = await User.findOne({ username: req.session.username });
      if (staffUser && staffUser.rest_id) {
        req.session.rest_id = staffUser.rest_id;
        // console.log("✅ Recovered rest_id in dashboard:", req.session.rest_id);
      }
    }

    if (!req.session.rest_id) {
      return res.status(400).json({ error: "No restaurant ID in session" });
    }

    // ✅ Fetch restaurant
    const rest = await Restaurant.findById(req.session.rest_id)
      .populate("orders")
      .lean();

    if (!rest) {
      // console.log("❌ Restaurant not found for ID:", req.session.rest_id);
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // console.log('🏢 Restaurant tables:', rest.tables?.length || 0, rest.tables);

    // ✅ Get Orders
    let orders = rest.orders || [];
    if (!orders.length) {
      orders = await Order.find({ rest_id: req.session.rest_id });
    }

    // ✅ Get Reservations - ensure rest_id is string for query
    const restIdString = String(req.session.rest_id);
    // console.log('🔍 Querying reservations for rest_id:', restIdString);

    // Try multiple query formats to ensure we find reservations
    let reservations = await Reservation.find({ rest_id: restIdString }).lean();

    // If no results, try querying without string conversion (in case rest_id is stored differently)
    if (reservations.length === 0) {
      // console.log('⚠️ No reservations found with string rest_id, trying with original rest_id');
      reservations = await Reservation.find({ rest_id: req.session.rest_id }).lean();
    }

    // Also try querying all reservations to debug
    const allReservations = await Reservation.find({}).lean();
    // console.log(`📊 Total reservations in DB: ${allReservations.length}`);
    if (allReservations.length > 0) {
      // console.log('📋 Sample reservation rest_id values:', allReservations.slice(0, 3).map(r => ({ id: r._id, rest_id: r.rest_id, type: typeof r.rest_id })));
    }

    // console.log(`✅ Found ${reservations.length} reservations for rest_id: ${restIdString}`);
    if (reservations.length > 0) {
      // console.log('📋 Reservations found:', reservations.map(r => ({ id: r._id, customer: r.customerName, status: r.status, rest_id: r.rest_id })));
    }

    // ✅ Cleanup: Reset tables that are allocated but have no corresponding reservation
    const allocatedReservations = reservations.filter(r => r.allocated && r.status === 'confirmed');
    const allocatedTableNumbers = new Set();
    allocatedReservations.forEach(reservation => {
      if (Array.isArray(reservation.tables)) {
        reservation.tables.forEach(tableNum => allocatedTableNumbers.add(String(tableNum)));
      }
      if (reservation.table_id) {
        allocatedTableNumbers.add(String(reservation.table_id));
      }
    });

    let tablesUpdated = false;
    if (rest.tables && rest.tables.length > 0) {
      rest.tables.forEach(table => {
        if (table.status === 'Allocated' && !allocatedTableNumbers.has(String(table.number))) {
          // console.log(`🔧 Resetting orphaned table ${table.number} to Available`);
          table.status = 'Available';
          tablesUpdated = true;
        }
      });
      if (tablesUpdated) {
        await Restaurant.findByIdAndUpdate(rest._id, { tables: rest.tables });
        // console.log('✅ Cleaned up orphaned allocated tables');
      }
    }

    // ✅ Get Feedback
    const feedback = await Feedback.find({ rest_id: req.session.rest_id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // ✅ Get Inventory from restaurant inventoryData
    const inventoryStatus = [];
    if (rest.inventoryData && rest.inventoryData.labels && Array.isArray(rest.inventoryData.labels) && rest.inventoryData.labels.length > 0) {
      for (let i = 0; i < rest.inventoryData.labels.length; i++) {
        const quantity = (rest.inventoryData.values && rest.inventoryData.values[i]) || 0;
        const minStock = (rest.inventoryData.minStocks && rest.inventoryData.minStocks[i]) || 0;
        const unit = (rest.inventoryData.units && rest.inventoryData.units[i]) || 'pieces';

        let status = "Available";
        if (quantity <= 0) status = "Out of Stock";
        else if (quantity <= minStock) status = "Low Stock";

        inventoryStatus.push({
          item: rest.inventoryData.labels[i],
          quantity: `${quantity} ${unit}`,
          quantityValue: quantity, // Include numeric value for comparison
          minStock: minStock, // Include minStock for frontend calculations
          status,
        });
      }
    }

    // console.log(`✔ Found ${orders.length} orders, ${reservations.length} reservations, ${feedback.length} feedbacks, ${inventoryStatus.length} inventory items`);

    // ✅ Get available tables - ensure proper structure
    const availableTables = (rest.tables || []).filter(t => t.status === "Available").map(table => ({
      number: String(table.number || ''),
      seats: Number(table.seats || 4),
      status: table.status || 'Available'
    }));

    // ✅ Get all tables for occupied count
    const allTables = (rest.tables || []).map(table => ({
      number: String(table.number || ''),
      seats: Number(table.seats || 4),
      status: table.status || 'Available'
    }));

    // console.log('📊 Available tables:', availableTables.length, availableTables);
    // console.log('🏢 All tables:', allTables.length, allTables);

    // ✅ Get Staff Tasks
    const staffTasks = (rest.staffTasks || []).map((task) => ({
      id: task._id,
      name: task.description,
      status: task.status,
      priority: task.priority,
      assignedTo: task.assignedTo,
    }));
     console.log(staffTasks+"================================================")

    // ✅ Calculate pending tasks count
    const pendingTasksCount = staffTasks.filter(task => task.status === "Pending").length;

    // ✅ Send data
    res.json({
      rest_name: rest.name,
      orders,
      reservations,
      feedback,
      inventoryStatus, // 👈 add this field for frontend
      availableTables,
      allTables, // 👈 add all tables for occupied count
      staffTasks, // 👈 add staffTasks for pending tasks
      pendingTasksCount, // 👈 add pending tasks count
    });

    // console.log("------ STAFF DASHBOARD DEBUG END ------");
  } catch (error) {
    console.error("🔥 Error in getDashBoardData:", error.message);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};


