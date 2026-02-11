// server.js
const express = require("express");
const path = require("path");
const bodyparser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const csrf = require("csurf");
const { connectDB } = require("./util/database");
const cors = require("cors");
const morgan = require("morgan");
const rfs = require("rotating-file-stream");
// Models
const RestaurantRequest = require("./Model/restaurent_request_model.js");
const { Restaurant } = require("./Model/Restaurents_model.js");
const { User } = require("./Model/userRoleModel.js");
const customerPublicRoutes = require("./routes/customerPublic");
const app = express();

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

const csrfProtection = csrf();
app.use(csrfProtection);

const authRoutes = require("./routes/authRoutes.js");
const loginPage = require("./routes/loginPage.js");
const customerRouter = require("./routes/customer.js");
const adminRouter = require("./routes/adminroutes.js");
const ownerRouter = require("./routes/ownerRoutes.js");
const staffRouter = require("./routes/staffRouter.js");

const reservationRouter = require("./routes/reservationRoutes.js");
const customerSupportRouter = require("./routes/customerSupportRoutes.js");
const ownerSupportRouter = require("./routes/ownerSupportRoutes.js");
const adminSupportRouter = require("./routes/adminSupportRoutes.js");

const homepageController = require("./Controller/homePageController.js");
const menuController = require("./Controller/menuController.js");
const staffController = require("./Controller/staffController.js");
const authentication = require("./authenticationMiddleWare.js");
const validation = require("./passwordAuth.js");
const { verifyToken, AUTH_TOKEN_COOKIE } = require("./util/jwtHelper.js");
const { uploadRestaurantImage, handleUploadErrors } = require("./util/fileUpload.js");

connectDB()

// Logging setup
const programLogStream = rfs.createStream('programlog.txt', {
  interval: '1d', // rotate daily
  path: path.join(__dirname, 'logs')
});

const errorLogStream = rfs.createStream('error.txt', {
  interval: '1d', // rotate daily
  path: path.join(__dirname, 'logs')
});

// Morgan middleware for logging all requests
app.use(morgan('combined', { stream: programLogStream }));

// Mount auth routes
app.use("/api/auth", authRoutes);

// CSRF token endpoint
app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.log(err);
    res.clearCookie(AUTH_TOKEN_COOKIE, { path: "/" });
    res.redirect("/");
  });
});


app.use("/loginPage", loginPage);

//  public
app.use("/api/customer", customerPublicRoutes);

// Mount routers at both /role and /api/role paths so frontend can call /api/* endpoints
// Support routes must be mounted BEFORE generic role routers to ensure proper matching
app.use("/api/customer/support", authentication("customer"), customerSupportRouter);
app.use("/customer", authentication("customer"), customerRouter);
app.use("/api/customer", authentication("customer"), customerRouter);

app.use("/api/admin/support", authentication("admin"), adminSupportRouter);
app.use("/admin", authentication("admin"), adminRouter);
app.use("/api/admin", authentication("admin"), adminRouter);

app.use("/api/owner/support", authentication("owner"), ownerSupportRouter);
app.use("/owner", authentication("owner"), ownerRouter);
app.use("/api/owner", authentication("owner"), ownerRouter);



app.use("/reservations", authentication("owner"), reservationRouter);



// Staff routes - use router for all /staff and /api/staff paths
app.use('/api/staff', authentication('staff'), staffRouter);
// Also mount staffRouter at /staff for API routes (like /staff/homepage)
app.use('/staff', authentication('staff'),
staffRouter);

// Inline try/catch route handlers to forward errors via next(err)
app.get("/", async (req, res, next) => {
  try {
    await homepageController.getHomePage(req, res, next);
  } catch (err) {
    err.status = err.status || 500;
    err.message = err.message || "Internal Server Error";
    return next(err);
  }
});

/*app.post("/", validation, async (req, res, next) => {
  try {
    await homepageController.putHomePage(req, res, next);
  } catch (err) {
    err.status = err.status || 500;
    err.message = err.message || "Internal Server Error";
    return next(err);
  }
});*/

app.get(
  "/menu/:restid",
  authentication("customer"),
  async (req, res, next) => {
    try {
      await menuController.getMenu(req, res, next);
    } catch (err) {
      err.status = err.status || 500;
      err.message = err.message || "Internal Server Error";
      return next(err);
    }
  }
);

app.get("/create", (req, res) => {
  res.render("restaurantRequest");
});

app.get("/req_res", homepageController.getRestReq);
app.post(
  "/req_res",
  uploadRestaurantImage,
  handleUploadErrors,
  async (req, res, next) => {
    try {
      await homepageController.postRestReq(req, res, next);
    } catch (err) {
      err.status = err.status || 500;
      err.message = err.message || "Server error. Please try again later.";
      return next(err);
    }
  }
);

// CSRF error handling
app.use((err, req, res, next) => {
  if (err && err.code === "EBADCSRFTOKEN") {
    return res.status(403).json({ message: "Invalid CSRF token" });
  }
  return next(err);
});

// Error-handling middleware (must be added after all routes)
app.use((err, req, res, next) => {
  // Log full error to error.txt
  const errorMessage = `Unhandled error: ${err && err.stack ? err.stack : err}\n`;
  errorLogStream.write(errorMessage);

  const status = err && err.status ? err.status : 500;
  const message = err && err.message ? err.message : "Internal Server Error";

  // Return standardized JSON error with message and original URL
  if (res.headersSent) {
    return next(err);
  }
  res.status(status).json({ message, url: req.originalUrl });
});

// Legacy /check-session: same logic as /api/auth/check-session (session then JWT)
app.get("/check-session", async (req, res) => {
  try {
    if (req.session.username && req.session.cookie._expires > new Date()) {
      const user = await User.findOne({ username: req.session.username }).select("role");
      if (!user) return res.json({ valid: false });
      return res.json({ valid: true, username: req.session.username, role: user.role });
    }
    const token = req.cookies?.[AUTH_TOKEN_COOKIE];
    if (token) {
      const payload = verifyToken(token);
      if (payload?.username) {
        const user = await User.findOne({ username: payload.username }).select("role");
        if (user) return res.json({ valid: true, username: payload.username, role: user.role });
      }
    }
    res.json({ valid: false });
  } catch (err) {
    console.error("Error in /check-session:", err);
    res.status(500).json({ valid: false, error: "Server error" });
  }
});

app.get("/api/restaurants", async (req, res) => {
  try {
    const restaurants = await Restaurant.find({});
    
    // Get unique cities for the dropdown
    const uniqueCities = [
      ...new Set(restaurants.map((r) => r.city).filter(Boolean)),
    ].sort();

    res.json({
      restaurants: restaurants,
      cities: ["All", ...uniqueCities], // Include "All" option
    });
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
