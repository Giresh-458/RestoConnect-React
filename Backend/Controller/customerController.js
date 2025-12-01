const path = require("path");
const Person = require("../Model/customer_model");
const { Dish } = require("../Model/Dishes_model_test");
const Restaurant = require("../Model/Restaurents_model").Restaurant;
const Feedback = require("../Model/feedback");
const { Order } = require("../Model/Order_model");
const { User } = require("../Model/userRoleModel");
const { getImageUrl } = require('../util/fileUpload');

const formatRelativeTime = (targetDate) => {
  if (!targetDate) return "";

  const date = targetDate instanceof Date ? targetDate : new Date(targetDate);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const format = (value, unit, suffix) =>
    `${Math.abs(value)} ${unit}${Math.abs(value) === 1 ? "" : "s"} ${suffix}`;

  if (Math.abs(diffMinutes) < 60) {
    return diffMinutes >= 0
      ? format(diffMinutes, "minute", "from now")
      : format(diffMinutes, "minute", "ago");
  }

  if (Math.abs(diffHours) < 24) {
    return diffHours >= 0
      ? format(diffHours, "hour", "from now")
      : format(diffHours, "hour", "ago");
  }

  return diffDays >= 0
    ? format(diffDays, "day", "from now")
    : format(diffDays, "day", "ago");
};

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
    const customerName =
      req.session.username ||
      req.params.customerName ||
      req.query.customerName;

    if (!customerName) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // =================== USER DATA ===================
    const userData = await Person.get_user_function(customerName);
    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    const prevOrders = Array.isArray(userData.prev_order)
      ? userData.prev_order
      : [];
    const restaurantList = Array.isArray(userData.restaurent_list)
      ? userData.restaurent_list.filter(
          (name) => typeof name === 'string' && name.trim() && name !== 'others'
        )
      : [];
    const emailNotificationsEnabled =
      typeof userData.emailNotificationsEnabled === 'boolean'
        ? userData.emailNotificationsEnabled
        : true;

    // =================== RECENT ORDERS ===================
    const orders = await Order.find({ customerName })
      .sort({ date: -1 })
      .limit(10); // Get more orders to have enough for both tabs

    const recentOrders = await Promise.all(
      orders.map(async (order) => {
        let dishName = 'No items';
        let dishImage = '/dish-placeholder.png';
        
        // Orders store dish NAMES (not IDs) in the dishes array
        if (order.dishes && Array.isArray(order.dishes) && order.dishes.length > 0) {
          const firstDishName = order.dishes[0];
          
          // Try to find the dish by name to get image and other details
          let dish = null;
          try {
            dish = await Dish.findOne({ name: firstDishName });
          } catch (err) {
            console.error('Error finding dish:', err);
          }
          
          if (dish) {
            dishName = dish.name;
            dishImage = dish.image || dish.img_url || '/dish-placeholder.png';
          } else {
            // If dish not found in DB, use the name from order
            dishName = firstDishName;
          }
          
          // If multiple dishes, show first dish name + count
          if (order.dishes.length > 1) {
            dishName = `${dishName} + ${order.dishes.length - 1} more`;
          }
        }
        
        // Generate consistent order ID using hash method (same as owner dashboard)
        let hash = 0;
        for (let i = 0; i < order._id.length; i++) {
          const char = order._id.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32bit integer
        }
        // Convert to positive 3-digit number (100-999)
        const orderNumber = (Math.abs(hash) % 900 + 100).toString();
        const consistentOrderId = `OR${orderNumber}`;

        let totalAmount = Number(order.totalAmount) || 0;
        if ((!totalAmount || Number.isNaN(totalAmount)) && Array.isArray(order.dishes)) {
          totalAmount = order.dishes.reduce((sum, dishName) => {
            try {
              const dishDoc = Dish.findByName ? Dish.findByName(dishName) : null;
              return sum + (dishDoc?.price || 0);
            } catch {
              return sum;
            }
          }, 0);
        }

        return {
          orderId: consistentOrderId,
          recordId: order._id || null,
          dishName: dishName,
          price: Number(totalAmount.toFixed(2)),
          status: order.status || 'pending',
          date: order.date,
          image: dishImage,
          restaurant: order.restaurant || 'Unknown Restaurant',
          restId: order.rest_id || null
        };
      })
    );

    // =================== FAVORITE RESTAURANTS ===================
    const topRestaurants = restaurantList.slice(0, 3);
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
            restId: restaurant._id,
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
      const ratingValues = feedbacks.flatMap((fb) =>
        [fb.orderRating, fb.diningRating].filter((val) => typeof val === "number")
      );

      if (ratingValues.length > 0) {
        const avgRating =
          ratingValues.reduce((sum, rating) => sum + rating, 0) / ratingValues.length;
        satisfactionRate = Math.round((avgRating / 5) * 100);
      }

      const restaurantIdSet = Array.from(
        new Set(feedbacks.map((fb) => fb.rest_id).filter(Boolean))
      );
      const restaurantLookup = {};
      if (restaurantIdSet.length > 0) {
        const feedbackRestaurants = await Restaurant.find({
          _id: { $in: restaurantIdSet }
        }).select("name");
        feedbackRestaurants.forEach((rest) => {
          restaurantLookup[rest._id.toString()] = rest.name;
        });
      }

      recentReviews = feedbacks
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 3)
        .map((fb) => {
          const restaurantName =
            restaurantLookup[fb.rest_id?.toString()] || "Unknown Restaurant";
          const ratings = [fb.orderRating, fb.diningRating].filter(
            (val) => typeof val === "number"
          );
          const averageRating =
            ratings.length > 0
              ? ratings.reduce((sum, val) => sum + val, 0) / ratings.length
              : null;

          return {
            restaurant: restaurantName,
            rating: averageRating,
            orderRating: fb.orderRating,
            diningRating: fb.diningRating,
            comment: fb.additionalFeedback || "",
            lovedItems: fb.lovedItems || "",
            createdAt: fb.createdAt
          };
        });
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

    // =================== NOTIFICATIONS ===================
    const notifications = [];

    // Add notifications for recent orders (limit to last 3 orders with pending/delivered status)
    const recentOrderNotifications = recentOrders
      .filter(order => order.status === 'pending' || order.status === 'delivered')
      .slice(0, 3)
      .map((order) => {
        const statusText =
          order.status === 'delivered'
            ? 'has been delivered successfully!'
            : order.status === 'pending'
            ? 'is being prepared'
            : `is currently ${order.status}`;
        return {
          id: `order-${order.orderId}`,
          type: 'order',
          icon: order.status === 'delivered' ? '✓' : '⏳',
          message: `Your order #${order.orderId} ${statusText}`,
          timeAgo: order.date ? formatRelativeTime(new Date(order.date)) : ''
        };
      });
    notifications.push(...recentOrderNotifications);

    // Add notifications for upcoming reservations
    if (upcoming.length > 0) {
      upcoming.slice(0, 2).forEach((reservation) => {
        const reservationDateTime = reservation.date
          ? new Date(`${reservation.date}T${reservation.time || '00:00'}`)
          : null;
        const hoursUntilReservation = reservationDateTime
          ? Math.round((reservationDateTime.getTime() - Date.now()) / (1000 * 60 * 60))
          : null;
        
        let message = `Your table booking is confirmed at ${reservation.restaurant}`;
        if (reservation.time) {
          message += ` for ${reservation.time}`;
        }
        if (hoursUntilReservation !== null && hoursUntilReservation < 24 && hoursUntilReservation > 0) {
          message += ` (in ${hoursUntilReservation} hour${hoursUntilReservation !== 1 ? 's' : ''})`;
        }
        
        notifications.push({
          id: `reservation-${reservation.id || Date.now()}`,
          type: 'reservation',
          icon: '📅',
          message: message,
          timeAgo: reservationDateTime ? formatRelativeTime(reservationDateTime) : ''
        });
      });
    }

    // Add notification for new reviews/feedback if available
    if (totalReviews > 0 && recentReviews.length > 0) {
      const latestReview = recentReviews[0];
      notifications.push({
        id: `review-${Date.now()}`,
        type: 'info',
        icon: '⭐',
        message: `Thank you for your ${latestReview.rating}-star review!`,
        timeAgo: ''
      });
    }

    // Ensure at least one notification is always present
    if (notifications.length === 0) {
      notifications.push({
        id: 'welcome',
        type: 'info',
        icon: 'ℹ️',
        message: 'Welcome! Your order updates and reservations will appear here.',
        timeAgo: ''
      });
    }

    // =================== FINAL RESPONSE ===================
    return res.status(200).json({
      user: {
        name: userData.name,
        img_url: userData.img_url,
        email: userData.email,
        phone: userData.phone,
        totalOrders: prevOrders.length,
        totalVisits,
        avgSpend,
        totalSpent: totalSpent.toFixed(2),
        topRestaurant: restaurantList[0] || 'N/A'
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
      visitFrequency,
      notifications,
      emailNotificationsEnabled
    });
  } catch (error) {
    console.error('Error in getCustomerDashboard:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

exports.reorderOrder = async (req, res) => {
  try {
    const customerName = req.session.username;
    if (!customerName) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Order ID is required' });
    }

    const order = await Order.findOne({ _id: orderId, customerName });
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    const dishCounts = {};
    (order.dishes || []).forEach((dishName) => {
      if (!dishName) return;
      dishCounts[dishName] = (dishCounts[dishName] || 0) + 1;
    });

    const uniqueDishNames = Object.keys(dishCounts);

    const items = await Promise.all(
      uniqueDishNames.map(async (dishName) => {
        try {
          const dishDoc = await Dish.findByName(dishName);
          const price = dishDoc ? Number(dishDoc.price) : 0;
          const quantity = dishCounts[dishName];
          return {
            id: dishDoc?._id || dishName,
            name: dishDoc?.name || dishName,
            price,
            amount: price,
            image: dishDoc?.image || dishDoc?.img_url || null,
            quantity
          };
        } catch (err) {
          console.error(`Failed to load dish ${dishName}`, err);
          return {
            id: dishName,
            name: dishName,
            price: 0,
            amount: 0,
            image: null,
            quantity: dishCounts[dishName]
          };
        }
      })
    );

    const person = await Person.findOne({ name: customerName });
    if (person) {
      person.cart = uniqueDishNames.map((dishName) => ({
        dish: dishName,
        quantity: dishCounts[dishName]
      }));
      person.markModified('cart');
      await person.save();
    }

    return res.json({
      success: true,
      restaurant: {
        id: order.rest_id || null,
        name: order.restaurant || 'Restaurant'
      },
      items
    });
  } catch (error) {
    console.error('Error in reorderOrder:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.updateEmailNotifications = async (req, res) => {
  try {
    const customerName = req.session.username;
    if (!customerName) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ success: false, error: 'Enabled flag must be boolean' });
    }

    const person = await Person.findOne({ name: customerName });
    if (!person) {
      return res.status(404).json({ success: false, error: 'Customer profile not found' });
    }

    person.emailNotificationsEnabled = enabled;
    await person.save();

    return res.json({
      success: true,
      emailNotificationsEnabled: person.emailNotificationsEnabled
    });
  } catch (error) {
    console.error('Error updating email notifications:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.getFeedBack = async (req, res) => {
  try {
    const username = req.session.username;
    const user = await Person.findOne({ name: username });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Get recent orders for the customer to select restaurant
    const recentOrders = await Order.find({ customerName: username })
      .sort({ date: -1 })
      .limit(10)
      .select('rest_id restaurant date totalAmount')
      .lean();

    // Get unique restaurants from recent orders
    const restaurantIds = [...new Set(recentOrders.map(o => o.rest_id).filter(Boolean))];
    const restaurants = await Restaurant.find({ _id: { $in: restaurantIds } })
      .select('name _id')
      .lean();

    // Fetch the feedbacks for this user (using customerName, not username)
    const feedbacks = await Feedback.find({ customerName: username })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Return JSON for React frontend
    res.json({ 
      user: {
        name: user.name,
        email: user.email
      },
      recentOrders: recentOrders.map(order => ({
        id: order._id,
        restaurant: order.restaurant,
        rest_id: order.rest_id,
        date: order.date,
        totalAmount: order.totalAmount
      })),
      restaurants: restaurants.map(r => ({
        id: r._id,
        name: r.name
      })),
      feedbacks: feedbacks.map(fb => ({
        id: fb._id,
        rest_id: fb.rest_id,
        diningRating: fb.diningRating,
        orderRating: fb.orderRating,
        lovedItems: fb.lovedItems,
        additionalFeedback: fb.additionalFeedback,
        status: fb.status,
        createdAt: fb.createdAt
      }))
    });
  } catch (error) {
    console.error("Error fetching feedback data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



exports.submitFeedback = async (req, res) => {
  try {
    const { rest_id, diningRating, lovedItems, orderRating, additionalFeedback } = req.body;
    const username = req.session.username;

    if (!username) {
      return res.status(401).json({ error: "Unauthorized. Please login." });
    }

    // Validate rest_id is provided
    if (!rest_id) {
      return res.status(400).json({ error: "Restaurant ID is required. Please select a restaurant." });
    }

    // Verify the restaurant exists
    const restaurant = await Restaurant.findById(rest_id);
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found." });
    }

    // Create feedback
    const feedback = await Feedback.create({
      rest_id: rest_id,
      customerName: username,
      diningRating: diningRating ? parseInt(diningRating) : null,
      lovedItems: lovedItems || "",
      orderRating: orderRating ? parseInt(orderRating) : null,
      additionalFeedback: additionalFeedback || "",
      status: 'Pending',
      createdAt: new Date()
    });

    // Return JSON response for React frontend
    res.json({ 
      success: true, 
      message: "Feedback submitted successfully!",
      feedback: {
        id: feedback._id,
        rest_id: feedback.rest_id,
        customerName: feedback.customerName,
        diningRating: feedback.diningRating,
        orderRating: feedback.orderRating,
        lovedItems: feedback.lovedItems,
        additionalFeedback: feedback.additionalFeedback,
        status: feedback.status,
        createdAt: feedback.createdAt
      }
    });
  } catch (err) {
    console.error("Error submitting feedback:", err);
    res.status(500).json({ error: "Server Error. Please try again." });
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

      // Set password - User model's pre-save hook will automatically hash it
      // No need to hash manually as the model has a pre('save') hook that does this
      userRole.password = newPassword;
    }

    userRole.username = name || userRole.username;
    userRole.email = email || userRole.email;
    await userRole.save();


    

    const personUsername = name && name !== currentUsername ? name : currentUsername;
    const user = await Person.findOne({ name: req.session.username });
    
    if (!user) {
      if (req.headers['content-type']?.includes('application/json')) {
        return res.status(404).json({ success: false, error: "Customer profile not found" });
      }
      return res.status(404).send("Customer profile not found");
    }

    if (name && name !== currentUsername) req.session.username = name;
   

    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.img_url = img_url || user.img_url;
    await user.save();

    // Check if request wants JSON response (from React frontend)
    const wantsJson = req.headers['content-type']?.includes('application/json');
    if (wantsJson) {
      return res.status(200).json({ 
        success: true, 
        message: "Profile updated successfully",
        data: {
          name: user.name,
          email: user.email,
          phone: user.phone,
          img_url: user.img_url
        }
      });
    }

    res.redirect("/customer/customerDashboard");
  } catch (error) {
    console.error("Error updating user profile:", error);
    const wantsJson = req.headers['content-type']?.includes('application/json');
    if (wantsJson) {
      return res.status(500).json({ success: false, error: "Internal server error", details: error.message });
    }
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

// Favourites functionality
exports.addToFavourites = async (req, res) => {
  try {
    const customerName = req.session.username;
    if (!customerName) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { dishId } = req.body;
    if (!dishId) {
      return res.status(400).json({ success: false, error: 'Dish ID is required' });
    }

    const person = await Person.findOne({ name: customerName });
    if (!person) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    // Initialize favourites array if it doesn't exist
    if (!person.favourites) {
      person.favourites = [];
    }

    // Check if dish is already in favourites
    if (person.favourites.includes(dishId)) {
      return res.status(400).json({ success: false, error: 'Dish already in favourites' });
    }

    // Add to favourites
    person.favourites.push(dishId);
    person.markModified('favourites');
    await person.save();

    res.json({ success: true, message: 'Dish added to favourites' });
  } catch (error) {
    console.error('Error adding to favourites:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.removeFromFavourites = async (req, res) => {
  try {
    const customerName = req.session.username;
    if (!customerName) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { dishId } = req.body;
    if (!dishId) {
      return res.status(400).json({ success: false, error: 'Dish ID is required' });
    }

    const person = await Person.findOne({ name: customerName });
    if (!person) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    // Remove from favourites
    if (person.favourites) {
      person.favourites = person.favourites.filter(id => id !== dishId);
      person.markModified('favourites');
      await person.save();
    }

    res.json({ success: true, message: 'Dish removed from favourites' });
  } catch (error) {
    console.error('Error removing from favourites:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

exports.getFavourites = async (req, res) => {
  try {
    const customerName = req.session.username;
    if (!customerName) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const person = await Person.findOne({ name: customerName });
    if (!person) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const favouriteDishIds = person.favourites || [];

    if (favouriteDishIds.length === 0) {
      return res.json({ success: true, favourites: [] });
    }

    // Get dish details
    const dishes = await Promise.all(
      favouriteDishIds.map(async (dishId) => {
        try {
          const dish = await Dish.findById(dishId);
          if (!dish) return null;

          return {
            id: dish._id,
            name: dish.name,
            price: dish.price,
            amount: dish.price,
            description: dish.description || '',
            image: getImageUrl(req, dish.image) || null
          };
        } catch (err) {
          console.error(`Error fetching dish ${dishId}:`, err);
          return null;
        }
      })
    );

    // Filter out null values (dishes that no longer exist)
    const validDishes = dishes.filter(dish => dish !== null);

    res.json({ success: true, favourites: validDishes });
  } catch (error) {
    console.error('Error getting favourites:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
