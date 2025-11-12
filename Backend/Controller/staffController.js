const Restaurant = require("../Model/Restaurents_model").Restaurant;
const user_model = require("../Model/userRoleModel");

// Dashboard Methods
exports.getDashBoard = async (req, res) => {
  try {
    let r_name=await Restaurant.findById(req.session.rest_id)
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
      rest_name:r_name.name
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
      return res.status(404).send("Order not found");
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

    res.redirect("/staff/Dashboard");
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.postAllocateTable = async (req, res) => {
  const { reservationId, tableNumber } = req.body;
  let rest = await Restaurant.findById(req.session.rest_id);
  if (!rest) {
    return res.status(404).send("Restaurant not found");
  }

  // Find reservation by id
  let reservation = null;
  for (let resv of rest.reservations) {
    if (resv.id == reservationId) {
      reservation = resv;
      break;
    }
  }
  if (!reservation) {
    return res.status(404).send("Reservation not found");
  }

  // Allocate table to reservation
  if (!reservation.tables) {
    reservation.tables = [];
  }
  if (!reservation.tables.includes(tableNumber)) {
    reservation.tables.push(tableNumber);
  }

  // Mark reservation as allocated
  reservation.allocated = true;

  // Update table status in restaurant tables array
  // Assuming tables array contains objects with number and status
  for (let table of rest.tables) {
    if (table.number == tableNumber) {
      table.status = "Allocated";
      break;
    }
  }

  await rest.save();
  res.redirect("/staff/HomePage");
};

// HomePage Methods
exports.getHomePage = async (req, res) => {
  let rest = await Restaurant.findById(req.session.rest_id);
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
  let rest_name = rest.name
  res.render("staffHomepage", {
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
  const reservationId = req.params.id;
  const rest = await Restaurant.findById(req.session.rest_id);
  if (!rest) {
    return res.status(404).send("Restaurant not found");
  }

  // Find reservation index using loose equality for id comparison
  const reservationIndex = rest.reservations.findIndex(
    (r) => r.id == reservationId
  );
  if (reservationIndex === -1) {
    return res.status(404).send("Reservation not found");
  }

  // Get tables allocated to this reservation
  const tablesToFree = rest.reservations[reservationIndex].tables || [];

  // Remove reservation
  rest.reservations.splice(reservationIndex, 1);
  rest.reservations = rest.reservations; // reassign to mark change

  // Free up tables by setting status to 'Available' or empty string
  for (let table of rest.tables) {
    if (tablesToFree.includes(table.number)) {
      table.status = "Available";
    }
  }
  rest.tables = rest.tables; // reassign to mark change

  rest.markModified("reservations");
  rest.markModified("tables");

  await rest.save();
  res.redirect("/staff/HomePage");
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
    if (action === "increase") restaurant.inventoryData.values[index] += 1;
    else if (
      action === "decrease" &&
      restaurant.inventoryData.values[index] > 0
    )
      restaurant.inventoryData.values[index] -= 1;

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



















exports.getDashBoardData = async (req, res) => {
  try {
    const { Restaurant } = require("../Model/Restaurents_model");
    const { User } = require("../Model/userRoleModel");
    const Feedback = require("../Model/feedback");
    const { Order } = require("../Model/Order_model");
    const { Reservation } = require("../Model/Reservation_model");
    const { Inventory } = require("../Model/Inventory_model"); // ✅ include inventory

    console.log("------ STAFF DASHBOARD DEBUG START ------");
    console.log("Session data:", req.session);

    // Recover rest_id if missing
    if (!req.session.rest_id && req.session.username) {
      const staffUser = await User.findOne({ username: req.session.username });
      if (staffUser && staffUser.rest_id) {
        req.session.rest_id = staffUser.rest_id;
        console.log("Recovered rest_id:", req.session.rest_id);
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
      console.log("❌ Restaurant not found for ID:", req.session.rest_id);
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // ✅ Get Orders
    let orders = rest.orders || [];
    if (!orders.length) {
      orders = await Order.find({ rest_id: req.session.rest_id });
    }

    // ✅ Get Reservations
    const reservations = await Reservation.find({ rest_id: req.session.rest_id }).lean();

    // ✅ Get Feedback
    const feedback = await Feedback.find({ restaurantName: rest.name })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // ✅ Get Inventory
    const rawInventory = await Inventory.find({ rest_id: req.session.rest_id }).lean();
    const inventoryStatus = rawInventory.map((item) => {
      let status = "Available";
      if (item.quantity <= 0) status = "Out of Stock";
      else if (item.quantity <= item.minStock) status = "Low Stock";

      return {
        item: item.name,
        quantity: `${item.quantity} ${item.unit}`,
        status,
      };
    });

    console.log(`✔ Found ${orders.length} orders, ${reservations.length} reservations, ${feedback.length} feedbacks, ${inventoryStatus.length} inventory items`);

    // ✅ Send data
    res.json({
      rest_name: rest.name,
      orders,
      reservations,
      feedback,
      inventoryStatus, // 👈 add this field for frontend
    });

    console.log("------ STAFF DASHBOARD DEBUG END ------");
  } catch (error) {
    console.error("🔥 Error in getDashBoardData:", error.message);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};


