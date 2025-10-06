const { connectDB, mongoose } = require('../util/database');
const { User } = require('../Model/userRoleModel');
const Person = require('../Model/customer_model');
const { Order } = require('../Model/Order_model');
const { Restaurant } = require('../Model/Restaurents_model');
const { Dish } = require('../Model/Dishes_model_test'); // Import Dish model

async function seed() {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Person.deleteMany({});
    await Order.deleteMany({});
    await Restaurant.deleteMany({});
    await Dish.deleteMany({}); // Clear existing dishes

    // Seed Users
    const bcrypt = require('bcrypt');

    // Create example dishes
    const dishes = [
      {
        name: 'Paneer Tikka',
        price: 250,
        description: 'Delicious grilled paneer cubes marinated in spices',
        image: 'paneer_tikka.jpg'
      },
      {
        name: 'Chicken Curry',
        price: 350,
        description: 'Spicy and flavorful chicken curry cooked with herbs',
        image: 'chicken_curry.jpeg'
      },
      {
        name: 'Veg Biryani',
        price: 300,
        description: 'Aromatic basmati rice cooked with mixed vegetables and spices',
        image: 'biryani.jpg'
      },
      {
        name: 'Fish Fry',
        price: 400,
        description: 'Crispy fried fish with special spices',
        image: 'fish_fry.jpg'
      },
      {
        name: 'Mutton Korma',
        price: 450,
        description: 'Rich and creamy mutton curry with aromatic spices',
        image: 'mutton_korma.jpg'
      },
      {
        name: 'Masala Dosa',
        price: 150,
        description: 'Crispy dosa filled with spicy potato masala',
        image: 'masala_dosa.jpg'
      }
    ];
    const createdDishes = await Dish.insertMany(dishes);

    // Seed Restaurants with dishes linked by their IDs
    const restaurants = [
      {
        name: 'Tasty Bites',
        image: '/images/Tasty_Bites.png',
        rating: 4.5,
        location: 'Chennai',
        amount: 100,
        dishes: createdDishes.map(dish => dish._id), // Add dish IDs here
        orders: [],
        reservations: [],
        tables: [
          { number: '1', status: 'available', seats: 2 },
          { number: '2', status: 'available', seats: 3 },
          { number: '3', status: 'available', seats: 4 },
          { number: '4', status: 'available', seats: 5 },
          { number: '5', status: 'available', seats: 1 }
        ],
        totalTables: 5,
        inventory: ['Tomatoes', 'Cheese', 'Chicken'],
        orderData: { labels: ['Jan', 'Feb'], values: [10, 15] },
        inventoryData: { labels: ['Tomatoes', 'Cheese'], values: [20, 30] },
        tasks: [{ id: 1, name: 'Clean kitchen' }]
      },
      {
        name: 'Spice Hub',
        image: '/images/SpiceHub.png',
        rating: 4.7,
        location: 'Tirupati',
        amount: 120,
        dishes: createdDishes.slice(3, 5).map(dish => dish._id), // Fish Fry and Mutton Korma
        orders: [],
        reservations: [],
        tables: [
          { number: '1', status: 'available', seats: 2 },
          { number: '2', status: 'available', seats: 3 },
          { number: '3', status: 'available', seats: 4 },
          { number: '4', status: 'available', seats: 5 },
          { number: '5', status: 'available', seats: 1 }
        ],
        totalTables: 5,
        inventory: ['Fish', 'Mutton', 'Spices'],
        orderData: { labels: ['Mar', 'Apr'], values: [20, 25] },
        inventoryData: { labels: ['Fish', 'Mutton'], values: [15, 10] },
        tasks: [{ id: 1, name: 'Restock spices' }]
      },
      {
        name: 'South Delight',
        image: '/images/SouthDelight.jpeg',
        rating: 4.3,
        location: 'Hyderabad',
        amount: 90,
        dishes: [createdDishes[5]._id], // Masala Dosa
        orders: [],
        reservations: [],
        tables: [
          { number: '1', status: 'available', seats: 2 },
          { number: '2', status: 'available', seats: 3 },
          { number: '3', status: 'available', seats: 4 },
          { number: '4', status: 'available', seats: 5 },
          { number: '5', status: 'available', seats: 1 }
        ],
        totalTables: 5,
        inventory: ['Potatoes', 'Rice', 'Lentils'],
        orderData: { labels: ['May', 'Jun'], values: [18, 22] },
        inventoryData: { labels: ['Potatoes', 'Rice'], values: [25, 35] },
        tasks: [{ id: 1, name: 'Clean dining area' }]
      },
      {
        name: 'Green Garden',
        image: '/images/Green Garden.jpeg',
        rating: 4.6,
        location: 'Chennai',
        amount: 110,
        dishes: [createdDishes[0]._id, createdDishes[2]._id], // Paneer Tikka, Veg Biryani
        orders: [],
        reservations: [],
        tables: [
          { number: '1', status: 'available', seats: 2 },
          { number: '2', status: 'available', seats: 3 },
          { number: '3', status: 'available', seats: 4 },
          { number: '4', status: 'available', seats: 5 },
          { number: '5', status: 'available', seats: 6 }
        ],
        totalTables: 5,
        inventory: ['Vegetables', 'Paneer', 'Rice'],
        orderData: { labels: ['Jul', 'Aug'], values: [12, 18] },
        inventoryData: { labels: ['Vegetables', 'Paneer'], values: [30, 25] },
        tasks: [{ id: 1, name: 'Water plants' }]
      },
      {
        name: 'Ocean Breeze',
        image: '/images/Ocean Breeze.jpeg',
        rating: 4.8,
        location: 'Tirupati',
        amount: 130,
        dishes: [createdDishes[3]._id, createdDishes[4]._id], // Fish Fry, Mutton Korma
        orders: [],
        reservations: [],
        tables: [
          { number: '1', status: 'available', seats: 2 },
          { number: '2', status: 'available', seats: 3 },
          { number: '3', status: 'available', seats: 4 },
          { number: '4', status: 'available', seats: 5 },
          { number: '5', status: 'available', seats: 6 }
        ],
        totalTables: 5,
        inventory: ['Fish', 'Seafood', 'Spices'],
        orderData: { labels: ['Sep', 'Oct'], values: [22, 28] },
        inventoryData: { labels: ['Fish', 'Seafood'], values: [18, 20] },
        tasks: [{ id: 1, name: 'Clean fish tanks' }]
      },
      {
        name: 'Spicy Fiesta',
        image: '/images/Spicy Fiesta.jpeg',
        rating: 4.4,
        location: 'Hyderabad',
        amount: 95,
        dishes: [createdDishes[1]._id, createdDishes[5]._id], // Chicken Curry, Masala Dosa
        orders: [],
        reservations: [],
        tables: [
          { number: '1', status: 'available', seats: 4 },
          { number: '2', status: 'available', seats: 2 },
          { number: '3', status: 'available', seats: 2 }
        ],
        totalTables: 3,
        inventory: ['Chili', 'Chicken', 'Rice'],
        orderData: { labels: ['Nov', 'Dec'], values: [16, 20] },
        inventoryData: { labels: ['Chili', 'Chicken'], values: [22, 18] },
        tasks: [{ id: 1, name: 'Order more chili' }]
      },
      {
        name: 'Urban Eats',
        image: '/images/Urban Eats.jpeg',
        rating: 4.2,
        location: 'Chennai',
        amount: 105,
        dishes: [createdDishes[0]._id, createdDishes[1]._id], // Paneer Tikka, Chicken Curry
        orders: [],
        reservations: [],
        tables: [
          { number: '1', status: 'available', seats: 2 },
          { number: '2', status: 'available', seats: 3 },
          { number: '3', status: 'available', seats: 4 },
          { number: '4', status: 'available', seats: 5 },
          { number: '5', status: 'available', seats: 6 }
        ],
        totalTables: 5,
        inventory: ['Paneer', 'Chicken', 'Spices'],
        orderData: { labels: ['Jan', 'Feb'], values: [14, 19] },
        inventoryData: { labels: ['Paneer', 'Chicken'], values: [28, 22] },
        tasks: [{ id: 1, name: 'Restock spices' }]
      },
      {
        name: 'Cozy Corner',
        image: '/images/Cozy Corner.jpeg',
        rating: 4.0,
        location: 'Tirupati',
        amount: 85,
        dishes: [createdDishes[2]._id, createdDishes[5]._id], // Veg Biryani, Masala Dosa
        orders: [],
        reservations: [],
        tables: [
          { number: '1', status: 'available', seats: 2 },
          { number: '2', status: 'available', seats: 6 }
        ],
        totalTables: 2,
        inventory: ['Rice', 'Potatoes', 'Lentils'],
        orderData: { labels: ['Mar', 'Apr'], values: [12, 16] },
        inventoryData: { labels: ['Rice', 'Potatoes'], values: [24, 30] },
        tasks: [{ id: 1, name: 'Clean dining area' }]
      },
      {
        name: 'The Spice Route',
        image: '/images/Spicy Route.jpeg',
        rating: 4.5,
        location: 'Hyderabad',
        amount: 115,
        dishes: [createdDishes[1]._id, createdDishes[3]._id], // Chicken Curry, Fish Fry
        orders: [],
        reservations: [],
        tables: [
          { number: '1', status: 'available', seats: 6 },
          { number: '2', status: 'available', seats: 4 }
        ],
        totalTables: 2,
        inventory: ['Chicken', 'Fish', 'Spices'],
        orderData: { labels: ['May', 'Jun'], values: [18, 22] },
        inventoryData: { labels: ['Chicken', 'Fish'], values: [36, 28] },
        tasks: [{ id: 1, name: 'Order fresh fish' }]
      },
      {
        name: 'Garden Fresh',
        image: '/images/Garden Fresh.jpeg',
        rating: 4.3,
        location: 'Chennai',
        amount: 100,
        dishes: [createdDishes[0]._id, createdDishes[2]._id], // Paneer Tikka, Veg Biryani
        orders: [],
        reservations: [],
        tables: [
          { number: '1', status: 'available', seats: 4 },
          { number: '2', status: 'available', seats: 4 }
        ],
        totalTables: 2,
        inventory: ['Vegetables', 'Paneer', 'Rice'],
        orderData: { labels: ['Jul', 'Aug'], values: [20, 25] },
        inventoryData: { labels: ['Vegetables', 'Paneer'], values: [40, 35] },
        tasks: [{ id: 1, name: 'Water plants' }]
      },
      {
        name: 'Sunset Grill',
        image: '/images/Sunset Grill.avif',
        rating: 4.6,
        location: 'Tirupati',
        amount: 125,
        dishes: [createdDishes[3]._id, createdDishes[4]._id], // Fish Fry, Mutton Korma
        orders: [],
        reservations: [],
        tables: [
          { number: '1', status: 'available', seats: 6 },
          { number: '2', status: 'available', seats: 4 }
        ],
        totalTables: 2,
        inventory: ['Fish', 'Mutton', 'Spices'],
        orderData: { labels: ['Sep', 'Oct'], values: [24, 30] },
        inventoryData: { labels: ['Fish', 'Mutton'], values: [48, 40] },
        tasks: [{ id: 1, name: 'Clean grill' }]
      }
    ];
    const createdRestaurants = await Restaurant.insertMany(restaurants);

    // Create owners and staff for all restaurants
    const users = [
      { username: 'admin1', email: 'admin1@example.com', role: 'admin', password: bcrypt.hashSync('123', 10) }
    ];

    createdRestaurants.forEach((restaurant, index) => {
      users.push(
        {
          username: `owner${index + 1}`,
          email: `owner${index + 1}@example.com`,
          role: 'owner',
          restaurantName: restaurant.name,
          rest_id: restaurant._id,
          password: bcrypt.hashSync('123', 10)
        },
        {
          username: `staff${index + 1}`,
          email: `staff${index + 1}@example.com`,
          role: 'staff',
          restaurantName: restaurant.name,
          rest_id: restaurant._id,
          password: bcrypt.hashSync('123', 10)
        }
      );
    });

    // Add a customer user as well
    users.push(
      { username: 'customer1', email: 'customer1@example.com', role: 'customer', password: bcrypt.hashSync('123', 10) }
    );

    await User.insertMany(users);

    // Seed Customers for users with role 'customer'
    const customerUsers = users.filter(user => user.role === 'customer');
    const customers = customerUsers.map(user => ({
      name: user.username,
      img_url: user.username + '.jpg',
      email: user.email,
      phone: '',
      address: '',
      prev_orders: [],
      top_dishes: {},
      top_restaurent: {},
      cart: []
    }));
    await Person.insertMany(customers);

    // Seed Orders
    const orders = [
      {
        dishes: ['Paneer Tikka', 'Chicken Curry'],
        customerName: 'John Doe',
        status: 'pending',
        totalAmount: 500
      }
    ];
    await Order.insertMany(orders);

    console.log('Seed data inserted successfully');
  } catch (error) {
    console.error('Error inserting seed data:', error);
  } finally {
    mongoose.connection.close();
  }
}

seed();
