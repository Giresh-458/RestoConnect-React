const Dish = require('../Model/Dishes_model_test').Dish;
const Restaurant = require('../Model/Restaurents_model').Restaurant;
const { getImageUrl } = require('../util/fileUpload');

// Create a new dish with image upload
exports.createDish = async (req, res, next) => {
  try {
    const { name, price, description, restaurantId } = req.body;
    
    // Create new dish
    const dish = new Dish({
      name,
      price,
      description,
      image: req.file ? req.file.filename : 'default-dish.jpg'
    });

    // Save dish to database
    await dish.save();
    
    // Add dish to restaurant's menu
    await Restaurant.updateOne(
      { _id: restaurantId },
      { $push: { dishes: dish._id } }
    );

    // Get full image URL
    const imageUrl = getImageUrl(req, dish.image);

    res.status(201).json({
      success: true,
      data: {
        ...dish.toObject(),
        imageUrl
      },
      message: 'Dish created successfully'
    });
  } catch (error) {
    console.error('Error creating dish:', error);
    error.status = error.status || 500;
    error.message = error.message || 'Failed to create dish';
    return next(error);
  }
};

// Get dish by ID
exports.getDish = async (req, res, next) => {
  try {
    const dish = await Dish.findById(req.params.id);
    
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found'
      });
    }

    // Get full image URL
    const imageUrl = getImageUrl(req, dish.image);

    res.status(200).json({
      success: true,
      data: {
        ...dish.toObject(),
        imageUrl
      }
    });
  } catch (error) {
    console.error('Error fetching dish:', error);
    error.status = error.status || 500;
    error.message = error.message || 'Failed to fetch dish';
    return next(error);
  }
};

// Update dish
exports.updateDish = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    
    // If there's a new image, update the image field
    if (req.file) {
      updates.image = req.file.filename;
    }
    
    const dish = await Dish.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found'
      });
    }

    // Get full image URL
    const imageUrl = getImageUrl(req, dish.image);

    res.status(200).json({
      success: true,
      data: {
        ...dish.toObject(),
        imageUrl
      },
      message: 'Dish updated successfully'
    });
  } catch (error) {
    console.error('Error updating dish:', error);
    error.status = error.status || 500;
    error.message = error.message || 'Failed to update dish';
    return next(error);
  }
};

// Delete dish
exports.deleteDish = async (req, res, next) => {
  try {
    const dish = await Dish.findByIdAndDelete(req.params.id);
    
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found'
      });
    }
    
    // Remove dish from restaurant's menu
    await Restaurant.updateMany(
      { dishes: req.params.id },
      { $pull: { dishes: req.params.id } }
    );

    res.status(200).json({
      success: true,
      message: 'Dish deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting dish:', error);
    error.status = error.status || 500;
    error.message = error.message || 'Failed to delete dish';
    return next(error);
  }
};
