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
const mongoose = require("mongoose")
// Swagger imports
const swaggerUi = require('swagger-ui-express');
const { swaggerSpec } = require('./swagger');
const { graphqlHTTP } = require('express-graphql');
const { Restaurant } = require("./Model/Restaurents_model.js");
const config = require("./config/env");
const { getClearCookieOptions, getCsrfCookieOptions, getSessionCookieOptions } = require("./util/cookies");
const { createSessionStoreManager } = require("./util/sessionStore");
const { performanceMetricsMiddleware } = require("./middleware/performanceMetrics");
const { connectDataCache } = require("./util/dataCache");
const {
  redisReadCacheMiddleware,
  redisInvalidateOnMutationMiddleware,
} = require("./middleware/redisCache");
const { createGraphQLOptions } = require("./graphql/schema");
const { registerGraphQLDocumentationRoutes } = require("./graphql/documentationRoutes");

// Models
const RestaurantRequest = require("./Model/restaurent_request_model.js");

const { User } = require("./Model/userRoleModel.js");
const customerPublicRoutes = require("./routes/customerPublic");
const stripeRoutes = require("./routes/stripe");
const app = express();
const sessionStoreManager = createSessionStoreManager();

if (config.trustProxy) {
  app.set("trust proxy", 1);
}

app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());
app.use(express.json());
app.use(cookieParser());
app.use(performanceMetricsMiddleware);
app.use(redisInvalidateOnMutationMiddleware);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || config.corsAllowedOrigins.length === 0 || config.corsAllowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", "views");

// Stripe payment API route
app.use("/api", stripeRoutes);

app.use(
  session({
    store: sessionStoreManager.store,
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    proxy: config.trustProxy,
    cookie: getSessionCookieOptions(),
  })
);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});


app.get("/schemas", (req, res) => {
  const schemas = {};

  Object.keys(mongoose.models).forEach((modelName) => {
    const model = mongoose.models[modelName];
    schemas[modelName] = {};

    Object.keys(model.schema.paths).forEach((field) => {
      schemas[modelName][field] =
        model.schema.paths[field].instance;
    });
  });

  res.json(schemas);
});

// Swagger docs (before CSRF - must be publicly readable without JWT/CSRF)
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(swaggerSpec);
});
app.use('/api-docs', swaggerUi.serveFiles(swaggerSpec), swaggerUi.setup(swaggerSpec, {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { font-size: 2.5em; }
    .swagger-ui .info .description { font-size: 1.1em; line-height: 1.6; }
  `,
  customSiteTitle: 'RestoConnect API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
  }
}));

registerGraphQLDocumentationRoutes(app);

app.use('/graphql', graphqlHTTP(createGraphQLOptions));

const csrfProtection = csrf({
  cookie: getCsrfCookieOptions(),
  value: (req) => req.headers['x-csrf-token']
});
app.use((req, res, next) => {

  // cookie sent by browser
  //console.log("Cookie header:", req.headers.cookie);

  // csrf token sent by client
  //console.log("Request CSRF Header:", req.headers["x-csrf-token"]);

  if (req.path.startsWith('/api-docs') || req.path.startsWith('/graphql-docs')) return next();
  // Auth endpoints that establish session - no CSRF (user not logged in yet)
  if (req.path === '/api/auth/login' || req.path === '/api/auth/signup') return next();
  if (req.path.startsWith('/api/auth/forgot-password')) return next();
  return csrfProtection(req, res, next);
});

const authRoutes = require("./routes/authRoutes.js");
const loginPage = require("./routes/loginPage.js");
const customerRouter = require("./routes/customer.js");
const adminRouter = require("./routes/adminroutes.js");
const superadminRouter = require("./routes/superadminRoutes.js");
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

/**
 * @swagger
 * /api/csrf-token:
 *   get:
 *     summary: Get CSRF token for protected endpoints
 *     tags: [Authentication]
 *     description: |
 *       This endpoint returns a CSRF token that must be included in the
 *       X-CSRF-Token header for all state-changing requests (POST, PUT, DELETE).
 *       
 *       **How to use:**
 *       1. First call this endpoint to get a CSRF token
 *       2. Include the token in your request header: X-CSRF-Token: {token}
 *       3. Make your state-changing request
 *       
 *       **Note:** The CSRF token is automatically handled when using the
 *       "Authorize" button in Swagger UI with session-based authentication.
 *     responses:
 *       200:
 *         description: CSRF token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example:
 *               csrfToken: "abc123def456..."
 */
// CSRF token endpoint
app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.log(err);
    res.clearCookie("connect.sid", getClearCookieOptions());
    res.clearCookie(AUTH_TOKEN_COOKIE, getClearCookieOptions());
    res.redirect("/");
  });
});


app.use("/loginPage", loginPage);

// Public customer discovery endpoints are cacheable and do not require auth.
app.use("/api/customer", redisReadCacheMiddleware, customerPublicRoutes);

// Mount routers at both /role and /api/role paths so frontend can call /api/* endpoints
// Support routes must be mounted BEFORE generic role routers to ensure proper matching
app.use("/api/customer/support", authentication("customer"), redisReadCacheMiddleware, customerSupportRouter);
app.use("/customer", authentication("customer"), customerRouter);
app.use("/api/customer", authentication("customer"), redisReadCacheMiddleware, customerRouter);

app.use("/api/admin/support", authentication(["admin", "employee"]), redisReadCacheMiddleware, adminSupportRouter);
app.use("/api/superadmin", authentication("admin"), redisReadCacheMiddleware, superadminRouter);
app.use("/admin", authentication(["admin", "employee"]), adminRouter);
app.use("/api/admin", authentication(["admin", "employee"]), redisReadCacheMiddleware, adminRouter);

app.use("/api/employee/support", authentication("employee"), redisReadCacheMiddleware, adminSupportRouter);
app.use("/employee", authentication("employee"), adminRouter);
app.use("/api/employee", authentication("employee"), redisReadCacheMiddleware, adminRouter);

app.use("/api/owner/support", authentication("owner"), redisReadCacheMiddleware, ownerSupportRouter);
app.use("/owner", authentication("owner"), ownerRouter);
app.use("/api/owner", authentication("owner"), redisReadCacheMiddleware, ownerRouter);



app.use("/reservations", authentication("owner"), reservationRouter);



// Staff routes - use router for all /staff and /api/staff paths
app.use('/api/staff', authentication('staff'), redisReadCacheMiddleware, staffRouter);
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
  redisReadCacheMiddleware,
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

// Legacy /check-session: same logic as /api/auth/check-session (JWT first, then legacy session)
app.get("/check-session", async (req, res) => {
  try {
    const token = req.cookies?.[AUTH_TOKEN_COOKIE];
    if (token) {
      const payload = verifyToken(token);
      if (payload?.username) {
        const user = await User.findOne({ username: payload.username }).select("role");
        if (user) return res.json({ valid: true, username: payload.username, role: user.role });
      }
    }
    if (req.session?.username && req.session.cookie._expires > new Date()) {
      const user = await User.findOne({ username: req.session.username }).select("role");
      if (!user) return res.json({ valid: false });
      return res.json({ valid: true, username: req.session.username, role: user.role });
    }
    res.json({ valid: false });
  } catch (err) {
    console.error("Error in /check-session:", err);
    res.status(500).json({ valid: false, error: "Server error" });
  }
});

app.get("/api/restaurants", redisReadCacheMiddleware, async (req, res) => {
  try {
    // Run both queries in parallel — distinct avoids loading all docs just for city names
    const [restaurants, uniqueCities] = await Promise.all([
      Restaurant.find({})
        .select("_id name image rating location city cuisine isOpen operatingHours distance date")
        .lean(),
      Restaurant.distinct("city"),
    ]);

    res.json({
      restaurants: restaurants,
      cities: ["All", ...(uniqueCities || []).filter(Boolean).sort()],
    });
  } catch (err) {
    console.error("Error fetching restaurants:", err);
    res.status(500).json({ error: "Failed to fetch restaurants" });
  }
});

const startServer = async () => {
  await sessionStoreManager.connect();
  await connectDataCache();
  await connectDB();

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });
}

module.exports = app;

