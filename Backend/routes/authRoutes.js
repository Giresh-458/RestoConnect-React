const express = require('express');
const router = express.Router();
const authController = require('../Controller/authController');
const { uploadProfilePicture, handleUploadErrors } = require('../util/fileUpload');

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login - Get JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example:
 *               message: Login successful
 *               token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               user:
 *                 username: admin
 *                 role: admin
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example:
 *               error: Invalid username or password
 *       403:
 *         description: Account suspended
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example:
 *               error: Account is suspended
 */
// POST /api/auth/login
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: User signup
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - email
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [customer, owner, staff, employee, admin]
 *               restaurantName:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Signup successful
 *       400:
 *         description: Validation error
 */
// POST /api/auth/signup with optional profile picture upload
router.post('/signup', uploadProfilePicture, handleUploadErrors, authController.signup);

/**
 * @swagger
 * /api/auth/logout:
 *   get:
 *     summary: User logout
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout successful
 */
// GET /api/auth/logout
router.get('/logout', authController.logout);

/**
 * @swagger
 * /api/auth/check-session:
 *   get:
 *     summary: Check if user session is valid
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Session status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example:
 *               valid: true
 *               username: admin
 *               role: admin
 */
// GET /api/auth/check-session
router.get('/check-session', authController.checkSession);

/**
 * @swagger
 * /api/auth/forgot-password/send-code:
 *   post:
 *     summary: Send password reset code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reset code sent
 */
// POST /api/auth/forgot-password/send-code
router.post('/forgot-password/send-code', authController.sendResetCode);

/**
 * @swagger
 * /api/auth/forgot-password/verify-code:
 *   post:
 *     summary: Verify password reset code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Code verified
 */
// POST /api/auth/forgot-password/verify-code
router.post('/forgot-password/verify-code', authController.verifyResetCode);

/**
 * @swagger
 * /api/auth/forgot-password/reset:
 *   post:
 *     summary: Reset password with verified code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *               code:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 */
// POST /api/auth/forgot-password/reset
router.post('/forgot-password/reset', authController.resetPassword);

/**
 * @swagger
 * /api/auth/forgot-password/resend-code:
 *   post:
 *     summary: Resend password reset code
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reset code resent
 */
// POST /api/auth/forgot-password/resend-code
router.post('/forgot-password/resend-code', authController.resendResetCode);

module.exports = router;
