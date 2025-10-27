
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
    const { 
      ownerName, 
      ownerEmail, 
      password, 
      restaurantName, 
      location, 
      contactNumber,
      amount,
      cuisineTypes,
      additionalNotes 
    } = req.body;

    // Validation
    if (!ownerName || !ownerEmail || !password || !restaurantName || !location || !contactNumber || amount === undefined) {
      return res.status(400).json({ 
        error: 'All required fields must be filled' 
      });
    }

    if (amount < 0) {
      return res.status(400).json({ 
        error: 'Registration fee must be a positive number' 
      });
    }

    if (!cuisineTypes || cuisineTypes.length === 0) {
      return res.status(400).json({ 
        error: 'Please select at least one cuisine type' 
      });
    }

    // Check if restaurant name already exists
    const existingRestaurantName = await Restaurant.findOne({ name: restaurantName });
    const existingReqName = await restaurantReq.findOne({ name: restaurantName });

    if (existingRestaurantName || existingReqName) {
      return res.status(409).json({ 
        error: 'Restaurant name already exists' 
      });
    }

    // Check if email already exists
    const existingRestaurantEmail = await Restaurant.findOne({ email: ownerEmail });
    const existingReqEmail = await restaurantReq.findOne({ email: ownerEmail });

    if (existingRestaurantEmail || existingReqEmail) {
      return res.status(409).json({ 
        error: 'Email already registered' 
      });
    }

    // Check if user with this email exists
    const existingUser = await User.findOne({ email: ownerEmail });
    
    // Create restaurant request
    const restreq = new restaurantReq({
      name: restaurantName,
      location: location,
      amount: amount, // Registration fee to be paid to admin
      owner_username: existingUser ? existingUser.username : ownerEmail.split('@')[0],
      owner_password: password,
      date_joined: new Date(),
      email: ownerEmail,
      contactNumber: contactNumber,
      cuisineTypes: cuisineTypes, // Store array of cuisine types
      additionalNotes: additionalNotes || ''
    });

    await restreq.save();

    // If user doesn't exist, create owner account
    if (!existingUser) {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const newUser = new User({
        username: ownerEmail.split('@')[0],
        email: ownerEmail,
        role: 'owner',
        restaurantName: null, // Will be set when admin approves
        password: hashedPassword,
        rest_id: null
      });
      
      await newUser.save();
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Restaurant application submitted successfully! Our team will review and contact you soon.' 
    });

  } catch (error) {
    console.error("Error submitting restaurant request:", error);
    return res.status(500).json({ 
      error: 'Server error. Please try again later.' 
    });
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
