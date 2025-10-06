const express = require('express');
const router = express.Router();
const { User } = require('../Model/userRoleModel');
const bcrypt = require('bcrypt');

router.get('/', (req, res) => {
    const error = req.query.error;
    let errorMessage = null;
    if (error === 'UserNotFound') {
        errorMessage = 'User not found. Please try again.';
    } else if (error === 'InvalidPassword') {
        errorMessage = 'Incorrect password. Please try again.';
    }
    res.render('login', {
        title: 'Log In',
        buttonText: 'Log In',
        toggleText: 'New user? Sign Up',
        errorMessage: errorMessage
    });
});

router.post('/', async (req, res) => {
    const { username, password, fullName, email, mobile } = req.body;
    
    if (fullName && email && mobile) {
        // Handle sign-up logic
        // Implement sign-up logic here if needed
        return res.send('Sign-up successful!');
    } else {
        // Handle login logic
        try {
            const user = await User.findOne({ username: username });
            if (!user) {
                return res.redirect('/loginPage?error=UserNotFound');
            }
            // Verify password using bcrypt.compare
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.redirect('/loginPage?error=InvalidPassword');
            }
            // Set session variables
            req.session.username = user.username;
            req.session.role = user.role;
            // Redirect based on role
            if (user.role === 'customer') {
                return res.redirect('/customer/customerDashboard');
            } else if (user.role === 'admin') {
                return res.redirect('/admin/dashboard');
            } else if (user.role === 'owner') {
                return res.redirect('/owner/dashboard');
            } else if (user.role === 'staff') {
                return res.redirect('/staff/dashboard');
            } else {
                return res.redirect('/');
            }
        } catch (error) {
            console.error('Login error:', error);
            return res.redirect('/loginPage?error=UserNotFound');
        }
    }
});

module.exports = router;
