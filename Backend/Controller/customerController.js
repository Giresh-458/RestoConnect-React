const path = require("path");
const Person = require("../Model/customer_model");
const { Dish } = require("../Model/Dishes_model_test");
const Restaurant = require("../Model/Restaurents_model").Restaurant;
const Feedback = require("../Model/feedback");
const { Order } = require("../Model/Order_model");
const { Reservation } = require("../Model/Reservation_model");
const { PromoCode } = require("../Model/PromoCode_model");
const { User } = require("../Model/userRoleModel");
const { getImageUrl, getProfilePicUrl } = require("../util/fileUpload");
// Removed duplicate Restaurant import to avoid redeclaration

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

exports.getCustomerDashboard = async (req, res) => {
  try {
    const customerName =
      req.session.username || req.params.customerName || req.query.customerName;

    if (!customerName) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // =================== USER DATA ===================
    const userData = await Person.get_user_function(customerName);
    if (!userData) {
      return res.status(404).json({ error: "User not found" });
    }

    const prevOrders = Array.isArray(userData.prev_order)
      ? userData.prev_order
      : [];
    const restaurantList = Array.isArray(userData.restaurent_list)
      ? userData.restaurent_list.filter(
          (name) => typeof name === "string" && name.trim() && name !== "others"
        )
      : [];
    const emailNotificationsEnabled =
      typeof userData.emailNotificationsEnabled === "boolean"
        ? userData.emailNotificationsEnabled
        : true;

    // =================== RECENT ORDERS ===================
    const orders = await Order.find({ customerName })
      .sort({ date: -1 })
      .limit(10); // Get more orders to have enough for both tabs

    const recentOrders = await Promise.all(
      orders.map(async (order) => {
        let dishName = "No items";
        let dishImage = "/dish-placeholder.png";

        // Orders store dish NAMES (not IDs) in the dishes array, but some may have IDs
        if (
          order.dishes &&
          Array.isArray(order.dishes) &&
          order.dishes.length > 0
        ) {
          const firstDishIdentifier = order.dishes[0];

          // Try to find the dish by name first
          let dish = null;
          try {
            dish = await Dish.findOne({ name: firstDishIdentifier });
          } catch (err) {
            console.error("Error finding dish by name:", err);
          }

          // If not found by name, try to find by ID (in case the order stores IDs)
          if (!dish) {
            try {
              dish = await Dish.findById(firstDishIdentifier);
            } catch (err) {
              console.error("Error finding dish by ID:", err);
            }
          }

          if (dish) {
            dishName = dish.name;
            dishImage = dish.image || dish.img_url || "/dish-placeholder.png";
          } else {
            // If dish not found in DB, use the identifier from order as fallback
            dishName = firstDishIdentifier;
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
          hash = (hash << 5) - hash + char;
          hash = hash & hash; // Convert to 32bit integer
        }
        // Convert to positive 3-digit number (100-999)
        const orderNumber = ((Math.abs(hash) % 900) + 100).toString();
        const consistentOrderId = `OR${orderNumber}`;

        let totalAmount = Number(order.totalAmount) || 0;
        if (
          (!totalAmount || Number.isNaN(totalAmount)) &&
          Array.isArray(order.dishes)
        ) {
          totalAmount = order.dishes.reduce((sum, dishName) => {
            try {
              const dishDoc = Dish.findByName
                ? Dish.findByName(dishName)
                : null;
              return sum + (dishDoc?.price || 0);
            } catch {
              return sum;
            }
          }, 0);
        }

        // Fetch restaurant ID if not present in order
        let restId = order.rest_id || null;
        if (!restId && order.restaurant) {
          try {
            const restaurant = await Restaurant.findOne({
              name: order.restaurant,
            });
            if (restaurant) {
              restId = restaurant._id;
            }
          } catch (err) {
            console.error("Error finding restaurant:", err);
          }
        }

        return {
          orderId: consistentOrderId,
          recordId: order._id || null,
          dishName: dishName,
          price: Number(totalAmount.toFixed(2)),
          status: order.status || "pending",
          date: order.date,
          image: dishImage,
          restaurant: order.restaurant || "Unknown Restaurant",
          restId: restId,
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
            image: restaurant.image || "/dish-placeholder.png",
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
            // Create proper datetime by combining date and time
            let reservationDateTime = new Date(reservation.date);
            if (reservation.time) {
              const [hours, minutes] = reservation.time.split(":");
              reservationDateTime.setHours(
                parseInt(hours) || 0,
                parseInt(minutes) || 0,
                0,
                0
              );
            }
            allReservations.push({
              restaurant: restaurant.name,
              date: reservation.date,
              time: reservation.time,
              guests: reservation.guests,
              id: reservation.id,
              reservationDate: reservationDateTime,
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
      date: { $gte: sevenDaysAgo },
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
    const totalSpent = allOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );
    const avgSpend =
      totalOrders > 0 ? (totalSpent / totalOrders).toFixed(2) : "0.00";
    const totalVisits = totalOrders;

    // =================== FEEDBACK STATS ===================
    const feedbacks = await Feedback.find({ customerName });
    const totalReviews = feedbacks.length;

    let satisfactionRate = 0;
    let recentReviews = [];

    if (totalReviews > 0) {
      const ratingValues = feedbacks.flatMap((fb) =>
        [fb.orderRating, fb.diningRating].filter(
          (val) => typeof val === "number"
        )
      );

      if (ratingValues.length > 0) {
        const avgRating =
          ratingValues.reduce((sum, rating) => sum + rating, 0) /
          ratingValues.length;
        satisfactionRate = Math.round((avgRating / 5) * 100);
      }

      const restaurantIdSet = Array.from(
        new Set(feedbacks.map((fb) => fb.rest_id).filter(Boolean))
      );
      const restaurantLookup = {};
      if (restaurantIdSet.length > 0) {
        const feedbackRestaurants = await Restaurant.find({
          _id: { $in: restaurantIdSet },
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
            createdAt: fb.createdAt,
          };
        });
    }

    // =================== VISIT FREQUENCY ===================
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthOrders = await Order.find({
      customerName,
      date: { $gte: thirtyDaysAgo },
    });
    const visitFrequency = [0, 0, 0, 0];
    monthOrders.forEach((order) => {
      const orderDate = new Date(order.date);
      const daysDiff = Math.floor(
        (new Date() - orderDate) / (1000 * 60 * 60 * 24)
      );
      const weekIndex = Math.floor(daysDiff / 7);
      if (weekIndex < 4) visitFrequency[weekIndex]++;
    });

    // =================== NOTIFICATIONS ===================
    const notifications = [];

    // Add notifications for recent orders (limit to last 3 orders with pending/delivered status)
    const recentOrderNotifications = recentOrders
      .filter(
        (order) => order.status === "pending" || order.status === "delivered"
      )
      .slice(0, 3)
      .map((order) => {
        const statusText =
          order.status === "delivered"
            ? "has been delivered successfully!"
            : order.status === "pending"
            ? "is being prepared"
            : `is currently ${order.status}`;
        return {
          id: `order-${order.orderId}`,
          type: "order",
          icon: order.status === "delivered" ? "✓" : "⏳",
          message: `Your order #${order.orderId} ${statusText}`,
          timeAgo: order.date ? formatRelativeTime(new Date(order.date)) : "",
        };
      });
    notifications.push(...recentOrderNotifications);

    // Add notifications for upcoming reservations
    if (upcoming.length > 0) {
      upcoming.slice(0, 2).forEach((reservation) => {
        const reservationDateTime = reservation.date
          ? new Date(`${reservation.date}T${reservation.time || "00:00"}`)
          : null;
        const hoursUntilReservation = reservationDateTime
          ? Math.round(
              (reservationDateTime.getTime() - Date.now()) / (1000 * 60 * 60)
            )
          : null;

        let message = `Your table booking is confirmed at ${reservation.restaurant}`;
        if (reservation.time) {
          message += ` for ${reservation.time}`;
        }
        if (
          hoursUntilReservation !== null &&
          hoursUntilReservation < 24 &&
          hoursUntilReservation > 0
        ) {
          message += ` (in ${hoursUntilReservation} hour${
            hoursUntilReservation !== 1 ? "s" : ""
          })`;
        }

        notifications.push({
          id: `reservation-${reservation.id || Date.now()}`,
          type: "reservation",
          icon: "📅",
          message: message,
          timeAgo: reservationDateTime
            ? formatRelativeTime(reservationDateTime)
            : "",
        });
      });
    }

    // Add notification for new reviews/feedback if available
    if (totalReviews > 0 && recentReviews.length > 0) {
      const latestReview = recentReviews[0];
      notifications.push({
        id: `review-${Date.now()}`,
        type: "info",
        icon: "⭐",
        message: `Thank you for your ${latestReview.rating}-star review!`,
        timeAgo: "",
      });
    }

    // Ensure at least one notification is always present
    if (notifications.length === 0) {
      notifications.push({
        id: "welcome",
        type: "info",
        icon: "ℹ️",
        message:
          "Welcome! Your order updates and reservations will appear here.",
        timeAgo: "",
      });
    }

    // =================== FINAL RESPONSE ===================
    return res.status(200).json({
      user: {
        name: userData.name,
        img_url: getProfilePicUrl(req, userData.img_url),
        email: userData.email,
        phone: userData.phone,
        totalOrders: prevOrders.length,
        totalVisits,
        avgSpend,
        totalSpent: totalSpent.toFixed(2),
        topRestaurant: restaurantList[0] || "N/A",
      },
      recentOrders,
      favoriteRestaurants,
      upcomingReservations: upcoming,
      pastReservations: past,
      weeklySpending,
      feedbackStats: {
        satisfactionRate,
        totalReviews,
        recentReviews,
      },
      visitFrequency,
      notifications,
      emailNotificationsEnabled,
    });
  } catch (error) {
    console.error("Error in getCustomerDashboard:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

exports.reorderOrder = async (req, res) => {
  try {
    const customerName = req.session.username;
    if (!customerName) {
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });
    }

    const { orderId } = req.params;
    if (!orderId) {
      return res
        .status(400)
        .json({ success: false, error: "Order ID is required" });
    }

    const order = await Order.findOne({ _id: orderId, customerName });
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
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
            quantity,
          };
        } catch (err) {
          console.error(`Failed to load dish ${dishName}`, err);
          return {
            id: dishName,
            name: dishName,
            price: 0,
            amount: 0,
            image: null,
            quantity: dishCounts[dishName],
          };
        }
      })
    );

    const person = await Person.findOne({ name: customerName });
    if (person) {
      person.cart = uniqueDishNames.map((dishName) => ({
        dish: dishName,
        quantity: dishCounts[dishName],
      }));
      person.markModified("cart");
      await person.save();
    }

    return res.json({
      success: true,
      restaurant: {
        id: order.rest_id || null,
        name: order.restaurant || "Restaurant",
      },
      items,
    });
  } catch (error) {
    console.error("Error in reorderOrder:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

exports.updateEmailNotifications = async (req, res) => {
  try {
    const customerName = req.session.username;
    if (!customerName) {
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });
    }

    const { enabled } = req.body;
    if (typeof enabled !== "boolean") {
      return res
        .status(400)
        .json({ success: false, error: "Enabled flag must be boolean" });
    }

    const person = await Person.findOne({ name: customerName });
    if (!person) {
      return res
        .status(404)
        .json({ success: false, error: "Customer profile not found" });
    }

    person.emailNotificationsEnabled = enabled;
    await person.save();

    return res.json({
      success: true,
      emailNotificationsEnabled: person.emailNotificationsEnabled,
    });
  } catch (error) {
    console.error("Error updating email notifications:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

exports.getFeedBack = async (req, res) => {
  try {
    const username = req.session.username;
    console.log("=== getFeedBack called for username:", username);

    const user = await Person.findOne({ name: username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const recentOrders = await Order.find({ customerName: username })
      .sort({ date: -1 })
      .limit(10)
      .lean();

    console.log("Found orders count:", recentOrders.length);
    if (recentOrders.length > 0) {
      console.log(
        "First order sample:",
        JSON.stringify(recentOrders[0], null, 2)
      );
    }

    const ordersWithDishes = await Promise.all(
      recentOrders.map(async (order) => {
        let dishes = [];
        console.log(
          "Processing order:",
          order._id,
          "with dishes array:",
          order.dishes
        );

        if (
          order.dishes &&
          Array.isArray(order.dishes) &&
          order.dishes.length > 0
        ) {
          try {
            console.log("Fetching dishes with IDs:", order.dishes);
            dishes = await Dish.find({ _id: { $in: order.dishes } }).lean();

            if (dishes.length === 0 && order.dishes.length > 0) {
              console.log(
                "No dishes found by ID, trying by name:",
                order.dishes
              );
              dishes = await Dish.find({ name: { $in: order.dishes } }).lean();
            }

            console.log(
              "Fetched",
              dishes.length,
              "dishes for order",
              order._id
            );
          } catch (err) {
            console.log("Could not fetch dish details:", err.message);
            dishes = [];
          }
        }

        return {
          ...order,
          items: dishes.map((d) => ({
            id: d._id,
            _id: d._id,
            name: d.name,
            price: d.price,
            image: d.image,
            description: d.description,
            dish: d,
          })),
          dishes: dishes.map((d) => ({
            id: d._id,
            _id: d._id,
            name: d.name,
            price: d.price,
            image: d.image,
            description: d.description,
          })),
        };
      })
    );

    const restaurantIds = [
      ...new Set(recentOrders.map((o) => o.rest_id).filter(Boolean)),
    ];
    const restaurants = await Restaurant.find({ _id: { $in: restaurantIds } })
      .select("name _id")
      .lean();

    const feedbacks = await Feedback.find({ customerName: username })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const responseData = {
      user: {
        name: user.name,
        email: user.email,
      },
      recentOrders: ordersWithDishes.map((order) => ({
        id: order._id,
        restaurant: order.restaurant,
        rest_id: order.rest_id,
        date: order.date,
        totalAmount: order.totalAmount,
        items: order.items || [],
        dishes: order.dishes || [],
      })),
      orders: ordersWithDishes.map((order) => ({
        id: order._id,
        restaurant: order.restaurant,
        rest_id: order.rest_id,
        date: order.date,
        totalAmount: order.totalAmount,
        items: order.items || [],
        dishes: order.dishes || [],
      })),
      restaurants: restaurants.map((r) => ({
        id: r._id,
        name: r.name,
      })),
      feedbacks: feedbacks.map((fb) => ({
        id: fb._id,
        rest_id: fb.rest_id,
        orderId: fb.orderId,
        diningRating: fb.diningRating,
        orderRating: fb.orderRating,
        lovedItems: fb.lovedItems,
        additionalFeedback: fb.additionalFeedback,
        status: fb.status,
        createdAt: fb.createdAt,
      })),
    };

    console.log(
      "Response data - recentOrders count:",
      responseData.recentOrders.length
    );
    console.log("Response data - orders count:", responseData.orders.length);
    if (responseData.recentOrders[0]) {
      console.log(
        "Sample items from first order count:",
        responseData.recentOrders[0].items.length
      );
      console.log(
        "Sample items:",
        JSON.stringify(responseData.recentOrders[0].items.slice(0, 2), null, 2)
      );
    }

    res.json(responseData);
  } catch (error) {
    console.error("Error fetching feedback data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.submitFeedback = async (req, res) => {
  try {
    const {
      rest_id,
      orderId,
      diningRating,
      lovedItems,
      orderRating,
      additionalFeedback,
    } = req.body;
    const username = req.session.username;

    if (!username) {
      return res.status(401).json({ error: "Unauthorized. Please login." });
    }

    // Validate rest_id is provided
    if (!rest_id) {
      return res.status(400).json({
        error: "Restaurant ID is required. Please select a restaurant.",
      });
    }

    // Validate orderId is provided
    if (!orderId) {
      return res.status(400).json({
        error: "Order ID is required to submit feedback.",
      });
    }

    // Verify the restaurant exists
    const restaurant = await Restaurant.findById(rest_id);
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found." });
    }

    // Check if feedback has already been submitted for this specific order
    const existingFeedback = await Feedback.findOne({
      orderId: orderId,
    });

    if (existingFeedback) {
      return res.status(400).json({
        error:
          "You have already submitted feedback. Thank you for your input! You can only provide feedback once.",
      });
    }

    // Create feedback
    const feedback = await Feedback.create({
      rest_id: rest_id,
      orderId: orderId,
      customerName: username,
      diningRating: diningRating ? parseInt(diningRating) : null,
      lovedItems: lovedItems || "",
      orderRating: orderRating ? parseInt(orderRating) : null,
      additionalFeedback: additionalFeedback || "",
      status: "Pending",
      createdAt: new Date(),
    });

    // Return JSON response for React frontend
    res.json({
      success: true,
      message: "Feedback submitted successfully!",
      feedback: {
        id: feedback._id,
        rest_id: feedback.rest_id,
        orderId: feedback.orderId,
        customerName: feedback.customerName,
        diningRating: feedback.diningRating,
        orderRating: feedback.orderRating,
        lovedItems: feedback.lovedItems,
        additionalFeedback: feedback.additionalFeedback,
        status: feedback.status,
        createdAt: feedback.createdAt,
      },
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
  const newOrder = {
    id: Date.now(),
    restaurant,
    specialRequests,
    status: "Pending",
  };
  req.session.tempOrder = newOrder;
  const dishes_temp = req.session.temp_cart || [];
  let sum = 0;
  for (let a of dishes_temp) {
    const temp = await Dish.findByName(a.dish);
    sum += parseInt(temp.price) * a.quantity;
  }
  req.session.bill = sum;
  // If the request expects JSON (from SPA), respond with JSON instead of redirect
  const wantsJson =
    req.headers["content-type"]?.includes("application/json") ||
    req.headers["accept"]?.includes("application/json");
  if (wantsJson) {
    return res.json({
      success: true,
      message: "Order stored in session",
      bill: req.session.bill,
    });
  }
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
  const wantsJson =
    req.headers["content-type"]?.includes("application/json") ||
    req.headers["accept"]?.includes("application/json");
  if (wantsJson) {
    return res.json({
      success: true,
      message: "Reservation stored in session",
      reservation: req.session.reservation,
    });
  }
  res.redirect("/customer/payments");
};

exports.postOrderAndReservationCombined = async (req, res) => {
  try {
    const { restaurant, specialRequests, date, time, guests } = req.body;

    const newOrder = {
      id: Date.now(),
      restaurant,
      specialRequests,
      status: "Pending",
    };
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
    const wantsJson =
      req.headers["content-type"]?.includes("application/json") ||
      req.headers["accept"]?.includes("application/json");
    if (wantsJson) {
      return res.json({
        success: true,
        message: "Order+Reservation stored in session",
        bill: req.session.bill,
      });
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
        status: "waiting",
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

    const wantsJson =
      req.headers["content-type"]?.includes("application/json") ||
      req.headers["accept"]?.includes("application/json");
    if (wantsJson) {
      return res.json({
        success: true,
        message: "Payment successful, order/reservation completed",
      });
    }
    res.redirect("/customer/feedback");
  } catch (error) {
    console.error("Error in postPaymentsSuccess:", error);
    res.status(500).send("Internal Server Error");
  }
};

// API: create order and/or reservation from SPA
exports.apiCheckout = async (req, res) => {
  try {
    const username = req.session.username || null;
    const {
      rest_id,
      items,
      totalAmount,
      reservation,
      promoCode,
      promoDiscount,
    } = req.body;

    if (!rest_id)
      return res
        .status(400)
        .json({ success: false, message: "", error: "rest_id is required" });
    if (!Array.isArray(items) || items.length === 0)
      return res
        .status(400)
        .json({ success: false, message: "", error: "items are required" });

    // Calculate final amount with promo discount
    const baseAmount = Number(totalAmount) || 0;
    const discount = Number(promoDiscount) || 0;
    const finalAmount = Math.max(0, baseAmount - discount);

    // Create Order
    const dishes = items
      .map((i) => i.name || i.dish || i.id || "")
      .filter(Boolean);
    const order = new Order({
      dishes,
      customerName: username || "guest",
      restaurant: req.body.restaurantName || "",
      rest_id,
      status: "pending",
      totalAmount: finalAmount,
      promoCode: promoCode || null,
      promoDiscount: discount || 0,
    });
    await order.save();

    // Attach order to restaurant
    const rest = await Restaurant.find_by_id(rest_id);
    if (rest) {
      rest.orders = rest.orders || [];
      rest.orders.push(order._id);
      await rest.save();
    }

    // If reservation provided with all required fields, add to restaurant reservations
    // Create reservation if date and time are provided (table_id can be assigned later by staff)
    let reservationSaved = null;
    if (reservation && reservation.date && reservation.time) {
      // Ensure rest_id is a string for consistency
      const restIdString = String(rest_id);

      const newReservation = new Reservation({
        customerName: username || reservation.name || "guest",
        time: reservation.time,
        table_id: reservation.table_id || "", // Optional - staff will assign
        guests: reservation.guests || 1,
        status: "pending",
        rest_id: restIdString,
        date: reservation.date,
      });
      await newReservation.save();
      console.log(
        "✅ Created reservation:",
        newReservation._id,
        "for rest_id:",
        restIdString
      );

      order.reservation_id = newReservation._id;
      await order.save();
      reservationSaved = newReservation;

      // Add reservation to restaurant's reservations array
      const restForReservation = await Restaurant.find_by_id(restIdString);
      if (restForReservation) {
        restForReservation.reservations = restForReservation.reservations || [];
        restForReservation.reservations.push({
          id: newReservation._id,
          name: newReservation.customerName,
          guests: newReservation.guests,
          date:
            newReservation.date instanceof Date
              ? newReservation.date.toISOString().split("T")[0]
              : String(newReservation.date),
          time: newReservation.time,
          tables: newReservation.table_id ? [newReservation.table_id] : [],
          allocated: false,
        });
        await restForReservation.save();
        console.log("✅ Added reservation to restaurant reservations array");
      } else {
        console.warn("⚠️ Restaurant not found for rest_id:", restIdString);
      }
    }

    // Return created ids for frontend to proceed to payment
    return res.json({
      success: true,
      data: {
        orderId: order._id,
        reservation: reservationSaved ? { id: reservationSaved._id } : null,
        amount: order.totalAmount,
      },
      message: "",
    });
  } catch (err) {
    console.error("apiCheckout error:", err);
    return res
      .status(500)
      .json({ success: false, message: "", error: "Server error" });
  }
};

// API: confirm payment for an order/reservation
exports.apiCheckoutPay = async (req, res) => {
  try {
    const { orderId, rest_id, payload } = req.body;

    let order = null;

    // If orderId provided, find existing order
    if (orderId) {
      if (!rest_id) {
        return res.status(400).json({
          success: false,
          error:
            "rest_id is required when confirming payment for existing order",
        });
      }
      order = await Order.findOne({ _id: orderId });
      if (!order) {
        return res
          .status(404)
          .json({ success: false, error: "Order not found" });
      }

      // If order has a reservation_id, ensure it's in the restaurant's reservations array
      if (order.reservation_id) {
        const existingReservation = await Reservation.findOne({
          _id: order.reservation_id,
        });
        if (existingReservation) {
          const orderRestId = String(rest_id || order.rest_id);
          const restForReservation = await Restaurant.find_by_id(orderRestId);
          if (restForReservation) {
            // Check if reservation already exists in restaurant's reservations array
            const reservationExists = restForReservation.reservations.some(
              (r) => r.id === existingReservation._id
            );
            if (!reservationExists) {
              restForReservation.reservations =
                restForReservation.reservations || [];
              restForReservation.reservations.push({
                id: existingReservation._id,
                name: existingReservation.customerName,
                guests: existingReservation.guests,
                date:
                  existingReservation.date instanceof Date
                    ? existingReservation.date.toISOString().split("T")[0]
                    : String(existingReservation.date),
                time: existingReservation.time,
                tables: [existingReservation.table_id],
                allocated: existingReservation.allocated || false,
              });
              await restForReservation.save();
              console.log(
                "✅ Added existing reservation to restaurant reservations array"
              );
            }
          } else {
            console.warn("⚠️ Restaurant not found for rest_id:", orderRestId);
          }
        } else {
          console.warn(
            "⚠️ Reservation not found for reservation_id:",
            order.reservation_id
          );
        }
      }
    } else {
      // Create order from payload
      if (!payload) {
        return res.status(400).json({
          success: false,
          error: "Missing payload. Please provide order details.",
        });
      }
      if (!payload.rest_id) {
        return res.status(400).json({
          success: false,
          error: "Restaurant ID (rest_id) is required",
        });
      }
      if (!Array.isArray(payload.items) || payload.items.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Items array is required and cannot be empty",
        });
      }

      const username = req.session.username || null;
      const dishes = payload.items
        .map((i) => i.name || i.dish || i.id || "")
        .filter(Boolean);

      if (dishes.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No valid dish names found in items",
        });
      }

      const baseAmount = Number(payload.totalAmount) || 0;
      const promoDiscount = Number(payload.promoDiscount) || 0;
      const finalAmount = Math.max(0, baseAmount - promoDiscount);

      if (finalAmount <= 0) {
        return res.status(400).json({
          success: false,
          error: "Total amount must be greater than 0",
        });
      }

      order = new Order({
        dishes,
        customerName: username || "guest",
        restaurant: payload.restaurantName || "",
        rest_id: payload.rest_id,
        status: "pending",
        totalAmount: finalAmount,
        promoCode: payload.promoCode || null,
        promoDiscount: promoDiscount || 0,
      });
      await order.save();

      // Apply promo code usage if promo code was used
      if (payload.promoCode) {
        try {
          const promoCodeDoc = await PromoCode.findOne({
            code: payload.promoCode.toUpperCase().trim(),
          });
          if (promoCodeDoc) {
            promoCodeDoc.usedCount += 1;
            await promoCodeDoc.save();
          }
        } catch (e) {
          console.warn("Failed to increment promo code usage:", e);
        }
      }

      // Attach order to restaurant
      const rest = await Restaurant.find_by_id(payload.rest_id);
      if (rest) {
        rest.orders = rest.orders || [];
        rest.orders.push(order._id);
        await rest.save();
      } else {
        console.warn(`Restaurant with id ${payload.rest_id} not found`);
      }

      // If reservation provided with all required fields, add to restaurant reservations
      // Create reservation if date and time are provided (table_id can be assigned later by staff)
      if (
        payload.reservation &&
        payload.reservation.date &&
        payload.reservation.time
      ) {
        // Ensure rest_id is a string for consistency
        const restIdString = String(payload.rest_id);

        const newReservation = new Reservation({
          customerName: username || payload.reservation.name || "guest",
          time: payload.reservation.time,
          table_id: payload.reservation.table_id || "", // Optional - staff will assign
          guests: payload.reservation.guests || 1,
          status: "pending",
          rest_id: restIdString,
          date: payload.reservation.date,
        });
        await newReservation.save();
        console.log(
          "✅ Created reservation:",
          newReservation._id,
          "for rest_id:",
          restIdString
        );

        order.reservation_id = newReservation._id;
        await order.save();

        // Add reservation to restaurant's reservations array
        const restForReservation = await Restaurant.find_by_id(restIdString);
        if (restForReservation) {
          restForReservation.reservations =
            restForReservation.reservations || [];
          restForReservation.reservations.push({
            id: newReservation._id,
            name: newReservation.customerName,
            guests: newReservation.guests,
            date:
              newReservation.date instanceof Date
                ? newReservation.date.toISOString().split("T")[0]
                : String(newReservation.date),
            time: newReservation.time,
            tables: newReservation.table_id ? [newReservation.table_id] : [],
            allocated: false,
          });
          await restForReservation.save();
          console.log("✅ Added reservation to restaurant reservations array");
        } else {
          console.warn("⚠️ Restaurant not found for rest_id:", restIdString);
        }
      }
    }

    // At this point we have an order object; mark payment as paid but keep status as pending for kitchen
    order.status = "pending"; // Keep as pending until kitchen prepares it
    order.paymentStatus = "paid"; // Mark payment as completed
    order.completionTime = new Date();
    await order.save();

    // Add payment to restaurant record
    const finalRestId =
      rest_id || (order && order.rest_id) || (payload && payload.rest_id);
    if (finalRestId) {
      const rest = await Restaurant.find_by_id(finalRestId);
      if (rest) {
        rest.payments = rest.payments || [];
        rest.payments.push({ amount: order.totalAmount, date: new Date() });
        await rest.save();
      }
    }

    // If user exists, add order to their history and clear cart
    if (req.session.username) {
      const person = await Person.findOne({ name: req.session.username });
      if (person) {
        await person.add_order({
          name: order.restaurant || "",
          items: order.dishes,
        });
        person.cart = [];
        await person.save();
      }
    }

    return res.json({
      success: true,
      data: { orderId: order._id },
      message: "Payment processed and order created",
    });
  } catch (err) {
    console.error("apiCheckoutPay error:", err);
    const errorMessage = err.message || "Server error";
    return res
      .status(500)
      .json({ success: false, message: "", error: errorMessage });
  }
};

// API: get order details by ID for Order Placed page
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res
        .status(400)
        .json({ success: false, message: "", error: "orderId is required" });
    }
    const order = await Order.findOne({ _id: orderId });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "", error: "Order not found" });
    }
    // Optional: ensure current user owns the order
    if (
      req.session?.username &&
      order.customerName &&
      order.customerName !== req.session.username
    ) {
      return res
        .status(403)
        .json({ success: false, message: "", error: "Forbidden" });
    }

    let reservation = null;
    if (order.reservation_id) {
      reservation = await Reservation.findOne({ _id: order.reservation_id });
    }

    return res.json({
      success: true,
      data: { order, reservation },
      message: "",
    });
  } catch (err) {
    console.error("getOrderById error:", err);
    return res
      .status(500)
      .json({ success: false, message: "", error: "Server error" });
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
  try {
    const currentUsername = req.session.username;
    const { name, email, phone, newPassword, confirmPassword } = req.body;
    const profilePicFilename = req.file ? req.file.filename : null;

    // First, find and update the User model (authentication)
    const userRole = await User.findOne({ username: currentUsername });
    if (!userRole) {
      const wantsJson =
        req.headers["content-type"]?.includes("application/json");
      if (wantsJson) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }
      return res.status(404).send("User not found");
    }

    // Handle password change
    if (newPassword || confirmPassword) {
      if (!newPassword || !confirmPassword) {
        const wantsJson =
          req.headers["content-type"]?.includes("application/json");
        if (wantsJson) {
          return res.status(400).json({
            success: false,
            error: "Both password fields are required",
          });
        }
        return res.status(400).send("Both password fields are required");
      }
      if (newPassword !== confirmPassword) {
        const wantsJson =
          req.headers["content-type"]?.includes("application/json");
        if (wantsJson) {
          return res
            .status(400)
            .json({ success: false, error: "Passwords do not match" });
        }
        return res.status(400).send("Passwords do not match");
      }
      if (newPassword.length < 6) {
        const wantsJson =
          req.headers["content-type"]?.includes("application/json");
        if (wantsJson) {
          return res.status(400).json({
            success: false,
            error: "Password must be at least 6 characters",
          });
        }
        return res.status(400).send("Password must be at least 6 characters");
      }
      userRole.password = newPassword;
    }

    // Update username in User model only if name changed
    if (name && name !== currentUsername) {
      const existingUser = await User.findOne({ username: name });
      if (existingUser && existingUser.username !== currentUsername) {
        const wantsJson =
          req.headers["content-type"]?.includes("application/json");
        if (wantsJson) {
          return res
            .status(400)
            .json({ success: false, error: "Username already exists" });
        }
        return res.status(400).send("Username already exists");
      }
      userRole.username = name;
    }

    // Update email and role in User model
    if (email) userRole.email = email;
    await userRole.save();

    // Now update the Person model (customer profile)
    const person = await Person.findOne({ name: currentUsername });
    if (!person) {
      const wantsJson =
        req.headers["content-type"]?.includes("application/json");
      if (wantsJson) {
        return res
          .status(404)
          .json({ success: false, error: "Customer profile not found" });
      }
      return res.status(404).send("Customer profile not found");
    }

    // If name is changing, also update related documents
    if (name && name !== currentUsername) {
      // Update all Orders with the old customer name
      const { Order } = require("../Model/Order_model");
      await Order.updateMany(
        { customerName: currentUsername },
        { customerName: name }
      );

      // Update all Feedback with the old customer name
      const Feedback = require("../Model/feedback");
      await Feedback.updateMany(
        { customerName: currentUsername },
        { customerName: name }
      );

      // Update reservations in restaurants
      const Restaurant = require("../Model/Restaurents_model").Restaurant;
      await Restaurant.updateMany(
        { "reservations.name": currentUsername },
        { $set: { "reservations.$[elem].name": name } },
        { arrayFilters: [{ "elem.name": currentUsername }] }
      );

      console.log(
        `✅ Updated all references from ${currentUsername} to ${name}`
      );
    }

    // Update session if name changed
    if (name && name !== currentUsername) {
      req.session.username = name;
    }

    // Update person profile
    person.name = name || person.name;
    person.username = userRole.username || name || person.name;
    person.email = email || person.email;
    person.phone = phone || person.phone;
    // Update image URL if a new file was uploaded
    if (profilePicFilename) {
      person.img_url = profilePicFilename;
    }
    await person.save();

    // Check if request wants JSON response (from React frontend)
    const wantsJson =
      req.headers["content-type"]?.includes("application/json") ||
      req.get("content-type")?.includes("formdata");
    if (wantsJson || req.method === "POST") {
      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: {
          name: person.name,
          email: person.email,
          phone: person.phone,
          img_url: getProfilePicUrl(req, person.img_url),
        },
      });
    }

    res.redirect("/customer/customerDashboard");
  } catch (error) {
    console.error("Error updating user profile:", error);
    const wantsJson = req.headers["content-type"]?.includes("application/json");
    if (wantsJson) {
      return res.status(500).json({
        success: false,
        error: "Internal server error",
        details: error.message,
      });
    }
    res.status(500).send("Internal Server Error");
  }
};

// Search and filter restaurants for customer homepage
exports.searchRestaurants = async (req, res) => {
  try {
    const { search, cuisine, openNow, maxDistance, sortBy, location } =
      req.query;

    let query = {};

    // Search by name or location
    if (search) {
      query.$or = [
        { name: { $regex: new RegExp(search.trim(), "i") } },
        { location: { $regex: new RegExp(search.trim(), "i") } },
      ];
    }

    // Filter by location
    if (location && location !== "All") {
      query.location = { $regex: new RegExp(location.trim(), "i") };
    }

    // Filter by cuisine
    if (cuisine && cuisine !== "All") {
      query.cuisine = { $in: [cuisine] };
    }

    // Filter by distance (if distance field exists)
    if (maxDistance) {
      query.distance = { $lte: parseFloat(maxDistance) };
    }

    let restaurants = await Restaurant.find(query);

    // Filter by open now (simplified - check isOpen field and operating hours)
    if (openNow === "true") {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      restaurants = restaurants.filter((restaurant) => {
        if (!restaurant.isOpen) return false;

        // Check operating hours if they exist
        if (
          restaurant.operatingHours &&
          restaurant.operatingHours.open &&
          restaurant.operatingHours.close
        ) {
          try {
            const [openHour, openMin] = restaurant.operatingHours.open
              .split(":")
              .map(Number);
            const [closeHour, closeMin] = restaurant.operatingHours.close
              .split(":")
              .map(Number);
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
        case "rating":
          restaurants.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case "name":
          restaurants.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case "distance":
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

    const restaurantsWithStatus = restaurants.map((restaurant) => {
      let isCurrentlyOpen = restaurant.isOpen;

      if (
        restaurant.operatingHours &&
        restaurant.operatingHours.open &&
        restaurant.operatingHours.close
      ) {
        try {
          const [openHour, openMin] = restaurant.operatingHours.open
            .split(":")
            .map(Number);
          const [closeHour, closeMin] = restaurant.operatingHours.close
            .split(":")
            .map(Number);
          const openTime = openHour * 60 + openMin;
          const closeTime = closeHour * 60 + closeMin;
          const currentTime = currentHour * 60 + currentMinute;

          isCurrentlyOpen =
            restaurant.isOpen &&
            currentTime >= openTime &&
            currentTime <= closeTime;
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
        operatingHours: restaurant.operatingHours,
      };
    });

    // Get all unique cuisines from all restaurants
    const allRestaurants = await Restaurant.find({});
    const allCuisines = new Set();
    allRestaurants.forEach((rest) => {
      if (rest.cuisine && Array.isArray(rest.cuisine)) {
        rest.cuisine.forEach((c) => allCuisines.add(c));
      }
    });

    res.json({
      restaurants: restaurantsWithStatus,
      availableCuisines: Array.from(allCuisines).sort(),
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
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });
    }

    const { dishId } = req.body;
    if (!dishId) {
      return res
        .status(400)
        .json({ success: false, error: "Dish ID is required" });
    }

    // Normalize dishId to string for comparison
    const dishIdStr = String(dishId);
    console.log(
      `[Favorites] Adding dish ${dishIdStr} for user ${customerName}`
    );

    const person = await Person.findOne({ name: customerName });

    if (!person) {
      return res
        .status(404)
        .json({ success: false, error: "Customer not found" });
    }

    if (!person.favourites) person.favourites = [];

    // Check if already favorited by comparing as strings
    const alreadyFavourited = person.favourites.some(
      (fav) => String(fav) === dishIdStr
    );

    if (alreadyFavourited) {
      console.log(`[Favorites] Dish ${dishIdStr} already in favorites`);
      return res
        .status(400)
        .json({ success: false, error: "Dish already in favourites" });
    }

    person.favourites.push(dishIdStr);
    person.markModified("favourites");
    await person.save();

    console.log(
      `[Favorites] Added dish ${dishIdStr} to favorites for ${customerName}`
    );
    res.json({ success: true, message: "Dish added to favourites" });
  } catch (error) {
    console.error("[Favorites] Add error:", error.message);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.removeFromFavourites = async (req, res) => {
  try {
    const customerName = req.session.username;
    if (!customerName) {
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });
    }

    const { dishId } = req.body;
    if (!dishId) {
      return res
        .status(400)
        .json({ success: false, error: "Dish ID is required" });
    }

    // Normalize dishId to string for comparison
    const dishIdStr = String(dishId);
    console.log(
      `[Favorites] Removing dish ${dishIdStr} for user ${customerName}`
    );

    const person = await Person.findOne({ name: customerName });
    if (!person) {
      return res
        .status(404)
        .json({ success: false, error: "Customer not found" });
    }

    // Remove from favourites using string comparison
    if (person.favourites) {
      person.favourites = person.favourites.filter(
        (id) => String(id) !== dishIdStr
      );
      person.markModified("favourites");
      await person.save();
    }

    console.log(`[Favorites] Removed dish ${dishIdStr} for ${customerName}`);
    res.json({ success: true, message: "Dish removed from favourites" });
  } catch (error) {
    console.error("[Favorites] Remove error:", error.message);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.getFavourites = async (req, res) => {
  try {
    const customerName = req.session.username;
    if (!customerName) {
      return res
        .status(401)
        .json({ success: false, error: "Not authenticated" });
    }

    console.log(`[Favorites] Fetching favorites for user: ${customerName}`);
    const person = await Person.findOne({ name: customerName });

    if (!person) {
      console.log(`[Favorites] Person not found for: ${customerName}`);
      return res.json([]);
    }

    const favouriteDishIds = person.favourites || [];
    console.log(`[Favorites] Found ${favouriteDishIds.length} favorite dishes`);

    if (favouriteDishIds.length === 0) {
      return res.json([]);
    }

    // Fetch full dish details with restaurant information
    const favoriteDishes = [];

    for (const dishId of favouriteDishIds) {
      try {
        // Find the dish
        const dish = await Dish.find_by_id(dishId);

        if (!dish) {
          console.log(`[Favorites] Dish ${dishId} not found, skipping`);
          continue;
        }

        // Find which restaurant(s) have this dish
        const restaurants = await Restaurant.find({ dishes: dishId });

        // Get image URL
        const imageUrl = getImageUrl(req, dish.image);

        // Format dish data
        const dishData = {
          _id: dish._id,
          id: dish._id,
          name: dish.name,
          price: dish.price,
          description: dish.description || "",
          image: imageUrl,
          imageUrl: imageUrl,
          // Include restaurant info if available
          restaurantId: restaurants.length > 0 ? restaurants[0]._id : null,
          rest_id: restaurants.length > 0 ? restaurants[0]._id : null,
          restaurantName: restaurants.length > 0 ? restaurants[0].name : null,
          restaurant: restaurants.length > 0 ? restaurants[0].name : null,
        };

        favoriteDishes.push(dishData);
      } catch (error) {
        console.error(
          `[Favorites] Error fetching dish ${dishId}:`,
          error.message
        );
        // Continue with other dishes even if one fails
        continue;
      }
    }

    console.log(
      `[Favorites] Returning ${favoriteDishes.length} favorite dishes with details`
    );
    res.json(favoriteDishes);
  } catch (error) {
    console.error("[Favorites] Get error:", error.message);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Validate promo code
exports.validatePromoCode = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: "Promo code is required",
      });
    }

    const promoCode = await PromoCode.findOne({
      code: code.toUpperCase().trim(),
    });

    if (!promoCode) {
      return res.status(404).json({
        success: false,
        error: "Invalid promo code",
      });
    }

    const orderAmountNum = Number(orderAmount) || 0;
    const validation = promoCode.isValid(orderAmountNum);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    const discount = promoCode.calculateDiscount(orderAmountNum);
    const finalAmount = orderAmountNum - discount;

    return res.json({
      success: true,
      data: {
        code: promoCode.code,
        description: promoCode.description,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue,
        discount: discount,
        finalAmount: finalAmount,
      },
      message: "Promo code applied successfully",
    });
  } catch (error) {
    console.error("validatePromoCode error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};

// Apply promo code to order (increment usage count)
exports.applyPromoCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: "Promo code is required",
      });
    }

    const promoCode = await PromoCode.findOne({
      code: code.toUpperCase().trim(),
    });

    if (!promoCode) {
      return res.status(404).json({
        success: false,
        error: "Invalid promo code",
      });
    }

    // Increment usage count
    promoCode.usedCount += 1;
    await promoCode.save();

    return res.json({
      success: true,
      message: "Promo code applied to order",
    });
  } catch (error) {
    console.error("applyPromoCode error:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
};



exports.getPublicCuisines = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({}, "cuisine");
    const cuisineSet = new Set();

    restaurants.forEach((r) => {
      if (Array.isArray(r.cuisine)) {
        r.cuisine.forEach((c) => cuisineSet.add(c));
      }
    });

    res.json({
      cuisines: Array.from(cuisineSet).sort(),
    });
  } catch (error) {
    console.error("Error fetching cuisines:", error);
    res.status(500).json({ error: "Failed to fetch cuisines" });
  }
};
