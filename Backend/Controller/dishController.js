const Dish = require('../Model/Dishes_model_test').Dish;
const Restaurant = require('../Model/Restaurents_model').Restaurant;
const { getImageUrl } = require('../util/fileUpload');

// Create a new dish with image upload
exports.createDish = async (req, res) => {
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
    res.status(500).json({
      success: false,
      message: 'Failed to create dish',
      error: error.message
    });
  }
};

// Get dish by ID
exports.getDish = async (req, res) => {
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
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dish',
      error: error.message
    });
  }
};

// Update dish
exports.updateDish = async (req, res) => {
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
    res.status(500).json({
      success: false,
      message: 'Failed to update dish',
      error: error.message
    });
  }
};

// Delete dish
exports.deleteDish = async (req, res) => {
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
    res.status(500).json({
      success: false,
      message: 'Failed to delete dish',
      error: error.message
    });
  }
};
