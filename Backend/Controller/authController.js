const { User } = require('../Model/userRoleModel');
const Person = require('../Model/customer_model');
const bcrypt = require('bcrypt');

// Validation helper functions
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validateUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
};

const validatePassword = (password) => {
    // Password: minimum 6 characters
    return password && password.length >= 6;
};

const validateMobile = (mobile) => {
    if (!mobile || mobile.trim() === '') return true;
    const mobileRegex = /^[0-9]{10}$/;
    return mobileRegex.test(mobile.replace(/\s+/g, ''));
};

// Login Controller
const login = async (req, res) => {
    try {
        let { username, password } = req.body;

        // Trim inputs
        username = username ? username.trim() : '';
        password = password ? password.trim() : '';

        if (!username || !password) {
            return res.status(400).json({ 
                valid: false, 
                error: 'Username and password are required' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                valid: false, 
                error: 'Invalid credentials' 
            });
        }

        // Find user by username or email
        const user = await User.findOne({ 
            $or: [{ username: username }, { email: username }] 
        });

        if (!user) {
            return res.status(401).json({ 
                valid: false, 
                error: 'Invalid credentials' 
            });
        }

        // Check if user is suspended
        if (user.isSuspended) {
            const endDate = user.suspensionEndDate ? new Date(user.suspensionEndDate).toLocaleDateString() : 'indefinite';
            return res.status(403).json({
                valid: false,
                error: `Your account has been suspended until ${endDate}. If you have any queries, please contact customer care.`
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password.trim(), user.password);

        if (!isMatch) {
            return res.status(401).json({
                valid: false,
                error: 'Invalid credentials'
            });
        }

        // Set session
        req.session.username = user.username;
        req.session.role = user.role;

        return res.status(200).json({
            valid: true,
            role: user.role,
            username: user.username,
            message: 'Login successful'
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ 
            valid: false, 
            error: 'Server error during login' 
        });
    }
};

// Signup Controller
const signup = async (req, res) => {
    try {
        let { username, email, password, fullName, mobile, role } = req.body;

        // Trim and sanitize inputs
        username = username ? username.trim() : '';
        email = email ? email.trim().toLowerCase() : '';
        password = password ? password.trim() : '';
        fullName = fullName ? fullName.trim() : '';
        mobile = mobile ? mobile.trim() : '';
        role = role ? role.trim().toLowerCase() : 'customer';

        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Username, email, and password are required' 
            });
        }

        // Validate username format
        if (!validateUsername(username)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Username must be 3-20 characters and contain only letters, numbers, and underscores' 
            });
        }

        // Validate email format
        if (!validateEmail(email)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Please provide a valid email address' 
            });
        }

        // Validate password strength
        if (!validatePassword(password)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Password must be at least 6 characters long' 
            });
        }

        // Validate mobile number if provided
        if (mobile && !validateMobile(mobile)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Please provide a valid 10-digit mobile number' 
            });
        }

        // Validate full name
        if (!fullName || fullName.length < 2) {
            return res.status(400).json({ 
                success: false, 
                error: 'Please provide a valid full name' 
            });
        }

        // Validate role
        const allowedRoles = ['customer', 'owner'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid role selected' 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ username: username }, { email: email }] 
        });

        if (existingUser) {
            return res.status(409).json({ 
                success: false, 
                error: 'Username or email already exists' 
            });
        }

        // Create customer profile only if role is customer
        if (role === 'customer') {
            const newPerson = new Person({
                name: username,
                img_url: '/images/benjamin-chambon-vRu-Bs27E2M-unsplash.jpg',
                email: email,
                phone: mobile || '',
                prev_orders: [],
                top_dishes: {},
                top_restaurent: {},
                cart: []
            });
            await newPerson.save();
        }

        // Create user account
        const newUser = new User({
            username,
            email,
            role: role,
            restaurantName: null,
            password: password,
            rest_id: null
        });
        await newUser.save();

        return res.status(201).json({
            success: true,
            message: 'Account created successfully. Please login.',
            username: newUser.username
        });

    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Server error during signup' 
        });
    }
};

// Logout Controller
const logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to logout' 
            });
        }
        res.clearCookie('connect.sid');
        return res.status(200).json({ 
            success: true, 
            message: 'Logged out successfully' 
        });
    });
};

// Check Session Controller
const checkSession = async (req, res) => {
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
        console.error("Error in check-session:", err);
        res.status(500).json({ valid: false, error: "Server error" });
    }
};

module.exports = { login, signup, logout, checkSession };
