const session = require('express-session');
const { User } = require('./Model/userRoleModel');

const auth_middleware = (role) => {
    return async (req, res, next) => {
        if (!req.session.username) {
            return res.redirect('/loginPage');
        }
        
        let user = await User.findOne({ username: req.session.username }); // Changed from findByname()
        
        if (!user) {
            return res.redirect('/loginPage');
        }
        req.user = user;  // Set user on request object for downstream use
        if (user.role === role) {
            next();
        } else {
            return res.redirect('/loginPage');
        }
    }
}

module.exports = auth_middleware;
