// server.js
const express = require('express');
const path = require('path');
const bodyparser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const { connectDB } = require('./util/database');
const cors = require("cors");
// Models
const RestaurantRequest = require('./Model/restaurent_request_model.js'); // ✅ Correct spelling
const { Restaurant } = require('./Model/Restaurents_model.js'); // ✅ Correct spelling
const {User} = require('./Model/userRoleModel.js');
const app = express();

// Middleware
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', 'views');


app.use(session({
  secret: "session",
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: false,     
    maxAge: 1000 * 60 * 30 * 24,
    sameSite: "lax"    
  }
}));



// Routes & Controllers
const loginPage = require('./routes/loginPage.js');
const customerRouter = require('./routes/customer.js');
const adminRouter = require('./routes/adminroutes.js');
const ownerRouter = require('./routes/ownerRoutes.js');
const staffRouter = require('./routes/staffRouter.js');
const homepageController = require('./Controller/homePageController.js');
const menuController = require('./Controller/menuController.js');
const authentication = require('./authenticationMiddleWare.js');
const validation = require('./passwordAuth.js');
const res_req = require(path.join(__dirname,'routes','customer.js'));

// Connect to MongoDB
connectDB();

// Logout route
app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Session destroy error:", err);
            return res.status(500).json({ error: "Logout failed" });
        }
        res.clearCookie("connect.sid", { path: "/" });  // Clear the session cookie
        res.json({ message: "Logged out successfully" });
    });
});


// Use Routers
app.use('/loginPage', loginPage);
app.use('/customer', authentication('customer'), customerRouter);
app.use('/admin', authentication('admin'), adminRouter);
app.use('/owner', authentication('owner'), ownerRouter);
app.use('/staff', authentication('staff'), staffRouter);

// Home page
app.use('/res_req', res_req);
app.get('/', homepageController.getHomePage);
app.post('/', validation, homepageController.putHomePage);

// Menu page
app.get('/menu/:restid', authentication('customer'), menuController.getMenu);

// Restaurant request page
app.get("/create", (req, res) => {
    res.render("restaurantRequest");
});

app.get('/req_res', homepageController.getRestReq);
app.post('/req_res', homepageController.postRestReq);

// ===================== API ROUTES =====================
// API: fetch restaurants (used by AJAX in homepage.ejs)
app.get('/api/restaurants', async (req, res) => {
    try {
        const { city_option_home: loco, name_resaurent: name2 } = req.query;

        let query = {};
        if (loco) query.location = { $regex: new RegExp(loco.trim(), 'i') };
        if (name2) query.name = { $regex: new RegExp(name2.trim(), 'i') };

        let restaurants = await Restaurant.find(query);

        if (restaurants.length === 0) {
            restaurants = await Restaurant.find(); // fallback
        }

        res.json(restaurants);
    } catch (err) {
        console.error("Error fetching restaurants:", err);
        res.status(500).json({ error: "Failed to fetch restaurants" });
    }
});


//================= to know if your session is valid or not==========
app.get("/check-session", async (req, res) => {
  try {
    if (req.session.username && req.session.cookie._expires > new Date()) {  
      const user = await User.findOne({ username: req.session.username }).select("role");
      if (!user) {
        return res.json({ valid: false });
      }
      return res.json({
        valid: true,
        username: req.session.username,
        role: user.role
      });
    }
    res.json({ valid: false });

  } catch (err) {
    console.error("Error in /check-session:", err);
    res.status(500).json({ valid: false, error: "Server error" });
  }
});



// ===================== START SERVER =====================
app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});
