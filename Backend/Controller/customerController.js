const path = require("path");
const Person = require("../Model/customer_model");
const { Dish } = require("../Model/Dishes_model_test");
const Restaurant = require("../Model/Restaurents_model").Restaurant;
const Feedback = require("../Model/feedback");
const { Order } = require("../Model/Order_model");
const bcrypt = require("bcrypt");
const { User } = require("../Model/userRoleModel");




// Validate reservation date/time
exports.validateReservationDateTime = (date, time) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDate = new Date(date);
  selectedDate.setHours(0, 0, 0, 0);

  const twoDaysLater = new Date();
  twoDaysLater.setDate(today.getDate() + 2);
  twoDaysLater.setHours(0, 0, 0, 0);

  if (selectedDate < today || selectedDate > twoDaysLater) return false;

  if (selectedDate.getTime() === today.getTime()) {
    const selectedDateTime = new Date(`${date}T${time}`);
    return selectedDateTime > new Date();
  }

  return true;
};


/*exports.getCustomerDashboard = async (req, res) => {
  try {
    // Fetch user data
    const data = await Person.get_user_function(req.session.username);
    if (!data) return res.status(404).send("User not found");

    // Filter restaurants by location if query exists
    const locationFilter = req.query.location;
    const restaurantQuery = locationFilter
      ? { location: { $regex: new RegExp(locationFilter.trim(), "i") } }
      : {};

    const restaurants = await Restaurant.find(restaurantQuery);

    // Get previous orders
    const prev_order = data.prev_order || [];

    // Aggregate item and restaurant counts
    const itemCountMap = {};
    const restaurantCountMap = {};
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

    const item_list = Object.keys(itemCountMap);
    const item_counts = Object.values(itemCountMap);
    const restaurent_list = Object.keys(restaurantCountMap);
    const restaurent_counts = Object.values(restaurantCountMap);

    // Fetch recent orders for display
    const recentOrders = await Order.find({ customerName: req.session.username })
      .sort({ _id: -1 })
      .limit(5);

    // ✅ Fetch the last 5 feedbacks submitted by this customer
    const feedbackList = await Feedback.find({ customerName: req.session.username })
      .sort({ createdAt: -1 })
      .limit(5);

    // Render the dashboard EJS
    res.render(path.join(__dirname, "..", "views", "customerDashboard"), {
      ...data,
      item_list,
      item_counts,
      restaurent_list,
      restaurent_counts,
      prev_order,
      restaurants,
      locationFilter,
      recentOrders,
      feedbackList, // ✅ pass feedback to EJS
    });
  } catch (error) {
    console.error("Error fetching customer dashboard data:", error);
    res.status(500).send("Internal Server Error  1");
  }
};*/






exports.getCustomerDashboard = async (req, res) => {
  try {
    const customerName = req.params.customerName || req.query.customerName;

    if (!customerName) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    // =================== USER DATA ===================
    const userData = await Person.get_user_function(customerName);
    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // =================== RECENT ORDERS ===================
    const orders = await Order.find({ customerName })
      .sort({ date: -1 })
      .limit(5)
      .populate('dishes');

    const recentOrders = await Promise.all(
      orders.map(async (order) => {
        const dish = await Dish.findOne({ _id: order.dishes[0] });
        return {
          orderId: order._id,
          dishName: dish ? dish.name : 'Unknown Dish',
          price: order.totalAmount,
          status: order.status,
          date: order.date,
          image: '/dish-placeholder.png',
          restaurant: order.restaurant
        };
      })
    );

    // =================== FAVORITE RESTAURANTS ===================
    const topRestaurants = userData.restaurent_list.slice(0, 3);
    const favoriteRestaurants = (
      await Promise.all(
        topRestaurants.map(async (restaurantName) => {
          const restaurant = await Restaurant.findOne({ name: restaurantName });
          if (!restaurant) return null;
          const dish =
            restaurant.dishes.length > 0
              ? await Dish.findOne({ _id: restaurant.dishes[0] })
              : null;
          return {
            name: dish ? dish.name : restaurantName,
            restaurant: restaurantName,
            image: restaurant.image || '/dish-placeholder.png'
          };
        })
      )
    ).filter((r) => r !== null);

    // =================== RESERVATIONS ===================
    const restaurants = await Restaurant.find({});
    const allReservations = [];

    restaurants.forEach((restaurant) => {
      if (restaurant.reservations && restaurant.reservations.length > 0) {
        restaurant.reservations.forEach((reservation) => {
          if (reservation.name === customerName) {
            allReservations.push({
              restaurant: restaurant.name,
              date: reservation.date,
              time: reservation.time,
              guests: reservation.guests,
              id: reservation.id,
              reservationDate: new Date(reservation.date)
            });
          }
        });
      }
    });

    const now = new Date();
    const upcoming = allReservations
      .filter((r) => r.reservationDate >= now)
      .sort((a, b) => a.reservationDate - b.reservationDate)
      .slice(0, 3);
    const past = allReservations
      .filter((r) => r.reservationDate < now)
      .sort((a, b) => b.reservationDate - a.reservationDate)
      .slice(0, 3);

    // =================== WEEKLY SPENDING ===================
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weekOrders = await Order.find({
      customerName,
      date: { $gte: sevenDaysAgo }
    });
    const weeklySpending = [0, 0, 0, 0, 0, 0, 0];
    weekOrders.forEach((order) => {
      const orderDate = new Date(order.date);
      const dayIndex = orderDate.getDay();
      const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
      weeklySpending[adjustedIndex] += order.totalAmount;
    });

    // =================== USER STATS ===================
    const allOrders = await Order.find({ customerName });
    const totalOrders = allOrders.length;
    const totalSpent = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const avgSpend = totalOrders > 0 ? (totalSpent / totalOrders).toFixed(2) : '0.00';
    const totalVisits = totalOrders;

    // =================== FEEDBACK STATS ===================
    const feedbacks = await Feedback.find({ customerName });
    const totalReviews = feedbacks.length;

    let satisfactionRate = 0;
    let recentReviews = [];

    if (totalReviews > 0) {
      const avgRating =
        feedbacks.reduce((sum, fb) => sum + (fb.orderRating || 0), 0) / totalReviews;
      satisfactionRate = Math.round((avgRating / 5) * 100);

      recentReviews = feedbacks
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 2)
        .map((fb) => ({
          restaurant: 'Restaurant Name', // Can join with order for actual name
          rating: fb.orderRating,
          comment: fb.additionalFeedback,
          lovedItems: fb.lovedItems
        }));
    }

    // =================== VISIT FREQUENCY ===================
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthOrders = await Order.find({
      customerName,
      date: { $gte: thirtyDaysAgo }
    });
    const visitFrequency = [0, 0, 0, 0];
    monthOrders.forEach((order) => {
      const orderDate = new Date(order.date);
      const daysDiff = Math.floor((new Date() - orderDate) / (1000 * 60 * 60 * 24));
      const weekIndex = Math.floor(daysDiff / 7);
      if (weekIndex < 4) visitFrequency[weekIndex]++;
    });

    // =================== FINAL RESPONSE ===================
    return res.status(200).json({
      user: {
        name: userData.name,
        img_url: userData.img_url,
        email: userData.email,
        phone: userData.phone,
        totalOrders: userData.prev_order.length,
        totalVisits,
        avgSpend,
        topRestaurant: userData.restaurent_list[0] || 'N/A'
      },
      recentOrders,
      favoriteRestaurants,
      upcomingReservations: upcoming,
      pastReservations: past,
      weeklySpending,
      feedbackStats: {
        satisfactionRate,
        totalReviews,
        recentReviews
      },
      visitFrequency
    });
  } catch (error) {
    console.error('Error in getCustomerDashboard:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};







exports.getFeedBack = async (req, res) => {
  try {
    const username = req.session.username;
    const user = await Person.findOne({ name: username });
    if (!user) return res.status(404).send("User not found");

    const recentOrders = await Order.find({ customerName: username })
      .sort({ _id: -1 })
      .limit(5);

    // ✅ Fetch the feedbacks for this user
    const feedbacks = await Feedback.find({ username })
      .sort({ date: -1 })
      .limit(10);

    res.render("feedback", { user, recentOrders, feedbacks }); // pass feedbacks
  } catch (error) {
    console.error("Error fetching feedback data:", error);
    res.status(500).send("Internal Server Error2");
  }
};



exports.submitFeedback = async (req, res) => {
  try {
    const { diningRating, lovedItems, orderRating, additionalFeedback } = req.body;
    const username = req.session.username;

    if (!username) return res.redirect("/customer/feedback");

    await Feedback.create({
      customerName: username,
      diningRating: diningRating || 0,
      lovedItems: lovedItems || "",
      orderRating: orderRating || 0,
      additionalFeedback: additionalFeedback || "",
      createdAt: new Date()
    });

    // Redirect to customer dashboard after submission
    res.redirect("/customer/customerDashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};




// Orders and reservations
exports.postOrderAndReservation = async (req, res) => {
  try {
    
    let restaurantName, cart, rest_id;
    console.log(req.session.cart);
    if (req.body.restaurant) {
      restaurantName = req.body.restaurant;
      rest_id = req.body.rest_id;
      cart = JSON.parse(req.body.order);
      req.session.temp_cart = cart;
      req.session.rest_name = restaurantName;
      req.session.rest_id = rest_id;
    } else {
      rest_id = req.session.rest_id;
      if (rest_id) {
        const rest = await Restaurant.find_by_id(rest_id);
        restaurantName = rest ? rest.name : "";
        req.session.rest_name = restaurantName;
      } else return res.redirect("/customer/customerDashboard");

      const user = req.user;
      if (user) {
        const person = await Person.findOne({ email: user.email });
        cart = person ? person.cart : [];
      } else {
        cart = req.session.temp_cart || [];
      }
    }
    if (!cart) cart = [];
    res.render("orderReservation", { restaurantName, cart, rest_id });
  } catch (error) {
    console.error("Error in postOrderAndReservation:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.order = async (req, res) => {
  const { restaurant, specialRequests } = req.body;
  const newOrder = { id: Date.now(), restaurant, specialRequests, status: "Pending" };
  req.session.tempOrder = newOrder;
  const dishes_temp = req.session.temp_cart || [];
  let sum = 0;
  for (let a of dishes_temp) {
    const temp = await Dish.findByName(a.dish);
    sum += parseInt(temp.price) * a.quantity;
  }
  req.session.bill = sum;
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

    const newOrder = { id: Date.now(), restaurant, specialRequests, status: "Pending" };
    req.session.tempOrder = newOrder;

    let dishes_temp = req.session.temp_cart || [];
    let sum = 0;
    for (let a of dishes_temp) {
      const temp = await Dish.findByName(a.dish);
      sum += parseInt(temp.price) * a.quantity;
    }
    req.session.bill = sum;

    const newReservation = {
      id: Date.now(),
      name: req.session.username,
      restaurant,
      date,
      time,
      guests,
    };
    req.session.reservation = newReservation;


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
    const username = req.session.username;
    const user = await Person.findOne({ name: username });
    const rest_name = req.session.rest_name;
    const rest_id = req.session.rest_id;
    const dishes = [];

    if (req.session.reservation) {
      const tmp_rest = await Restaurant.find_by_id(rest_id);
      tmp_rest.reservations.push(req.session.reservation);
      await tmp_rest.save();
    }

    const dishes_temp = req.session.temp_cart || [];
    for (let i = 0; i < dishes_temp.length; i++) {
      dishes.push(dishes_temp[i].dish);
    }

    if (dishes.length > 0) {
      const newOrder = new Order({
        dishes,
        customerName: username,
        restaurant: rest_name,
        rest_id,
        status: "Pending",
        totalAmount: req.session.bill,
      });
      await newOrder.save();

      const tmp_rest = await Restaurant.find_by_id(rest_id);
      if (tmp_rest) {
        tmp_rest.orders.push(newOrder._id);
        tmp_rest.payments.push({ amount: req.session.bill, date: new Date() });
        await tmp_rest.save();
      }

      if (user) {
        await user.add_order({ name: rest_name, items: dishes });
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

// Profile editing
exports.getEditProfile = async (req, res) => {
  try {
    const user = await Person.findOne({ name: req.session.username });
    if (!user) return res.status(404).send("User not found");
    res.render("editCustomerProfile", { user });
  } catch (error) {
    console.error("Error fetching user for edit profile:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.postEditProfile = async (req, res) => {

  function sendAlert(msg){
    res.send(`
  <script>
    alert(${msg});
    window.history.back();
  </script>
`)
  }

  try {
    const currentUsername = req.session.username;
    const { name, email, phone, img_url, newPassword, confirmPassword } = req.body;
   
    const userRole = await User.findOne({ username: currentUsername });
    const adding = await User.findOne({username:name});
   /* if(adding!=null){
      return res.send(`
  <script>
    alert('user already exists');
    window.history.back();
  </script>
`);

    }*/   
    if (!userRole) return sendAlert("user not found");

    if (newPassword || confirmPassword) {
      if (!newPassword || !confirmPassword)
        return sendAlert("bot password are required");
      if (newPassword !== confirmPassword)
        return sendAlert("both passwords must be equal")

      /*const hashedPassword = await bcrypt.hash(newPassword, 10);*/
      userRole.password = newPassword;
    }

    userRole.username = name || userRole.username;
    userRole.email = email || userRole.email;
    await userRole.save();


    

    const personUsername = name && name !== currentUsername ? name : currentUsername;
    const user = await Person.findOne({ name: req.session.username });
    
    /*if (!user) return res.status(404).send("User not found");*/

    if (name && name !== currentUsername) req.session.username = name;
   

    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.img_url = img_url || user.img_url;
    await user.save();

    res.redirect("/customer/customerDashboard");
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).send("Internal Server Error");
  }
};
