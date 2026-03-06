const { User } = require('../Model/userRoleModel');
const Person = require('../Model/customer_model');
const { PasswordResetCode } = require('../Model/PasswordResetCode_model');
const bcrypt = require('bcrypt');
const { getProfilePicUrl } = require('../util/fileUpload');
const { sendPasswordResetCode } = require('../util/emailService');
const { signToken, verifyToken, AUTH_TOKEN_COOKIE } = require('../util/jwtHelper');

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
const login = async (req, res, next) => {
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
            const endDate = user.suspensionEndDate ? new Date(user.suspensionEndDate).toLocaleDateString() : null;
            const dateMsg = endDate ? ` until ${endDate}` : '';
            return res.status(403).json({
                valid: false,
                error: `Your account has been suspended${dateMsg}. If you have any queries, please contact customer care.`
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

        // Stateless auth: set JWT in httpOnly cookie (used by authentication middleware)
        const token = signToken({ username: user.username, role: user.role });
        res.cookie(AUTH_TOKEN_COOKIE, token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/',
            maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days, match session
        });

        return res.status(200).json({
            valid: true,
            role: user.role,
            username: user.username,
            message: 'Login successful'
        });

    } catch (error) {
        console.error('Login error:', error);
        error.status = error.status || 500;
        error.message = error.message || 'Server error during login';
        return next(error);
    }
};

// Signup Controller
const signup = async (req, res, next) => {
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

        // Validate role - only customers can self-register
        // Owners are created when admin accepts restaurant requests
        // Staff are created by restaurant owners
        const allowedRoles = ['customer'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Only customer accounts can be created through signup. Owners and staff are added by administrators and restaurant owners respectively.'
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
            const profilePicFilename = req.file ? req.file.filename : null;
            const newPerson = new Person({
                name: username,
                img_url: profilePicFilename || '/images/benjamin-chambon-vRu-Bs27E2M-unsplash.jpg',
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
        error.status = error.status || 500;
        error.message = error.message || 'Server error during signup';
        return next(error);
    }
};

// Logout Controller
const logout = (req, res, next) => {
    // Stateless logout: clear cookies; keep session only for csurf token if present.
    if (req.session) {
        req.session.destroy(() => {});
    }
    res.clearCookie('connect.sid');
    res.clearCookie(AUTH_TOKEN_COOKIE, { path: '/' });
    return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
};

// Check Session Controller: session first, then JWT from cookie (minimal frontend change)
const checkSession = async (req, res, next) => {
    try {
        // 1) JWT in cookie (preferred stateless check)
        const token = req.cookies?.[AUTH_TOKEN_COOKIE];
        if (token) {
            const payload = verifyToken(token);
            if (payload?.username) {
                const user = await User.findOne({ username: payload.username }).select("role");
                if (user) {
                    return res.json({
                        valid: true,
                        username: payload.username,
                        role: user.role
                    });
                }
            }
        }
        // 2) No valid JWT
        res.json({ valid: false });
    } catch (err) {
        console.error("Error in check-session:", err);
        err.status = err.status || 500;
        err.message = err.message || 'Server error';
        return next(err);
    }
};

// Generate random 6-digit code
const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send Password Reset Code
const sendResetCode = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // Email not registered
      return res.status(404).json({
        success: false,
        error: 'No member registered using this email'
      });
    }

    // Generate reset code
    const code = generateResetCode();

    // Invalidate any existing codes for this email
    await PasswordResetCode.updateMany(
      { email: email.toLowerCase().trim(), used: false },
      { $set: { used: true } }
    );

    // Create new reset code
    const resetCode = new PasswordResetCode({
      email: email.toLowerCase().trim(),
      code: code,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    });

    await resetCode.save();

    // Send email
    try {
      await sendPasswordResetCode(email, code);
      console.log(`✅ Reset code sent successfully to ${email}`);
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError.message);
      console.error('Full error:', emailError);
      // Log the error but still save the code in database
      // Return error to user so they know what went wrong
      return res.status(500).json({
        success: false,
        error: emailError.message || 'Failed to send email. Please check your email configuration or try again later.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Reset code has been sent to your email.'
    });

  } catch (error) {
    console.error('Send reset code error:', error);
    error.status = error.status || 500;
    error.message = error.message || 'Server error. Please try again later.';
    return next(error);
  }
};

// Verify Reset Code
const verifyResetCode = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        error: 'Email and code are required'
      });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const trimmedCode = code.trim();

    console.log(`[Verify Code] Checking code for email: ${trimmedEmail}, code: ${trimmedCode}`);

    // Find valid reset code
    const resetCode = await PasswordResetCode.findOne({
      email: trimmedEmail,
      code: trimmedCode,
      used: false
    });

    if (!resetCode) {
      console.log(`[Verify Code] Code not found for email: ${trimmedEmail}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid reset code. Please check the code and try again.'
      });
    }

    // Check if code is expired
    if (!resetCode.isValid()) {
      console.log(`[Verify Code] Code expired for email: ${trimmedEmail}`);
      return res.status(400).json({
        success: false,
        error: 'Reset code has expired. Please request a new one.'
      });
    }

    console.log(`[Verify Code] Code verified successfully for email: ${trimmedEmail}`);
    return res.status(200).json({
      success: true,
      message: 'Code verified successfully'
    });

  } catch (error) {
    console.error('Verify reset code error:', error);
    error.status = error.status || 500;
    error.message = error.message || 'Server error. Please try again later.';
    return next(error);
  }
};

// Reset Password with Code
const resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Email, code, and new password are required'
      });
    }

    // Trim and validate inputs
    const trimmedEmail = email ? email.toLowerCase().trim() : '';
    const trimmedCode = code ? code.trim() : '';
    const trimmedPassword = newPassword ? newPassword.trim() : '';

    // Validate password
    if (!trimmedPassword || trimmedPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    // Find and verify reset code
    const resetCode = await PasswordResetCode.findOne({
      email: trimmedEmail,
      code: trimmedCode,
      used: false
    });

    if (!resetCode) {
      console.log(`[Reset Password] Code not found for email: ${trimmedEmail}, code: ${trimmedCode}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset code. Please request a new code.'
      });
    }

    if (!resetCode.isValid()) {
      console.log(`[Reset Password] Code expired for email: ${trimmedEmail}`);
      return res.status(400).json({
        success: false,
        error: 'Reset code has expired. Please request a new code.'
      });
    }

    // Find user
    const user = await User.findOne({ email: trimmedEmail });

    if (!user) {
      console.log(`[Reset Password] User not found for email: ${trimmedEmail}`);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Set the plain password - the pre-save hook in User model will hash it automatically
    // DO NOT hash it manually here, as the pre-save hook will hash it again (double hashing)
    user.password = trimmedPassword;
    await user.save();

    console.log(`[Reset Password] Password updated successfully for email: ${trimmedEmail}`);

    // Mark reset code as used
    resetCode.used = true;
    await resetCode.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    error.status = error.status || 500;
    error.message = error.message || 'Server error. Please try again later.';
    return next(error);
  }
};

// Resend Reset Code
const resendResetCode = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // Email not registered
      return res.status(404).json({
        success: false,
        error: 'No member registered using this email'
      });
    }

    // Generate new code
    const code = generateResetCode();

    // Invalidate existing codes
    await PasswordResetCode.updateMany(
      { email: email.toLowerCase().trim(), used: false },
      { $set: { used: true } }
    );

    // Create new reset code
    const resetCode = new PasswordResetCode({
      email: email.toLowerCase().trim(),
      code: code,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    });

    await resetCode.save();

    // Send email
    try {
      await sendPasswordResetCode(email, code);
      console.log(`✅ Reset code sent successfully to ${email}`);
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError.message);
      console.error('Full error:', emailError);
      // Log the error but still save the code in database
      // Return error to user so they know what went wrong
      return res.status(500).json({
        success: false,
        error: emailError.message || 'Failed to send email. Please check your email configuration or try again later.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'A new reset code has been sent to your email.'
    });

  } catch (error) {
    console.error('Resend reset code error:', error);
    error.status = error.status || 500;
    error.message = error.message || 'Server error. Please try again later.';
    return next(error);
  }
};

module.exports = { 
  login, 
  signup, 
  logout, 
  checkSession,
  sendResetCode,
  verifyResetCode,
  resetPassword,
  resendResetCode
};
