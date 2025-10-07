// Controller/adminController.js
const path = require('path');
const bcrypt = require('bcrypt');
const { User } = require('../Model/userRoleModel');
const { Restaurant } = require('../Model/Restaurents_model'); // ✅ Correct spelling
const RestaurantRequest = require('../Model/restaurent_request_model'); // ✅ Correct spelling
const { Dish } = require('../Model/Dishes_model_test');

// Admin Dashboard
exports.getAdminDashboard = async (req, res) => {
    try {
        const restaurants = await Restaurant.findAll();
        const formattedRestaurants = restaurants.map(r => ({
            name: r.name,
            location: r.location,
            amount: r.amount,
            date: r.date,
            _id: r._id,
            image: r.image,
        }));

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const totalRevenue = restaurants.reduce((sum, r) => {
            const joinDate = new Date(r.date);
            if (joinDate.getMonth() === currentMonth && joinDate.getFullYear() === currentYear) {
                return sum + (r.amount || 0);
            }
            return sum;
        }, 0);

        const currentAdminUsername = req.user ? req.user.username : null;
        let currentAdminProfile = null;
        if (currentAdminUsername) {
            currentAdminProfile = await User.findOne({ username: currentAdminUsername });
        }

        let users = [];
        if (currentAdminUsername) {
            users = await User.find({ username: { $ne: currentAdminUsername } });
        } else {
            users = await User.find({});
        }

        users = users.map(user => {
            if (user.role === 'customer') user.restaurantName = '';
            return user;
        });

        const totalUserCount = await User.countDocuments();

       /* res.render(path.join(__dirname, '..', 'views', 'Admin_Dashboard'), { 
            active_user_count: 0, // You can calculate active users if needed
            total_user_count: totalUserCount,
            current_admin: currentAdminProfile,
            totalRevenue,
            restaurants_list: formattedRestaurants,
            users_list: users
        });*/
        res.json({ 
            active_user_count: 0, // You can calculate active users if needed
            total_user_count: totalUserCount,
            current_admin: currentAdminProfile,
            totalRevenue,
            restaurants_list: formattedRestaurants,
            users_list: users
        })
    } catch (error) {
        console.error("Error in getAdminDashboard:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const currentAdminUsername = req.user ? req.user.username : null;
        let users = [];
        if (currentAdminUsername) {
            users = await User.find();
        } else {
            users = await User.find({});
        }
        res.json(users);
    } catch (error) {
        console.error("Error in getAllUsers:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Get statistics
exports.getStatistics = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalRestaurants = await Restaurant.countDocuments();
        const restaurants = await Restaurant.findAll();
        const totalRevenue = restaurants.reduce((sum, r) => sum + (r.amount || 0), 0);
        res.json({ totalUsers, totalRestaurants, totalRevenue });
    } catch (error) {
        console.error("Error in getStatistics:", error);
        res.status(500).send("Internal Server Error");
    }
};


//add user
exports.addUser = async (req, res) => {
  try {
    let { username, fullname, password, email, role } = req.body;

    // Check if username or email already exists
    const chk = await User.findOne({
      $or: [{ username: username }, { email: email }],
    });

    if (chk) {
      return res.status(400).send("error: user already exists");
    }

    // If role is customer → create Person document
    if (role === "customer") {
      const newPerson = new Person({
        name: fullname || username,
        img_url: "/images/default-user.jpg",
        email: email,
        prev_orders: [],
        top_dishes: {},
        top_restaurent: {},
        cart: [],
      });
      await newPerson.save();
    }

    // Create the User document
    password = password.toString().trim();
    const newUser = new User({
      username,
      email,
      role,
      restaurantName: role === "admin" ? fullname : null,
      password,
      rest_id: null,
    });

    await newUser.save();
    console.log("User created:", newUser.username);

    res.status(201).send("user added successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("server error");
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        await User.deleteOne({ _id: userId });
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error("Error in deleteUser:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Edit user
exports.editUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { username, email, role, restaurantName, password } = req.body;
        if (!username || !role) return res.status(400).json({ error: "Missing required fields!" });

        const updateData = { username, email, role, restaurantName };
        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password.trim(), 10);
        }

        await User.updateOne({ _id: userId }, { $set: updateData });
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error("Error in editUser:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Edit admin profile
exports.editProfile = async (req, res) => {
    try {
        const currentAdminUsername = req.user ? req.user.username : null;
        if (!currentAdminUsername) return res.redirect('/loginPage');

        const { username, email, password } = req.body;
        if (!username || !email) return res.status(400).send("Missing required fields");

        const updateData = { username, email };
        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password.trim(), 10);
        }

        await User.updateOne({ username: currentAdminUsername }, { $set: updateData });
        if (username !== currentAdminUsername) req.session.username = username;

        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error("Error in editProfile:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Add restaurant
exports.postAddRestaurent = async (req, res) => {
    try {
        const { name, location, amount, owner_username, owner_password, owner_email } = req.body;
        if (!name || !location || !amount) return res.status(400).json({ error: "Missing required fields!" });

        const newRestaurant = new Restaurant({ name, location, amount, date: new Date(), image: '', rating: 4 });
        await newRestaurant.save();

        const ownerUser = new User({
            username: owner_username || `${name.toLowerCase().replace(/\s/g, '')}_owner`,
            password: owner_password || 'defaultpassword',
            email: owner_email || '',
            role: 'owner',
            restaurantName: name,
            rest_id: newRestaurant._id
        });
        await ownerUser.save();

        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error("Error in postAddRestaurent:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Edit restaurant
exports.postEditRestaurent = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, location, amount } = req.body;
        if (!name || !location || !amount) return res.status(400).json({ error: "Missing required fields!" });

        await Restaurant.updateFull({ _id: id, name, location, amount });
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error("Error in postEditRestaurent:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Delete restaurant
exports.postDeleteRestaurent = async (req, res) => {
    try {
        const id = req.params.id;
        const restaurant = await Restaurant.find_by_id(id);
        if (restaurant) {
            await Dish.deleteMany({ _id: { $in: restaurant.dishes } });
            await User.deleteMany({ rest_id: id });
        }
        await Restaurant.deleteOne({ _id: id });
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error("Error in postDeleteRestaurent:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Get all restaurants
exports.getAllRestaurants = async (req, res) => {
    try {
        const restaurants = await Restaurant.findAll();
        res.json(restaurants);
    } catch (error) {
        console.error("Error fetching restaurants:", error);
        res.status(500).send("Internal Server Error");
    }
};

// Accept restaurant request
exports.getaceptreq = async (req, res) => {
    try {
        const ownername = req.params.owner_username;
        const request = await RestaurantRequest.findOne({ owner_username: ownername });
        if (!request) return res.status(404).json({ error: "Request not found" });

        const newRestaurant = new Restaurant({
            name: request.name,
            location: request.location,
            amount: request.amount,
            date: request.date_joined,
            created_at: new Date()
        });
        await newRestaurant.save();

        const newOwner = new User({
            username: request.owner_username,
            password: request.owner_password,
            role: "owner",
            restaurantName: request.name,
            rest_id: newRestaurant._id
        });
        await newOwner.save();

        await RestaurantRequest.deleteOne({ _id: request._id });

        res.json({ message: "Request accepted successfully" });
    } catch (err) {
        console.error("Error accepting request:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Reject restaurant request
exports.getrejectreq = async (req, res) => {
    try {
        const ownername = req.params.owner_username;
        const request = await RestaurantRequest.findOne({ owner_username: ownername });
        if (!request) return res.status(404).json({ error: "Request not found" });

        await RestaurantRequest.deleteOne({ _id: request._id });
        res.json({ message: "Request rejected successfully" });
    } catch (err) {
        console.error("Error rejecting request:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Get all requests
exports.getAllRequests = async (req, res) => {
    try {
        const requests = await RestaurantRequest.find();
        res.json(requests);
    } catch (err) {
        console.error("Error fetching requests:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};



// ✅ Public API for homepage (fetch restaurants via AJAX)
exports.getPublicRestaurants = async (req, res) => {
    try {
        const restaurants = await Restaurant.findAll(); // fetch all restaurants
        res.json(restaurants); // send as JSON
    } catch (error) {
        console.error("Error fetching public restaurants:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
