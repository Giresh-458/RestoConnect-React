const { connectDB, mongoose } = require("../util/database");
const { User } = require("../Model/userRoleModel");
const Person = require("../Model/customer_model");
const { Order } = require("../Model/Order_model");
const { Restaurant } = require("../Model/Restaurents_model");
const { Dish } = require("../Model/Dishes_model_test");
const { Reservation } = require("../Model/Reservation_model"); // Add this
const { Inventory } = require("../Model/Inventory_model");
const Feedback = require("../Model/feedback.js");
const bcrypt = require("bcrypt");

async function seed() {
  try {
    await connectDB();

    console.log('Clearing existing data...');
    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Person.deleteMany({}),
      Order.deleteMany({}),
      Restaurant.deleteMany({}),
      Dish.deleteMany({}),
      Feedback.deleteMany({}),
      Reservation.deleteMany({}),
      Inventory.deleteMany({})
    ]);

    // 1. Seed Dishes
    const dishesData = [
      {
        name: "Paneer Tikka",
        price: 250,
        description: "Delicious grilled paneer cubes marinated in spices",
        image: "/images/paneer_tikka.jpg",
      },
      {
        name: "Chicken Curry",
        price: 350,
        description: "Spicy and flavorful chicken curry cooked with herbs",
        image: "/images/chicken_curry.jpeg",
      },
      {
        name: "Veg Biryani",
        price: 300,
        description:
          "Aromatic basmati rice cooked with mixed vegetables and spices",
        image: "/images/biryani.jpg",
      },
      {
        name: "Fish Fry",
        price: 400,
        description: "Crispy fried fish with special spices",
        image: "/images/fish_fry.jpg",
      },
      {
        name: "Mutton Korma",
        price: 450,
        description: "Rich and creamy mutton curry with aromatic spices",
        image: "/images/mutton-korma.jpg",
      },
      {
        name: "Masala Dosa",
        price: 150,
        description: "Crispy dosa filled with spicy potato masala",
      },
    ];
    const dishes = await Dish.insertMany(dishesData);

    // 2. Seed Restaurants
    const restaurantsData = [
      {
        name: "Tasty Bites",
        image: "/images/Tasty_Bites.png",
        rating: 4.5,
        location: "Chennai",
        amount: 100,
        dishes: [dishes[0]._id, dishes[1]._id, dishes[2]._id],
        cuisine: ["Indian", "Vegetarian"],
        isOpen: true,
        operatingHours: { open: "09:00", close: "22:00" },
        distance: 2.5,
      },
      {
        name: "Spice Hub",
        image: "/images/SpiceHub.png",
        rating: 4.7,
        location: "Tirupati",
        amount: 120,
        dishes: [dishes[3]._id, dishes[4]._id],
        cuisine: ["Indian", "Non-Veg"],
        isOpen: true,
        operatingHours: { open: "10:00", close: "23:00" },
        distance: 3.2,
      },
      {
        name: "South Delight",
        image: "/images/SouthDelight.jpeg",
        rating: 4.3,
        location: "Hyderabad",
        amount: 90,
        dishes: [dishes[5]._id],
        cuisine: ["South Indian", "Vegetarian"],
        isOpen: true,
        operatingHours: { open: "08:00", close: "21:00" },
        distance: 1.8,
      },
      {
        name: "Green Garden",
        image: "/images/Green Garden.jpeg",
        rating: 4.6,
        location: "Chennai",
        amount: 110,
        dishes: [dishes[0]._id, dishes[2]._id],
        cuisine: ["Vegan", "Vegetarian"],
        isOpen: true,
        operatingHours: { open: "09:00", close: "22:00" },
        distance: 4.1,
      },
      {
        name: "Ocean Breeze",
        image: "/images/Ocean Breeze.jpeg",
        rating: 4.8,
        location: "Tirupati",
        amount: 130,
        dishes: [dishes[3]._id, dishes[4]._id],
        cuisine: ["Seafood", "Non-Veg"],
        isOpen: true,
        operatingHours: { open: "11:00", close: "23:00" },
        distance: 2.9,
      },
      {
        name: "Spicy Fiesta",
        image: "/images/Spicy Fiesta.jpeg",
        rating: 4.4,
        location: "Hyderabad",
        amount: 95,
        dishes: [dishes[1]._id, dishes[5]._id],
        cuisine: ["Mexican", "Vegetarian"],
        isOpen: false,
        operatingHours: { open: "12:00", close: "22:00" },
        distance: 5.5,
      },
      {
        name: "Urban Eats",
        image: "/images/Urban Eats.jpeg",
        rating: 4.2,
        location: "Chennai",
        amount: 105,
        dishes: [dishes[0]._id, dishes[1]._id],
        cuisine: ["Italian", "Fast Food"],
        isOpen: true,
        operatingHours: { open: "10:00", close: "22:00" },
        distance: 3.7,
      },
      {
        name: "Cozy Corner",
        image: "/images/Cozy Corner.jpeg",
        rating: 4.0,
        location: "Tirupati",
        amount: 85,
        dishes: [dishes[2]._id, dishes[5]._id],
        cuisine: ["Cafe", "Vegetarian"],
        isOpen: true,
        operatingHours: { open: "07:00", close: "20:00" },
        distance: 1.2,
      },
      {
        name: "The Spice Route",
        image: "/images/Spicy Route.jpeg",
        rating: 4.5,
        location: "Hyderabad",
        amount: 115,
        dishes: [dishes[1]._id, dishes[3]._id],
        cuisine: ["Indian", "Chinese"],
        isOpen: true,
        operatingHours: { open: "11:00", close: "23:00" },
        distance: 4.8,
      },
      {
        name: "Garden Fresh",
        image: "/images/Garden Fresh.jpeg",
        rating: 4.3,
        location: "Chennai",
        amount: 100,
        dishes: [dishes[0]._id, dishes[2]._id],
        cuisine: ["Vegan", "Organic"],
        isOpen: true,
        operatingHours: { open: "09:00", close: "21:00" },
        distance: 2.3,
      },
      {
        name: "Sunset Grill",
        image: "/images/Sunset Grill.avif",
        rating: 4.6,
        location: "Tirupati",
        amount: 125,
        dishes: [dishes[3]._id, dishes[4]._id],
        cuisine: ["BBQ", "Non-Veg"],
        isOpen: true,
        operatingHours: { open: "17:00", close: "23:00" },
        distance: 6.2,
      },
    ];

    // Add tables and payments fields
    restaurantsData.forEach((rest, index) => {
      rest.tables = [
        { number: "1", status: "available", seats: 2 },
        { number: "2", status: "available", seats: 3 },
        { number: "3", status: "available", seats: 4 },
        { number: "4", status: "available", seats: 5 },
        { number: "5", status: "available", seats: 6 },
      ];
      rest.totalTables = rest.tables.length;
      rest.payments = [
        { method: "UPI", amount: 500, date: new Date(), reference: `UPI-${index + 1}-A` },
        { method: "Card", amount: 750, date: new Date(), reference: `CARD-${index + 1}-B` },
      ];

      rest.inventoryData = {
        labels: [
          "Tomatoes",
          "Onions",
          "Chicken Breast",
          "Paneer",
          "Rice",
          "Cooking Oil",
          "Flour",
          "Cheese",
          "Milk",
          "Potatoes",
          "Spices Mix",
          "Fish",
        ],
        values: [
          50, // Tomatoes
          30, // Onions
          25, // Chicken Breast
          20, // Paneer
          100, // Rice
          15, // Cooking Oil
          40, // Flour
          20, // Cheese
          35, // Milk
          45, // Potatoes
          10, // Spices Mix
          18, // Fish
        ],
        units: [
          "kg",
          "kg",
          "kg",
          "kg",
          "kg",
          "L",
          "kg",
          "kg",
          "L",
          "kg",
          "kg",
          "kg",
        ],
        suppliers: [
          "Fresh Farms",
          "Local Market",
          "Meat World",
          "Dairy Fresh",
          "Grain Co",
          "Oil Mill",
          "Bakery Supply",
          "Dairy Fresh",
          "Dairy Fresh",
          "Fresh Farms",
          "Spice Traders",
          "Ocean Fresh",
        ],
      };
      rest.announcements = [
        {
          message: "Team meeting tomorrow at 10 AM",
          priority: "high",
          completedBy: [],
          active: true,
          createdAt: new Date(),
        },
        {
          message: "New menu items launching next week",
          priority: "normal",
          completedBy: [],
          active: true,
          createdAt: new Date(),
        },
      ];
      const today = new Date();
      rest.staffShifts = [
        {
          name: "Lunch Shift",
          startTime: "11:00",
          endTime: "15:00",
          date: today,
          assignedStaff: [`staff${index + 1}`],
          completed: false,
        },
        {
          name: "Dinner Shift",
          startTime: "17:00",
          endTime: "22:00",
          date: today,
          assignedStaff: [`staff${index + 1}`],
          completed: false,
        },
      ];
      rest.staffTasks = [
        {
          description: "Clean dining area",
          status: "Pending",
          assignedTo: [`staff${index + 1}`],
          priority: "medium",
          createdAt: new Date(),
        },
        {
          description: "Restock napkins and cutlery",
          status: "In Progress",
          assignedTo: [`staff${index + 1}`],
          priority: "high",
          createdAt: new Date(),
        },
        {
          description: "Prepare welcome drinks",
          status: "Pending",
          assignedTo: [`staff${index + 1}`],
          priority: "normal",
          createdAt: new Date(),
        },
      ];

      // Add support messages structure
      rest.supportMessages = [
        {
          from: `staff${index + 1}`,
          message: "POS is running slow at counter 1",
          status: "open",
          createdAt: new Date(),
          priority: "high",
        },
        {
          from: `owner${index + 1}`,
          message: "Schedule deep cleaning on weekend",
          status: "open",
          createdAt: new Date(),
          priority: "medium",
        },
      ];
    });

    const createdRestaurants = await Restaurant.insertMany(restaurantsData);

    // 3. Users
    const users = [
      {
        username: "admin1",
        email: "admin1@example.com",
        role: "admin",
        password: bcrypt.hashSync("123456", 10),
      },
    ];

    createdRestaurants.forEach((rest, idx) => {
      users.push(
        {
          username: `owner${idx + 1}`,
          email: `owner${idx + 1}@example.com`,
          role: "owner",
          restaurantName: rest.name,
          rest_id: rest._id,
          password: bcrypt.hashSync("123456", 10),
        },
        {
          username: `staff${idx + 1}`,
          email: `staff${idx + 1}@example.com`,
          role: "staff",
          restaurantName: rest.name,
          rest_id: rest._id,
          password: bcrypt.hashSync("123456", 10),
        }
      );
    });

    users.push(
      {
        username: "customer1",
        email: "customer1@example.com",
        role: "customer",
        password: bcrypt.hashSync("123456", 10),
      },
      {
        username: "customer2",
        email: "customer2@example.com",
        role: "customer",
        password: bcrypt.hashSync("123456", 10),
      },
      {
        username: "customer3",
        email: "customer3@example.com",
        role: "customer",
        password: bcrypt.hashSync("123456", 10),
      }
    );

    await User.insertMany(users);

    // 4. Customers
    const customers = [
      {
        name: "customer1",
        img_url: "customer1.jpg",
        email: "customer1@example.com",
        phone: "1234567890",
        prev_orders: [],
        top_dishes: { "Paneer Tikka": 3, "Veg Biryani": 2 },
        top_restaurent: { "Tasty Bites": 5 },
        cart: [{ name: "Paneer Tikka", qty: 1 }],
        favourites: [],
      },
      {
        name: "customer2",
        img_url: "customer2.jpg",
        email: "customer2@example.com",
        phone: "1234562890",
        prev_orders: [],
        top_dishes: { "Chicken Curry": 4 },
        top_restaurent: { "Spice Hub": 3 },
        cart: [{ name: "Masala Dosa", qty: 2 }],
        favourites: [],
      },
      {
        name: "customer3",
        img_url: "customer3.jpg",
        email: "customer3@example.com",
        phone: "1224567890",
        prev_orders: [],
        top_dishes: { "Masala Dosa": 1 },
        top_restaurent: { "South Delight": 2 },
        cart: [{ name: "Veg Biryani", qty: 1 }],
        favourites: [],
      },
    ];
    const createdCustomers = await Person.insertMany(customers);

    // Pre-populate customer favourites with valid Dish IDs so Favorite Dishes shows data
    if (createdCustomers && createdCustomers.length >= 3) {
      await Person.findByIdAndUpdate(createdCustomers[0]._id, {
        $set: { favourites: [dishes[0]._id.toString(), dishes[2]._id.toString()] }
      });
      await Person.findByIdAndUpdate(createdCustomers[1]._id, {
        $set: { favourites: [dishes[1]._id.toString(), dishes[5]._id.toString()] }
      });
      await Person.findByIdAndUpdate(createdCustomers[2]._id, {
        $set: { favourites: [dishes[3]._id.toString(), dishes[4]._id.toString()] }
      });
    }

    // 5. Orders for first restaurant
    const firstRestaurant = createdRestaurants[0];
    const customerA = createdCustomers[0];
    const customerB = createdCustomers[1];

    function randomDateInLastMonth() {
      const now = new Date();
      const past = new Date();
      past.setDate(now.getDate() - Math.floor(Math.random() * 30));
      return past;
    }

    function randomTimeWithinLastHour() {
      const now = new Date();
      const randomMinutes = Math.floor(Math.random() * 60);
      return new Date(now.getTime() - randomMinutes * 60 * 1000);
    }

    function randomCompletionTime(orderTime) {
      const serveTime = Math.floor(Math.random() * 15) + 8;
      return new Date(orderTime.getTime() + serveTime * 60 * 1000);
    }

    function randomRating() {
      const ratings = [4.0, 4.5, 4.5, 4.5, 5.0, 5.0, 4.0, 4.5, 5.0, 4.5];
      return ratings[Math.floor(Math.random() * ratings.length)];
    }

    function randomEstimatedTime(dishCount) {
      const baseTime = 10;
      const perDishTime = 3;
      return baseTime + dishCount * perDishTime;
    }
    // Use dish IDs instead of names
    const tastyBitesOrders = [
      {
        customerName: customerA.name,
        restaurant: firstRestaurant.name,
        rest_id: firstRestaurant._id,
        table_id: "T1",
        dishes: [dishes[0]._id, dishes[2]._id], // Paneer Tikka, Veg Biryani
        totalAmount: 550,
        status: "completed",
        tableNumber: "05",
        date: randomDateInLastMonth(),
        rating: 5.0,
        orderTime: (function () {
          const orderTime = randomTimeWithinLastHour();
          return orderTime;
        })(),
        completionTime: (function () {
          const orderTime = randomTimeWithinLastHour();
          return randomCompletionTime(orderTime);
        })(),
        estimatedTime: 18,
        assignedStaff: ["staff1"],
        feedback: "Excellent service and delicious food!",
      },
      {
        customerName: customerB.name,
        restaurant: firstRestaurant.name,
        rest_id: firstRestaurant._id,
        table_id: "T2",
        dishes: [dishes[0]._id], // Paneer Tikka
        totalAmount: 250,
        status: "pending",
        tableNumber: "02",
        date: randomDateInLastMonth(),
        rating: 4.5,
        orderTime: (function () {
          const orderTime = randomTimeWithinLastHour();
          return orderTime;
        })(),
        completionTime: null, // Pending orders don't have completion time
        estimatedTime: 12,
        assignedStaff: ["staff1"],
        feedback: "Good service, will visit again",
      },
      {
        customerName: customerA.name,
        restaurant: firstRestaurant.name,
        rest_id: firstRestaurant._id,
        table_id: "T3",
        dishes: [dishes[2]._id], // Veg Biryani
        totalAmount: 300,
        status: "preparing",
        tableNumber: "08",
        date: randomDateInLastMonth(),
        rating: 4.0,
        orderTime: (function () {
          const orderTime = randomTimeWithinLastHour();
          return orderTime;
        })(),
        completionTime: null, // Preparing orders don't have completion time yet
        estimatedTime: 15,
        assignedStaff: ["staff1"],
        feedback: "Tasty food, decent service",
      },
      {
        customerName: customerB.name,
        restaurant: firstRestaurant.name,
        rest_id: firstRestaurant._id,
        table_id: "T4",
        dishes: [dishes[0]._id, dishes[2]._id], // Paneer Tikka, Veg Biryani
        totalAmount: 550,
        status: "completed",
        tableNumber: "03",
        date: randomDateInLastMonth(),
        rating: 5.0,
        orderTime: (function () {
          const orderTime = randomTimeWithinLastHour();
          return orderTime;
        })(),
        completionTime: (function () {
          const orderTime = randomTimeWithinLastHour();
          return randomCompletionTime(orderTime);
        })(),
        estimatedTime: 22,
        assignedStaff: ["staff1"],
        feedback: "Outstanding service! Very prompt and friendly staff.",
      },
      {
        customerName: customerA.name,
        restaurant: firstRestaurant.name,
        rest_id: firstRestaurant._id,
        table_id: "T5",
        dishes: [dishes[0]._id], // Paneer Tikka
        totalAmount: 250,
        status: "completed",
        tableNumber: "01",
        date: randomDateInLastMonth(),
        rating: 4.5,
        orderTime: (function () {
          const orderTime = randomTimeWithinLastHour();
          return orderTime;
        })(),
        completionTime: (function () {
          const orderTime = randomTimeWithinLastHour();
          return randomCompletionTime(orderTime);
        })(),
        estimatedTime: 12,
        assignedStaff: ["staff1"],
        feedback: "Quick service, good quality",
      },
    ];

    const todayOrders = [
      {
        customerName: customerA.name,
        restaurant: firstRestaurant.name,
        rest_id: firstRestaurant._id,
        table_id: "T10",
        dishes: [dishes[0]._id], // Paneer Tikka
        totalAmount: 250,
        status: "completed",
        tableNumber: "10",
        date: new Date(),
        rating: 5.0,
        orderTime: new Date(new Date().setHours(12, 30, 0, 0)),
        completionTime: new Date(new Date().setHours(12, 42, 0, 0)),
        estimatedTime: 15,
        assignedStaff: ["staff1"],
        feedback: "Quick and efficient service!",
      },
      {
        customerName: customerB.name,
        restaurant: firstRestaurant.name,
        rest_id: firstRestaurant._id,
        table_id: "T11",
        dishes: [dishes[2]._id, dishes[5]._id], // Veg Biryani, Masala Dosa
        totalAmount: 450,
        status: "completed",
        tableNumber: "11",
        date: new Date(),
        rating: 4.5,
        orderTime: new Date(new Date().setHours(13, 15, 0, 0)),
        completionTime: new Date(new Date().setHours(13, 32, 0, 0)),
        estimatedTime: 20,
        assignedStaff: ["staff1"],
        feedback: "Food was delicious, service was good",
      },
      {
        customerName: customerA.name,
        restaurant: firstRestaurant.name,
        rest_id: firstRestaurant._id,
        table_id: "T12",
        dishes: [dishes[1]._id], // Chicken Curry
        totalAmount: 350,
        status: "completed",
        tableNumber: "12",
        date: new Date(),
        rating: 4.0,
        orderTime: new Date(new Date().setHours(14, 0, 0, 0)),
        completionTime: new Date(new Date().setHours(14, 18, 0, 0)),
        estimatedTime: 15,
        assignedStaff: ["staff1"],
        feedback: "Nice ambiance, good food",
      },
      {
        customerName: customerB.name,
        restaurant: firstRestaurant.name,
        rest_id: firstRestaurant._id,
        table_id: "T13",
        dishes: [dishes[3]._id], // Fish Fry
        totalAmount: 400,
        status: "completed",
        tableNumber: "13",
        date: new Date(),
        rating: 4.5,
        orderTime: new Date(new Date().setHours(15, 20, 0, 0)),
        completionTime: new Date(new Date().setHours(15, 35, 0, 0)),
        estimatedTime: 12,
        assignedStaff: ["staff1"],
        feedback: "Crispy and tasty!",
      },
      {
        customerName: customerA.name,
        restaurant: firstRestaurant.name,
        rest_id: firstRestaurant._id,
        table_id: "T14",
        dishes: [dishes[4]._id], // Mutton Korma (no "Rice" dish in seed, using Mutton Korma only)
        totalAmount: 450,
        status: "completed",
        tableNumber: "14",
        date: new Date(),
        rating: 5.0,
        orderTime: new Date(new Date().setHours(19, 0, 0, 0)),
        completionTime: new Date(new Date().setHours(19, 22, 0, 0)),
        estimatedTime: 18,
        assignedStaff: ["staff1"],
        feedback: "Excellent dinner service!",
      },
    ];

    const allOrders = [...tastyBitesOrders, ...todayOrders].map(order => ({
  ...order,
  createdAt: order.orderTime || order.date || new Date(), // ✅ MAGIC LINE
}));

const createdOrders = await Order.insertMany(allOrders);

    firstRestaurant.orders = createdOrders.map((order) => order._id);
    await firstRestaurant.save();

    //  6️ Seed Reservations for first restaurant
    // 6️ Reservations (linked to first restaurant)
    const tastyBitesReservations = [
      {
        customerName: customerA.name,
        time: '7:30 PM',
        table_id: 'T1',
        guests: 4,
        status: 'confirmed',
        rest_id: firstRestaurant._id,
        date: new Date(), // ✅ optional
      },
      {
        customerName: customerB.name,
        time: '8:00 PM',
        table_id: 'T2',
        guests: 2,
        status: 'pending',
        rest_id: firstRestaurant._id,
        date: new Date(),
      },
      {
        customerName: createdCustomers[2].name,
        time: '9:00 PM',
        table_id: 'T3',
        guests: 3,
        status: 'completed',
        rest_id: firstRestaurant._id,
        date: new Date(),
      },
      // ✅ add more sample reservations if you want
      {
        customerName: customerA.name,
        time: '6:45 PM',
        table_id: 'T4',
        guests: 5,
        status: 'pending',
        rest_id: firstRestaurant._id,
        date: new Date(),
      },
    ];
    await Reservation.insertMany(tastyBitesReservations);
    console.log("✅ Reservations seeded successfully");



    // Map orders by customer to avoid ParallelSaveError
    const customerOrdersMap = {};
    allOrders.forEach((order) => {
      if (!customerOrdersMap[order.customerName])
        customerOrdersMap[order.customerName] = [];
      customerOrdersMap[order.customerName].push({
        name: order.restaurant,
        items: order.dishes,
      });
    });

    for (let custName in customerOrdersMap) {
      const customer = await Person.findOne({ name: custName });
      customer.prev_orders.push(...customerOrdersMap[custName]);
      await customer.save();
    }

    // Update first restaurant payments
    firstRestaurant.payments = [];

    allOrders.forEach((order) => {
      firstRestaurant.payments.push({
        amount: order.totalAmount,
        date: order.date,
      });
    });

    await firstRestaurant.save();

    // // 6. Inventory items for first restaurant (Spice Hub)

        // 6️⃣ Inventory items for all restaurants (including Spice Hub & Tasty Bites)
    for (const rest of createdRestaurants) {
      let inventoryItems;

      // Give Spice Hub a few extra inventory items for variety
      if (rest.name === 'Spice Hub') {
        inventoryItems = [
          { name: 'Tomato Sauce', unit: 'L', quantity: 1.5, minStock: 0.5, rest_id: rest._id },
          { name: 'Paneer', unit: 'Kg', quantity: 2, minStock: 0.5, rest_id: rest._id },
          { name: 'Rice', unit: 'Kg', quantity: 20, minStock: 5, rest_id: rest._id },
          { name: 'Chicken', unit: 'Kg', quantity: 8, minStock: 2, rest_id: rest._id },
          { name: 'Onions', unit: 'Kg', quantity: 6, minStock: 2, rest_id: rest._id },
          { name: 'Cooking Oil', unit: 'L', quantity: 5, minStock: 2, rest_id: rest._id },
        ];
      } else {
        // Default inventory for all other restaurants (including Tasty Bites)
        inventoryItems = [
          { name: 'Tomato Sauce', unit: 'L', quantity: 1, minStock: 0.5, rest_id: rest._id },
          { name: 'Paneer', unit: 'Kg', quantity: 1, minStock: 0.2, rest_id: rest._id },
          { name: 'Rice', unit: 'Kg', quantity: 15, minStock: 2, rest_id: rest._id },
          { name: 'Onions', unit: 'Kg', quantity: 3, minStock: 1, rest_id: rest._id },
          { name: 'Potatoes', unit: 'Kg', quantity: 5, minStock: 2, rest_id: rest._id },
        ];
      }

      await Inventory.insertMany(inventoryItems);
    }


    console.log('Seeding feedback...');
    // 7. Feedback - Must include rest_id (String) matching Restaurant._id
    const feedbacks = [
      {
        customerName: "customer1",
        rest_id: firstRestaurant._id, // Tasty Bites (String ID from shortid)
        diningRating: 5,
        lovedItems: "Paneer Tikka, Veg Biryani",
        orderRating: 4,
        additionalFeedback: "Loved the ambiance!",
        status: 'Pending',
        createdAt: randomDateInLastMonth()
      },
      {
        customerName: "customer2",
        rest_id: firstRestaurant._id, // Tasty Bites (String ID from shortid)
        diningRating: 4,
        lovedItems: "Paneer Tikka",
        orderRating: 5,
        additionalFeedback: "Tasty food!",
        status: 'Resolved',
        createdAt: randomDateInLastMonth()
      },
      {
        customerName: "customer3",
        rest_id: createdRestaurants[1]._id, // Spice Hub (String ID from shortid)
        diningRating: 5,
        lovedItems: "Masala Dosa",
        orderRating: 5,
        additionalFeedback: "Perfect breakfast!",
        status: 'Pending',
        createdAt: randomDateInLastMonth()
      },
    ];

    await Feedback.insertMany(feedbacks);
    console.log(`Created ${feedbacks.length} feedback entries`);

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📋 Demo Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:');
    console.log('  Username: admin1');
    console.log('  Password: 123456');
    console.log('\nOwner (Tasty Bites):');
    console.log('  Username: owner1');
    console.log('  Password: 123456');
    console.log('\nStaff:');
    console.log('  Username: staff1');
    console.log('  Password: 123456');
    console.log('\nCustomers:');
    console.log('  Username: customer1 / customer2 / customer3');
    console.log('  Password: 123456');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    mongoose.connection.close();
  }
}

seed();
