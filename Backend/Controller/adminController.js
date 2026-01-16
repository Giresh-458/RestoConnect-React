// Controller/adminController.js
const path = require("path");
const bcrypt = require("bcrypt");
const { User } = require("../Model/userRoleModel");
const { Restaurant } = require("../Model/Restaurents_model"); // ✅ Correct spelling
const RestaurantRequest = require("../Model/restaurent_request_model"); // ✅ Correct spelling
const { Dish } = require("../Model/Dishes_model_test");

// Admin Dashboard
exports.getAdminDashboard = async (req, res) => {
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

    // NOTE: req.user is often set by an authentication system.
    // If not using it, ensure you rely on req.session.username for identity.
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

    // Count only non-admin users
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

exports.getStatisticsGraphs = async (req, res) => {
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);

  const result = await Restaurant.aggregate([
    { $unwind: "$payments" },
    { $match: { "payments.date": { $gte: startOfYear } } },
    {
      $group: {
        _id: { month: { $month: "$payments.date" } },
        totalPayments: { $sum: "$payments.amount" },
        countPayments: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        month: "$_id.month",
        totalPayments: 1,
        countPayments: 1,
        restaurantFee: { $multiply: ["$totalPayments", 0.1] },
      },
    },
    { $sort: { month: 1 } },
  ]);

  res.json(result);
};

exports.getAllUsers = async (req, res) => {
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
exports.getStatistics = async (req, res) => {
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
exports.deleteUser = async (req, res) => {
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
exports.suspendUser = async (req, res) => {
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
exports.unsuspendUser = async (req, res) => {
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
exports.editProfile = async (req, res) => {
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
exports.changePassword = async (req, res) => {
  const currentAdminUsername = req.session.username; // Use session for identity
  if (!currentAdminUsername)
    return res.status(401).json({ error: "Unauthorized" });

  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: "Missing password fields" });

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
exports.deleteAccount = async (req, res) => {
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
exports.postAddRestaurent = async (req, res) => {
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
exports.postEditRestaurent = async (req, res) => {
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
exports.suspendRestaurant = async (req, res) => {
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
exports.unsuspendRestaurant = async (req, res) => {
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
exports.postDeleteRestaurent = async (req, res) => {
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
exports.getAllRestaurants = async (req, res) => {
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
exports.getaceptreq = async (req, res) => {
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

exports.getrejectreq = async (req, res) => {
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

exports.getAllRequests = async (req, res) => {
  try {
    const requests = await RestaurantRequest.find();
    res.json(requests);
  } catch (err) {
    console.error("Error fetching requests:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getPublicRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.findAll();
    res.json(restaurants);
  } catch (error) {
    console.error("Error fetching public restaurants:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getRecentActivities = async (req, res) => {
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
