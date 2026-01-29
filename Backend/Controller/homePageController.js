const path = require("path");
const Restaurant = require("../Model/Restaurents_model").Restaurant;
const { User } = require("../Model/userRoleModel");
const restaurantReq = require("../Model/restaurent_request_model");

exports.getHomePage = async (req, res) => {
  try {
    let login = req.session?.username ? true : false;
    const { city_option_home: loco, name_resaurent: name2 } = req.query;

    let query = {};

    if (loco) {
      query.location = { $regex: new RegExp(loco.trim(), "i") };
    }
    if (name2) {
      query.name = { $regex: new RegExp(name2.trim(), "i") };
    }

    let arr = await Restaurant.find(query);
    if (arr.length === 0) {
      arr = await Restaurant.find();
    }

    let userRole = await User.findOne({ username: req.session?.username });
    userRole = userRole?.role || null;
    const uniqueLocations = await Restaurant.distinct("location");

    res.render("home_page", {
      arr,
      login,
      user: userRole,
      city_option_home: loco || "All",
      uniqueLocations,
    });
  } catch (err) {
    console.error("Error in getHomePage:", err);
    res.status(500).send("Internal Server Error");
  }
};

exports.getRestReq = async (req, res) => {
  res.render("restaurantRequest");
};

exports.postRestReq = async (req, res) => {
  try {
    // Debug: Log what we're receiving
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);

    // Handle FormData parsing - cuisineTypes might be an array or single value
    let cuisineTypes = req.body.cuisineTypes;
    if (!Array.isArray(cuisineTypes)) {
      // If it's a single value, convert to array, otherwise make empty array
      cuisineTypes = cuisineTypes ? [cuisineTypes] : [];
    }

    // Handle operating days - might be an array or single value
    let operatingDays = req.body.operatingDays;
    if (!Array.isArray(operatingDays)) {
      operatingDays = operatingDays ? [operatingDays] : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    }

    const {
      ownerName,
      ownerEmail,
      password,
      restaurantName,
      location,
      city,
      contactNumber,
      amount: amountRaw,
      additionalNotes,
      openingTime = "09:00",
      closingTime = "22:00",
    } = req.body;

    console.log("Parsed values:", {
      ownerName,
      ownerEmail,
      password: password ? "***" : undefined,
      restaurantName,
      location,
      city,
      contactNumber,
      amountRaw,
      cuisineTypes,
    });

    // Convert amount to number
    const amount = parseFloat(amountRaw);

    // Validation
    if (
      !ownerName ||
      !ownerEmail ||
      !password ||
      !restaurantName ||
      !location ||
      !city ||
      !contactNumber ||
      amount === undefined ||
      isNaN(amount)
    ) {
      return res.status(400).json({
        error: "All required fields must be filled",
      });
    }

    if (amount < 0) {
      return res.status(400).json({
        error: "Registration fee must be a positive number",
      });
    }

    if (!cuisineTypes || cuisineTypes.length === 0) {
      return res.status(400).json({
        error: "Please select at least one cuisine type",
      });
    }

    // Check if restaurant name already exists
    const existingRestaurantName = await Restaurant.findOne({
      name: restaurantName,
    });
    const existingReqName = await restaurantReq.findOne({
      name: restaurantName,
    });

    if (existingRestaurantName || existingReqName) {
      return res.status(409).json({
        error: "Restaurant name already exists",
      });
    }

    // Check if email already exists
    const existingRestaurantEmail = await Restaurant.findOne({
      email: ownerEmail,
    });
    const existingReqEmail = await restaurantReq.findOne({ email: ownerEmail });

    if (existingRestaurantEmail || existingReqEmail) {
      return res.status(409).json({
        error: "Email already registered",
      });
    }

    // Check if user with this email exists
    const existingUser = await User.findOne({ email: ownerEmail });
    if (existingUser) {
      return res.status(409).json({
        error: 'A user with this email already exists. Please use a different email.'
      });
    }

    const existingUsername = await User.findOne({ username:ownerName });
if (existingUsername) {
  return res.status(409).json({
    error: "Username already exists. Please use a different email prefix."
  });
}


    // Handle image upload (if provided)
    let imageFilename = null;
    if (req.file) {
      imageFilename = req.file.filename;
      console.log("Image uploaded:", imageFilename);
    } else {
      console.log("No image file received");
    }

    // Generate username from email if not provided
   // const username = existingUser ? existingUser.username : (ownerEmail ? ownerEmail.split("@")[0] : null);
    const username = ownerName;
    // Final validation - ensure all required fields are present
    if (!username || !ownerEmail || !password || !restaurantName) {
      console.error("Missing required fields:", {
        username: !!username,
        ownerEmail: !!ownerEmail,
        password: !!password,
        restaurantName: !!restaurantName,
      });
      return res.status(400).json({
        error: "Missing required fields: username, email, password, or restaurant name",
      });
    }

    // Create restaurant request
    const restreq = new restaurantReq({
      name: restaurantName,
      location: location,
      city: city,
      amount: amount, // Registration fee to be paid to admin
      owner_username: username,
      owner_password: password, // Store plain password (will be hashed when user account is created)
      email: ownerEmail,
      contactNumber: contactNumber || "",
      cuisineTypes: cuisineTypes.length > 0 ? cuisineTypes : [], // Ensure array
      additionalNotes: additionalNotes || "",
      operatingHours: {
        open: openingTime,
        close: closingTime,
      },
      operatingDays: operatingDays.length > 0 ? operatingDays : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      image: imageFilename || null, // Store restaurant image filename
    });

    console.log("Restaurant request to save:", {
      name: restreq.name,
      email: restreq.email,
      owner_username: restreq.owner_username,
      has_password: !!restreq.owner_password,
      has_image: !!restreq.image,
      cuisineTypes: restreq.cuisineTypes,
    });

    const savedRequest = await restreq.save();
    console.log("Restaurant request saved successfully with ID:", savedRequest._id);
    console.log("Saved request data:", {
      _id: savedRequest._id,
      name: savedRequest.name,
      email: savedRequest.email,
      owner_username: savedRequest.owner_username,
      has_password: !!savedRequest.owner_password,
      has_image: !!savedRequest.image,
    });

    // If user doesn't exist, create owner account
   /* if (!existingUser) {
      const bcrypt = require("bcrypt");
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User({
        username: username,
        email: ownerEmail,
        role: "owner",
        restaurantName: null, // Will be set when admin approves
        password: hashedPassword,
        rest_id: null,
      });

      console.log("Creating new user:", {
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        has_password: !!newUser.password,
      });

      await newUser.save();
      console.log("User account created successfully");
    } else {
      console.log("User already exists, skipping user creation");
    }
*/
    return res.status(200).json({
      success: true,
      message:
        "Restaurant application submitted successfully! Our team will review and contact you soon.",
    });
  } catch (error) {
    console.error("Error submitting restaurant request:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      error: "Server error. Please try again later.",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

exports.putHomePage = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.session?.username });
    if (!user) return res.json({ valid: false });

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
    return res.json({ valid: true, role: user.role });
  } catch (err) {
    console.error("Error in putHomePage:", err);
    res.status(500).send("Internal Server Error");
  }
};
