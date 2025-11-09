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


exports.getCustomerDashboard = async (req, res) => {
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

// Search and filter restaurants for customer homepage
exports.searchRestaurants = async (req, res) => {
  try {
    const { 
      search, 
      cuisine, 
      openNow, 
      maxDistance, 
      sortBy,
      location 
    } = req.query;

    let query = {};

    // Search by name or location
    if (search) {
      query.$or = [
        { name: { $regex: new RegExp(search.trim(), 'i') } },
        { location: { $regex: new RegExp(search.trim(), 'i') } }
      ];
    }

    // Filter by location
    if (location && location !== 'All') {
      query.location = { $regex: new RegExp(location.trim(), 'i') };
    }

    // Filter by cuisine
    if (cuisine && cuisine !== 'All') {
      query.cuisine = { $in: [cuisine] };
    }

    // Filter by distance (if distance field exists)
    if (maxDistance) {
      query.distance = { $lte: parseFloat(maxDistance) };
    }

    let restaurants = await Restaurant.find(query);

    // Filter by open now (simplified - check isOpen field and operating hours)
    if (openNow === 'true') {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      restaurants = restaurants.filter(restaurant => {
        if (!restaurant.isOpen) return false;
        
        // Check operating hours if they exist
        if (restaurant.operatingHours && restaurant.operatingHours.open && restaurant.operatingHours.close) {
          try {
            const [openHour, openMin] = restaurant.operatingHours.open.split(':').map(Number);
            const [closeHour, closeMin] = restaurant.operatingHours.close.split(':').map(Number);
            const openTime = openHour * 60 + openMin;
            const closeTime = closeHour * 60 + closeMin;
            const currentTime = currentHour * 60 + currentMinute;
            
            return currentTime >= openTime && currentTime <= closeTime;
          } catch (e) {
            // If parsing fails, just check isOpen
            return restaurant.isOpen;
          }
        }
        
        return restaurant.isOpen;
      });
    }

    // Sort results
    if (sortBy) {
      switch (sortBy) {
        case 'rating':
          restaurants.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case 'name':
          restaurants.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'distance':
          restaurants.sort((a, b) => (a.distance || 0) - (b.distance || 0));
          break;
        default:
          restaurants.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      }
    } else {
      restaurants.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    // Format response with open/closed status
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const restaurantsWithStatus = restaurants.map(restaurant => {
      let isCurrentlyOpen = restaurant.isOpen;
      
      if (restaurant.operatingHours && restaurant.operatingHours.open && restaurant.operatingHours.close) {
        try {
          const [openHour, openMin] = restaurant.operatingHours.open.split(':').map(Number);
          const [closeHour, closeMin] = restaurant.operatingHours.close.split(':').map(Number);
          const openTime = openHour * 60 + openMin;
          const closeTime = closeHour * 60 + closeMin;
          const currentTime = currentHour * 60 + currentMinute;
          
          isCurrentlyOpen = restaurant.isOpen && (currentTime >= openTime && currentTime <= closeTime);
        } catch (e) {
          isCurrentlyOpen = restaurant.isOpen;
        }
      }

      return {
        _id: restaurant._id,
        name: restaurant.name,
        image: restaurant.image,
        rating: restaurant.rating,
        location: restaurant.location,
        cuisine: restaurant.cuisine || [],
        isOpen: isCurrentlyOpen,
        distance: restaurant.distance || 0,
        operatingHours: restaurant.operatingHours
      };
    });

    // Get all unique cuisines from all restaurants
    const allRestaurants = await Restaurant.find({});
    const allCuisines = new Set();
    allRestaurants.forEach(rest => {
      if (rest.cuisine && Array.isArray(rest.cuisine)) {
        rest.cuisine.forEach(c => allCuisines.add(c));
      }
    });

    res.json({ 
      restaurants: restaurantsWithStatus,
      availableCuisines: Array.from(allCuisines).sort()
    });
  } catch (error) {
    console.error("Error in searchRestaurants:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
