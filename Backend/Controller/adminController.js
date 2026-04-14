// Controller/adminController.js
const path = require("path");
const bcrypt = require("bcrypt");
const { User } = require("../Model/userRoleModel");
const { Restaurant } = require("../Model/Restaurents_model");
const RestaurantRequest = require("../Model/restaurent_request_model");
const { Dish } = require("../Model/Dishes_model_test");
const { Order } = require("../Model/Order_model");
const { Reservation } = require("../Model/Reservation_model");
const Feedback = require("../Model/feedback");

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

    const currentAdminUsername =
      (req.auth && req.auth.username) ||
      (req.user && req.user.username) ||
      null;
    let currentAdminProfile = null;
    if (currentAdminUsername) {
      currentAdminProfile = await User.findOne({
        username: currentAdminUsername,
      }).select("-password");
    }

    let users = [];
    const userFilter = { role: { $ne: "admin" } };
    if (currentAdminUsername) {
      users = await User.find({
        ...userFilter,
        username: { $ne: currentAdminUsername },
      }).select("-password");
    } else {
      users = await User.find(userFilter).select("-password");
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
    const period = req.query.period || "monthly"; // daily, monthly, yearly
    const now = new Date();
    let startDate, groupBy, sortBy;

    // Set date range and grouping based on period
    if (period === "daily") {
      // Last 30 days
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      groupBy = {
        year: { $year: "$payments.date" },
        month: { $month: "$payments.date" },
        day: { $dayOfMonth: "$payments.date" },
      };
      sortBy = { year: 1, month: 1, day: 1 };
    } else if (period === "yearly") {
      // Last 5 years
      startDate = new Date(now.getFullYear() - 4, 0, 1);
      groupBy = {
        year: { $year: "$payments.date" },
      };
      sortBy = { year: 1 };
    } else {
      // Monthly (default) - current year
      startDate = new Date(now.getFullYear(), 0, 1);
      groupBy = {
        month: { $month: "$payments.date" },
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
          ...(period === "daily"
            ? {
                year: "$_id.year",
                month: "$_id.month",
                day: "$_id.day",
              }
            : period === "yearly"
              ? {
                  year: "$_id.year",
                }
              : {
                  month: "$_id.month",
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
      }).select("-password");
    } else {
      users = await User.find(filter).select("-password");
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
    const [totalUsers, totalRestaurants, revenueResult] = await Promise.all([
      User.countDocuments(),
      Restaurant.countDocuments(),
      Restaurant.aggregate([
        { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
      ]),
    ]);
    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
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
      now.getDate(),
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
      },
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

//  FIX: Edit admin profile
exports.editProfile = async (req, res, next) => {
  try {
    const currentAdminUsername =
      (req.auth && req.auth.username) ||
      (req.user && req.user.username) ||
      null;
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
      if (newpassword.trim().length < 6) {
        return res.status(400).json({
          message: "password must be at least 6 letters",
        });
      }
      updateData.password = await bcrypt.hash(newpassword.trim(), 10);
    }

    await User.updateOne(
      { username: currentAdminUsername },
      { $set: updateData },
    );
    // Username is carried via JWT; no need to mutate session username.

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
  const currentAdminUsername =
    (req.auth && req.auth.username) || (req.user && req.user.username) || null;
  if (!currentAdminUsername)
    return res.status(401).json({ error: "Unauthorized" });

  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: "Missing password fields" });

    if (newPassword.trim().length < 6) {
      return res.status(400).json({
        message: "password must be at least 6 letters",
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
      { $set: { password: hashedPassword } },
    );

    res.status(200).json({ message: "Password changed successfully!" });
  } catch (error) {
    console.error("Error in changePassword:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 🌟 FIX: Delete Admin Account
exports.deleteAccount = async (req, res, next) => {
  const currentAdminUsername =
    (req.auth && req.auth.username) || (req.user && req.user.username) || null;
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
      { $set: { name, location, amount } },
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
      now.getDate(),
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
      },
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
  console.log("in the the admin controller delete restarant");
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
    // Batch-fetch all owners in one query instead of N+1 individual lookups
    const restIds = restaurants.map((r) => r._id);
    const owners = await User.find({
      rest_id: { $in: restIds },
      role: "owner",
    }).select("username email rest_id");
    const ownerMap = new Map(
      owners.map((o) => [
        String(o.rest_id),
        { name: o.username, email: o.email },
      ]),
    );

    const restaurantsWithOwners = restaurants.map((restaurant) => ({
      ...restaurant.toObject(),
      owner: ownerMap.get(String(restaurant._id)) || null,
    }));

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
    console.log(ownername);
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

    try {
      const newOwner = new User({
        username: request.owner_username,
        password: request.owner_password,
        role: "owner",
        restaurantName: request.name,
        rest_id: newRestaurant._id,
        email: request.email,
      });
      await newOwner.save();
    } catch (err) {
      console.log(err + "===================================================");
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
    // stats – use aggregation instead of loading all orders into memory
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const [statsResult] = await Order.aggregate([
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                revenue: { $sum: "$totalAmount" },
              },
            },
          ],
          todayStats: [
            { $match: { date: { $gte: todayStart } } },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                revenue: { $sum: "$totalAmount" },
              },
            },
          ],
          statusBreakdown: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
        },
      },
    ]);
    const totals = statsResult.totals[0] || { count: 0, revenue: 0 };
    const todayStats = statsResult.todayStats[0] || { count: 0, revenue: 0 };
    const statusBreakdown = {};
    (statsResult.statusBreakdown || []).forEach((s) => {
      statusBreakdown[s._id] = s.count;
    });
    const avgOrderValue =
      totals.count > 0 ? (totals.revenue / totals.count).toFixed(2) : 0;
    res.json({
      orders,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      stats: {
        totalOrders: totals.count,
        todayOrders: todayStats.count,
        totalRevenue: totals.revenue,
        todayRevenue: todayStats.revenue,
        avgOrderValue: parseFloat(avgOrderValue),
        statusBreakdown,
      },
    });
  } catch (error) {
    console.error("Error in getAllOrders:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ── Admin: Get all reservations across all restaurants ──
exports.getAllReservations = async (req, res, next) => {
  try {
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
      Reservation.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Reservation.countDocuments(filter),
    ]);
    // stats – use aggregation instead of loading all reservations into memory
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const [resStats] = await Reservation.aggregate([
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                guests: { $sum: "$guests" },
              },
            },
          ],
          todayCount: [
            { $match: { date: { $gte: todayStart } } },
            { $count: "count" },
          ],
          statusBreakdown: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
        },
      },
    ]);
    const resTotals = resStats.totals[0] || { count: 0, guests: 0 };
    const todayResCount = resStats.todayCount[0]?.count || 0;
    const statusBreakdown = {};
    (resStats.statusBreakdown || []).forEach((s) => {
      statusBreakdown[s._id] = s.count;
    });
    res.json({
      reservations,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      stats: {
        totalReservations: resTotals.count,
        todayReservations: todayResCount,
        totalGuests: resTotals.guests,
        statusBreakdown,
      },
    });
  } catch (error) {
    console.error("Error in getAllReservations:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ── Admin: Get all feedback across all restaurants ──
exports.getAllFeedback = async (req, res, next) => {
  try {
    const { status, restaurant, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (restaurant) filter.rest_id = restaurant;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [feedback, total] = await Promise.all([
      Feedback.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Feedback.countDocuments(filter),
    ]);
    // Use aggregation instead of loading all feedback into memory
    const [fbStats] = await Feedback.aggregate([
      {
        $facet: {
          totals: [{ $count: "count" }],
          avgDining: [
            { $match: { diningRating: { $exists: true, $ne: null } } },
            { $group: { _id: null, avg: { $avg: "$diningRating" } } },
          ],
          avgOrder: [
            { $match: { orderRating: { $exists: true, $ne: null } } },
            { $group: { _id: null, avg: { $avg: "$orderRating" } } },
          ],
          statusBreakdown: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
        },
      },
    ]);
    const fbTotal = fbStats.totals[0]?.count || 0;
    const avgDining = fbStats.avgDining[0]?.avg?.toFixed(1) || 0;
    const avgOrder = fbStats.avgOrder[0]?.avg?.toFixed(1) || 0;
    const fbStatusMap = {};
    (fbStats.statusBreakdown || []).forEach((s) => {
      fbStatusMap[s._id] = s.count;
    });
    res.json({
      feedback,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      stats: {
        totalFeedback: fbTotal,
        avgDiningRating: parseFloat(avgDining),
        avgOrderRating: parseFloat(avgOrder),
        pending: fbStatusMap["Pending"] || 0,
        resolved: fbStatusMap["Resolved"] || 0,
      },
    });
  } catch (error) {
    console.error("Error in getAllFeedback:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ── Admin: Analytics endpoint (DB-aggregated) ──
exports.getAnalytics = async (req, res, next) => {
  try {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const monthNames = [
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

    // Run all aggregations in parallel
    const [restaurants, totalUsers, orderAgg, totalReservations, feedbackAgg] =
      await Promise.all([
        Restaurant.find({ isSuspended: { $ne: true } })
          .select("name _id rating isSuspended")
          .lean(),
        User.countDocuments({ role: { $ne: "admin" } }),
        Order.aggregate([
          {
            $facet: {
              overview: [
                {
                  $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: "$totalAmount" },
                  },
                },
              ],
              byRestaurant: [
                {
                  $group: {
                    _id: "$rest_id",
                    orders: { $sum: 1 },
                    revenue: { $sum: "$totalAmount" },
                  },
                },
                { $sort: { revenue: -1 } },
                { $limit: 15 },
              ],
              peakHours: [
                {
                  $group: {
                    _id: { $hour: { $ifNull: ["$orderTime", "$date"] } },
                    count: { $sum: 1 },
                  },
                },
                { $sort: { _id: 1 } },
              ],
              monthlyRevenue: [
                { $match: { date: { $gte: twelveMonthsAgo } } },
                {
                  $group: {
                    _id: { y: { $year: "$date" }, m: { $month: "$date" } },
                    revenue: { $sum: "$totalAmount" },
                    orders: { $sum: 1 },
                  },
                },
                { $sort: { "_id.y": 1, "_id.m": 1 } },
              ],
            },
          },
        ]),
        Reservation.countDocuments(),
        Feedback.aggregate([
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              avgRating: {
                $avg: { $ifNull: ["$diningRating", "$orderRating"] },
              },
            },
          },
        ]),
      ]);

    const oa = orderAgg[0];
    const overview = oa.overview[0] || { totalOrders: 0, totalRevenue: 0 };
    const fb = feedbackAgg[0] || { count: 0, avgRating: 0 };

    // Build restaurant revenue map from aggregation
    const revMap = new Map(oa.byRestaurant.map((r) => [String(r._id), r]));
    const topRestaurants = restaurants
      .map((r) => ({
        _id: r._id.toString(),
        name: r.name,
        orders: revMap.get(String(r._id))?.orders || 0,
        revenue: revMap.get(String(r._id))?.revenue || 0,
        rating: r.rating || 0,
        isSuspended: r.isSuspended,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Peak hours — fill all 24 hours
    const hourMap = new Map(oa.peakHours.map((h) => [h._id, h.count]));
    const peakHours = Array.from({ length: 24 }, (_, h) => ({
      hour: `${h}:00`,
      count: hourMap.get(h) || 0,
    }));

    // Monthly revenue — fill all 12 months
    const mMap = new Map(
      oa.monthlyRevenue.map((m) => [`${m._id.y}-${m._id.m}`, m]),
    );
    const monthlyRevenue = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const entry = mMap.get(key) || { revenue: 0, orders: 0 };
      monthlyRevenue.push({
        month: monthNames[d.getMonth()] + " " + d.getFullYear(),
        revenue: entry.revenue,
        orders: entry.orders,
      });
    }

    res.json({
      overview: {
        totalRestaurants: restaurants.length,
        totalUsers,
        totalOrders: overview.totalOrders,
        totalReservations,
        totalRevenue: overview.totalRevenue,
        avgRating: parseFloat((fb.avgRating || 0).toFixed(1)),
        totalFeedback: fb.count,
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
    const [employees, restaurants, orderStats] = await Promise.all([
      User.find({ role: "employee" })
        .select("username email _id isSuspended createdAt")
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
      const managedRestaurants = restaurants.filter(
        (_, i) => i % employeeCount === idx,
      );
      const managedRestIds = managedRestaurants.map((r) => r._id.toString());
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
      return {
        _id: emp._id,
        username: emp.username,
        email: emp.email,
        isSuspended: emp.isSuspended,
        totalApprovals,
        totalOrdersHandled: totals.totalOrdersHandled,
        revenueGenerated: totals.revenueGenerated,
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

    performance.sort((a, b) => b.totalApprovals - a.totalApprovals);
    res.json({ employees: performance });
  } catch (error) {
    console.error("Error in getEmployeePerformance:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ── Add Employee ──
exports.addEmployee = async (req, res) => {
  try {
    let { username, email, password } = req.body;

    // Trim and sanitize
    username = username ? username.trim() : "";
    email = email ? email.trim().toLowerCase() : "";
    password = password ? password.trim() : "";

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Username, email, and password are required",
      });
    }

    // Validate username: 3-20 chars, letters/numbers/underscores
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return res.status(400).json({
        success: false,
        error:
          "Username must be 3-20 characters (letters, numbers, underscores only)",
      });
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid email address",
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters long",
      });
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, error: "Username or email already exists" });
    }

    // Create employee user
    const newEmployee = new User({
      username,
      email,
      role: "employee",
      password,
      restaurantName: null,
      rest_id: null,
    });
    await newEmployee.save();

    res.status(201).json({
      success: true,
      message: `Employee '${username}' created successfully`,
      employee: {
        _id: newEmployee._id,
        username: newEmployee.username,
        email: newEmployee.email,
        role: "employee",
      },
    });
  } catch (error) {
    console.error("Error in addEmployee:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

// ── Restaurant Revenue / Platform Fee Analytics (DB-aggregated) ──
exports.getRestaurantRevenue = async (req, res) => {
  try {
    const { period = "all" } = req.query;
    const now = new Date();

    // Build date filter
    const dateMatch = {};
    if (period === "today") {
      const s = new Date(now);
      s.setHours(0, 0, 0, 0);
      dateMatch.date = { $gte: s };
    } else if (period === "week") {
      const s = new Date(now);
      s.setDate(s.getDate() - 7);
      dateMatch.date = { $gte: s };
    } else if (period === "month") {
      dateMatch.date = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
    } else if (period === "year") {
      dateMatch.date = { $gte: new Date(now.getFullYear(), 0, 1) };
    }

    const [restaurants, revenueAgg] = await Promise.all([
      Restaurant.find({})
        .select("name _id location city image rating isOpen")
        .lean(),
      Order.aggregate([
        ...(Object.keys(dateMatch).length > 0 ? [{ $match: dateMatch }] : []),
        {
          $group: {
            _id: "$rest_id",
            revenue: { $sum: "$totalAmount" },
            orders: { $sum: 1 },
          },
        },
      ]),
    ]);
    const revMap = new Map(revenueAgg.map((r) => [String(r._id), r]));

    const restaurantData = restaurants
      .map((r) => {
        const d = revMap.get(String(r._id)) || { revenue: 0, orders: 0 };
        return {
          _id: r._id,
          name: r.name,
          location: r.location,
          city: r.city,
          image: r.image,
          rating: r.rating || 0,
          revenue: d.revenue,
          orders: d.orders,
          platformFee: d.revenue * 0.1,
          avgOrderValue: d.orders > 0 ? Math.round(d.revenue / d.orders) : 0,
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

// ── Dish & Category Trends ──
exports.getDishTrends = async (req, res) => {
  try {
    const now = new Date();
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
        category: dish.category || "Main Course",
        price: dish.price,
        image: dish.image,
        currentMonthOrders: current,
        prevMonthOrders: previous,
        changePercent: Math.round(change),
        trend: change > 0 ? "up" : change < 0 ? "down" : "stable",
        restaurants: restMap.get(String(dish._id)) || [],
      };
    });

    dishTrends.sort((a, b) => b.currentMonthOrders - a.currentMonthOrders);

    // Category aggregation
    const categories = {};
    dishTrends.forEach((d) => {
      const cat = d.category;
      if (!categories[cat])
        categories[cat] = { current: 0, previous: 0, dishes: 0 };
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

    // Monthly trend (last 6 months)
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
    const monthlyData = [];
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
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const dishStat = dishMonthMap.get(key) || {
        totalDishesOrdered: 0,
        uniqueDishes: 0,
      };
      monthlyData.push({
        month: months[d.getMonth()],
        totalDishesOrdered: dishStat.totalDishesOrdered,
        uniqueDishes: dishStat.uniqueDishes,
        revenue: revMonthMap.get(key) || 0,
      });
    }

    res.json({
      dishes: dishTrends.slice(0, 30),
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

// ── Top Customers Analytics (DB-aggregated) ──
exports.getTopCustomers = async (req, res) => {
  try {
    const { period = "all" } = req.query;
    const now = new Date();

    // Build date filter
    const dateMatch = {};
    if (period === "month") {
      dateMatch.date = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
    } else if (period === "quarter") {
      const s = new Date(now);
      s.setMonth(s.getMonth() - 3);
      dateMatch.date = { $gte: s };
    } else if (period === "year") {
      dateMatch.date = { $gte: new Date(now.getFullYear(), 0, 1) };
    }

    const [customerAgg, customers] = await Promise.all([
      Order.aggregate([
        ...(Object.keys(dateMatch).length > 0 ? [{ $match: dateMatch }] : []),
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
        { $limit: 50 },
      ]),
      User.find({ role: "customer" }).select("username email _id").lean(),
    ]);
    const spendMap = new Map(customerAgg.map((c) => [c._id, c]));

    const topCustomers = customers
      .map((c) => {
        const d = spendMap.get(c.username);
        if (!d) return null;
        return {
          _id: c._id,
          username: c.username,
          email: c.email,
          totalSpent: d.totalSpent,
          totalOrders: d.totalOrders,
          totalItems: d.totalItems,
          avgOrderValue:
            d.totalOrders > 0 ? Math.round(d.totalSpent / d.totalOrders) : 0,
          lastOrderDate: d.lastOrderDate,
        };
      })
      .filter((c) => c !== null)
      .sort((a, b) => b.totalSpent - a.totalSpent);

    const totalCustomerSpend = topCustomers.reduce(
      (s, c) => s + c.totalSpent,
      0,
    );
    const maxSpender = topCustomers[0] || null;

    res.json({
      customers: topCustomers.slice(0, 20),
      summary: {
        totalActiveCustomers: topCustomers.length,
        totalCustomerSpend,
        avgSpendPerCustomer:
          topCustomers.length > 0
            ? Math.round(totalCustomerSpend / topCustomers.length)
            : 0,
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

// ── Admin Overview Dashboard (DB-aggregated) ──
exports.getAdminOverview = async (req, res) => {
  try {
    const [
      totalUsers,
      totalEmployees,
      totalRestaurants,
      orderStats,
      totalReservations,
    ] = await Promise.all([
      User.countDocuments({ role: { $nin: ["admin", "employee"] } }),
      User.countDocuments({ role: "employee" }),
      Restaurant.countDocuments(),
      Order.aggregate([
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
          },
        },
      ]),
      Reservation.countDocuments(),
    ]);

    const stats = orderStats[0] || { count: 0, revenue: 0 };
    const { password: _pw, ...safeAdmin } = req.user.toObject
      ? req.user.toObject()
      : req.user;
    res.json({
      current_admin: safeAdmin,
      totalUsers,
      totalEmployees,
      totalRestaurants,
      totalOrders: stats.count,
      totalReservations,
      totalRevenue: stats.revenue,
      platformFee: stats.revenue * 0.1,
    });
  } catch (error) {
    console.error("Error in getAdminOverview:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ── Revenue Over Time (DB-aggregated) ──
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
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      const agg = await Order.aggregate([
        { $match: { date: { $gte: start } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            revenue: { $sum: "$totalAmount" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      const m = new Map(agg.map((d) => [d._id, d]));
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const k = d.toISOString().slice(0, 10);
        const e = m.get(k) || { revenue: 0, orders: 0 };
        data.push({
          label: `${d.getMonth() + 1}/${d.getDate()}`,
          revenue: e.revenue,
          orders: e.orders,
          platformFee: e.revenue * 0.1,
        });
      }
    } else if (period === "yearly") {
      const start = new Date(now.getFullYear() - 4, 0, 1);
      const agg = await Order.aggregate([
        { $match: { date: { $gte: start } } },
        {
          $group: {
            _id: { $year: "$date" },
            revenue: { $sum: "$totalAmount" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      const m = new Map(agg.map((y) => [y._id, y]));
      for (let i = 4; i >= 0; i--) {
        const yr = now.getFullYear() - i;
        const e = m.get(yr) || { revenue: 0, orders: 0 };
        data.push({
          label: String(yr),
          revenue: e.revenue,
          orders: e.orders,
          platformFee: e.revenue * 0.1,
        });
      }
    } else {
      const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      const agg = await Order.aggregate([
        { $match: { date: { $gte: start } } },
        {
          $group: {
            _id: { y: { $year: "$date" }, m: { $month: "$date" } },
            revenue: { $sum: "$totalAmount" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { "_id.y": 1, "_id.m": 1 } },
      ]);
      const m = new Map(agg.map((x) => [`${x._id.y}-${x._id.m}`, x]));
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const k = `${d.getFullYear()}-${d.getMonth() + 1}`;
        const e = m.get(k) || { revenue: 0, orders: 0 };
        data.push({
          label: `${months[d.getMonth()]} ${d.getFullYear()}`,
          revenue: e.revenue,
          orders: e.orders,
          platformFee: e.revenue * 0.1,
        });
      }
    }

    res.json(data);
  } catch (error) {
    console.error("Error in getRevenueOverTime:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
