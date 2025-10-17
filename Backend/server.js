const express = require('express');
const path = require('path');
const bodyparser = require('body-parser');
const session = require('express-session');
const { connectDB } = require('./util/database');
const { Restaurant } = require('./Model/Restaurents_model.js'); 

const app = express();

app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', 'views');


app.use(session({
    secret: 'session',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 30 }
}));


const loginPage = require('./routes/loginPage.js');
const customerRouter = require('./routes/customer.js');
const adminRouter = require('./routes/adminroutes.js');
const ownerRouter = require('./routes/ownerRoutes.js');
const staffRouter = require('./routes/staffRouter.js');
const homepageController = require('./Controller/homePageController.js');
const menuController = require('./Controller/menuController.js');
const authentication = require('./authenticationMiddleWare.js');
const validation = require('./passwordAuth.js');

connectDB();

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) console.log(err);
        res.redirect('/');
    });
});

app.use('/loginPage', loginPage);
app.use('/customer', authentication('customer'), customerRouter);
app.use('/admin', authentication('admin'), adminRouter);
app.use('/owner', authentication('owner'), ownerRouter);
app.use('/staff', authentication('staff'), staffRouter);

app.get('/', homepageController.getHomePage);
app.post('/', validation, homepageController.putHomePage);

app.get('/menu/:restid', authentication('customer'), menuController.getMenu);

app.get("/create", (req, res) => {
    res.render("restaurantRequest");
});

app.get('/req_res', homepageController.getRestReq);
app.post('/req_res', homepageController.postRestReq);


app.get('/api/restaurants', async (req, res) => {
  try {
    const { city } = req.query; // match your AJAX query param
    let query = {};

    if (city && city !== 'All') {
      query.location = { $regex: new RegExp(city.trim(), 'i') };
    }

    const restaurants = await Restaurant.find(query);

    res.json(restaurants);
  } catch (err) {
    console.error("Error fetching restaurants:", err);
    res.status(500).json({ error: "Failed to fetch restaurants" });
  }
});


app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});
