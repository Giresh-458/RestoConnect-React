const { connectDB, mongoose } = require('../util/database');
const { User } = require('../Model/userRoleModel');
const Person = require('../Model/customer_model');
const { Order } = require('../Model/Order_model');
const { Restaurant } = require('../Model/Restaurents_model');
const { Dish } = require('../Model/Dishes_model_test');
const Feedback = require('../Model/feedback.js');
const bcrypt = require('bcrypt');

async function seed() {
  try {
    await connectDB();

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Person.deleteMany({}),
      Order.deleteMany({}),
      Restaurant.deleteMany({}),
      Dish.deleteMany({}),
      Feedback.deleteMany({})
    ]);

    // 1. Seed Dishes
    const dishesData = [
      { name: 'Paneer Tikka', price: 250, description: 'Delicious grilled paneer cubes marinated in spices' },
      { name: 'Chicken Curry', price: 350, description: 'Spicy and flavorful chicken curry cooked with herbs' },
      { name: 'Veg Biryani', price: 300, description: 'Aromatic basmati rice cooked with mixed vegetables and spices' },
      { name: 'Fish Fry', price: 400, description: 'Crispy fried fish with special spices' },
      { name: 'Mutton Korma', price: 450, description: 'Rich and creamy mutton curry with aromatic spices' },
      { name: 'Masala Dosa', price: 150, description: 'Crispy dosa filled with spicy potato masala' }
    ];
    const dishes = await Dish.insertMany(dishesData);

    // 2. Seed Restaurants
    const restaurantsData = [
      { name:'Tasty Bites', image:'/images/Tasty_Bites.png', rating:4.5, location:'Chennai', amount:100, dishes:[dishes[0]._id,dishes[1]._id,dishes[2]._id] },
      { name:'Spice Hub', image:'/images/SpiceHub.png', rating:4.7, location:'Tirupati', amount:120, dishes:[dishes[3]._id,dishes[4]._id] },
      { name:'South Delight', image:'/images/SouthDelight.jpeg', rating:4.3, location:'Hyderabad', amount:90, dishes:[dishes[5]._id] },
      { name:'Green Garden', image:'/images/Green Garden.jpeg', rating:4.6, location:'Chennai', amount:110, dishes:[dishes[0]._id,dishes[2]._id] },
      { name:'Ocean Breeze', image:'/images/Ocean Breeze.jpeg', rating:4.8, location:'Tirupati', amount:130, dishes:[dishes[3]._id,dishes[4]._id] },
      { name:'Spicy Fiesta', image:'/images/Spicy Fiesta.jpeg', rating:4.4, location:'Hyderabad', amount:95, dishes:[dishes[1]._id,dishes[5]._id] },
      { name:'Urban Eats', image:'/images/Urban Eats.jpeg', rating:4.2, location:'Chennai', amount:105, dishes:[dishes[0]._id,dishes[1]._id] },
      { name:'Cozy Corner', image:'/images/Cozy Corner.jpeg', rating:4.0, location:'Tirupati', amount:85, dishes:[dishes[2]._id,dishes[5]._id] },
      { name:'The Spice Route', image:'/images/Spicy Route.jpeg', rating:4.5, location:'Hyderabad', amount:115, dishes:[dishes[1]._id,dishes[3]._id] },
      { name:'Garden Fresh', image:'/images/Garden Fresh.jpeg', rating:4.3, location:'Chennai', amount:100, dishes:[dishes[0]._id,dishes[2]._id] },
      { name:'Sunset Grill', image:'/images/Sunset Grill.avif', rating:4.6, location:'Tirupati', amount:125, dishes:[dishes[3]._id,dishes[4]._id] }
    ];

    // Add tables and revenue fields
    restaurantsData.forEach(rest => {
      rest.tables = [
        { number:'1', status:'available', seats:2 },
        { number:'2', status:'available', seats:3 },
        { number:'3', status:'available', seats:4 },
        { number:'4', status:'available', seats:5 },
        { number:'5', status:'available', seats:6 }
      ];
      rest.totalTables = rest.tables.length;
      rest.weeklyRevenue = 0;
      rest.monthlyRevenue = 0;
      rest.totalOrders = 0;
      rest.payments = [];
    });

    const createdRestaurants = await Restaurant.insertMany(restaurantsData);

    // 3. Users
    const users = [
      { username:'admin1', email:'admin1@example.com', role:'admin', password:bcrypt.hashSync('123',10) }
    ];

    createdRestaurants.forEach((rest, idx)=>{
      users.push(
        { username:`owner${idx+1}`, email:`owner${idx+1}@example.com`, role:'owner', restaurantName:rest.name, rest_id:rest._id, password:bcrypt.hashSync('123',10) },
        { username:`staff${idx+1}`, email:`staff${idx+1}@example.com`, role:'staff', restaurantName:rest.name, rest_id:rest._id, password:bcrypt.hashSync('123',10) }
      );
    });

    users.push(
      { username:'customer1', email:'customer1@example.com', role:'customer', password:bcrypt.hashSync('123',10) },
      { username:'customer2', email:'customer2@example.com', role:'customer', password:bcrypt.hashSync('123',10) },
      { username:'customer3', email:'customer3@example.com', role:'customer', password:bcrypt.hashSync('123',10) }
    );

    await User.insertMany(users);

    // 4. Customers
    const customers = [
      { name:'customer1', img_url:'customer1.jpg', email:'customer1@example.com', phone:'1234567890', prev_orders:[], top_dishes:{}, top_restaurent:{}, cart:[] },
      { name:'customer2', img_url:'customer2.jpg', email:'customer2@example.com', phone:'1234562890', prev_orders:[], top_dishes:{}, top_restaurent:{}, cart:[] },
      { name:'customer3', img_url:'customer3.jpg', email:'customer3@example.com', phone:'1224567890', prev_orders:[], top_dishes:{}, top_restaurent:{}, cart:[] }
    ];
    const createdCustomers = await Person.insertMany(customers);

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

    const tastyBitesOrders = [
      { customerName: customerA.name, restaurant: firstRestaurant.name, rest_id: firstRestaurant._id, dishes: ['Paneer Tikka','Veg Biryani'], totalAmount:550, status:'completed', date:randomDateInLastMonth() },
      { customerName: customerB.name, restaurant: firstRestaurant.name, rest_id: firstRestaurant._id, dishes: ['Paneer Tikka'], totalAmount:250, status:'completed', date:randomDateInLastMonth() },
      { customerName: customerA.name, restaurant: firstRestaurant.name, rest_id: firstRestaurant._id, dishes: ['Veg Biryani'], totalAmount:300, status:'completed', date:randomDateInLastMonth() },
      { customerName: customerB.name, restaurant: firstRestaurant.name, rest_id: firstRestaurant._id, dishes: ['Paneer Tikka','Veg Biryani'], totalAmount:550, status:'completed', date:randomDateInLastMonth() },
      { customerName: customerA.name, restaurant: firstRestaurant.name, rest_id: firstRestaurant._id, dishes: ['Paneer Tikka'], totalAmount:250, status:'completed', date:randomDateInLastMonth() }
    ];

    await Order.insertMany(tastyBitesOrders);

    // Map orders by customer to avoid ParallelSaveError
    const customerOrdersMap = {};
    tastyBitesOrders.forEach(order => {
      if (!customerOrdersMap[order.customerName]) customerOrdersMap[order.customerName] = [];
      customerOrdersMap[order.customerName].push({ name: order.restaurant, items: order.dishes });
    });

    for (let custName in customerOrdersMap) {
      const customer = await Person.findOne({ name: custName });
      customer.prev_orders.push(...customerOrdersMap[custName]);
      await customer.save();
    }

    // Update first restaurant revenue & payments
    const now = new Date();
    const oneWeekAgo = new Date(now); oneWeekAgo.setDate(now.getDate()-7);
    const oneMonthAgo = new Date(now); oneMonthAgo.setMonth(now.getMonth()-1);

    firstRestaurant.totalOrders = 0;
    firstRestaurant.weeklyRevenue = 0;
    firstRestaurant.monthlyRevenue = 0;
    firstRestaurant.payments = [];

    tastyBitesOrders.forEach(order => {
      const orderDate = new Date(order.date);
      if(orderDate >= oneWeekAgo) firstRestaurant.weeklyRevenue += order.totalAmount;
      if(orderDate >= oneMonthAgo) firstRestaurant.monthlyRevenue += order.totalAmount;
      firstRestaurant.totalOrders += 1;

      firstRestaurant.payments.push({
        amount: order.totalAmount,
        date: order.date,
        _id: new mongoose.Types.ObjectId()
      });
    });

    await firstRestaurant.save();

    // 6. Feedback
    const feedbacks = [
      { customerName:'customer1', diningRating:5, lovedItems:'Paneer Tikka, Veg Biryani', orderRating:4, additionalFeedback:'Loved the ambiance!' },
      { customerName:'customer2', diningRating:4, lovedItems:'Fish Fry', orderRating:5, additionalFeedback:'Tasty food!' },
      { customerName:'customer3', diningRating:5, lovedItems:'Masala Dosa', orderRating:5, additionalFeedback:'Perfect breakfast!' }
    ];
    await Feedback.insertMany(feedbacks);

    console.log('Seed completed successfully with tables, weekly & monthly revenue, and payments!');
  } catch(err){
    console.error('Seeding error:', err);
  } finally{
    mongoose.connection.close();
  }
}

seed();
