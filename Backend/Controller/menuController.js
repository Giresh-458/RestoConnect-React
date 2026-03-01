const path = require('path');
const Person = require('../Model/customer_model');
const Restaurant = require('../Model/Restaurents_model').Restaurant;
const Dish = require('../Model/Dishes_model_test').Dish;
const { getImageUrl } = require('../util/fileUpload');


exports.getMenu = async (req,res,next)=>{    
    try {
        const id = req.params.restid;
        const rest = await Restaurant.find_by_id(id);

        if (!rest) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }

        // Set rest_id in session
        req.session.rest_id = id;

        let dishes1 = [];
        for(let i=0 ;i<rest.dishes.length;i++){
            let dsh = await Dish.find_by_id(rest.dishes[i])
            if(dsh){
                dishes1.push(dsh)
            }
        }

        // Format dishes for frontend
        const formattedDishes = dishes1.map(dish => ({
            id: dish._id,
            name: dish.name,
            price: dish.price,
            amount: dish.price, // For cart compatibility
            description: dish.description || '',
            image: getImageUrl(req, dish.image) || null
        }));

        // Return JSON for React frontend
        res.json({ 
            restaurant: {
                id: rest._id,
                name: rest.name,
                location: rest.location,
                image: rest.image,
                rating: rest.rating,
                isOpen: rest.isOpen,
                taxRate: Number(rest.taxRate) || 0,
                serviceCharge: Number(rest.serviceCharge) || 0,
                operatingHours: rest.operatingHours,
                cuisine: rest.cuisine || []
            },
            dishes: formattedDishes
        });
    } catch (error) {
        console.error('Error in getMenu:', error);
        error.status = error.status || 500;
        error.message = error.message || 'Internal server error';
        return next(error);
    }
}

// Add dish to cart
exports.addDishToCart = async (req, res, next) => {
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
        error.status = error.status || 500;
        error.message = error.message || 'Server error';
        return next(error);
    }
};

// Increase dish quantity in cart
exports.increaseDishQuantity = async (req, res, next) => {
    try {
        
        const user = req.user?.username || req.session.username;
       
        const dishName = req.body.dish;
       
        if (!dishName) {
            return res.status(400).send('Dish name is required');
        }
        let person = await Person.findOne({ name: user });
      
        if (!person) {
            return res.status(404).send('User not found');
        }
     
        let cart = person.cart || [];
        let itemIndex = cart.findIndex(item => item.dish === dishName);
      
        if (itemIndex > -1) {
             
            cart[itemIndex].quantity += 1;
            
            person.cart = cart;
            person.markModified('cart');
            await person.save();
        }
        res.redirect('back');
    } catch (error) {
        console.error(error);
        error.status = error.status || 500;
        error.message = error.message || 'Server error';
        return next(error);
    }
};

// Decrease dish quantity in cart
exports.decreaseDishQuantity = async (req, res, next) => {
    try {
        const user = req.user?.username || req.session.username;
        
        const dishName = req.body.dish;
        if (!dishName) {
            return res.status(400).send('Dish name is required');
        }
        let person = await Person.findOne({ name: user });
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
            person.markModified('cart');
            await person.save();
        }
        res.redirect('back');
    } catch (error) {
        console.error(error);
        error.status = error.status || 500;
        error.message = error.message || 'Server error';
        return next(error);
    }
};

// Order cart - clear cart array and redirect with cart data
exports.orderCart = async (req, res, next) => {
    try {
        const user = req.user;
        let person = await Person.findOne({ email: user.email });
        if (!person) {
            return res.redirect('/login');
        }
       
        const cart = person.cart || [];
        const restaurantName = req.body.restaurant || req.session.rest_name || '';
        const rest_id = req.body.rest_id || req.session.rest_id || '';

      
        // Store cart and restaurant info in session for orderReservation page
        req.session.temp_cart = cart;
        req.session.rest_name = restaurantName;
        req.session.rest_id = rest_id;

        // Redirect to orderReservation page
        res.redirect('/customer/order_reservation');
    } catch (error) {
        console.error(error);
        error.status = error.status || 500;
        error.message = error.message || 'Server error';
        return next(error);
    }
};
