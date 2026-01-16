const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Ensure profile-pictures directory exists
const profilePicDir = path.join(__dirname, '../public/profile-pictures');
if (!fs.existsSync(profilePicDir)) {
  fs.mkdirSync(profilePicDir, { recursive: true });
}

// Ensure restaurant-images directory exists
const restaurantImgDir = path.join(__dirname, '../public/restaurant-images');
if (!fs.existsSync(restaurantImgDir)) {
  fs.mkdirSync(restaurantImgDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'dish-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure multer for profile pictures
const profilePicStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, profilePicDir);
  },
  filename: function (req, file, cb) {
    const username = req.body.username || req.session.username || 'user';
    const uniqueSuffix = Date.now();
    cb(null, username + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure multer for restaurant images
const restaurantImgStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, restaurantImgDir);
  },
  filename: function (req, file, cb) {
    const restaurantName = req.body.restaurantName || 'restaurant';
    const sanitizedName = restaurantName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'rest-' + sanitizedName + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, webp)'), false);
  }
};

// Initialize upload for dishes
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Initialize upload for profile pictures
const uploadProfilePic = multer({
  storage: profilePicStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: fileFilter
});

// Initialize upload for restaurant images
const uploadRestaurantImg = multer({
  storage: restaurantImgStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Middleware to handle single file upload
const uploadDishImage = upload.single('image');
const uploadProfilePicture = uploadProfilePic.single('profilePicture');
const uploadRestaurantImage = uploadRestaurantImg.single('restaurantImage');

// Middleware to handle errors from multer
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    return res.status(400).json({
      success: false,
      message: err.message
    });
  } else if (err) {
    // An unknown error occurred
    return res.status(500).json({
      success: false,
      message: err.message || 'Error uploading file'
    });
  }
  // No errors, proceed to next middleware
  next();
};

// Function to get the full URL for an image
const getImageUrl = (req, filename) => {
  if (!filename) return null;
  // Check if filename already contains a path (e.g., from public/images)
  if (filename.includes('/')) {
    return `${req.protocol}://${req.get('host')}${filename}`;
  }
  // Otherwise, assume it's in uploads directory
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
};

// Function to get the full URL for a profile picture
const getProfilePicUrl = (req, filename) => {
  if (!filename) return null;
  // Check if filename already contains a path
  if (filename.includes('/')) {
    return `${req.protocol}://${req.get('host')}${filename}`;
  }
  // Otherwise, assume it's in profile-pictures directory
  return `${req.protocol}://${req.get('host')}/profile-pictures/${filename}`;
};

// Function to get the full URL for a restaurant image
const getRestaurantImageUrl = (req, filename) => {
  if (!filename) return null;
  // Check if filename already contains a path
  if (filename.includes('/')) {
    return `${req.protocol}://${req.get('host')}${filename}`;
  }
  // Otherwise, assume it's in restaurant-images directory
  return `${req.protocol}://${req.get('host')}/restaurant-images/${filename}`;
};

module.exports = {
  uploadDishImage,
  uploadProfilePicture,
  uploadRestaurantImage,
  handleUploadErrors,
  getImageUrl,
  getProfilePicUrl,
  getRestaurantImageUrl
};
