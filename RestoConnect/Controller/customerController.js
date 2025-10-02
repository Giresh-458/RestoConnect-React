const path = require("path");
const Person = require("../Model/customer_model");
const { Dish } = require("../Model/Dishes_model_test");
const Restaurant = require("../Model/Restaurents_model").Restaurant;

//feedbackdata
let feedbacks = [];

//orderandreservation_data
let orders = [];
let reservations = [];

exports.validateReservationDateTime = (date, time) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDate = new Date(date);
  selectedDate.setHours(0, 0, 0, 0);

  const twoDaysLater = new Date();
  twoDaysLater.setDate(today.getDate() + 2);
  twoDaysLater.setHours(0, 0, 0, 0);

  // Check if date is within valid range
  if (selectedDate < today || selectedDate > twoDaysLater) {
    return false;
  }

  // Check if time is valid for today's date
  if (selectedDate.getTime() === today.getTime()) {
    const selectedDateTime = new Date(`${date}T${time}`);
    return selectedDateTime > new Date();
  }

  return true;
};
//dashboards
exports.getCustomerDashboard = async (req, res) => {
  try {
    let data = await Person.get_user_function(req.session.username);
    if (!data) {
      return res.status(404).send("User not found");
    }

    // Get location filter from query parameters
    const locationFilter = req.query.location;

    // Query restaurants based on location filter if provided
    let restaurantQuery = {};
    if (locationFilter) {
      restaurantQuery.location = {
        $regex: new RegExp(locationFilter.trim(), "i"),
      };
    }
    let restaurants = await Restaurant.find(restaurantQuery);

    // Use prev_orders from Person model for past orders
    const prev_order = data.prev_order || [];

    // Aggregate item counts and restaurant counts from prev_orders
    let itemCountMap = {};
    let restaurantCountMap = {};

    prev_order.forEach((order) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((dish) => {
          itemCountMap[dish] = (itemCountMap[dish] || 0) + 1;
        });
      }
      if (order.name) {
        restaurantCountMap[order.name] =
          (restaurantCountMap[order.name] || 0) + 1;
      }
    });

    // Prepare arrays for labels and counts
    const item_list = Object.keys(itemCountMap);
    const item_counts = Object.values(itemCountMap);

    const restaurent_list = Object.keys(restaurantCountMap);
    const restaurent_counts = Object.values(restaurantCountMap);

    // Pass all data including filtered restaurants to view
    res.render(path.join(__dirname, "..", "views", "customerDashboard"), {
      ...data,
      item_list,
      item_counts,
      restaurent_list,
      restaurent_counts,
      prev_order,
      restaurants,
      locationFilter,
    });
  } catch (error) {
    console.error("Error fetching customer dashboard data:", error);
    res.status(500).send("Internal Server Error");
  }
};

//feed backs
const { Order } = require("../Model/Order_model");

exports.getFeedBack = async (req, res) => {
  try {
    const username = req.session.username;
    const user = await Person.findOne({ name: username });
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Fetch recent orders for the user (limit 1 for latest)
    const recentOrders = await Order.find({ customerName: username })
      .sort({ _id: -1 })
      .limit(1);

    res.render("feedback", { user, recentOrders });
  } catch (error) {
    console.error("Error fetching feedback data:", error);
    res.status(500).send("Internal Server Error");
  }
};
exports.postSubmitFeedBack = (req, res) => {
  const feedbackText = req.body.feedback;
  if (feedbackText && feedbackText.trim() !== "") {
    feedbacks.push({
      username: req.session.username,
      feedback: feedbackText,
      date: new Date(),
    });
    console.log("Feedback received:", feedbackText);
  }
  res.redirect("/");
};

//order_and_reservation
exports.postOrderAndReservation = async (req, res) => {
  try {
    let restaurantName;
    let cart;
    let rest_id;
    if (req.body.restaurant) {
      restaurantName = req.body.restaurant;
      rest_id = req.body.rest_id;
      cart = JSON.parse(req.body.order);
      req.session.temp_cart = cart;
      req.session.rest_name = restaurantName;
      req.session.rest_id = rest_id;
    } else {
      // Fetch restaurant name from rest_id
      rest_id = req.session.rest_id;
      if (rest_id) {
        const Restaurant = require("../Model/Restaurents_model").Restaurant;
        const rest = await Restaurant.find_by_id(rest_id);
        restaurantName = rest ? rest.name : "";
        req.session.rest_name = restaurantName; // Ensure rest_name is set here
      } else {
        restaurantName = "";
      }
      // Fallback if rest_id is undefined, set to null to handle gracefully
      if (!rest_id) {
        // Redirect to dashboard if rest_id missing to avoid invalid back link
        return res.redirect("/customer/customerDashboard");
      }
      // Fetch cart from database for logged-in user
      const user = req.user;
      if (user) {
        const person = await require("../Model/customer_model").findOne({
          email: user.email,
        });
        cart = person ? person.cart : [];
      } else {
        cart = req.session.temp_cart || [];
      }
    }
    // Ensure cart is always an array
    if (!cart) {
      cart = [];
    }
    res.render("orderReservation", { restaurantName, cart, rest_id });
    console.log(rest_id);
  } catch (error) {
    console.error("Error in postOrderAndReservation:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.order = async (req, res) => {
  const { restaurant, specialRequests } = req.body;
  const newOrder = {
    id: Date.now(),
    restaurant,
    specialRequests,
    status: "Pending",
  };
  let order_temp = newOrder;
  req.session.tempOrder = order_temp;
  let dishes_temp = req.session.temp_cart;
  let sum = 0;
  for (let a of dishes_temp) {
    let temp = await Dish.findByName(a.dish);
    sum = sum + parseInt(temp.price) * a.quantity;
  }
  req.session.bill = sum;
  // Do NOT clear cart here as per user request
  // Cart will be cleared only on combined order and reservation
  res.redirect("/customer/payments");
};

exports.reservation = async (req, res) => {
  const { restaurant, date, time, guests } = req.body;
  const newReservation = {
    id: Date.now(),
    name: req.session.username,
    restaurant,
    date,
    time,
    guests,
  };
  req.session.reservation = newReservation;
  res.redirect("/customer/payments");
};

exports.postOrderAndReservationCombined = async (req, res) => {
  try {
    const { restaurant, specialRequests, date, time, guests } = req.body;

    // Create order object
    const newOrder = {
      id: Date.now(),
      restaurant,
      specialRequests,
      status: "Pending",
    };
    req.session.tempOrder = newOrder;

    // Calculate bill from session cart
    let dishes_temp = req.session.temp_cart;
    let sum = 0;
    for (let a of dishes_temp) {
      let temp = await Dish.findByName(a.dish);
      sum += parseInt(temp.price) * a.quantity;
    }
    req.session.bill = sum;

    // Create reservation object
    const newReservation = {
      id: Date.now(),
      name: req.session.username,
      restaurant,
      date,
      time,
      guests,
    };
    req.session.reservation = newReservation;

    // Clear user's cart in database
    const user = await Person.findOne({ name: req.session.username });
    if (user) {
      user.cart = [];
      await user.save();
    }

    res.redirect("/customer/payments");
  } catch (error) {
    console.error("Error in postOrderAndReservationCombined:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.getPayments = (req, res) => {
  res.render("payment", { bill_price: req.session.bill });
};

exports.postPaymentsSuccess = async (req, res) => {
  try {
    let username = req.session.username;
    let user = await Person.findOne({ name: username });
    let rest_name = req.session.rest_name;
    let rest_id = req.session.rest_id;
    let dishes = [];

    if (req.session.reservation != undefined) {
      let tmp_rest = await Restaurant.find_by_id(rest_id);
      let reserv = req.session.reservation;
      // Save reservation as subdocument
      tmp_rest.reservations.push(reserv);
      await tmp_rest.save();
    }

    if (req.session.temp_cart && req.session.temp_cart.length > 0) {
      let len = req.session.temp_cart.length;
      for (let i = 0; i < len; i++) {
        dishes.push(req.session.temp_cart[i].dish);
      }
      // Create new Order document
      const Order = require("../Model/Order_model").Order;
      const newOrder = new Order({
        dishes: dishes,
        customerName: username,
        restaurant: rest_name, // Add restaurant name here
        rest_id: rest_id, // Add restaurant id here
        status: "Pending",
        totalAmount: req.session.bill,
      });
      await newOrder.save();

      // Push order reference to Restaurant.orders and add payment record
      let tmp_rest = await Restaurant.find_by_id(rest_id);
      if (tmp_rest) {
        tmp_rest.orders.push(newOrder._id);
        tmp_rest.payments.push({
          amount: req.session.bill,
          date: new Date(),
        });
        await tmp_rest.save();
      }

      if (user) {
        await user.add_order({ name: rest_name, items: dishes });
      } else {
        console.warn(`User with name ${username} not found in customer_model.`);
      }
    }

    req.session.tempOrder = undefined;
    req.session.temp_cart = undefined;
    req.session.rest_name = undefined;
    req.session.reservation = undefined;
    req.session.rest_id = undefined;
    req.session.bill = undefined;

    res.redirect("/customer/feedback");
  } catch (error) {
    console.error("Error in postPaymentsSuccess:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.getEditProfile = async (req, res) => {
  try {
    const username = req.session.username;
    const user = await Person.findOne({ name: username });
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.render("editCustomerProfile", { user });
  } catch (error) {
    console.error("Error fetching user for edit profile:", error);
    res.status(500).send("Internal Server Error");
  }
};

const bcrypt = require("bcrypt");
const { User } = require("../Model/userRoleModel");

exports.postEditProfile = async (req, res) => {
  try {
    const currentUsername = req.session.username;
    const { name, email, phone, img_url, newPassword, confirmPassword } =
      req.body;

    const userRole = await User.findOne({ username: currentUsername });
    if (!userRole) {
      return res.status(404).send("User role not found");
    }

    // Validate password change if provided
    if (newPassword || confirmPassword) {
      if (!newPassword || !confirmPassword) {
        return res
          .status(400)
          .send("Both new password and confirm password are required");
      }
      if (newPassword !== confirmPassword) {
        return res
          .status(400)
          .send("New password and confirm password do not match");
      }
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      userRole.password = hashedPassword;
    }

    // Update User model fields
    userRole.username = name || userRole.username;
    userRole.email = email || userRole.email;

    // Save User model first to ensure username update
    await userRole.save();

    // Update session username if changed
    if (name && name !== currentUsername) {
      req.session.username = name;
    }

    // Find Person model by updated username or old username
    const personUsername =
      name && name !== currentUsername ? name : currentUsername;
    const user = await Person.findOne({ name: personUsername });
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Update Person model fields
    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.img_url = img_url || user.img_url;

    // Save Person model
    await user.save();

    res.redirect("/customer/customerDashboard");
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).send("Internal Server Error");
  }
};
