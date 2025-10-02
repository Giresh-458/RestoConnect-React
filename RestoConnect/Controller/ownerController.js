const mongoose = require('mongoose');
const { User } = require('../Model/userRoleModel');
let Restaurant = require('../Model/Restaurents_model').Restaurant;
let Dish  = require('../Model/Dishes_model_test').Dish;

exports.getOwnerHomepage = async (req, res) => {
    try {
        let username = req.session.username;
        console.log("Looking for user with username:", username);
        let user = await User.findByname(username);
        console.log("Found user:", user);
        if (!user) {
            return res.status(404).send("User not found");
        }
        let restaurant = user.restaurantName;
        // Fetch staff list for this restaurant
        const staffList = await User.find({ rest_id: user.rest_id, role: 'staff' });

        // Fetch restaurant tables
        const rest = await Restaurant.find_by_id(user.rest_id);
        const restPopulated = await Restaurant.findById(user.rest_id).populate('dishes').populate('orders');
        const tables = restPopulated ? restPopulated.tables : [];

        res.render("ownerHomepage", { restaurant: restaurant, staffList: staffList, tables: tables, tasks: rest.tasks || [] });
    } catch (error) {
        console.error("Error in getOwnerHomepage:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Table management methods

exports.getTables = async (req, res) => {
    try {
        const user = await User.findByname(req.session.username);
        if (!user) {
            return res.status(404).send("User not found");
        }
        const rest = await Restaurant.find_by_id(user.rest_id);
        if (!rest) {
            return res.status(404).send("Restaurant not found");
        }
        const restPopulated = await Restaurant.findById(user.rest_id).populate('dishes').populate('orders');
       // res.render('ownerTables', { tables: restPopulated.tables });
       res.json({ tables: restPopulated.tables });
    } catch (error) {
        console.error("Error in getTables:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.addTable = async (req, res) => {
    try {
        const { number, seats } = req.body;
        if (!number || !seats) {
            return res.status(400).send("Table number and number of seats are required");
        }
        const user = await User.findByname(req.session.username);
        if (!user) {
            return res.status(404).send("User not found");
        }
        const rest = await Restaurant.find_by_id(user.rest_id);
        if (!rest) {
            return res.status(404).send("Restaurant not found");
        }
        // Check if table number already exists
        if (rest.tables.some(table => table.number === number)) {
            return res.status(400).send("Table number already exists");
        }
        rest.tables.push({ number, seats: parseInt(seats), status: 'Available' });
        rest.totalTables = rest.tables.length;
        await rest.save();
        res.redirect('/owner');
    } catch (error) {
        console.error("Error in addTable:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.deleteTable = async (req, res) => {
    try {
        const { number } = req.params;
        const user = await User.findByname(req.session.username);
        if (!user) {
            return res.status(404).send("User not found");
        }
        const rest = await Restaurant.find_by_id(user.rest_id);
        if (!rest) {
            return res.status(404).send("Restaurant not found");
        }
        rest.tables = rest.tables.filter(table => table.number !== number);
        rest.totalTables = rest.tables.length;
        await rest.save();
        res.redirect('/owner');
    } catch (error) {
        console.error("Error in deleteTable:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.getDashboard = async (req, res) => {
    try {
        let username = req.session.username;
        let user = await User.findByname(username);
        if (!user) {
            return res.status(404).send("User not found");
        }
        let restaurant = user.restaurantName;

        // Fetch restaurant document
        let rest = await Restaurant.find_by_id(user.rest_id);

        // Calculate total orders
        let totalOrders = rest.orders ? rest.orders.length : 0;

        // Calculate total customers - count distinct customer names from orders
        const Order = require('../Model/Order_model').Order;
        let customers = await Order.distinct('customerName', { _id: { $in: rest.orders } });
        let totalCustomers = customers.length;

        // Calculate total revenue - sum of all payment amounts
        let totalRevenue = 0;
        let payments = rest.payments || [];
        console.log("Payments count:", payments.length);
        console.log("Payments sample:", payments.slice(0,5));
        payments.forEach(payment => {
            totalRevenue += payment.amount || 0;
        });

        // Prepare data for charts
        // Overall revenue: sum of all payments
        // Monthly revenue: group payments by month and sum amounts
        let monthlyRevenueMap = {};
        let yearlyRevenueMap = {};
        payments.forEach(payment => {
            let month = payment.date ? payment.date.toISOString().slice(0,7) : 'Unknown';
            if(!monthlyRevenueMap[month]){
                monthlyRevenueMap[month] = 0;
            }
            monthlyRevenueMap[month] += payment.amount || 0;

            let year = payment.date ? payment.date.getFullYear() : 'Unknown';
            if(!yearlyRevenueMap[year]){
                yearlyRevenueMap[year] = 0;
            }
            yearlyRevenueMap[year] += payment.amount || 0;
        });
        let monthlyLabels = Object.keys(monthlyRevenueMap).sort();
        let monthlyValues = monthlyLabels.map(label => monthlyRevenueMap[label]);

        let yearlyRevenueLabels = Object.keys(yearlyRevenueMap).sort();
        let yearlyRevenueValues = yearlyRevenueLabels.map(label => yearlyRevenueMap[label]);

        res.render("ownerDashboard", { 
            restaurant, 
            totalOrders, 
            totalCustomers, 
            totalRevenue, 
            yearlyRevenueLabels,
            yearlyRevenueValues,
            monthlyRevenueLabels: monthlyLabels,
            monthlyRevenueValues: monthlyValues
        });
    } catch (error) {
        console.error("Error in getDashboard:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.getMenuManagement = async (req, res) => {
    try {
        console.log("Session rest_id:", req.session.rest_id);
        let rest = await Restaurant.find_by_id(req.session.rest_id); 
        console.log("Found restaurant:", rest);
        if (!rest) {
            console.error("Restaurant not found for id:", req.session.rest_id);
            return res.status(404).send("Restaurant not found");
        }

        let restPopulated = await Restaurant.findById(req.session.rest_id).populate('dishes').populate('orders');
        let products = restPopulated.dishes;

        res.render('menuManagement', { products });
    } catch (error) {
        console.error("Error in getMenuManagement:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.addProduct = async (req, res) => {
    try {
        const { name, category, price, status, imageUrl } = req.body;
        let dish = new Dish({ name, price, description: "good one", image: imageUrl });
        await dish.addDish(req.session.rest_id);
        res.redirect('/owner');
    } catch (error) {
        console.error("Error in addProduct:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.editProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, price, status, imageUrl } = req.body;

        let dish = await Dish.find_by_id(id);
        if (!dish) {
            return res.status(404).send("Dish not found");
        }
        dish.name = name;
        dish.price = price;
        dish.description = "good one";
        dish.image = imageUrl;
        await dish.updateDish();
        res.redirect('/owner');
    } catch (error) {
        console.error("Error in editProduct:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await Dish.removeDish(req.session.rest_id, id);
        res.redirect('/owner/menuManagement');
    } catch (error) {
        console.error("Error in deleteProduct:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Staff CRUD operations for owner

exports.getStaffList = async (req, res) => {
    try {
        const rest_id = req.session.rest_id;
        const staffList = await User.find({ rest_id: rest_id, role: 'staff' });
        // Also fetch restaurant name to pass to view
      /*  const user = await User.findByname(req.session.username);
        const restaurant = user ? user.restaurantName : null;
        const rest = await Restaurant.find_by_id(rest_id);
        const tables = rest ? rest.tables : [];
        const tasks = rest ? rest.tasks || [] : [];
        const restPopulated = await Restaurant.findById(rest_id).populate('dishes').populate('orders');
        res.render('ownerHomepage', { staffList, restaurant, tables, tasks, orders: restPopulated.orders, dishes: restPopulated.dishes });*/
        res.json(staffList);
    } catch (error) {
        console.error("Error in getStaffList:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.addStaff = async (req, res) => {
    try {
        const rest_id = req.session.rest_id;
        const { username, password, restaurantName,email } = req.body;
        if (!username || !password) {
            return res.status(400).send("Missing required fields");
        }
        const newStaff = new User({
            username,
            password,
            role: 'staff',
            rest_id,
            restaurantName,
            email
        });
        await newStaff.save();
        res.redirect('/owner/staffManagement');
    } catch (error) {
        console.error("Error in addStaff:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.editStaff = async (req, res) => {
    try {
        const staffId = req.params.id;
        const { username, password } = req.body;
        if (!username) {
            return res.status(400).send("Missing required fields");
        }
        const updateData = { username };
        if (password && password.trim() !== '') {
            updateData.password = password;
        }
        await User.updateOne({ _id: staffId }, { $set: updateData });
        res.redirect('/owner/staffManagement');
    } catch (error) {
        console.error("Error in editStaff:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.deleteStaff = async (req, res) => {
    try {
        const staffId = req.params.id;
        await User.deleteOne({ _id: staffId });
        res.redirect('/owner/staffManagement');
    } catch (error) {
        console.error("Error in deleteStaff:", error);
        res.status(500).send("Internal Server Error");
    }
};


exports.getTasks = async (req,res)=>{

const rest_id = req.session.rest_id;

const rest = await Restaurant.findById(rest_id).select("tasks")

res.json({ tasks: rest.tasks });
}



exports.deleteTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        const rest_id = req.session.rest_id;
        const rest = await Restaurant.find_by_id(rest_id);
        if (!rest) {
            return res.status(404).send("Restaurant not found");
        }
        rest.tasks = rest.tasks.filter(task => task.id !== parseInt(taskId));
        await rest.save();
        res.redirect('/owner/staffManagement');
    } catch (error) {
        console.error("Error in deleteTask:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.deleteRestaurant = async (req, res) => {
    try {
        const restaurantId = req.params.id;
        // Delete the restaurant
        const restaurant = await Restaurant.findByIdAndDelete(restaurantId);
        if (!restaurant) {
            return res.status(404).send("Restaurant not found");
        }
        // Delete all users related to this restaurant (staff and owner)
        await User.deleteMany({ rest_id: restaurantId });
        res.redirect('/owner'); // Redirect to owner homepage or appropriate page
    } catch (error) {
        console.error("Error deleting restaurant and related users:", error);
        res.status(500).send("Internal Server Error");
    }
};
