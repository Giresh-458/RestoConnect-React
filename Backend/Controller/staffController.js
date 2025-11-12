const Restaurant = require("../Model/Restaurents_model").Restaurant;
const { User } = require("../Model/userRoleModel");
const { Order } = require("../Model/Order_model");

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
  let rest_name = rest.name;
  res.render("staffHomepage", {
    tasks: rest.tasks || [],
    allocatedTables,
    reservationsNeedingAllocation,
    availableTables,
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

exports.getStaffHomepageData = async (req, res) => {
  try {
    console.log("Session username:", req.session.username);

    const staffMember = await User.findOne({ username: req.session.username });
    if (!staffMember) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    const restaurant = await Restaurant.findById(staffMember.rest_id);
    if (!restaurant) {
      return res.status(404).json({
        error: "Restaurant not found",
        staffRestId: staffMember.rest_id,
      });
    }

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

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
