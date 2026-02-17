// Controller/adminController.js
const path = require("path");
const bcrypt = require("bcrypt");
const { User } = require("../Model/userRoleModel");
const { Restaurant } = require("../Model/Restaurents_model"); // ✅ Correct spelling
const RestaurantRequest = require("../Model/restaurent_request_model"); // ✅ Correct spelling
const { Dish } = require("../Model/Dishes_model_test");

// Admin Dashboard
exports.getAdminDashboard = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.findAll();
    const formattedRestaurants = restaurants.map((r) => ({
      name: r.name,
      location: r.location,
      amount: r.amount,
      date: r.date,
      _id: r._id,
      image: r.image,
    }));

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const totalRevenue = restaurants.reduce((sum, r) => {
      const joinDate = new Date(r.date);
      if (
        joinDate.getMonth() === currentMonth &&
        joinDate.getFullYear() === currentYear
      ) {
        return sum + (r.amount || 0);
      }
      return sum;
    }, 0);

   
    const currentAdminUsername = req.user
      ? req.user.username
      : req.session.username;
    let currentAdminProfile = null;
    if (currentAdminUsername) {
      currentAdminProfile = await User.findOne({
        username: currentAdminUsername,
      });
    }

    let users = [];
    const userFilter = { role: { $ne: "admin" } };
    if (currentAdminUsername) {
      users = await User.find({
        ...userFilter,
        username: { $ne: currentAdminUsername },
      });
    } else {
      users = await User.find(userFilter);
    }

    users = users.map((user) => {
      if (user.role === "customer") user.restaurantName = "";
      return user;
    });

    //non-admin users
    const totalUserCount = await User.countDocuments({
      role: { $ne: "admin" },
    });

    res.json({
      active_user_count: 0,
      total_user_count: totalUserCount,
      current_admin: currentAdminProfile,
      totalRevenue,
      restaurants_list: formattedRestaurants,
      users_list: users,
    });
  } catch (error) {
    console.error("Error in getAdminDashboard:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.getStatisticsGraphs = async (req, res, next) => {
  try {
    const period = req.query.period || 'monthly'; // daily, monthly, yearly
    const now = new Date();
    let startDate, groupBy, sortBy;

    // Set date range and grouping based on period
    if (period === 'daily') {
      // Last 30 days
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      groupBy = {
        year: { $year: "$payments.date" },
        month: { $month: "$payments.date" },
        day: { $dayOfMonth: "$payments.date" }
      };
      sortBy = { year: 1, month: 1, day: 1 };
    } else if (period === 'yearly') {
      // Last 5 years
      startDate = new Date(now.getFullYear() - 4, 0, 1);
      groupBy = {
        year: { $year: "$payments.date" }
      };
      sortBy = { year: 1 };
    } else {
      // Monthly (default) - current year
      startDate = new Date(now.getFullYear(), 0, 1);
      groupBy = {
        month: { $month: "$payments.date" }
      };
      sortBy = { month: 1 };
    }

    const result = await Restaurant.aggregate([
      { $unwind: "$payments" },
      { $match: { "payments.date": { $gte: startDate } } },
      {
        $group: {
          _id: groupBy,
          totalPayments: { $sum: "$payments.amount" },
          countPayments: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          ...(period === 'daily' ? {
            year: "$_id.year",
            month: "$_id.month",
            day: "$_id.day"
          } : period === 'yearly' ? {
            year: "$_id.year"
          } : {
            month: "$_id.month"
          }),
          totalPayments: 1,
          countPayments: 1,
          restaurantFee: { $multiply: ["$totalPayments", 0.1] },
        },
      },
      { $sort: sortBy },
    ]);

    res.json(result);
  } catch (error) {
    console.error("Error in getStatisticsGraphs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const currentAdminUsername = req.user ? req.user.username : null;
    let users = [];
    const filter = { role: { $ne: "admin" } };
    if (currentAdminUsername) {
      users = await User.find({
        ...filter,
        username: { $ne: currentAdminUsername },
      });
    } else {
      users = await User.find(filter);
    }
    res.json(users);
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).send("Internal Server Error");
  }
};

// Get statistics
exports.getStatistics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRestaurants = await Restaurant.countDocuments();
    const restaurants = await Restaurant.findAll();
    const totalRevenue = restaurants.reduce(
      (sum, r) => sum + (r.amount || 0),
      0
    );
    res.json({ totalUsers, totalRestaurants, totalRevenue });
  } catch (error) {
    console.error("Error in getStatistics:", error);
    res.status(500).send("Internal Server Error");
  }
};

// Helper to determine if request expects JSON (AJAX)
const expectsJson = (req) => {
  return (
    req.xhr ||
    (req.headers.accept && req.headers.accept.includes("application/json")) ||
    req.get("X-Requested-With") === "XMLHttpRequest" ||
    req.headers["content-type"] === "application/json"
  );
};

// Delete user
exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    await User.deleteOne({ _id: userId });
    if (expectsJson(req))
      return res.status(200).json({ message: "User deleted successfully" });
    return res.redirect("/admin/dashboard");
  } catch (error) {
    console.error("Error in deleteUser:", error);
    if (expectsJson(req))
      return res.status(500).json({ error: "Internal Server Error" });
    res.status(500).send("Internal Server Error");
  }
};

// Suspend user
exports.suspendUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { suspensionEndDate, suspensionReason } = req.body || {};

    // Require a valid suspension end date
    if (!suspensionEndDate) {
      return res.status(400).json({ error: "Suspension end date is required" });
    }

    const parsed = new Date(suspensionEndDate);
    if (isNaN(parsed.getTime())) {
      return res.status(400).json({ error: "Invalid suspension end date" });
    }

    const now = new Date();
    // Allow same-day suspensions; require end date >= today
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    if (parsed < startOfToday) {
      return res
        .status(400)
        .json({ error: "Suspension end date must be today or later" });
    }

    const updateData = {
      isSuspended: true,
      suspensionEndDate: parsed,
      suspensionReason: suspensionReason || null,
    };

    await User.updateOne({ _id: userId }, { $set: updateData });
    if (expectsJson(req))
      return res.status(200).json({ message: "User suspended successfully" });
    return res.redirect("/admin/dashboard");
  } catch (error) {
    console.error("Error in suspendUser:", error);
    if (expectsJson(req))
      return res.status(500).json({ error: "Internal Server Error" });
    res.status(500).send("Internal Server Error");
  }
};

// Unsuspend user
exports.unsuspendUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          isSuspended: false,
          suspensionEndDate: null,
          suspensionReason: null,
        },
      }
    );
    if (expectsJson(req))
      return res.status(200).json({ message: "User unsuspended successfully" });
    return res.redirect("/admin/dashboard");
  } catch (error) {
    console.error("Error in unsuspendUser:", error);
    if (expectsJson(req))
      return res.status(500).json({ error: "Internal Server Error" });
    res.status(500).send("Internal Server Error");
  }
};

// 🌟 FIX: Edit admin profile
exports.editProfile = async (req, res, next) => {
  try {
    const currentAdminUsername = req.user
      ? req.user.username
      : req.session.username;
    if (!currentAdminUsername) {
      if (expectsJson(req))
        return res.status(401).json({ error: "Unauthorized" });
      return res.redirect("/loginPage");
    }

    const { username, email, currentPassword, newpassword } = req.body || {};
    if (!username || !email) {
      if (expectsJson(req))
        return res.status(400).json({ error: "Missing required fields" });
      return res.status(400).send("Missing required fields");
    }

    const adminUser = await User.findOne({ username: currentAdminUsername });
    if (!adminUser) {
      if (expectsJson(req))
        return res.status(404).json({ error: "Admin not found" });
      return res.redirect("/loginPage");
    }

    // Determine if identity/password will change
    const willChangeIdentity =
      username !== adminUser.username ||
      email !== adminUser.email ||
      (newpassword && newpassword.trim() !== "");

    // If the client provided a currentPassword, always verify it.
    if (currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, adminUser.password);
      if (!isMatch) {
        if (expectsJson(req))
          return res.status(401).json({ error: "Incorrect current password" });
        return res.status(401).send("Incorrect current password");
      }
    } else if (willChangeIdentity) {
      // When identity (username/email) or password is changing, require the current password.
      if (expectsJson(req))
        return res
          .status(400)
          .json({ error: "Current password is required to update profile" });
      return res.status(400).send("Current password is required");
    }

    const updateData = { username, email };
    if (newpassword && newpassword.trim() !== "") {
      if(newpassword.trim().length<6){
      return res.status(400).json({
  message: "password must be at least 6 letters"
});
      }
      updateData.password = await bcrypt.hash(newpassword.trim(), 10);
    }

    await User.updateOne(
      { username: currentAdminUsername },
      { $set: updateData }
    );
    if (username !== currentAdminUsername) req.session.username = username;

    if (expectsJson(req))
      return res.status(200).json({ message: "Profile updated successfully" });
    return res.redirect("/admin/dashboard");
  } catch (error) {
    console.error("Error in editProfile:", error);
    if (expectsJson(req))
      return res.status(500).json({ error: "Internal Server Error" });
    res.status(500).send("Internal Server Error");
  }
};

// 🌟 FIX: Change Admin Password
exports.changePassword = async (req, res, next) => {
  const currentAdminUsername = req.session.username; // Use session for identity
  if (!currentAdminUsername)
    return res.status(401).json({ error: "Unauthorized" });

  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: "Missing password fields" });

    if(newPassword.trim().length<6){
    return res.status(400).json({
  message: "password must be at least 6 letters"
});

    }
    const user = await User.findOne({ username: currentAdminUsername });
    if (!user) return res.status(404).json({ error: "Admin not found" });

    // 1. Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(401).json({ error: "Incorrect current password" });


    // 2. Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne(
      { username: currentAdminUsername },
      { $set: { password: hashedPassword } }
    );

    res.status(200).json({ message: "Password changed successfully!" });
  } catch (error) {
    console.error("Error in changePassword:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 🌟 FIX: Delete Admin Account
exports.deleteAccount = async (req, res, next) => {
  const currentAdminUsername = req.session.username; // Use session for identity
  if (!currentAdminUsername) {
    if (expectsJson(req))
      return res.status(401).json({ error: "Unauthorized" });
    return res.redirect("/loginPage");
  }

  try {
    // Find the admin user to be sure
    const user = await User.findOne({
      username: currentAdminUsername,
      role: "admin",
    });
    if (!user) {
      if (expectsJson(req))
        return res.status(404).json({ error: "Admin account not found" });
      return res.redirect("/loginPage");
    }

    await User.deleteOne({ username: currentAdminUsername });

    // Destroy the session to log the admin out
    req.session.destroy((err) => {
      if (err) console.error("Error destroying session:", err);
      if (expectsJson(req))
        return res
          .status(200)
          .json({ message: "Account deleted successfully." });
      res.redirect("/loginPage");
    });
  } catch (error) {
    console.error("Error in deleteAccount:", error);
    if (expectsJson(req))
      return res.status(500).json({ error: "Internal Server Error" });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Add restaurant
exports.postAddRestaurent = async (req, res, next) => {
  try {
    const {
      name,
      location,
      amount,
      owner_username,
      owner_password,
      owner_email,
    } = req.body;
    if (!name || !location || !amount)
      return res.status(400).json({ error: "Missing required fields!" });

    const newRestaurant = new Restaurant({
      name,
      location,
      amount,
      date: new Date(),
      image: "",
      rating: 4,
    });
    await newRestaurant.save();

    const ownerUser = new User({
      username:
        owner_username || `${name.toLowerCase().replace(/\s/g, "")}_owner`,
      password: owner_password || "defaultpassword",
      email: owner_email || "",
      role: "owner",
      restaurantName: name,
      rest_id: newRestaurant._id,
    });
    await ownerUser.save();

    res.redirect("/admin/dashboard");
  } catch (error) {
    console.error("Error in postAddRestaurent:", error);
    res.status(500).send("Internal Server Error");
  }
};

// Edit restaurant
exports.postEditRestaurent = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { name, location, amount } = req.body;
    if (!name || !location || !amount)
      return res.status(400).json({ error: "Missing required fields!" });

    await Restaurant.updateOne(
      { _id: id },
      { $set: { name, location, amount } }
    );
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.error("Error in postEditRestaurent:", error);
    res.status(500).send("Internal Server Error");
  }
};

// Suspend restaurant
exports.suspendRestaurant = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { suspensionEndDate, suspensionReason } = req.body || {};

    // Require a valid suspension end date
    if (!suspensionEndDate) {
      return res.status(400).json({ error: "Suspension end date is required" });
    }

    const parsed = new Date(suspensionEndDate);
    if (isNaN(parsed.getTime())) {
      return res.status(400).json({ error: "Invalid suspension end date" });
    }

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    if (parsed < startOfToday) {
      return res
        .status(400)
        .json({ error: "Suspension end date must be today or later" });
    }

    const updateData = {
      isSuspended: true,
      suspensionEndDate: parsed,
      suspensionReason: suspensionReason || null,
    };

    await Restaurant.updateOne({ _id: id }, { $set: updateData });
    if (expectsJson(req))
      return res
        .status(200)
        .json({ message: "Restaurant suspended successfully" });
    return res.redirect("/admin/dashboard");
  } catch (error) {
    console.error("Error in suspendRestaurant:", error);
    if (expectsJson(req))
      return res.status(500).json({ error: "Internal Server Error" });
    res.status(500).send("Internal Server Error");
  }
};

// Unsuspend restaurant
exports.unsuspendRestaurant = async (req, res, next) => {
  try {
    const id = req.params.id;
    await Restaurant.updateOne(
      { _id: id },
      {
        $set: {
          isSuspended: false,
          suspensionEndDate: null,
          suspensionReason: null,
        },
      }
    );
    if (expectsJson(req))
      return res
        .status(200)
        .json({ message: "Restaurant unsuspended successfully" });
    return res.redirect("/admin/dashboard");
  } catch (error) {
    console.error("Error in unsuspendRestaurant:", error);
    if (expectsJson(req))
      return res.status(500).json({ error: "Internal Server Error" });
    res.status(500).send("Internal Server Error");
  }
};

// Delete restaurant
exports.postDeleteRestaurent = async (req, res, next) => {
  console.log("in the the admin controller delete restarant")
  try {
    const id = req.params.id;
    const restaurant = await Restaurant.findById(id);
    if (restaurant) {
      await Dish.deleteMany({ _id: { $in: restaurant.dishes } });
      await User.deleteMany({ rest_id: id });
    }
    await Restaurant.deleteOne({ _id: id });
    if (expectsJson(req))
      return res
        .status(200)
        .json({ message: "Restaurant deleted successfully" });
    return res.redirect("/admin/dashboard");
  } catch (error) {
    console.error("Error in postDeleteRestaurent:", error);
    if (expectsJson(req))
      return res.status(500).json({ error: "Internal Server Error" });
    res.status(500).send("Internal Server Error");
  }
};

// Get all restaurants
exports.getAllRestaurants = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.findAll();
    const restaurantsWithOwners = await Promise.all(
      restaurants.map(async (restaurant) => {
        const owner = await User.findOne({ rest_id: restaurant._id });
        return {
          ...restaurant.toObject(),
          owner: owner
            ? {
                name: owner.username,
                email: owner.email,
              }
            : null,
        };
      })
    );

    res.json(restaurantsWithOwners);
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    res.status(500).send("Internal Server Error");
  }
};

// Accept restaurant request
exports.getaceptreq = async (req, res, next) => {
  try {
    const ownername = req.params.owner_username;
    console.log(ownername)
    const request = await RestaurantRequest.findOne({
      owner_username: ownername,
    });
    if (!request) return res.status(404).json({ error: "Request not found" });

    const newRestaurant = new Restaurant({
      name: request.name,
      location: request.location, // Full address including city
      city: request.city, // City for filtering
      amount: request.amount,
      cuisine: request.cuisineTypes || [], // Transfer cuisine types
      image: request.image, // Transfer image
      created_at: new Date(),
    });
    await newRestaurant.save();

    try{
    const newOwner = new User({
      username: request.owner_username,
      password: request.owner_password,
      role: "owner",
      restaurantName: request.name,
      rest_id: newRestaurant._id,
      email: request.email,
    });
    await newOwner.save();
  }
  catch(err){
    console.log(err+"===================================================")
  }

    await RestaurantRequest.deleteOne({ _id: request._id });

    res.json({ message: "Request accepted successfully" });
  } catch (err) {
    console.error("Error accepting request:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getrejectreq = async (req, res, next) => {
  try {
    const ownername = req.params.owner_username;
    const request = await RestaurantRequest.findOne({
      owner_username: ownername,
    });
    if (!request) return res.status(404).json({ error: "Request not found" });

    await RestaurantRequest.deleteOne({ _id: request._id });
    res.json({ message: "Request rejected successfully" });
  } catch (err) {
    console.error("Error rejecting request:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getAllRequests = async (req, res, next) => {
  try {
    const requests = await RestaurantRequest.find();
    res.json(requests);
  } catch (err) {
    console.error("Error fetching requests:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getPublicRestaurants = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.findAll();
    res.json(restaurants);
  } catch (error) {
    console.error("Error fetching public restaurants:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ── Admin: Get all orders across all restaurants ──
exports.getAllOrders = async (req, res, next) => {
  try {
    const Order = require("../Model/Order_model");
    const { status, restaurant, date, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (restaurant) filter.rest_id = restaurant;
    if (date) {
      const d = new Date(date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.date = { $gte: d, $lt: next };
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ date: -1 }).skip(skip).limit(parseInt(limit)),
      Order.countDocuments(filter),
    ]);
    // stats
    const allOrders = await Order.find({});
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayOrders = allOrders.filter(o => new Date(o.date) >= todayStart);
    const totalRevenue = allOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const todayRevenue = todayOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const avgOrderValue = allOrders.length ? (totalRevenue / allOrders.length).toFixed(2) : 0;
    const statusBreakdown = {};
    allOrders.forEach(o => { statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1; });
    res.json({
      orders,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      stats: { totalOrders: allOrders.length, todayOrders: todayOrders.length, totalRevenue, todayRevenue, avgOrderValue: parseFloat(avgOrderValue), statusBreakdown },
    });
  } catch (error) {
    console.error("Error in getAllOrders:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ── Admin: Get all reservations across all restaurants ──
exports.getAllReservations = async (req, res, next) => {
  try {
    const Reservation = require("../Model/Reservation_model");
    const { status, restaurant, date, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (restaurant) filter.rest_id = restaurant;
    if (date) {
      const d = new Date(date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.date = { $gte: d, $lt: next };
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [reservations, total] = await Promise.all([
      Reservation.find(filter).sort({ date: -1 }).skip(skip).limit(parseInt(limit)),
      Reservation.countDocuments(filter),
    ]);
    // stats
    const allRes = await Reservation.find({});
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayRes = allRes.filter(r => new Date(r.date) >= todayStart);
    const statusBreakdown = {};
    allRes.forEach(r => { statusBreakdown[r.status] = (statusBreakdown[r.status] || 0) + 1; });
    const totalGuests = allRes.reduce((s, r) => s + (r.guests || 0), 0);
    res.json({
      reservations,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      stats: { totalReservations: allRes.length, todayReservations: todayRes.length, totalGuests, statusBreakdown },
    });
  } catch (error) {
    console.error("Error in getAllReservations:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ── Admin: Get all feedback across all restaurants ──
exports.getAllFeedback = async (req, res, next) => {
  try {
    const Feedback = require("../Model/feedback");
    const { status, restaurant, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (restaurant) filter.rest_id = restaurant;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [feedback, total] = await Promise.all([
      Feedback.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Feedback.countDocuments(filter),
    ]);
    const allFb = await Feedback.find({});
    const avgDining = allFb.length ? (allFb.reduce((s, f) => s + (f.diningRating || 0), 0) / allFb.filter(f => f.diningRating).length).toFixed(1) : 0;
    const avgOrder = allFb.length ? (allFb.reduce((s, f) => s + (f.orderRating || 0), 0) / allFb.filter(f => f.orderRating).length).toFixed(1) : 0;
    const pending = allFb.filter(f => f.status === "Pending").length;
    const resolved = allFb.filter(f => f.status === "Resolved").length;
    res.json({
      feedback,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      stats: { totalFeedback: allFb.length, avgDiningRating: parseFloat(avgDining), avgOrderRating: parseFloat(avgOrder), pending, resolved },
    });
  } catch (error) {
    console.error("Error in getAllFeedback:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ── Admin: Analytics endpoint ──
exports.getAnalytics = async (req, res, next) => {
  try {
    const Order = require("../Model/Order_model");
    const Reservation = require("../Model/Reservation_model");
    const Feedback = require("../Model/feedback");

    const restaurants = await Restaurant.findAll();
    const allOrders = await Order.find({});
    const allReservations = await Reservation.find({});
    const allFeedback = await Feedback.find({});
    const totalUsers = await User.countDocuments({ role: { $ne: "admin" } });

    // Top restaurants by order count
    const restOrderCount = {};
    const restRevenue = {};
    allOrders.forEach(o => {
      const rid = o.rest_id?.toString() || "unknown";
      restOrderCount[rid] = (restOrderCount[rid] || 0) + 1;
      restRevenue[rid] = (restRevenue[rid] || 0) + (o.totalAmount || 0);
    });

    const topRestaurants = restaurants
      .map(r => ({
        _id: r._id.toString(),
        name: r.name,
        orders: restOrderCount[r._id.toString()] || 0,
        revenue: restRevenue[r._id.toString()] || 0,
        rating: r.rating || 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Peak hours
    const hourCounts = Array(24).fill(0);
    allOrders.forEach(o => {
      if (o.orderTime) {
        const h = new Date(o.orderTime).getHours();
        hourCounts[h]++;
      } else if (o.date) {
        const h = new Date(o.date).getHours();
        hourCounts[h]++;
      }
    });
    const peakHours = hourCounts.map((count, hour) => ({ hour: `${hour}:00`, count }));

    // Monthly revenue trend (last 12 months)
    const monthlyRevenue = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const monthOrders = allOrders.filter(o => {
        const od = new Date(o.date);
        return od >= d && od <= monthEnd;
      });
      const revenue = monthOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      monthlyRevenue.push({ month: months[d.getMonth()] + " " + d.getFullYear(), revenue, orders: monthOrders.length });
    }

    // Customer activity - reservations per restaurant
    const restReservationCount = {};
    allReservations.forEach(r => {
      const rid = r.rest_id?.toString() || "unknown";
      restReservationCount[rid] = (restReservationCount[rid] || 0) + 1;
    });

    const totalRevenue = allOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const avgRating = allFeedback.length
      ? (allFeedback.reduce((s, f) => s + (f.diningRating || f.orderRating || 0), 0) / allFeedback.length).toFixed(1)
      : 0;

    res.json({
      overview: {
        totalRestaurants: restaurants.length,
        totalUsers,
        totalOrders: allOrders.length,
        totalReservations: allReservations.length,
        totalRevenue,
        avgRating: parseFloat(avgRating),
        totalFeedback: allFeedback.length,
      },
      topRestaurants,
      peakHours,
      monthlyRevenue,
    });
  } catch (error) {
    console.error("Error in getAnalytics:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getRecentActivities = async (req, res, next) => {
  try {
    const activities = [];

    // Latest 5 new users
    const newUsers = await User.find().sort({ _id: -1 }).limit(5); // Use _id as proxy for creation time since no createdAt
    newUsers.forEach((u) => {
      activities.push({
        time: u._id.getTimestamp().toLocaleString(),
        description: `New user ${u.username} registered`,
      });
    });

    // Latest 5 restaurants
    const newRestaurants = await Restaurant.find().sort({ date: -1 }).limit(5);
    newRestaurants.forEach((r) => {
      activities.push({
        time:
          r.date && !isNaN(new Date(r.date).getTime())
            ? new Date(r.date).toLocaleString()
            : new Date().toLocaleString(),
        description: `Restaurant ${r.name} added to platform`,
      });
    });

    // Sort by most recent
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));

    // Limit to 10 activities
    res.json(activities.slice(0, 10));
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ── Employee Performance Analytics ──
exports.getEmployeePerformance = async (req, res) => {
  try {
    const { Order } = require("../Model/Order_model");
    const employees = await User.find({ role: "employee" }).select(
      "username email _id isSuspended createdAt"
    );
    const restaurants = await Restaurant.find({});
    const allOrders = await Order.find({});

    const employeeCount = employees.length || 1;

    const performance = employees.map((emp, idx) => {
      const managedRestaurants = restaurants.filter(
        (_, i) => i % employeeCount === idx
      );
      const managedRestIds = managedRestaurants.map((r) => r._id.toString());
      const managedOrders = allOrders.filter((o) =>
        managedRestIds.includes(o.rest_id?.toString())
      );
      const totalApprovals = managedRestaurants.length;
      const totalOrdersHandled = managedOrders.length;
      const revenueGenerated = managedOrders.reduce(
        (s, o) => s + (o.totalAmount || 0), 0
      );
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
          totalApprovals > 5 ? 4.5
          : totalApprovals > 2 ? 3.8
          : totalApprovals > 0 ? 3.0
          : 0,
      };
    });

    performance.sort((a, b) => b.totalApprovals - a.totalApprovals);
    res.json({ employees: performance });
  } catch (error) {
    console.error("Error in getEmployeePerformance:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ── Restaurant Revenue / Platform Fee Analytics ──
exports.getRestaurantRevenue = async (req, res) => {
  try {
    const { Order } = require("../Model/Order_model");
    const { period = "all" } = req.query;
    const restaurants = await Restaurant.find({});
    const allOrders = await Order.find({});

    const now = new Date();
    let filteredOrders = allOrders;

    if (period === "today") {
      const start = new Date(now); start.setHours(0, 0, 0, 0);
      filteredOrders = allOrders.filter((o) => new Date(o.date) >= start);
    } else if (period === "week") {
      const start = new Date(now); start.setDate(start.getDate() - 7);
      filteredOrders = allOrders.filter((o) => new Date(o.date) >= start);
    } else if (period === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      filteredOrders = allOrders.filter((o) => new Date(o.date) >= start);
    } else if (period === "year") {
      const start = new Date(now.getFullYear(), 0, 1);
      filteredOrders = allOrders.filter((o) => new Date(o.date) >= start);
    }

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
    const totalPlatformFee = restaurantData.reduce((s, r) => s + r.platformFee, 0);
    const totalOrders = restaurantData.reduce((s, r) => s + r.orders, 0);

    res.json({
      restaurants: restaurantData,
      summary: {
        totalRevenue,
        totalPlatformFee,
        totalOrders,
        avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      },
    });
  } catch (error) {
    console.error("Error in getRestaurantRevenue:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ── Dish & Category Trends ──
exports.getDishTrends = async (req, res) => {
  try {
    const { Order } = require("../Model/Order_model");
    const allOrders = await Order.find({});
    const allDishes = await Dish.find({});
    const restaurants = await Restaurant.find({});

    const now = new Date();
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

    const countDishes = (orders) => {
      const counts = {};
      orders.forEach((o) => {
        if (o.dishes && Array.isArray(o.dishes)) {
          o.dishes.forEach((dishId) => {
            const id = dishId?.toString();
            if (id) counts[id] = (counts[id] || 0) + 1;
          });
        }
      });
      return counts;
    };

    const currentCounts = countDishes(currentMonthOrders);
    const prevCounts = countDishes(prevMonthOrders);

    const dishTrends = allDishes.map((dish) => {
      const current = currentCounts[dish._id.toString()] || 0;
      const previous = prevCounts[dish._id.toString()] || 0;
      const change = previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;
      const servingRestaurants = restaurants
        .filter((r) => r.dishes?.some((d) => d.toString() === dish._id.toString()))
        .map((r) => r.name);

      return {
        _id: dish._id,
        name: dish.name,
        category: dish.category || "Main Course",
        price: dish.price,
        image: dish.image,
        currentMonthOrders: current,
        prevMonthOrders: previous,
        changePercent: Math.round(change),
        trend: change > 0 ? "up" : change < 0 ? "down" : "stable",
        restaurants: servingRestaurants,
      };
    });

    dishTrends.sort((a, b) => b.currentMonthOrders - a.currentMonthOrders);

    // Category aggregation
    const categories = {};
    dishTrends.forEach((d) => {
      const cat = d.category;
      if (!categories[cat]) categories[cat] = { current: 0, previous: 0, dishes: 0 };
      categories[cat].current += d.currentMonthOrders;
      categories[cat].previous += d.prevMonthOrders;
      categories[cat].dishes++;
    });

    const categoryTrends = Object.entries(categories).map(([name, data]) => {
      const change = data.previous > 0
        ? ((data.current - data.previous) / data.previous) * 100
        : data.current > 0 ? 100 : 0;
      return {
        category: name,
        currentMonthOrders: data.current,
        prevMonthOrders: data.previous,
        changePercent: Math.round(change),
        trend: change > 0 ? "up" : change < 0 ? "down" : "stable",
        dishCount: data.dishes,
      };
    });

    // Monthly trend (last 6 months)
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const monthOrders = allOrders.filter((o) => {
        const od = new Date(o.date);
        return od >= d && od <= mEnd;
      });
      const counts = countDishes(monthOrders);
      monthlyData.push({
        month: months[d.getMonth()],
        totalDishesOrdered: Object.values(counts).reduce((s, c) => s + c, 0),
        uniqueDishes: Object.keys(counts).length,
        revenue: monthOrders.reduce((s, o) => s + (o.totalAmount || 0), 0),
      });
    }

    res.json({
      dishes: dishTrends.slice(0, 30),
      categoryTrends,
      monthlyData,
      topGainers: dishTrends.filter((d) => d.trend === "up").sort((a, b) => b.changePercent - a.changePercent).slice(0, 5),
      topDecliners: dishTrends.filter((d) => d.trend === "down").sort((a, b) => a.changePercent - b.changePercent).slice(0, 5),
    });
  } catch (error) {
    console.error("Error in getDishTrends:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ── Top Customers Analytics ──
exports.getTopCustomers = async (req, res) => {
  try {
    const { Order } = require("../Model/Order_model");
    const { period = "all" } = req.query;
    const allOrders = await Order.find({});
    const customers = await User.find({ role: "customer" }).select("username email _id");

    const now = new Date();
    let filteredOrders = allOrders;

    if (period === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      filteredOrders = allOrders.filter((o) => new Date(o.date) >= start);
    } else if (period === "quarter") {
      const start = new Date(now); start.setMonth(start.getMonth() - 3);
      filteredOrders = allOrders.filter((o) => new Date(o.date) >= start);
    } else if (period === "year") {
      const start = new Date(now.getFullYear(), 0, 1);
      filteredOrders = allOrders.filter((o) => new Date(o.date) >= start);
    }

    const customerSpending = {};
    const customerOrderCount = {};
    const customerItems = {};
    const customerLastOrder = {};

    filteredOrders.forEach((o) => {
      const cname = o.customerName || "unknown";
      customerSpending[cname] = (customerSpending[cname] || 0) + (o.totalAmount || 0);
      customerOrderCount[cname] = (customerOrderCount[cname] || 0) + 1;
      if (o.dishes && Array.isArray(o.dishes))
        customerItems[cname] = (customerItems[cname] || 0) + o.dishes.length;
      const orderDate = new Date(o.date);
      if (!customerLastOrder[cname] || orderDate > new Date(customerLastOrder[cname]))
        customerLastOrder[cname] = o.date;
    });

    const topCustomers = customers
      .map((c) => ({
        _id: c._id,
        username: c.username,
        email: c.email,
        totalSpent: customerSpending[c.username] || 0,
        totalOrders: customerOrderCount[c.username] || 0,
        totalItems: customerItems[c.username] || 0,
        avgOrderValue: customerOrderCount[c.username] > 0
          ? Math.round((customerSpending[c.username] || 0) / customerOrderCount[c.username])
          : 0,
        lastOrderDate: customerLastOrder[c.username] || null,
      }))
      .filter((c) => c.totalOrders > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent);

    const totalCustomerSpend = topCustomers.reduce((s, c) => s + c.totalSpent, 0);
    const maxSpender = topCustomers[0] || null;

    res.json({
      customers: topCustomers.slice(0, 20),
      summary: {
        totalActiveCustomers: topCustomers.length,
        totalCustomerSpend,
        avgSpendPerCustomer: topCustomers.length > 0 ? Math.round(totalCustomerSpend / topCustomers.length) : 0,
        topSpender: maxSpender ? { username: maxSpender.username, totalSpent: maxSpender.totalSpent } : null,
      },
    });
  } catch (error) {
    console.error("Error in getTopCustomers:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ── Admin Overview Dashboard (Analytics-focused) ──
exports.getAdminOverview = async (req, res) => {
  try {
    const { Order } = require("../Model/Order_model");
    const { Reservation } = require("../Model/Reservation_model");

    const [totalUsers, totalEmployees, totalRestaurants, totalOrders, totalReservations] =
      await Promise.all([
        User.countDocuments({ role: { $nin: ["admin", "employee"] } }),
        User.countDocuments({ role: "employee" }),
        Restaurant.countDocuments(),
        Order.countDocuments(),
        Reservation.countDocuments(),
      ]);

    const allOrders = await Order.find({});
    const totalRevenue = allOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const platformFee = totalRevenue * 0.1;

    res.json({
      current_admin: req.user,
      totalUsers,
      totalEmployees,
      totalRestaurants,
      totalOrders,
      totalReservations,
      totalRevenue,
      platformFee,
    });
  } catch (error) {
    console.error("Error in getAdminOverview:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ── Revenue Over Time (for admin charts) ──
exports.getRevenueOverTime = async (req, res) => {
  try {
    const { Order } = require("../Model/Order_model");
    const { period = "monthly" } = req.query;
    const allOrders = await Order.find({});
    const now = new Date();
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    let data = [];

    if (period === "daily") {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
        const dayOrders = allOrders.filter((o) => {
          const od = new Date(o.date);
          return od >= dayStart && od < dayEnd;
        });
        data.push({
          label: `${d.getMonth() + 1}/${d.getDate()}`,
          revenue: dayOrders.reduce((s, o) => s + (o.totalAmount || 0), 0),
          orders: dayOrders.length,
          platformFee: dayOrders.reduce((s, o) => s + (o.totalAmount || 0), 0) * 0.1,
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
          platformFee: yearOrders.reduce((s, o) => s + (o.totalAmount || 0), 0) * 0.1,
        });
      }
    } else {
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
          platformFee: monthOrders.reduce((s, o) => s + (o.totalAmount || 0), 0) * 0.1,
        });
      }
    }

    res.json(data);
  } catch (error) {
    console.error("Error in getRevenueOverTime:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
