// server.js
const express = require("express");
const path = require("path");
const bodyparser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const { connectDB } = require("./util/database");
const cors = require("cors");
// Models
const RestaurantRequest = require("./Model/restaurent_request_model.js");
const { Restaurant } = require("./Model/Restaurents_model.js");
const { User } = require("./Model/userRoleModel.js");
const customerPublicRoutes = require("./routes/customerPublic");
const app = express();

// Middleware
// Note: bodyparser.urlencoded automatically skips multipart/form-data, 
// and multer will handle it, so this should work fine
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", "views");

app.use(
  session({
    secret: "session",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 1000 * 60 * 30 * 24,
      sameSite: "lax",
    },
  })
);

const authRoutes = require("./routes/authRoutes.js");
const loginPage = require("./routes/loginPage.js");
const customerRouter = require("./routes/customer.js");
const adminRouter = require("./routes/adminroutes.js");
const ownerRouter = require("./routes/ownerRoutes.js");
const staffRouter = require("./routes/staffRouter.js");

const reservationRouter = require("./routes/reservationRoutes.js");

const homepageController = require("./Controller/homePageController.js");
const menuController = require("./Controller/menuController.js");
const staffController = require("./Controller/staffController.js");
const authentication = require("./authenticationMiddleWare.js");
const validation = require("./passwordAuth.js");
const { uploadRestaurantImage, handleUploadErrors } = require("./util/fileUpload.js");

connectDB();

// Mount auth routes
app.use("/api/auth", authRoutes);

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.log(err);
    res.redirect("/");
  });
});

app.use("/loginPage", loginPage);

//  public
app.use("/api/customer", customerPublicRoutes);

// Mount routers at both /role and /api/role paths so frontend can call /api/* endpoints
app.use("/customer", authentication("customer"), customerRouter);
app.use("/api/customer", authentication("customer"), customerRouter);

app.use("/admin", authentication("admin"), adminRouter);
app.use("/api/admin", authentication("admin"), adminRouter);

app.use("/owner", authentication("owner"), ownerRouter);
app.use("/api/owner", authentication("owner"), ownerRouter);



app.use("/reservations", authentication("owner"), reservationRouter);



// Staff routes - use router for all /staff and /api/staff paths
app.use('/api/staff', authentication('staff'), staffRouter);
// Also mount staffRouter at /staff for API routes (like /staff/homepage)
app.use('/staff', authentication('staff'),
staffRouter);

app.get("/", homepageController.getHomePage);
app.post("/", validation, homepageController.putHomePage);

app.get("/menu/:restid", authentication("customer"), menuController.getMenu);

app.get("/create", (req, res) => {
  res.render("restaurantRequest");
});

app.get("/req_res", homepageController.getRestReq);
app.post("/req_res", uploadRestaurantImage, handleUploadErrors, homepageController.postRestReq);

app.get("/check-session", async (req, res) => {
  try {
    if (req.session.username && req.session.cookie._expires > new Date()) {
      const user = await User.findOne({
        username: req.session.username,
      }).select("role");
      if (!user) {
        return res.json({ valid: false });
      }
      return res.json({
        valid: true,
        username: req.session.username,
        role: user.role,
      });
    }
    res.json({ valid: false });
  } catch (err) {
    console.error("Error in /check-session:", err);
    res.status(500).json({ valid: false, error: "Server error" });
  }
});

app.get("/api/restaurants", async (req, res) => {
  try {
    const { city } = req.query; // match your AJAX query param
    let query = {};

    if (city && city !== "All") {
      query.location = { $regex: new RegExp(city.trim(), "i") };
    }

    const restaurants = await Restaurant.find(query);

    res.json(restaurants);
  } catch (err) {
    console.error("Error fetching restaurants:", err);
    res.status(500).json({ error: "Failed to fetch restaurants" });
  }
});

if (require.main === module) {
  app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
  });
}

module.exports = app;
