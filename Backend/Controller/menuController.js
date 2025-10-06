const path = require('path');
const Person = require('../Model/customer_model');
const Restaurant = require('../Model/Restaurents_model').Restaurant;
const Dish = require('../Model/Dishes_model_test').Dish;


exports.getMenu = async (req,res)=>{    
    const id = req.params.restid;
    const rest = await Restaurant.find_by_id(id);

    // Set rest_id in session
    req.session.rest_id = id;

    let dishes = [];
    for(let i=0 ;i<rest.dishes.length;i++){    
    let tm_dishes = await Dish.find_by_id(rest.dishes[i]);
    dishes.push(tm_dishes);
    }

    // Get cart from Person model for logged-in user
    const user = req.user;
    let person = await Person.findOne({ email: user.email });
    let cart = person ? person.cart : [];

    res.render('menu',{ restaurant: {name:rest.name,location:rest.location,rest_id:id}, dishes: dishes, cart: cart })
}

// Add dish to cart
exports.addDishToCart = async (req, res) => {
    try {
        const user = req.user;
        const dishName = req.body.dish;
        if (!dishName) {
            return res.status(400).send('Dish name is required');
        }
        let person = await Person.findOne({ email: user.email });
        if (!person) {
            return res.status(404).send('User not found');
        }
        // Check if dish already in cart
        let cart = person.cart || [];
        let itemIndex = cart.findIndex(item => item.dish === dishName);
        if (itemIndex > -1) {
            // Increase quantity
            cart[itemIndex].quantity += 1;
        } else {
            // Add new dish with quantity 1
            cart.push({ dish: dishName, quantity: 1 });
        }
        person.cart = cart;
        await person.save();
        res.redirect('back');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

// Increase dish quantity in cart
exports.increaseDishQuantity = async (req, res) => {
    try {
        const user = req.user;
        const dishName = req.body.dish;
        if (!dishName) {
            return res.status(400).send('Dish name is required');
        }
        let person = await Person.findOne({ email: user.email });
        if (!person) {
            return res.status(404).send('User not found');
        }
        let cart = person.cart || [];
        let itemIndex = cart.findIndex(item => item.dish === dishName);
        if (itemIndex > -1) {
            cart[itemIndex].quantity += 1;
            person.cart = cart;
            await person.save();
        }
        res.redirect('back');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

// Decrease dish quantity in cart
exports.decreaseDishQuantity = async (req, res) => {
    try {
        const user = req.user;
        const dishName = req.body.dish;
        if (!dishName) {
            return res.status(400).send('Dish name is required');
        }
        let person = await Person.findOne({ email: user.email });
        if (!person) {
            return res.status(404).send('User not found');
        }
        let cart = person.cart || [];
        let itemIndex = cart.findIndex(item => item.dish === dishName);
        if (itemIndex > -1) {
            if(cart[itemIndex].quantity > 1){
                cart[itemIndex].quantity -= 1;
            } else {
                // Remove item if quantity is 1 and decrease is requested
                cart.splice(itemIndex, 1);
            }
            person.cart = cart;
            await person.save();
        }
        res.redirect('back');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

// Order cart - clear cart array and redirect with cart data
exports.orderCart = async (req, res) => {
    try {
        const user = req.user;
        let person = await Person.findOne({ email: user.email });
        if (!person) {
            return res.status(404).send('User not found');
        }
        // Get current cart before clearing
        const cart = person.cart || [];
        const restaurantName = req.body.restaurant || req.session.rest_name || '';
        const rest_id = req.body.rest_id || req.session.rest_id || '';

        // Do NOT clear the cart here as per user request
        // Cart will be cleared only on combined order and reservation submission

        // Store cart and restaurant info in session for orderReservation page
        req.session.temp_cart = cart;
        req.session.rest_name = restaurantName;
        req.session.rest_id = rest_id;

        // Redirect to orderReservation page
        res.redirect('/customer/order_reservation');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};
