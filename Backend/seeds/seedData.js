const { connectDB, mongoose } = require("../util/database");
const { User } = require("../Model/userRoleModel");
const Person = require("../Model/customer_model");
const { Order } = require("../Model/Order_model");
const { Restaurant } = require("../Model/Restaurents_model");
const { Dish } = require("../Model/Dishes_model_test");
const { Reservation } = require("../Model/Reservation_model");
const { Inventory } = require("../Model/Inventory_model");
const { PromoCode } = require("../Model/PromoCode_model");
const { Cart } = require("../Model/Cart_model");
const SupportTicket = require("../Model/SupportTicket_model");
const Feedback = require("../Model/feedback.js");
const bcrypt = require("bcrypt");

async function seed() {
  try {
    await connectDB();

    console.log("Clearing existing data...");
    await Promise.all([
      User.deleteMany({}),
      Person.deleteMany({}),
      Order.deleteMany({}),
      Restaurant.deleteMany({}),
      Dish.deleteMany({}),
      Feedback.deleteMany({}),
      Reservation.deleteMany({}),
      Inventory.deleteMany({}),
      PromoCode.deleteMany({}),
      Cart.deleteMany({}),
      SupportTicket.deleteMany({}),
    ]);

    // ═══════════════════════════════════════════
    // 1. SEED DISHES
    // ═══════════════════════════════════════════
    const dishesData = [
      {
        name: "Paneer Tikka",
        price: 250,
        description: "Delicious grilled paneer cubes marinated in spices",
        image: "/images/paneer_tikka.jpg",
        serves: 2,
      },
      {
        name: "Chicken Curry",
        price: 350,
        description: "Spicy and flavorful chicken curry cooked with herbs",
        image: "/images/chicken_curry.jpeg",
        serves: 3,
      },
      {
        name: "Veg Biryani",
        price: 300,
        description:
          "Aromatic basmati rice cooked with mixed vegetables and spices",
        image: "/images/biryani.jpg",
        serves: 2,
      },
      {
        name: "Fish Fry",
        price: 400,
        description: "Crispy fried fish with special spices",
        image: "/images/fish_fry.jpg",
        serves: 2,
      },
      {
        name: "Mutton Korma",
        price: 450,
        description: "Rich and creamy mutton curry with aromatic spices",
        image: "/images/mutton-korma.jpg",
        serves: 3,
      },
      {
        name: "Masala Dosa",
        price: 150,
        description: "Crispy dosa filled with spicy potato masala",
        image: "/images/masala-dosa.jpg",
        serves: 1,
      },
      {
        name: "Palak Paneer",
        price: 280,
        description: "Creamy spinach curry with paneer cubes",
        image: "/images/palak-paneer.jpg",
        serves: 2,
      },
      {
        name: "Butter Chicken",
        price: 380,
        description: "Rich and creamy tomato-based curry with tender chicken",
        image: "/images/butter-chicken.jpg",
        serves: 2,
      },
      {
        name: "Idli Sambar",
        price: 120,
        description: "Steamed rice cakes served with lentil soup and chutney",
        image: "/images/idli-sambar.png",
        serves: 1,
      },
      {
        name: "Prawn Masala",
        price: 420,
        description: "Spicy prawns cooked in aromatic masala",
        image: "/images/prawn-masala.jpg",
        serves: 2,
      },
      {
        name: "Vegetable Tacos",
        price: 200,
        description: "Mexican tacos filled with fresh vegetables and salsa",
        image: "/images/veg-tacos.jpg",
        serves: 1,
      },
      {
        name: "Margherita Pizza",
        price: 320,
        description: "Classic Italian pizza with tomato, mozzarella, and basil",
        image: "/images/margherita-pizza.jpg",
        serves: 2,
      },
      {
        name: "Chicken Sandwich",
        price: 180,
        description: "Grilled chicken sandwich with fresh vegetables",
        image: "/images/chicken-sandwich.jpg",
        serves: 1,
      },
      {
        name: "Vegetable Fried Rice",
        price: 160,
        description: "Chinese-style fried rice with mixed vegetables",
        image: "/images/vegetable-fried-rice.jpg",
        serves: 2,
      },
      {
        name: "BBQ Chicken",
        price: 400,
        description: "Smoky barbecue chicken with special sauce",
        image: "/images/bbq-chicken.jpg",
        serves: 2,
      },
      {
        name: "Vegan Salad",
        price: 150,
        description: "Fresh mixed greens with organic vegetables and dressing",
        image: "/images/vegan-salad.jpg",
        serves: 1,
      },
      {
        name: "Chana Masala",
        price: 220,
        description: "Spicy chickpea curry with aromatic spices",
        image: "/images/chana-masala.jpg",
        serves: 2,
      },
      {
        name: "Aloo Gobi",
        price: 200,
        description: "Potato and cauliflower curry with Indian spices",
        image: "/images/aloo-gobi.jpeg",
        serves: 2,
      },
      {
        name: "Chicken Biryani",
        price: 400,
        description:
          "Fragrant basmati rice cooked with tender chicken and spices",
        image: "/images/chicken-biryani.jpg",
        serves: 2,
      },
      {
        name: "Mutton Biryani",
        price: 450,
        description: "Aromatic rice dish with succulent mutton pieces",
        image: "/images/mutton-biryani.jpg",
        serves: 2,
      },
      {
        name: "Medu Vada",
        price: 100,
        description: "Crispy lentil donuts served with chutney and sambar",
        image: "/images/medu-vada.jpg",
        serves: 1,
      },
      {
        name: "Uttapam",
        price: 140,
        description: "Thick rice pancake topped with vegetables",
        image: "/images/uttapam.jpg",
        serves: 1,
      },
      {
        name: "Quinoa Salad",
        price: 180,
        description: "Nutritious quinoa with fresh vegetables and herbs",
        image: "/images/quinoa-salad.jpg",
        serves: 1,
      },
      {
        name: "Vegan Burger",
        price: 220,
        description: "Plant-based burger with fresh veggies and sauce",
        image: "/images/vegan-burger.jpg",
        serves: 1,
      },
      {
        name: "Crab Curry",
        price: 480,
        description: "Spicy crab cooked in coconut milk and spices",
        image: "/images/crab-curry.jpg",
        serves: 2,
      },
      {
        name: "Lobster Thermidor",
        price: 550,
        description: "Luxurious lobster in creamy sauce",
        image: "/images/lobster-thermidor.jpg",
        serves: 1,
      },
      {
        name: "Quesadilla",
        price: 250,
        description: "Grilled tortilla filled with cheese and vegetables",
        image: "/images/quesadilla.jpg",
        serves: 1,
      },
      {
        name: "Burrito",
        price: 280,
        description: "Large tortilla wrap with beans, rice, and veggies",
        image: "/images/burrito.jpg",
        serves: 1,
      },
      {
        name: "Pasta Alfredo",
        price: 320,
        description: "Creamy fettuccine pasta with parmesan sauce",
        image: "/images/pasta-alfredo.jpg",
        serves: 2,
      },
      {
        name: "Cheeseburger",
        price: 240,
        description: "Juicy beef patty with cheese and toppings",
        image: "/images/cheeseburger.jpg",
        serves: 1,
      },
      {
        name: "Cappuccino",
        price: 120,
        description: "Espresso with steamed milk and foam",
        image: "/images/cappuccino.jpg",
        serves: 1,
      },
      {
        name: "Club Sandwich",
        price: 200,
        description: "Triple-decker sandwich with chicken, bacon, and veggies",
        image: "/images/club-sandwich.jpg",
        serves: 1,
      },
      {
        name: "Gobi Manchurian",
        price: 180,
        description: "Crispy cauliflower in spicy Indo-Chinese sauce",
        image: "/images/gobi-manchurian.jpg",
        serves: 2,
      },
      {
        name: "Hakka Noodles",
        price: 160,
        description: "Stir-fried noodles with vegetables and spices",
        image: "/images/hakka-noodles.jpg",
        serves: 2,
      },
      {
        name: "Green Smoothie",
        price: 140,
        description: "Refreshing blend of greens, fruits, and yogurt",
        image: "/images/green-smoothie.jpg",
        serves: 1,
      },
      {
        name: "Buddha Bowl",
        price: 220,
        description:
          "Nutritious bowl with quinoa, veggies, and tahini dressing",
        image: "/images/buddha-bowl.jpg",
        serves: 1,
      },
      {
        name: "BBQ Ribs",
        price: 500,
        description: "Tender pork ribs glazed with barbecue sauce",
        image: "/images/bbq-ribs.jpg",
        serves: 2,
      },
      {
        name: "Grilled Steak",
        price: 600,
        description: "Juicy steak grilled to perfection",
        image: "/images/grilled-steak.jpg",
        serves: 1,
      },
      {
        name: "Tandoori Chicken",
        price: 380,
        description:
          "Marinated chicken grilled in tandoor with yogurt and spices",
        image: "/images/tandoori-chicken.jpg",
        serves: 2,
      },
      {
        name: "Samosa",
        price: 60,
        description: "Crispy potato and pea filled pastry with chutney",
        image: "/images/samosa.jpg",
        serves: 1,
      },
      {
        name: "Garlic Naan",
        price: 80,
        description: "Soft Indian bread brushed with garlic and butter",
        image: "/images/garlic-naan.jpg",
        serves: 1,
      },
      {
        name: "Cheese Naan",
        price: 100,
        description: "Soft Indian bread stuffed with melted cheese",
        image: "/images/cheese-naan.jpg",
        serves: 1,
      },
      {
        name: "Rogan Josh",
        price: 380,
        description: "Aromatic lamb curry cooked with yogurt and spices",
        image: "/images/rogan-josh.jpg",
        serves: 2,
      },
      {
        name: "Tikka Masala",
        price: 350,
        description: "Succulent paneer chunks in creamy tomato sauce",
        image: "/images/tikka-masala.jpg",
        serves: 2,
      },
      {
        name: "Fried Rice",
        price: 150,
        description: "Steamed rice stir-fried with eggs and vegetables",
        image: "/images/fried-rice.jpg",
        serves: 1,
      },
      {
        name: "Manchow Soup",
        price: 120,
        description: "Crispy noodle soup with vegetables and soy sauce",
        image: "/images/manchow-soup.jpg",
        serves: 1,
      },
      {
        name: "Spring Rolls",
        price: 140,
        description:
          "Crispy rolls filled with vegetables and served with sauce",
        image: "/images/spring-rolls.jpg",
        serves: 1,
      },
      {
        name: "Momos",
        price: 160,
        description: "Steamed dumplings filled with vegetables and meat",
        image: "/images/momos.jpg",
        serves: 2,
      },
      {
        name: "Panipuri",
        price: 80,
        description: "Crispy gol gappas with spicy water and potato filling",
        image: "/images/panipuri.jpg",
        serves: 1,
      },
      {
        name: "Dhokla",
        price: 100,
        description: "Steamed savory cake made from gram flour",
        image: "/images/samosa.jpg",
        serves: 1,
      },
      {
        name: "Kachumber Salad",
        price: 120,
        description: "Fresh vegetable salad with lemon and spices",
        image: "/images/vegan-salad.jpg",
        serves: 1,
      },
      {
        name: "Mango Lassi",
        price: 100,
        description: "Sweet yogurt-based drink with fresh mango pulp",
        image: "/images/green-smoothie.jpg",
        serves: 1,
      },
      {
        name: "Chicken 65",
        price: 320,
        description: "Spicy fried chicken pieces coated in aromatic spices",
        image: "/images/tandoori-chicken.jpg",
        serves: 2,
      },
      {
        name: "Shrimp Scampi",
        price: 450,
        description: "Garlic butter prawns with white wine sauce",
        image: "/images/prawn-masala.jpg",
        serves: 2,
      },
      {
        name: "Eggplant Parmesan",
        price: 280,
        description: "Layered eggplant with marinara and mozzarella cheese",
        image: "/images/vegan-burger.jpg",
        serves: 2,
      },
      {
        name: "Falafel Wrap",
        price: 220,
        description: "Crispy falafel with tahini sauce and fresh veggies",
        image: "/images/burrito.jpg",
        serves: 1,
      },
      {
        name: "Thai Green Curry",
        price: 360,
        description: "Aromatic green curry with coconut milk and basil",
        image: "/images/crab-curry.jpg",
        serves: 2,
      },
    ];
    const dishes = await Dish.insertMany(dishesData);
    console.log(`✅ Created ${dishes.length} dishes`);

    // ═══════════════════════════════════════════
    // 2. SEED RESTAURANTS
    // ═══════════════════════════════════════════
    const restaurantsData = [
      {
        name: "Tasty Bites",
        image: "/images/Tasty_Bites.png",
        rating: 4.5,
        location: "123 Main Street, T. Nagar, Chennai",
        city: "Chennai",
        amount: 100,
        dishes: [
          dishes[0]._id,
          dishes[1]._id,
          dishes[2]._id,
          dishes[6]._id,
          dishes[16]._id,
          dishes[17]._id,
        ],
        cuisine: ["Indian", "Vegetarian"],
        isOpen: true,
        operatingHours: { open: "09:00", close: "22:00" },
        distance: 2.5,
      },
      {
        name: "Spice Hub",
        image: "/images/SpiceHub.png",
        rating: 4.7,
        location: "456 Gandhi Road, Near Temple, Tirupati",
        city: "Tirupati",
        amount: 120,
        dishes: [
          dishes[3]._id,
          dishes[4]._id,
          dishes[7]._id,
          dishes[18]._id,
          dishes[19]._id,
        ],
        cuisine: ["Indian", "Non-Veg"],
        isOpen: true,
        operatingHours: { open: "10:00", close: "23:00" },
        distance: 3.2,
      },
      {
        name: "South Delight",
        image: "/images/SouthDelight.jpeg",
        rating: 4.3,
        location: "785 Jubilee Hills, Hyderabad",
        city: "Hyderabad",
        amount: 90,
        dishes: [dishes[5]._id, dishes[8]._id, dishes[20]._id, dishes[21]._id],
        cuisine: ["South Indian", "Vegetarian"],
        isOpen: true,
        operatingHours: { open: "08:00", close: "21:00" },
        distance: 1.8,
      },
      {
        name: "Green Garden",
        image: "/images/Green Garden.jpeg",
        rating: 4.6,
        location: "St.anns road,Near Chepauk stadium, Chennai",
        city: "Chennai",
        amount: 110,
        dishes: [
          dishes[0]._id,
          dishes[2]._id,
          dishes[15]._id,
          dishes[22]._id,
          dishes[23]._id,
        ],
        cuisine: ["Vegan", "Vegetarian"],
        isOpen: true,
        operatingHours: { open: "09:00", close: "22:00" },
        distance: 4.1,
      },
      {
        name: "Ocean Breeze",
        image: "/images/Ocean Breeze.jpeg",
        rating: 4.8,
        location: "Taluk street,Indira nagar,Tirupati",
        city: "Tirupati",
        amount: 130,
        dishes: [
          dishes[3]._id,
          dishes[4]._id,
          dishes[9]._id,
          dishes[24]._id,
          dishes[25]._id,
        ],
        cuisine: ["Seafood", "Non-Veg"],
        isOpen: true,
        operatingHours: { open: "11:00", close: "23:00" },
        distance: 2.9,
      },
      {
        name: "Spicy Fiesta",
        image: "/images/Spicy Fiesta.jpeg",
        rating: 4.4,
        location: "Road No. 10, Banjara hills, Hyderabad",
        city: "Hyderabad",
        amount: 95,
        dishes: [
          dishes[1]._id,
          dishes[5]._id,
          dishes[10]._id,
          dishes[26]._id,
          dishes[27]._id,
        ],
        cuisine: ["Mexican", "Vegetarian"],
        isOpen: false,
        operatingHours: { open: "12:00", close: "22:00" },
        distance: 5.5,
      },
      {
        name: "Urban Eats",
        image: "/images/Urban Eats.jpeg",
        rating: 4.2,
        location: "Perumal Koil Street, Mambakkam, Chennai",
        city: "Chennai",
        amount: 105,
        dishes: [
          dishes[0]._id,
          dishes[1]._id,
          dishes[11]._id,
          dishes[12]._id,
          dishes[28]._id,
          dishes[29]._id,
        ],
        cuisine: ["Italian", "Fast Food"],
        isOpen: true,
        operatingHours: { open: "10:00", close: "22:00" },
        distance: 3.7,
      },
      {
        name: "Cozy Corner",
        image: "/images/Cozy Corner.jpeg",
        rating: 4.0,
        location: "Venkatagiri Road, Yerpedu Post,Tirupati",
        city: "Tirupati",
        amount: 85,
        dishes: [
          dishes[2]._id,
          dishes[5]._id,
          dishes[13]._id,
          dishes[30]._id,
          dishes[31]._id,
        ],
        cuisine: ["Cafe", "Vegetarian"],
        isOpen: true,
        operatingHours: { open: "07:00", close: "20:00" },
        distance: 1.2,
      },
      {
        name: "The Spice Route",
        image: "/images/Spicy Route.jpeg",
        rating: 4.5,
        location: "Charminar Road, Chatta Bazar, Hyderabad",
        city: "Hyderabad",
        amount: 115,
        dishes: [
          dishes[1]._id,
          dishes[3]._id,
          dishes[13]._id,
          dishes[32]._id,
          dishes[33]._id,
        ],
        cuisine: ["Indian", "Chinese"],
        isOpen: true,
        operatingHours: { open: "11:00", close: "23:00" },
        distance: 4.8,
      },
      {
        name: "Garden Fresh",
        image: "/images/Garden Fresh.jpeg",
        rating: 4.3,
        location: " George Town, Anna Nagar, Chennai",
        city: "Chennai",
        amount: 100,
        dishes: [
          dishes[0]._id,
          dishes[2]._id,
          dishes[15]._id,
          dishes[34]._id,
          dishes[35]._id,
        ],
        cuisine: ["Vegan", "Organic"],
        isOpen: true,
        operatingHours: { open: "09:00", close: "21:00" },
        distance: 2.3,
      },
      {
        name: "Sunset Grill",
        image: "/images/Sunset Grill.avif",
        rating: 4.6,
        location: "Perumbakkam, Thoraipakkam, Tirupati",
        city: "Tirupati",
        amount: 125,
        dishes: [
          dishes[3]._id,
          dishes[4]._id,
          dishes[14]._id,
          dishes[36]._id,
          dishes[37]._id,
        ],
        cuisine: ["BBQ", "Non-Veg"],
        isOpen: true,
        operatingHours: { open: "17:00", close: "23:00" },
        distance: 6.2,
      },
    ];

    // Add tables, payments, inventory, announcements, shifts, tasks, support, orderData, etc.
    restaurantsData.forEach((rest, index) => {
      rest.tables = [
        { number: 1, status: "Available", seats: 2 },
        { number: 2, status: "Available", seats: 4 },
        { number: 3, status: "Available", seats: 4 },
        { number: 4, status: "Available", seats: 6 },
        { number: 5, status: "Available", seats: 6 },
        { number: 6, status: "Available", seats: 2 },
        { number: 7, status: "Available", seats: 4 },
        { number: 8, status: "Available", seats: 8 },
      ];
      rest.totalTables = rest.tables.length;

      rest.payments = [
        {
          method: "UPI",
          amount: 500,
          date: new Date(),
          reference: `UPI-${index + 1}-A`,
        },
        {
          method: "Card",
          amount: 750,
          date: new Date(),
          reference: `CARD-${index + 1}-B`,
        },
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
        values: [50, 30, 25, 20, 100, 15, 40, 20, 35, 45, 10, 18],
        units: [
          "kg", "kg", "kg", "kg", "kg", "L",
          "kg", "kg", "L", "kg", "kg", "kg",
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
        minStocks: [10, 5, 5, 5, 20, 3, 10, 5, 5, 10, 2, 5],
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
        {
          message: "Health inspection scheduled for Friday",
          priority: "high",
          completedBy: [],
          active: true,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
      ];

      const today = new Date();
      rest.staffShifts = [
        {
          name: "Morning Shift",
          startTime: "07:00",
          endTime: "11:00",
          date: today,
          assignedStaff: [`staff${index + 1}`],
          completed: true,
        },
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
          updatedAt: new Date(),
          completedBy: [],
        },
        {
          description: "Restock napkins and cutlery",
          status: "In Progress",
          assignedTo: [`staff${index + 1}`],
          priority: "high",
          createdAt: new Date(),
          updatedAt: new Date(),
          completedBy: [],
        },
        {
          description: "Prepare welcome drinks",
          status: "Pending",
          assignedTo: [`staff${index + 1}`],
          priority: "normal",
          createdAt: new Date(),
          updatedAt: new Date(),
          completedBy: [],
        },
        {
          description: "Check kitchen equipment",
          status: "Completed",
          assignedTo: [`staff${index + 1}`],
          priority: "high",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
          completedBy: [`staff${index + 1}`],
        },
      ];

      rest.supportMessages = [
        {
          from: `staff${index + 1}`,
          message: "POS is running slow at counter 1",
          status: "open",
          timestamp: new Date(),
        },
        {
          from: `owner${index + 1}`,
          message: "Schedule deep cleaning on weekend",
          status: "open",
          timestamp: new Date(),
        },
        {
          from: `staff${index + 1}`,
          message: "Need more hand sanitizer in restrooms",
          status: "resolved",
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      ];

      // Order data for charts
      rest.orderData = {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        values: [
          Math.floor(Math.random() * 15) + 5,
          Math.floor(Math.random() * 15) + 5,
          Math.floor(Math.random() * 15) + 5,
          Math.floor(Math.random() * 15) + 5,
          Math.floor(Math.random() * 15) + 5,
          Math.floor(Math.random() * 20) + 10,
          Math.floor(Math.random() * 20) + 10,
        ],
      };

      // Tasks for owner dashboard
      rest.tasks = [
        { id: 1, name: "Check food supplies" },
        { id: 2, name: "Clean kitchen equipment" },
        { id: 3, name: "Update menu board" },
        { id: 4, name: "Review staff performance" },
        { id: 5, name: "Inspect hygiene standards" },
      ];

      // Customer support threads
      rest.customerSupportThreads = [
        {
          customerName: "customer1",
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
          messages: [
            {
              senderRole: "customer",
              senderName: "customer1",
              text: "My order took too long to arrive. Can you look into this?",
              timestamp: new Date(),
            },
            {
              senderRole: "owner",
              senderName: `owner${index + 1}`,
              text: "We apologize for the delay. We are looking into this issue and will ensure faster service.",
              timestamp: new Date(),
            },
          ],
        },
        {
          customerName: "customer2",
          status: "resolved",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
          messages: [
            {
              senderRole: "customer",
              senderName: "customer2",
              text: "I was overcharged on my last bill. Please check order details.",
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            },
            {
              senderRole: "owner",
              senderName: `owner${index + 1}`,
              text: "We've checked and issued a refund. Sorry for the inconvenience!",
              timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            },
          ],
        },
        {
          customerName: "customer3",
          status: "pending",
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
          messages: [
            {
              senderRole: "customer",
              senderName: "customer3",
              text: "The food quality was not up to the mark today. Disappointed.",
              timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
            },
          ],
        },
      ];
    });

    const createdRestaurants = await Restaurant.insertMany(restaurantsData);
    console.log(`✅ Created ${createdRestaurants.length} restaurants`);

    // ═══════════════════════════════════════════
    // 3. SEED USERS
    // ═══════════════════════════════════════════
    const users = [
      {
        username: "admin1",
        email: "admin1@restoconnect.com",
        role: "admin",
        password: bcrypt.hashSync("123456", 10),
        isSuspended: false,
        suspensionEndDate: null,
        suspensionReason: null,
      },
      {
        username: "employee1",
        email: "employee1@restoconnect.com",
        role: "employee",
        password: bcrypt.hashSync("123456", 10),
        isSuspended: false,
        suspensionEndDate: null,
        suspensionReason: null,
      },
      {
        username: "employee2",
        email: "employee2@restoconnect.com",
        role: "employee",
        password: bcrypt.hashSync("123456", 10),
        isSuspended: false,
        suspensionEndDate: null,
        suspensionReason: null,
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
          isSuspended: false,
          suspensionEndDate: null,
          suspensionReason: null,
        },
        {
          username: `staff${idx + 1}`,
          email: `staff${idx + 1}@example.com`,
          role: "staff",
          restaurantName: rest.name,
          rest_id: rest._id,
          password: bcrypt.hashSync("123456", 10),
          isSuspended: false,
          suspensionEndDate: null,
          suspensionReason: null,
        },
      );
    });

    users.push(
      {
        username: "customer1",
        email: "customer1@example.com",
        role: "customer",
        password: bcrypt.hashSync("123456", 10),
        isSuspended: false,
        suspensionEndDate: null,
        suspensionReason: null,
      },
      {
        username: "customer2",
        email: "customer2@example.com",
        role: "customer",
        password: bcrypt.hashSync("123456", 10),
        isSuspended: false,
        suspensionEndDate: null,
        suspensionReason: null,
      },
      {
        username: "customer3",
        email: "customer3@example.com",
        role: "customer",
        password: bcrypt.hashSync("123456", 10),
        isSuspended: false,
        suspensionEndDate: null,
        suspensionReason: null,
      },
    );

    await User.insertMany(users);
    console.log(`✅ Created ${users.length} users`);

    // ═══════════════════════════════════════════
    // 4. SEED CUSTOMERS (Person model)
    // ═══════════════════════════════════════════
    const customers = [
      {
        name: "customer1",
        username: "customer1",
        img_url: "customer1.jpg",
        email: "customer1@example.com",
        phone: "1234567890",
        emailNotificationsEnabled: true,
        prev_orders: [],
        top_dishes: { "Paneer Tikka": 3, "Veg Biryani": 2, "Palak Paneer": 1 },
        top_restaurent: { "Tasty Bites": 5, "Green Garden": 2 },
        cart: [{ name: "Paneer Tikka", qty: 1 }],
        favourites: [],
      },
      {
        name: "customer2",
        username: "customer2",
        img_url: "customer2.jpg",
        email: "customer2@example.com",
        phone: "1234562890",
        emailNotificationsEnabled: true,
        prev_orders: [],
        top_dishes: { "Chicken Curry": 4, "Butter Chicken": 2, "Fish Fry": 1 },
        top_restaurent: { "Spice Hub": 3, "Ocean Breeze": 2 },
        cart: [{ name: "Masala Dosa", qty: 2 }],
        favourites: [],
      },
      {
        name: "customer3",
        username: "customer3",
        img_url: "customer3.jpg",
        email: "customer3@example.com",
        phone: "1224567890",
        emailNotificationsEnabled: true,
        prev_orders: [],
        top_dishes: { "Masala Dosa": 1, "Idli Sambar": 3, "Medu Vada": 2 },
        top_restaurent: { "South Delight": 2, "Cozy Corner": 1 },
        cart: [{ name: "Veg Biryani", qty: 1 }],
        favourites: [],
      },
    ];
    const createdCustomers = await Person.insertMany(customers);
    console.log(`✅ Created ${createdCustomers.length} customers`);

    // Pre-populate customer favourites with valid Dish IDs
    if (createdCustomers && createdCustomers.length >= 3) {
      await Person.findByIdAndUpdate(createdCustomers[0]._id, {
        $set: {
          favourites: [
            dishes[0]._id.toString(),
            dishes[2]._id.toString(),
            dishes[6]._id.toString(),
          ],
        },
      });
      await Person.findByIdAndUpdate(createdCustomers[1]._id, {
        $set: {
          favourites: [
            dishes[1]._id.toString(),
            dishes[5]._id.toString(),
            dishes[7]._id.toString(),
          ],
        },
      });
      await Person.findByIdAndUpdate(createdCustomers[2]._id, {
        $set: {
          favourites: [
            dishes[3]._id.toString(),
            dishes[4]._id.toString(),
            dishes[8]._id.toString(),
          ],
        },
      });
    }

    // ═══════════════════════════════════════════
    // 5. SEED ORDERS (for ALL restaurants)
    // ═══════════════════════════════════════════
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

    const customerA = createdCustomers[0];
    const customerB = createdCustomers[1];
    const customerC = createdCustomers[2];

    // ------- Tasty Bites (Restaurant 0) -------
    const firstRestaurant = createdRestaurants[0];
    const tastyBitesOrders = [
      {
        customerName: customerA.name,
        restaurant: firstRestaurant.name,
        rest_id: firstRestaurant._id,
        table_id: "T1",
        dishes: [dishes[0]._id, dishes[2]._id],
        totalAmount: 550,
        status: "completed",
        paymentStatus: "paid",
        tableNumber: "05",
        date: randomDateInLastMonth(),
        rating: 5.0,
        orderTime: (() => randomTimeWithinLastHour())(),
        completionTime: (() => {
          const t = randomTimeWithinLastHour();
          return randomCompletionTime(t);
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
        dishes: [dishes[0]._id],
        totalAmount: 250,
        status: "pending",
        paymentStatus: "unpaid",
        tableNumber: "02",
        date: randomDateInLastMonth(),
        rating: 4.5,
        orderTime: (() => randomTimeWithinLastHour())(),
        completionTime: null,
        estimatedTime: 12,
        assignedStaff: ["staff1"],
        feedback: "Good service, will visit again",
      },
      {
        customerName: customerA.name,
        restaurant: firstRestaurant.name,
        rest_id: firstRestaurant._id,
        table_id: "T3",
        dishes: [dishes[2]._id],
        totalAmount: 300,
        status: "preparing",
        paymentStatus: "unpaid",
        tableNumber: "08",
        date: randomDateInLastMonth(),
        rating: 4.0,
        orderTime: (() => randomTimeWithinLastHour())(),
        completionTime: null,
        estimatedTime: 15,
        assignedStaff: ["staff1"],
        feedback: "Tasty food, decent service",
      },
      {
        customerName: customerB.name,
        restaurant: firstRestaurant.name,
        rest_id: firstRestaurant._id,
        table_id: "T4",
        dishes: [dishes[0]._id, dishes[2]._id],
        totalAmount: 550,
        status: "completed",
        paymentStatus: "paid",
        tableNumber: "03",
        date: randomDateInLastMonth(),
        rating: 5.0,
        orderTime: (() => randomTimeWithinLastHour())(),
        completionTime: (() => {
          const t = randomTimeWithinLastHour();
          return randomCompletionTime(t);
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
        dishes: [dishes[0]._id],
        totalAmount: 250,
        status: "completed",
        paymentStatus: "paid",
        tableNumber: "01",
        date: randomDateInLastMonth(),
        rating: 4.5,
        orderTime: (() => randomTimeWithinLastHour())(),
        completionTime: (() => {
          const t = randomTimeWithinLastHour();
          return randomCompletionTime(t);
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
        dishes: [dishes[0]._id],
        totalAmount: 250,
        status: "completed",
        paymentStatus: "paid",
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
        dishes: [dishes[2]._id, dishes[5]._id],
        totalAmount: 450,
        status: "completed",
        paymentStatus: "paid",
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
        dishes: [dishes[1]._id],
        totalAmount: 350,
        status: "completed",
        paymentStatus: "paid",
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
        dishes: [dishes[3]._id],
        totalAmount: 400,
        status: "completed",
        paymentStatus: "paid",
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
        dishes: [dishes[4]._id],
        totalAmount: 450,
        status: "completed",
        paymentStatus: "paid",
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

    // ------- Spice Hub (Restaurant 1) -------
    const spiceHub = createdRestaurants[1];
    const spiceHubOrders = [
      {
        customerName: customerB.name,
        restaurant: spiceHub.name,
        rest_id: spiceHub._id,
        table_id: "T1",
        dishes: [dishes[3]._id, dishes[4]._id],
        totalAmount: 850,
        status: "completed",
        paymentStatus: "paid",
        tableNumber: "01",
        date: randomDateInLastMonth(),
        rating: 5.0,
        orderTime: (() => randomTimeWithinLastHour())(),
        completionTime: (() => {
          const t = randomTimeWithinLastHour();
          return randomCompletionTime(t);
        })(),
        estimatedTime: 20,
        assignedStaff: ["staff2"],
        feedback: "Best mutton korma in town!",
      },
      {
        customerName: customerA.name,
        restaurant: spiceHub.name,
        rest_id: spiceHub._id,
        table_id: "T2",
        dishes: [dishes[7]._id],
        totalAmount: 380,
        status: "completed",
        paymentStatus: "paid",
        tableNumber: "03",
        date: randomDateInLastMonth(),
        rating: 4.5,
        orderTime: (() => randomTimeWithinLastHour())(),
        completionTime: (() => {
          const t = randomTimeWithinLastHour();
          return randomCompletionTime(t);
        })(),
        estimatedTime: 15,
        assignedStaff: ["staff2"],
        feedback: "Butter chicken was fantastic",
      },
      {
        customerName: customerC.name,
        restaurant: spiceHub.name,
        rest_id: spiceHub._id,
        table_id: "T3",
        dishes: [dishes[18]._id, dishes[19]._id],
        totalAmount: 850,
        status: "pending",
        paymentStatus: "unpaid",
        tableNumber: "05",
        date: new Date(),
        rating: null,
        orderTime: new Date(new Date().setHours(18, 30, 0, 0)),
        completionTime: null,
        estimatedTime: 25,
        assignedStaff: ["staff2"],
        feedback: "",
      },
      {
        customerName: customerB.name,
        restaurant: spiceHub.name,
        rest_id: spiceHub._id,
        table_id: "T4",
        dishes: [dishes[7]._id, dishes[18]._id],
        totalAmount: 780,
        status: "completed",
        paymentStatus: "paid",
        tableNumber: "02",
        date: new Date(),
        rating: 4.0,
        orderTime: new Date(new Date().setHours(13, 0, 0, 0)),
        completionTime: new Date(new Date().setHours(13, 20, 0, 0)),
        estimatedTime: 18,
        assignedStaff: ["staff2"],
        feedback: "Good biryani, slightly spicy",
      },
    ];

    // ------- South Delight (Restaurant 2) -------
    const southDelight = createdRestaurants[2];
    const southDelightOrders = [
      {
        customerName: customerC.name,
        restaurant: southDelight.name,
        rest_id: southDelight._id,
        table_id: "T1",
        dishes: [dishes[5]._id, dishes[8]._id],
        totalAmount: 270,
        status: "completed",
        paymentStatus: "paid",
        tableNumber: "01",
        date: randomDateInLastMonth(),
        rating: 4.5,
        orderTime: (() => randomTimeWithinLastHour())(),
        completionTime: (() => {
          const t = randomTimeWithinLastHour();
          return randomCompletionTime(t);
        })(),
        estimatedTime: 12,
        assignedStaff: ["staff3"],
        feedback: "Authentic South Indian breakfast!",
      },
      {
        customerName: customerA.name,
        restaurant: southDelight.name,
        rest_id: southDelight._id,
        table_id: "T2",
        dishes: [dishes[20]._id, dishes[21]._id],
        totalAmount: 240,
        status: "completed",
        paymentStatus: "paid",
        tableNumber: "04",
        date: randomDateInLastMonth(),
        rating: 4.0,
        orderTime: (() => randomTimeWithinLastHour())(),
        completionTime: (() => {
          const t = randomTimeWithinLastHour();
          return randomCompletionTime(t);
        })(),
        estimatedTime: 10,
        assignedStaff: ["staff3"],
        feedback: "Medu vada was crispy and delicious",
      },
      {
        customerName: customerB.name,
        restaurant: southDelight.name,
        rest_id: southDelight._id,
        table_id: "T3",
        dishes: [dishes[5]._id],
        totalAmount: 150,
        status: "preparing",
        paymentStatus: "unpaid",
        tableNumber: "06",
        date: new Date(),
        rating: null,
        orderTime: new Date(new Date().setHours(17, 45, 0, 0)),
        completionTime: null,
        estimatedTime: 10,
        assignedStaff: ["staff3"],
        feedback: "",
      },
    ];

    // ------- Green Garden (Restaurant 3) -------
    const greenGarden = createdRestaurants[3];
    const greenGardenOrders = [
      {
        customerName: customerA.name,
        restaurant: greenGarden.name,
        rest_id: greenGarden._id,
        table_id: "T1",
        dishes: [dishes[15]._id, dishes[22]._id],
        totalAmount: 330,
        status: "completed",
        paymentStatus: "paid",
        tableNumber: "02",
        date: randomDateInLastMonth(),
        rating: 5.0,
        orderTime: (() => randomTimeWithinLastHour())(),
        completionTime: (() => {
          const t = randomTimeWithinLastHour();
          return randomCompletionTime(t);
        })(),
        estimatedTime: 12,
        assignedStaff: ["staff4"],
        feedback: "Loved the vegan options!",
      },
      {
        customerName: customerC.name,
        restaurant: greenGarden.name,
        rest_id: greenGarden._id,
        table_id: "T2",
        dishes: [dishes[23]._id],
        totalAmount: 220,
        status: "completed",
        paymentStatus: "paid",
        tableNumber: "04",
        date: randomDateInLastMonth(),
        rating: 4.5,
        orderTime: (() => randomTimeWithinLastHour())(),
        completionTime: (() => {
          const t = randomTimeWithinLastHour();
          return randomCompletionTime(t);
        })(),
        estimatedTime: 10,
        assignedStaff: ["staff4"],
        feedback: "Vegan burger was surprisingly good",
      },
      {
        customerName: customerB.name,
        restaurant: greenGarden.name,
        rest_id: greenGarden._id,
        table_id: "T3",
        dishes: [dishes[0]._id, dishes[2]._id],
        totalAmount: 550,
        status: "pending",
        paymentStatus: "unpaid",
        tableNumber: "07",
        date: new Date(),
        rating: null,
        orderTime: new Date(new Date().setHours(19, 15, 0, 0)),
        completionTime: null,
        estimatedTime: 18,
        assignedStaff: ["staff4"],
        feedback: "",
      },
    ];

    // ------- Ocean Breeze (Restaurant 4) -------
    const oceanBreeze = createdRestaurants[4];
    const oceanBreezeOrders = [
      {
        customerName: customerB.name,
        restaurant: oceanBreeze.name,
        rest_id: oceanBreeze._id,
        table_id: "T1",
        dishes: [dishes[9]._id, dishes[24]._id],
        totalAmount: 900,
        status: "completed",
        paymentStatus: "paid",
        tableNumber: "01",
        date: randomDateInLastMonth(),
        rating: 5.0,
        orderTime: (() => randomTimeWithinLastHour())(),
        completionTime: (() => {
          const t = randomTimeWithinLastHour();
          return randomCompletionTime(t);
        })(),
        estimatedTime: 22,
        assignedStaff: ["staff5"],
        feedback: "Seafood was incredibly fresh!",
      },
      {
        customerName: customerA.name,
        restaurant: oceanBreeze.name,
        rest_id: oceanBreeze._id,
        table_id: "T2",
        dishes: [dishes[25]._id],
        totalAmount: 550,
        status: "completed",
        paymentStatus: "paid",
        tableNumber: "03",
        date: randomDateInLastMonth(),
        rating: 4.5,
        orderTime: (() => randomTimeWithinLastHour())(),
        completionTime: (() => {
          const t = randomTimeWithinLastHour();
          return randomCompletionTime(t);
        })(),
        estimatedTime: 25,
        assignedStaff: ["staff5"],
        feedback: "Lobster was divine",
      },
      {
        customerName: customerC.name,
        restaurant: oceanBreeze.name,
        rest_id: oceanBreeze._id,
        table_id: "T3",
        dishes: [dishes[3]._id, dishes[4]._id],
        totalAmount: 850,
        status: "preparing",
        paymentStatus: "unpaid",
        tableNumber: "05",
        date: new Date(),
        rating: null,
        orderTime: new Date(new Date().setHours(18, 0, 0, 0)),
        completionTime: null,
        estimatedTime: 20,
        assignedStaff: ["staff5"],
        feedback: "",
      },
    ];

    // ------- Spicy Fiesta (Restaurant 5) -------
    const spicyFiesta = createdRestaurants[5];
    const spicyFiestaOrders = [
      {
        customerName: customerC.name,
        restaurant: spicyFiesta.name,
        rest_id: spicyFiesta._id,
        table_id: "T1",
        dishes: [dishes[10]._id, dishes[26]._id],
        totalAmount: 450,
        status: "completed",
        paymentStatus: "paid",
        tableNumber: "02",
        date: randomDateInLastMonth(),
        rating: 4.0,
        orderTime: (() => randomTimeWithinLastHour())(),
        completionTime: (() => {
          const t = randomTimeWithinLastHour();
          return randomCompletionTime(t);
        })(),
        estimatedTime: 14,
        assignedStaff: ["staff6"],
        feedback: "Tacos and quesadilla were great!",
      },
      {
        customerName: customerA.name,
        restaurant: spicyFiesta.name,
        rest_id: spicyFiesta._id,
        table_id: "T2",
        dishes: [dishes[27]._id],
        totalAmount: 280,
        status: "completed",
        paymentStatus: "paid",
        tableNumber: "04",
        date: randomDateInLastMonth(),
        rating: 4.5,
        orderTime: (() => randomTimeWithinLastHour())(),
        completionTime: (() => {
          const t = randomTimeWithinLastHour();
          return randomCompletionTime(t);
        })(),
        estimatedTime: 10,
        assignedStaff: ["staff6"],
        feedback: "Love the burrito filling!",
      },
    ];

    // ------- Urban Eats (Restaurant 6) -------
    const urbanEats = createdRestaurants[6];
    const urbanEatsOrders = [
      {
        customerName: customerA.name,
        restaurant: urbanEats.name,
        rest_id: urbanEats._id,
        table_id: "T1",
        dishes: [dishes[11]._id, dishes[28]._id],
        totalAmount: 640,
        status: "completed",
        paymentStatus: "paid",
        tableNumber: "01",
        date: randomDateInLastMonth(),
        rating: 4.0,
        orderTime: (() => randomTimeWithinLastHour())(),
        completionTime: (() => {
          const t = randomTimeWithinLastHour();
          return randomCompletionTime(t);
        })(),
        estimatedTime: 18,
        assignedStaff: ["staff7"],
        feedback: "Pizza and pasta combo was perfect",
      },
      {
        customerName: customerB.name,
        restaurant: urbanEats.name,
        rest_id: urbanEats._id,
        table_id: "T2",
        dishes: [dishes[12]._id, dishes[29]._id],
        totalAmount: 420,
        status: "completed",
        paymentStatus: "paid",
        tableNumber: "03",
        date: randomDateInLastMonth(),
        rating: 4.5,
        orderTime: (() => randomTimeWithinLastHour())(),
        completionTime: (() => {
          const t = randomTimeWithinLastHour();
          return randomCompletionTime(t);
        })(),
        estimatedTime: 12,
        assignedStaff: ["staff7"],
        feedback: "Cheeseburger was juicy and fresh",
      },
      {
        customerName: customerC.name,
        restaurant: urbanEats.name,
        rest_id: urbanEats._id,
        table_id: "T3",
        dishes: [dishes[0]._id, dishes[1]._id],
        totalAmount: 600,
        status: "pending",
        paymentStatus: "unpaid",
        tableNumber: "06",
        date: new Date(),
        rating: null,
        orderTime: new Date(new Date().setHours(19, 30, 0, 0)),
        completionTime: null,
        estimatedTime: 20,
        assignedStaff: ["staff7"],
        feedback: "",
      },
    ];

    // ------- Cozy Corner (Restaurant 7) -------
    const cozyCorner = createdRestaurants[7];
    const cozyCornerOrders = [
      {
        customerName: customerC.name,
        restaurant: cozyCorner.name,
        rest_id: cozyCorner._id,
        table_id: "T1",
        dishes: [dishes[30]._id, dishes[31]._id],
        totalAmount: 320,
        status: "completed",
        paymentStatus: "paid",
        tableNumber: "02",
        date: randomDateInLastMonth(),
        rating: 4.0,
        orderTime: (() => randomTimeWithinLastHour())(),
        completionTime: (() => {
          const t = randomTimeWithinLastHour();
          return randomCompletionTime(t);
        })(),
        estimatedTime: 10,
        assignedStaff: ["staff8"],
        feedback: "Cappuccino and club sandwich - perfect combo",
      },
      {
        customerName: customerA.name,
        restaurant: cozyCorner.name,
        rest_id: cozyCorner._id,
        table_id: "T2",
        dishes: [dishes[13]._id, dishes[5]._id],
        totalAmount: 310,
        status: "completed",
        paymentStatus: "paid",
        tableNumber: "04",
        date: new Date(),
        rating: 4.5,
        orderTime: new Date(new Date().setHours(10, 0, 0, 0)),
        completionTime: new Date(new Date().setHours(10, 15, 0, 0)),
        estimatedTime: 12,
        assignedStaff: ["staff8"],
        feedback: "Great cafe vibes and quick service",
      },
    ];

    // ------- The Spice Route (Restaurant 8) -------
    const spiceRoute = createdRestaurants[8];
    const spiceRouteOrders = [
      {
        customerName: customerB.name,
        restaurant: spiceRoute.name,
        rest_id: spiceRoute._id,
        table_id: "T1",
        dishes: [dishes[32]._id, dishes[33]._id],
        totalAmount: 340,
        status: "completed",
        paymentStatus: "paid",
        tableNumber: "01",
        date: randomDateInLastMonth(),
        rating: 4.5,
        orderTime: (() => randomTimeWithinLastHour())(),
        completionTime: (() => {
          const t = randomTimeWithinLastHour();
          return randomCompletionTime(t);
        })(),
        estimatedTime: 15,
        assignedStaff: ["staff9"],
        feedback: "Manchurian and noodles were amazing!",
      },
      {
        customerName: customerC.name,
        restaurant: spiceRoute.name,
        rest_id: spiceRoute._id,
        table_id: "T2",
        dishes: [dishes[1]._id, dishes[3]._id],
        totalAmount: 750,
        status: "completed",
        paymentStatus: "paid",
        tableNumber: "03",
        date: randomDateInLastMonth(),
        rating: 5.0,
        orderTime: (() => randomTimeWithinLastHour())(),
        completionTime: (() => {
          const t = randomTimeWithinLastHour();
          return randomCompletionTime(t);
        })(),
        estimatedTime: 22,
        assignedStaff: ["staff9"],
        feedback: "Authentic Indian-Chinese fusion flavors",
      },
      {
        customerName: customerA.name,
        restaurant: spiceRoute.name,
        rest_id: spiceRoute._id,
        table_id: "T3",
        dishes: [dishes[13]._id],
        totalAmount: 160,
        status: "preparing",
        paymentStatus: "unpaid",
        tableNumber: "05",
        date: new Date(),
        rating: null,
        orderTime: new Date(new Date().setHours(18, 45, 0, 0)),
        completionTime: null,
        estimatedTime: 12,
        assignedStaff: ["staff9"],
        feedback: "",
      },
    ];

    // ------- Garden Fresh (Restaurant 9) -------
    const gardenFresh = createdRestaurants[9];
    const gardenFreshOrders = [
      {
        customerName: customerA.name,
        restaurant: gardenFresh.name,
        rest_id: gardenFresh._id,
        table_id: "T1",
        dishes: [dishes[15]._id, dishes[34]._id],
        totalAmount: 290,
        status: "completed",
        paymentStatus: "paid",
        tableNumber: "02",
        date: randomDateInLastMonth(),
        rating: 4.5,
        orderTime: (() => randomTimeWithinLastHour())(),
        completionTime: (() => {
          const t = randomTimeWithinLastHour();
          return randomCompletionTime(t);
        })(),
        estimatedTime: 10,
        assignedStaff: ["staff10"],
        feedback: "Love the organic and fresh options",
      },
      {
        customerName: customerC.name,
        restaurant: gardenFresh.name,
        rest_id: gardenFresh._id,
        table_id: "T2",
        dishes: [dishes[35]._id, dishes[0]._id],
        totalAmount: 470,
        status: "completed",
        paymentStatus: "paid",
        tableNumber: "04",
        date: new Date(),
        rating: 5.0,
        orderTime: new Date(new Date().setHours(12, 0, 0, 0)),
        completionTime: new Date(new Date().setHours(12, 18, 0, 0)),
        estimatedTime: 15,
        assignedStaff: ["staff10"],
        feedback: "Buddha bowl is my new favorite!",
      },
    ];

    // ------- Sunset Grill (Restaurant 10) -------
    const sunsetGrill = createdRestaurants[10];
    const sunsetGrillOrders = [
      {
        customerName: customerB.name,
        restaurant: sunsetGrill.name,
        rest_id: sunsetGrill._id,
        table_id: "T1",
        dishes: [dishes[36]._id, dishes[37]._id],
        totalAmount: 1100,
        status: "completed",
        paymentStatus: "paid",
        tableNumber: "01",
        date: randomDateInLastMonth(),
        rating: 5.0,
        orderTime: (() => randomTimeWithinLastHour())(),
        completionTime: (() => {
          const t = randomTimeWithinLastHour();
          return randomCompletionTime(t);
        })(),
        estimatedTime: 30,
        assignedStaff: ["staff11"],
        feedback: "BBQ ribs and steak were incredible! Best grill in town.",
      },
      {
        customerName: customerA.name,
        restaurant: sunsetGrill.name,
        rest_id: sunsetGrill._id,
        table_id: "T2",
        dishes: [dishes[14]._id, dishes[3]._id],
        totalAmount: 800,
        status: "completed",
        paymentStatus: "paid",
        tableNumber: "03",
        date: randomDateInLastMonth(),
        rating: 4.5,
        orderTime: (() => randomTimeWithinLastHour())(),
        completionTime: (() => {
          const t = randomTimeWithinLastHour();
          return randomCompletionTime(t);
        })(),
        estimatedTime: 25,
        assignedStaff: ["staff11"],
        feedback: "BBQ chicken and fish fry combo was heavenly",
      },
      {
        customerName: customerC.name,
        restaurant: sunsetGrill.name,
        rest_id: sunsetGrill._id,
        table_id: "T3",
        dishes: [dishes[4]._id],
        totalAmount: 450,
        status: "pending",
        paymentStatus: "unpaid",
        tableNumber: "05",
        date: new Date(),
        rating: null,
        orderTime: new Date(new Date().setHours(19, 30, 0, 0)),
        completionTime: null,
        estimatedTime: 20,
        assignedStaff: ["staff11"],
        feedback: "",
      },
    ];

    // Combine all orders
    const allOrders = [
      ...tastyBitesOrders,
      ...todayOrders,
      ...spiceHubOrders,
      ...southDelightOrders,
      ...greenGardenOrders,
      ...oceanBreezeOrders,
      ...spicyFiestaOrders,
      ...urbanEatsOrders,
      ...cozyCornerOrders,
      ...spiceRouteOrders,
      ...gardenFreshOrders,
      ...sunsetGrillOrders,
    ].map((order) => ({
      ...order,
      createdAt: order.orderTime || order.date || new Date(),
    }));

    const createdOrders = await Order.insertMany(allOrders);
    console.log(`✅ Created ${createdOrders.length} orders`);

    // Link orders to their respective restaurants
    const ordersByRestaurant = {};
    createdOrders.forEach((order) => {
      const rid = order.rest_id;
      if (!ordersByRestaurant[rid]) ordersByRestaurant[rid] = [];
      ordersByRestaurant[rid].push(order._id);
    });

    for (const [restId, orderIds] of Object.entries(ordersByRestaurant)) {
      await Restaurant.findByIdAndUpdate(restId, {
        $set: { orders: orderIds },
      });
    }
    console.log("✅ Orders linked to all restaurants");

    // ═══════════════════════════════════════════
    // 6. SEED RESERVATIONS (for multiple restaurants)
    // ═══════════════════════════════════════════
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const allReservations = [
      // --- Tasty Bites ---
      {
        customerName: customerA.name,
        time: new Date(today.getTime() + 19 * 60 * 60 * 1000 + 30 * 60 * 1000),
        table_id: "1",
        guests: 4,
        status: "confirmed",
        allocated: true,
        tables: ["1"],
        rest_id: firstRestaurant._id,
        date: new Date(),
      },
      {
        customerName: customerB.name,
        time: new Date(today.getTime() + 20 * 60 * 60 * 1000),
        table_id: "2",
        guests: 2,
        status: "confirmed",
        allocated: true,
        tables: ["2"],
        rest_id: firstRestaurant._id,
        date: new Date(),
      },
      {
        customerName: customerC.name,
        time: new Date(today.getTime() + 21 * 60 * 60 * 1000),
        table_id: "",
        guests: 3,
        status: "pending",
        allocated: false,
        tables: [],
        rest_id: firstRestaurant._id,
        date: new Date(),
      },
      {
        customerName: customerA.name,
        time: new Date(today.getTime() + 18 * 60 * 60 * 1000 + 45 * 60 * 1000),
        table_id: "",
        guests: 5,
        status: "pending",
        allocated: false,
        tables: [],
        rest_id: firstRestaurant._id,
        date: new Date(),
      },
      {
        customerName: customerB.name,
        time: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 20 * 60 * 60 * 1000),
        table_id: "3",
        guests: 4,
        status: "completed",
        allocated: true,
        tables: ["3"],
        rest_id: firstRestaurant._id,
        date: new Date(today.getTime() - 24 * 60 * 60 * 1000),
      },

      // --- Spice Hub ---
      {
        customerName: customerB.name,
        time: new Date(today.getTime() + 19 * 60 * 60 * 1000),
        table_id: "1",
        guests: 3,
        status: "confirmed",
        allocated: true,
        tables: ["1"],
        rest_id: spiceHub._id,
        date: new Date(),
      },
      {
        customerName: customerC.name,
        time: new Date(today.getTime() + 20 * 60 * 60 * 1000 + 30 * 60 * 1000),
        table_id: "",
        guests: 4,
        status: "pending",
        allocated: false,
        tables: [],
        rest_id: spiceHub._id,
        date: new Date(),
      },
      {
        customerName: customerA.name,
        time: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000),
        table_id: "4",
        guests: 2,
        status: "completed",
        allocated: true,
        tables: ["4"],
        rest_id: spiceHub._id,
        date: new Date(today.getTime() - 24 * 60 * 60 * 1000),
      },

      // --- South Delight ---
      {
        customerName: customerC.name,
        time: new Date(today.getTime() + 12 * 60 * 60 * 1000),
        table_id: "2",
        guests: 2,
        status: "confirmed",
        allocated: true,
        tables: ["2"],
        rest_id: southDelight._id,
        date: new Date(),
      },
      {
        customerName: customerA.name,
        time: new Date(today.getTime() + 13 * 60 * 60 * 1000),
        table_id: "",
        guests: 3,
        status: "pending",
        allocated: false,
        tables: [],
        rest_id: southDelight._id,
        date: new Date(),
      },

      // --- Ocean Breeze ---
      {
        customerName: customerB.name,
        time: new Date(today.getTime() + 20 * 60 * 60 * 1000),
        table_id: "3",
        guests: 4,
        status: "confirmed",
        allocated: true,
        tables: ["3"],
        rest_id: oceanBreeze._id,
        date: new Date(),
      },
      {
        customerName: customerA.name,
        time: new Date(today.getTime() + 21 * 60 * 60 * 1000),
        table_id: "",
        guests: 2,
        status: "pending",
        allocated: false,
        tables: [],
        rest_id: oceanBreeze._id,
        date: new Date(),
      },

      // --- Urban Eats ---
      {
        customerName: customerA.name,
        time: new Date(today.getTime() + 19 * 60 * 60 * 1000),
        table_id: "1",
        guests: 2,
        status: "confirmed",
        allocated: true,
        tables: ["1"],
        rest_id: urbanEats._id,
        date: new Date(),
      },
      {
        customerName: customerC.name,
        time: new Date(today.getTime() + 20 * 60 * 60 * 1000),
        table_id: "",
        guests: 5,
        status: "pending",
        allocated: false,
        tables: [],
        rest_id: urbanEats._id,
        date: new Date(),
      },

      // --- The Spice Route ---
      {
        customerName: customerB.name,
        time: new Date(today.getTime() + 19 * 60 * 60 * 1000 + 30 * 60 * 1000),
        table_id: "2",
        guests: 3,
        status: "confirmed",
        allocated: true,
        tables: ["2"],
        rest_id: spiceRoute._id,
        date: new Date(),
      },
      {
        customerName: customerA.name,
        time: new Date(today.getTime() + 20 * 60 * 60 * 1000 + 15 * 60 * 1000),
        table_id: "",
        guests: 4,
        status: "pending",
        allocated: false,
        tables: [],
        rest_id: spiceRoute._id,
        date: new Date(),
      },

      // --- Sunset Grill ---
      {
        customerName: customerC.name,
        time: new Date(today.getTime() + 18 * 60 * 60 * 1000),
        table_id: "4",
        guests: 6,
        status: "confirmed",
        allocated: true,
        tables: ["4"],
        rest_id: sunsetGrill._id,
        date: new Date(),
      },
      {
        customerName: customerB.name,
        time: new Date(today.getTime() + 19 * 60 * 60 * 1000),
        table_id: "",
        guests: 2,
        status: "pending",
        allocated: false,
        tables: [],
        rest_id: sunsetGrill._id,
        date: new Date(),
      },
      {
        customerName: customerA.name,
        time: new Date(today.getTime() - 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000),
        table_id: "1",
        guests: 2,
        status: "completed",
        allocated: true,
        tables: ["1"],
        rest_id: sunsetGrill._id,
        date: new Date(today.getTime() - 24 * 60 * 60 * 1000),
      },
    ];

    await Reservation.insertMany(allReservations);
    console.log(`✅ Created ${allReservations.length} reservations`);

    // Update table statuses based on allocated reservations for all restaurants
    const reservationsByRestaurant = {};
    allReservations.forEach((r) => {
      if (r.allocated && r.status === "confirmed") {
        if (!reservationsByRestaurant[r.rest_id])
          reservationsByRestaurant[r.rest_id] = [];
        reservationsByRestaurant[r.rest_id].push(...r.tables);
      }
    });

    for (const [restId, allocTables] of Object.entries(reservationsByRestaurant)) {
      const rest = await Restaurant.findById(restId);
      if (rest) {
        rest.tables.forEach((table) => {
          if (allocTables.includes(String(table.number))) {
            table.status = "Allocated";
          }
        });
        await rest.save();
      }
    }
    console.log("✅ Table statuses updated based on reservations");

    // Map orders by customer to update prev_orders
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
      if (customer) {
        customer.prev_orders.push(...customerOrdersMap[custName]);
        await customer.save();
      }
    }
    console.log("✅ Customer previous orders updated");

    // Update restaurant payments from their orders
    for (const rest of createdRestaurants) {
      const restOrders = allOrders.filter(
        (o) => o.rest_id === rest._id
      );
      rest.payments = restOrders.map((order) => ({
        amount: order.totalAmount,
        date: order.date,
      }));
      await rest.save();
    }
    console.log("✅ Restaurant payments updated");

    // ═══════════════════════════════════════════
    // 7. SEED INVENTORY (for all restaurants)
    // ═══════════════════════════════════════════
    for (const rest of createdRestaurants) {
      let inventoryItems;

      if (rest.name === "Spice Hub") {
        inventoryItems = [
          { name: "Tomato Sauce", unit: "L", quantity: 1.5, minStock: 0.5, rest_id: rest._id },
          { name: "Paneer", unit: "Kg", quantity: 2, minStock: 0.5, rest_id: rest._id },
          { name: "Rice", unit: "Kg", quantity: 20, minStock: 5, rest_id: rest._id },
          { name: "Chicken", unit: "Kg", quantity: 8, minStock: 2, rest_id: rest._id },
          { name: "Onions", unit: "Kg", quantity: 6, minStock: 2, rest_id: rest._id },
          { name: "Cooking Oil", unit: "L", quantity: 5, minStock: 2, rest_id: rest._id },
          { name: "Mutton", unit: "Kg", quantity: 4, minStock: 1, rest_id: rest._id },
          { name: "Spices Mix", unit: "Kg", quantity: 3, minStock: 1, rest_id: rest._id },
        ];
      } else if (rest.name === "Ocean Breeze") {
        inventoryItems = [
          { name: "Fish", unit: "Kg", quantity: 10, minStock: 3, rest_id: rest._id },
          { name: "Prawns", unit: "Kg", quantity: 5, minStock: 1.5, rest_id: rest._id },
          { name: "Crab", unit: "Kg", quantity: 3, minStock: 1, rest_id: rest._id },
          { name: "Lobster", unit: "Kg", quantity: 2, minStock: 0.5, rest_id: rest._id },
          { name: "Cooking Oil", unit: "L", quantity: 4, minStock: 1.5, rest_id: rest._id },
          { name: "Rice", unit: "Kg", quantity: 15, minStock: 3, rest_id: rest._id },
          { name: "Coconut Milk", unit: "L", quantity: 3, minStock: 1, rest_id: rest._id },
        ];
      } else if (rest.name === "South Delight") {
        inventoryItems = [
          { name: "Rice Batter", unit: "Kg", quantity: 8, minStock: 2, rest_id: rest._id },
          { name: "Urad Dal", unit: "Kg", quantity: 5, minStock: 1, rest_id: rest._id },
          { name: "Potatoes", unit: "Kg", quantity: 10, minStock: 3, rest_id: rest._id },
          { name: "Coconut Chutney", unit: "L", quantity: 2, minStock: 0.5, rest_id: rest._id },
          { name: "Sambar Powder", unit: "Kg", quantity: 1.5, minStock: 0.5, rest_id: rest._id },
          { name: "Cooking Oil", unit: "L", quantity: 5, minStock: 2, rest_id: rest._id },
        ];
      } else if (rest.name === "Urban Eats") {
        inventoryItems = [
          { name: "Pizza Dough", unit: "Kg", quantity: 6, minStock: 2, rest_id: rest._id },
          { name: "Mozzarella", unit: "Kg", quantity: 4, minStock: 1, rest_id: rest._id },
          { name: "Pasta", unit: "Kg", quantity: 5, minStock: 1.5, rest_id: rest._id },
          { name: "Chicken", unit: "Kg", quantity: 6, minStock: 2, rest_id: rest._id },
          { name: "Bread", unit: "Kg", quantity: 3, minStock: 1, rest_id: rest._id },
          { name: "Tomato Sauce", unit: "L", quantity: 3, minStock: 1, rest_id: rest._id },
        ];
      } else if (rest.name === "Sunset Grill") {
        inventoryItems = [
          { name: "Pork Ribs", unit: "Kg", quantity: 8, minStock: 2, rest_id: rest._id },
          { name: "Steak", unit: "Kg", quantity: 5, minStock: 1.5, rest_id: rest._id },
          { name: "BBQ Sauce", unit: "L", quantity: 3, minStock: 1, rest_id: rest._id },
          { name: "Chicken", unit: "Kg", quantity: 6, minStock: 2, rest_id: rest._id },
          { name: "Fish", unit: "Kg", quantity: 4, minStock: 1, rest_id: rest._id },
          { name: "Charcoal", unit: "Kg", quantity: 10, minStock: 3, rest_id: rest._id },
        ];
      } else {
        inventoryItems = [
          { name: "Tomato Sauce", unit: "L", quantity: 1, minStock: 0.5, rest_id: rest._id },
          { name: "Paneer", unit: "Kg", quantity: 1, minStock: 0.2, rest_id: rest._id },
          { name: "Rice", unit: "Kg", quantity: 15, minStock: 2, rest_id: rest._id },
          { name: "Onions", unit: "Kg", quantity: 3, minStock: 1, rest_id: rest._id },
          { name: "Potatoes", unit: "Kg", quantity: 5, minStock: 2, rest_id: rest._id },
          { name: "Cooking Oil", unit: "L", quantity: 4, minStock: 1.5, rest_id: rest._id },
        ];
      }

      await Inventory.insertMany(inventoryItems);
    }
    console.log("✅ Inventory seeded for all restaurants");

    // ═══════════════════════════════════════════
    // 8. SEED PROMO CODES
    // ═══════════════════════════════════════════
    const promoCodes = [
      {
        code: "WELCOME20",
        description: "20% off on your first order",
        discountType: "percentage",
        discountValue: 20,
        minAmount: 200,
        maxDiscount: 150,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        usageLimit: 100,
        usedCount: 12,
        isActive: true,
      },
      {
        code: "FLAT50",
        description: "Flat ₹50 off on orders above ₹300",
        discountType: "fixed",
        discountValue: 50,
        minAmount: 300,
        maxDiscount: null,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        usageLimit: 200,
        usedCount: 45,
        isActive: true,
      },
      {
        code: "SPICY30",
        description: "30% off on spicy dishes",
        discountType: "percentage",
        discountValue: 30,
        minAmount: 250,
        maxDiscount: 200,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        usageLimit: 50,
        usedCount: 8,
        isActive: true,
      },
      {
        code: "FLAT100",
        description: "Flat ₹100 off on orders above ₹500",
        discountType: "fixed",
        discountValue: 100,
        minAmount: 500,
        maxDiscount: null,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        usageLimit: 75,
        usedCount: 20,
        isActive: true,
      },
      {
        code: "WEEKEND15",
        description: "15% off on weekend orders",
        discountType: "percentage",
        discountValue: 15,
        minAmount: 150,
        maxDiscount: 100,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        usageLimit: 300,
        usedCount: 67,
        isActive: true,
      },
      {
        code: "EXPIRED10",
        description: "10% off - expired promo",
        discountType: "percentage",
        discountValue: 10,
        minAmount: 100,
        maxDiscount: 50,
        validFrom: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        validUntil: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        usageLimit: 50,
        usedCount: 50,
        isActive: false,
      },
    ];
    await PromoCode.insertMany(promoCodes);
    console.log(`✅ Created ${promoCodes.length} promo codes`);

    // ═══════════════════════════════════════════
    // 9. SEED CARTS
    // ═══════════════════════════════════════════
    const carts = [
      {
        customerName: "customer1",
        restaurantId: firstRestaurant._id,
        items: [
          { dish: dishes[0]._id, quantity: 2 },
          { dish: dishes[6]._id, quantity: 1 },
        ],
        date: new Date(),
      },
      {
        customerName: "customer2",
        restaurantId: spiceHub._id,
        items: [
          { dish: dishes[7]._id, quantity: 1 },
          { dish: dishes[18]._id, quantity: 1 },
        ],
        date: new Date(),
      },
      {
        customerName: "customer3",
        restaurantId: southDelight._id,
        items: [
          { dish: dishes[5]._id, quantity: 3 },
          { dish: dishes[8]._id, quantity: 2 },
        ],
        date: new Date(),
      },
    ];
    await Cart.insertMany(carts);
    console.log(`✅ Created ${carts.length} carts`);

    // ═══════════════════════════════════════════
    // 10. SEED SUPPORT TICKETS
    // ═══════════════════════════════════════════
    const supportTickets = [
      {
        createdBy: "customer1",
        createdByRole: "customer",
        rest_id: firstRestaurant._id,
        restaurantName: firstRestaurant.name,
        category: "long_wait",
        subject: "Order took 45 minutes to arrive",
        priority: "high",
        status: "open",
        assignedTo: `owner1`,
        assignedRole: "owner",
        relatedOrderId: createdOrders[0]._id,
        orderSnapshot: {
          orderId: createdOrders[0]._id,
          restaurantName: firstRestaurant.name,
          items: [
            { name: "Paneer Tikka", price: 250 },
            { name: "Veg Biryani", price: 300 },
          ],
          totalAmount: 550,
          tableNumber: "05",
          orderDate: createdOrders[0].date,
          status: "completed",
          paymentStatus: "paid",
        },
        messages: [
          {
            senderRole: "customer",
            senderName: "customer1",
            text: "My order took almost 45 minutes to be served. This is unacceptable for a simple paneer tikka and biryani.",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
          {
            senderRole: "owner",
            senderName: "owner1",
            text: "We sincerely apologize for the delay. We were short-staffed today. We'll ensure this doesn't happen again.",
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          },
        ],
        internalNotes: [
          {
            author: "owner1",
            text: "Kitchen was understaffed due to sick leave. Need to arrange backup.",
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
          },
        ],
        firstResponseAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        resolvedAt: null,
      },
      {
        createdBy: "customer2",
        createdByRole: "customer",
        rest_id: spiceHub._id,
        restaurantName: spiceHub.name,
        category: "food_quality",
        subject: "Butter chicken was too salty",
        priority: "medium",
        status: "resolved",
        assignedTo: "owner2",
        assignedRole: "owner",
        relatedOrderId: createdOrders.find((o) => o.rest_id === spiceHub._id)?._id || null,
        orderSnapshot: {
          orderId: "order-ref",
          restaurantName: spiceHub.name,
          items: [{ name: "Butter Chicken", price: 380 }],
          totalAmount: 380,
          tableNumber: "03",
          orderDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          status: "completed",
          paymentStatus: "paid",
        },
        messages: [
          {
            senderRole: "customer",
            senderName: "customer2",
            text: "The butter chicken I received was way too salty compared to my previous visits.",
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          },
          {
            senderRole: "owner",
            senderName: "owner2",
            text: "We apologize for this. We've spoken to our chef. Please try again and we'll offer a 20% discount on your next order.",
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
          {
            senderRole: "customer",
            senderName: "customer2",
            text: "Thank you for the quick response. I'll visit again.",
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3600000),
          },
        ],
        internalNotes: [
          {
            author: "owner2",
            text: "New cook adjusted seasoning. Monitoring customer feedback.",
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
        ],
        satisfactionRating: 4,
        satisfactionComment: "Issue was resolved quickly",
        firstResponseAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3600000),
      },
      {
        createdBy: "customer3",
        createdByRole: "customer",
        rest_id: oceanBreeze._id,
        restaurantName: oceanBreeze.name,
        category: "wrong_order",
        subject: "Received prawn masala instead of crab curry",
        priority: "high",
        status: "in_progress",
        assignedTo: "owner5",
        assignedRole: "owner",
        relatedOrderId: createdOrders.find((o) => o.rest_id === oceanBreeze._id)?._id || null,
        orderSnapshot: {
          orderId: "order-ref",
          restaurantName: oceanBreeze.name,
          items: [{ name: "Crab Curry", price: 480 }],
          totalAmount: 480,
          tableNumber: "05",
          orderDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          status: "completed",
          paymentStatus: "paid",
        },
        messages: [
          {
            senderRole: "customer",
            senderName: "customer3",
            text: "I ordered crab curry but received prawn masala. Very disappointing.",
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
          },
          {
            senderRole: "owner",
            senderName: "owner5",
            text: "We're extremely sorry for the mix-up. We're investigating and will offer a replacement or refund.",
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          },
        ],
        internalNotes: [
          {
            author: "owner5",
            text: "Kitchen mixed up table orders. Need to improve order tracking system.",
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          },
        ],
        firstResponseAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        resolvedAt: null,
      },
      {
        createdBy: "owner1",
        createdByRole: "owner",
        rest_id: firstRestaurant._id,
        restaurantName: firstRestaurant.name,
        category: "other",
        subject: "POS system frequently crashes during peak hours",
        priority: "urgent",
        status: "escalated",
        assignedTo: "admin1",
        assignedRole: "admin",
        relatedOrderId: null,
        orderSnapshot: null,
        messages: [
          {
            senderRole: "owner",
            senderName: "owner1",
            text: "The POS system has been crashing 3-4 times daily during lunch and dinner rush. This is affecting our service severely.",
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          },
          {
            senderRole: "admin",
            senderName: "admin1",
            text: "We've escalated this to the technical team. A patch is being deployed tonight.",
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
          },
        ],
        internalNotes: [
          {
            author: "admin1",
            text: "Server memory issue identified. Scheduling maintenance window.",
            createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
          },
        ],
        firstResponseAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        resolvedAt: null,
      },
      {
        createdBy: "staff3",
        createdByRole: "staff",
        rest_id: southDelight._id,
        restaurantName: southDelight.name,
        category: "hygiene",
        subject: "Kitchen exhaust fan not working properly",
        priority: "high",
        status: "awaiting_owner",
        assignedTo: "owner3",
        assignedRole: "owner",
        relatedOrderId: null,
        orderSnapshot: null,
        messages: [
          {
            senderRole: "staff",
            senderName: "staff3",
            text: "The kitchen exhaust fan has been making unusual noise and not extracting smoke properly. This is a health hazard.",
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          },
        ],
        internalNotes: [],
        firstResponseAt: null,
        resolvedAt: null,
      },
    ];

    // Insert tickets one by one so the pre-save hook generates ticketNumber
    for (const ticketData of supportTickets) {
      const ticket = new SupportTicket(ticketData);
      await ticket.save();
    }
    console.log(`✅ Created ${supportTickets.length} support tickets`);

    // ═══════════════════════════════════════════
    // 11. SEED FEEDBACK
    // ═══════════════════════════════════════════
    console.log("Seeding feedback...");
    const feedbacks = [
      {
        customerName: "customer1",
        rest_id: firstRestaurant._id,
        orderId: createdOrders[0]._id.toString(),
        diningRating: 5,
        lovedItems: "Paneer Tikka, Veg Biryani",
        orderRating: 4,
        additionalFeedback: "Loved the ambiance and food quality!",
        status: "Pending",
        createdAt: randomDateInLastMonth(),
      },
      {
        customerName: "customer2",
        rest_id: firstRestaurant._id,
        orderId: createdOrders[1]._id.toString(),
        diningRating: 4,
        lovedItems: "Paneer Tikka",
        orderRating: 5,
        additionalFeedback: "Tasty food, prompt service!",
        status: "Resolved",
        createdAt: randomDateInLastMonth(),
      },
      {
        customerName: "customer3",
        rest_id: southDelight._id,
        orderId: createdOrders.find((o) => o.rest_id === southDelight._id)?._id?.toString() || createdOrders[2]._id.toString(),
        diningRating: 5,
        lovedItems: "Masala Dosa, Idli Sambar",
        orderRating: 5,
        additionalFeedback: "Perfect South Indian breakfast!",
        status: "Pending",
        createdAt: randomDateInLastMonth(),
      },
      {
        customerName: "customer2",
        rest_id: spiceHub._id,
        orderId: createdOrders.find((o) => o.rest_id === spiceHub._id)?._id?.toString() || createdOrders[3]._id.toString(),
        diningRating: 4,
        lovedItems: "Butter Chicken, Chicken Biryani",
        orderRating: 4,
        additionalFeedback: "Great spice levels, very authentic taste",
        status: "Resolved",
        createdAt: randomDateInLastMonth(),
      },
      {
        customerName: "customer1",
        rest_id: oceanBreeze._id,
        orderId: createdOrders.find((o) => o.rest_id === oceanBreeze._id)?._id?.toString() || createdOrders[4]._id.toString(),
        diningRating: 5,
        lovedItems: "Lobster Thermidor, Prawn Masala",
        orderRating: 5,
        additionalFeedback: "Best seafood restaurant in the city!",
        status: "Pending",
        createdAt: randomDateInLastMonth(),
      },
      {
        customerName: "customer3",
        rest_id: urbanEats._id,
        orderId: createdOrders.find((o) => o.rest_id === urbanEats._id)?._id?.toString() || createdOrders[5]._id.toString(),
        diningRating: 4,
        lovedItems: "Margherita Pizza, Pasta Alfredo",
        orderRating: 4,
        additionalFeedback: "Good Italian food, but pizza could be crispier",
        status: "Pending",
        createdAt: randomDateInLastMonth(),
      },
      {
        customerName: "customer1",
        rest_id: greenGarden._id,
        orderId: createdOrders.find((o) => o.rest_id === greenGarden._id)?._id?.toString() || createdOrders[6]._id.toString(),
        diningRating: 5,
        lovedItems: "Quinoa Salad, Vegan Salad",
        orderRating: 5,
        additionalFeedback: "Amazing organic and fresh options. Will come back!",
        status: "Resolved",
        createdAt: randomDateInLastMonth(),
      },
      {
        customerName: "customer2",
        rest_id: sunsetGrill._id,
        orderId: createdOrders.find((o) => o.rest_id === sunsetGrill._id)?._id?.toString() || createdOrders[7]._id.toString(),
        diningRating: 5,
        lovedItems: "BBQ Ribs, Grilled Steak",
        orderRating: 5,
        additionalFeedback: "The BBQ ribs were absolutely phenomenal! Best grill experience.",
        status: "Pending",
        createdAt: randomDateInLastMonth(),
      },
      {
        customerName: "customer3",
        rest_id: spiceRoute._id,
        orderId: createdOrders.find((o) => o.rest_id === spiceRoute._id)?._id?.toString() || createdOrders[8]._id.toString(),
        diningRating: 4,
        lovedItems: "Gobi Manchurian, Hakka Noodles",
        orderRating: 4,
        additionalFeedback: "Authentic Indo-Chinese flavors. Noodles were excellent.",
        status: "Pending",
        createdAt: randomDateInLastMonth(),
      },
      {
        customerName: "customer1",
        rest_id: cozyCorner._id,
        orderId: createdOrders.find((o) => o.rest_id === cozyCorner._id)?._id?.toString() || createdOrders[9]._id.toString(),
        diningRating: 4,
        lovedItems: "Cappuccino, Club Sandwich",
        orderRating: 4,
        additionalFeedback: "Cozy atmosphere, perfect for a casual outing",
        status: "Resolved",
        createdAt: randomDateInLastMonth(),
      },
    ];

    await Feedback.insertMany(feedbacks);
    console.log(`✅ Created ${feedbacks.length} feedback entries`);

    // ═══════════════════════════════════════════
    // DONE!
    // ═══════════════════════════════════════════
    console.log("\n✅ Seed completed successfully!");
    console.log("\n📋 Demo Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Admin (Super Admin):");
    console.log("  Username: admin1");
    console.log("  Password: 123456");
    console.log("\nEmployee:");
    console.log("  Username: employee1 / employee2");
    console.log("  Password: 123456");
    console.log("\nOwner (Tasty Bites):");
    console.log("  Username: owner1");
    console.log("  Password: 123456");
    console.log("\nStaff:");
    console.log("  Username: staff1");
    console.log("  Password: 123456");
    console.log("\nCustomers:");
    console.log("  Username: customer1 / customer2 / customer3");
    console.log("  Password: 123456");
    console.log("\n📦 Promo Codes: WELCOME20, FLAT50, SPICY30, FLAT100, WEEKEND15");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    mongoose.connection.close();
  }
}

seed();