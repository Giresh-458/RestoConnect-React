const express = require('express');
const router = express.Router();
const { uploadDishImage, handleUploadErrors } = require('../util/fileUpload');
const dishController = require('../Controller/dishController');
const auth_middleware = require('../authenticationMiddleWare');

// Create a new dish with image upload
router.post(
  '/',
  auth_middleware('owner'),
  uploadDishImage,
  handleUploadErrors,
  dishController.createDish
);

// Get dish by ID
router.get('/:id', dishController.getDish);

// Update dish with optional image update
router.put(
  '/:id',
  auth_middleware('owner'),
  uploadDishImage,
  handleUploadErrors,
  dishController.updateDish
);

// Delete dish
router.delete(
  '/:id',
  auth_middleware('owner'),
  dishController.deleteDish
);

module.exports = router;
