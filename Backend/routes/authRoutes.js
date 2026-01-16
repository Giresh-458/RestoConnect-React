const express = require('express');
const router = express.Router();
const authController = require('../Controller/authController');
const { uploadProfilePicture, handleUploadErrors } = require('../util/fileUpload');

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/signup with optional profile picture upload
router.post('/signup', uploadProfilePicture, handleUploadErrors, authController.signup);

// GET /api/auth/logout
router.get('/logout', authController.logout);

// GET /api/auth/check-session
router.get('/check-session', authController.checkSession);

// POST /api/auth/forgot-password/send-code
router.post('/forgot-password/send-code', authController.sendResetCode);

// POST /api/auth/forgot-password/verify-code
router.post('/forgot-password/verify-code', authController.verifyResetCode);

// POST /api/auth/forgot-password/reset
router.post('/forgot-password/reset', authController.resetPassword);

// POST /api/auth/forgot-password/resend-code
router.post('/forgot-password/resend-code', authController.resendResetCode);

module.exports = router;
