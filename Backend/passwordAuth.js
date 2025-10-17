const Person = require('./Model/customer_model');
const { User } = require('./Model/userRoleModel');
const bcrypt = require('bcrypt');

let validate = async (req, res, next) => {
    let { username, email, password, fullName } = req.body;
    console.log(fullName)
    if (fullName) {
        let chk = await User.findOne({ $or: [ { username: username }, { email: email } ] });
        console.log(chk)
        if (chk != null) {
             res.render('login', {
        title: 'Log In',
        buttonText: 'Log In',
        toggleText: 'New user? Sign Up',
        errorMessage: "User or email already exists"
    }); 
    
            return;
        }

        const newPerson = new Person({
            name: username,
            img_url: '/images/benjamin-chambon-vRu-Bs27E2M-unsplash.jpg',
            email: email,
            prev_orders: [],
            top_dishes: {},
            top_restaurent: {},
            cart: []
        });
        await newPerson.save();

        password = password.toString().trim();
        const newUser = new User({
            username,
            email,
            role: 'customer',
            restaurantName: null,
            password,
            rest_id: null
        });
        await newUser.save();
        res.redirect('/loginPage');
        return;
    }

    let user = await User.findOne({ $or: [ { username: username }, { email: username } ] });

    if (!user) {
        return res.json({valid: false })
    }
    
    let passwordMatch = await bcrypt.compare(password.trim(), user.password);
    if (passwordMatch) {
        
        req.session.username = user.username;
        next();
    } else {
        return res.json({valid:false})
    }
}

module.exports = validate;
