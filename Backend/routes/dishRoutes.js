const express = require('express');
const router = express.Router();
const { uploadDishImage, handleUploadErrors } = require('../util/fileUpload');
const dishController = require('../Controller/dishController');
const { isAuthenticated, isOwner } = require('../authenticationMiddleWare');

// Create a new dish with image upload
router.post(
  '/',
  isAuthenticated,
  isOwner,
  uploadDishImage,
  handleUploadErrors,
  dishController.createDish
);

// Get dish by ID
router.get('/:id', dishController.getDish);

// Update dish with optional image update
router.put(
  '/:id',
  isAuthenticated,
  isOwner,
  uploadDishImage,
  handleUploadErrors,
  dishController.updateDish
);

// Delete dish
router.delete(
  '/:id',
  isAuthenticated,
  isOwner,
  dishController.deleteDish
);

module.exports = router;
