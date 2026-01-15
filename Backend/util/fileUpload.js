const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
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

// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Middleware to handle single file upload
const uploadDishImage = upload.single('image');

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

module.exports = {
  uploadDishImage,
  handleUploadErrors,
  getImageUrl
};
