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

module.exports = router;
