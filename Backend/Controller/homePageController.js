
const path = require('path');
const Restaurant = require('../Model/Restaurents_model').Restaurant;
const { User } = require('../Model/userRoleModel');
const restaurantReq = require("../Model/restaurent_request_model")



exports.getHomePage = async (req, res) => {
    try {
        let login = req.session?.username ? true : false;
        const { city_option_home: loco, name_resaurent: name2 } = req.query;

        let query = {};

        if (loco) {
            query.location = { $regex: new RegExp(loco.trim(), 'i') };
        }
        if (name2) {
            query.name = { $regex: new RegExp(name2.trim(), 'i') };
        }

        let arr = await Restaurant.find(query);
        if (arr.length === 0) {
            arr = await Restaurant.find();
        }

        let userRole = await User.findOne({ username: req.session?.username });
        userRole = userRole?.role || null;
        const uniqueLocations = await Restaurant.distinct("location");
      
        res.render('home_page', {
            arr,
            login,
            user: userRole,
            city_option_home: loco || 'All'  ,
            uniqueLocations
        });
    } catch (err) {
        console.error("Error in getHomePage:", err);
        res.status(500).send("Internal Server Error");
    }
};




exports.getRestReq=async (req,res)=>{
    res.render("restaurantRequest")
}

exports.postRestReq = async (req, res) => {
  try {
    const { name, location, amount, owner_username, owner_password, date_joined, email } = req.body;

    const existingRestaurantName = await Restaurant.findOne({ name });
    const existingRestaurantUsername = await User.findOne({ username:owner_username });
    const existingRestaurantEmail = await Restaurant.findOne({ email });

    const existingReqName = await restaurantReq.findOne({ name });
    const existingReqUsername = await restaurantReq.findOne({ owner_username });
    const existingReqEmail = await restaurantReq.findOne({ email });

    if (existingRestaurantName || existingReqName) {
      return res.send("<script>alert('❌ Restaurant name already exists!'); window.history.back();</script>");
    }

    if (existingRestaurantUsername || existingReqUsername) {
      return res.send("<script>alert('❌ Owner username already exists!'); window.history.back();</script>");
    }

    if (existingRestaurantEmail || existingReqEmail) {
      return res.send("<script>alert('❌ Email already exists!'); window.history.back();</script>");
    }

    const restreq = new restaurantReq({
      name,
      location,
      amount,
      owner_username,
      owner_password,
      date_joined,
      email,
    });

    await restreq.save();

    res.send("<script>alert('✅ Restaurant request submitted successfully!'); window.location.href='/loginPage';</script>");

  } catch (error) {
    console.error("Error submitting restaurant request:", error);
    res.status(500).send("<script>alert('⚠️ Server error. Please try again later.'); window.history.back();</script>");
  }
};


exports.putHomePage = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.session?.username });
         if (!user) return res.json({valid:false});

       /* if (user.role === "owner" || user.role === "staff") {
            req.session.rest_id = user.rest_id;
            const redirectUrl = user.role === "owner" ? '/owner/' : '/staff/HomePage';
            return res.redirect(redirectUrl);
        }

        if (user.role === "admin") return res.redirect('/admin/dashboard');

        // For customer, render homepage with all restaurants
        const rest = await Restaurant.find();
        const uniqueLocations = await Restaurant.distinct("location");
        res.render('home_page', { 
            arr: rest, 
            login: true, 
            user: user.role, 
            city_option_home: 'All',  
            name_resaurent: '' ,
            uniqueLocations        
        });*/
                return res.json({valid:true,role:user.role});
    } catch (err) {
        console.error("Error in putHomePage:", err);
        res.status(500).send("Internal Server Error");
    }


};
