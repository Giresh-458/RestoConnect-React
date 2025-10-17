const mongoose = require("mongoose");
const { User } = require("../Model/userRoleModel");
let Restaurant = require("../Model/Restaurents_model").Restaurant;
let Dish = require("../Model/Dishes_model_test").Dish;

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
    if (!number || !seats) return res.status(400).send("Table number and number of seats are required");

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



exports.getDashboard = async (req, res) => {
  try {
    let username = req.session.username;
    let user = await User.findOne({ username });
    const Feedback = require("../Model/feedback"); 
    if (!user) return res.status(404).send("User not found");

    let restaurant = user.restaurantName;
    let rest = await Restaurant.findById(user.rest_id);

    let totalOrders = rest.orders ? rest.orders.length : 0;

    const Order = require("../Model/Order_model").Order;
    let customers = await Order.distinct("customerName", { _id: { $in: rest.orders } });
    let totalCustomers = customers.length;

    let totalRevenue = 0;
    let payments = rest.payments || [];
    payments.forEach((payment) => {
      totalRevenue += payment.amount || 0;
    });

    let dailyRevenueMap = {};
    let weeklyRevenueMap = {};

    payments.forEach((payment) => {
      if (!payment.date) return;

      let day = payment.date.toISOString().slice(0, 10);
      dailyRevenueMap[day] = (dailyRevenueMap[day] || 0) + (payment.amount || 0);

      let week = getWeekNumber(payment.date);
      weeklyRevenueMap[week] = (weeklyRevenueMap[week] || 0) + (payment.amount || 0);
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

  const feedbackList = await Feedback.find({
  restaurantName: req.session.restaurant,
}).sort({ createdAt: -1 });

    res.render("ownerDashboard", {
      restaurant,
      totalOrders,
      totalCustomers,
      totalRevenue,
      weeklyRevenueLabels: weeklyLabels,
      weeklyRevenueValues: weeklyValues,
      dailyRevenueLabels: dailyLabels,
      dailyRevenueValues: dailyValues,
      feedbackList, 
    });
  } catch (error) {
    console.error("Error in getDashboard:", error);
    res.status(500).send("Internal Server Error");
  }
};


// UTILITY
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
}


exports.getMenuManagement = async (req, res) => {
  try {
    let rest = await Restaurant.findById(req.session.rest_id)
      .populate("dishes")
      .populate("orders");

    if (!rest) return res.status(404).send("Restaurant not found");

    res.render("menuManagement", { products: rest.dishes });
  } catch (error) {
    console.error("Error in getMenuManagement:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.addProduct = async (req, res) => {
  try {
    const { name, price, description } = req.body;
    let dish = new Dish({ name, price, description:description });
    await dish.addDish(req.session.rest_id);
    res.redirect("/owner");
  } catch (error) {
    console.error("Error in addProduct:", error);
    res.status(500).send("Internal Server Error");
  }
};




exports.editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price,imageUrl } = req.body;

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
    const rest_id = req.session.rest_id;
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
  const rest_id = req.session.rest_id;

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
