
const path = require('path');
const Restaurant = require('../Model/Restaurents_model').Restaurant;
const { User } = require('../Model/userRoleModel');
const RestaurantRequest = require('../Model/restaurent_request_model')

exports.getHomePage = async (req, res) => {
    try {
        let login = req.session?.username ? true : false;

        // Extract query params
        const { city_option_home: loco, name_resaurent: name2 } = req.query;

        // Initialize query object
        let query = {};

        if (loco) {
            query.location = { $regex: new RegExp(loco.trim(), 'i') };
        }
        if (name2) {
            query.name = { $regex: new RegExp(name2.trim(), 'i') };
        }

        // Fetch restaurants based on query
        let arr = await Restaurant.find(query);
        console.log("Restaurants fetched:", arr);

        if (arr.length === 0) {
            arr = await Restaurant.find();
            console.log("All restaurants fetched (fallback):", arr);
        }

        let userRole = await User.findOne({ username: req.session?.username });
        userRole = userRole?.role || null;

        res.render('home_page', {
            arr,
            login,
            user: userRole
        });
    } catch (err) {
        console.error("Error in getHomePage:", err);
        res.status(500).send("Internal Server Error");
    }
};

exports.getRestReq=async (req,res)=>{
    res.render("restaurantRequest")
}

exports.postRestReq=async (req,res)=>{

 const { name, location, amount, owner_username, owner_password, date_joined } = req.body;
 let restreq = new RestaurantRequest({name, location, amount, owner_username, owner_password, date_joined});
 console.log(restreq)
 await restreq.save();

res.redirect("/loginPage");
};

exports.putHomePage = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.session?.username });
        if (!user) return res.json({valid:false});

        /*if (user.role === "owner" || user.role === "staff") {
            req.session.rest_id = user.rest_id;
            const redirectUrl = user.role === "owner" ? '/owner/' : '/staff/HomePage';
            return res.redirect(redirectUrl);
        }

        if (user.role === "admin") return res.redirect('/admin/dashboard');*/
        return res.json({valid:true,role:user.role});

        // For customer, render homepage with all restaurants
       /* const rest = await Restaurant.find();
        res.render('home_page', { arr: rest, login: true, user: user.role });*/
    } catch (err) {
        console.error("Error in putHomePage:", err);
        res.status(500).send("Internal Server Error");
    }
};
