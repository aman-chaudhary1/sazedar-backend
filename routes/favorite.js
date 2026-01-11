const express = require('express');
const router = express.Router();
const Favorite = require('../model/favorite');
const auth = require('../middleware/authMiddleware');
const asyncHandler = require('express-async-handler');

// Get all user favorites
router.get('/', auth, asyncHandler(async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user._id })
      .populate('productId', 'name price offerPrice images proCategoryId proSubCategoryId proBrandId todaysSpecial')
      .sort({ createdAt: -1 });

    res.json({ 
      success: true, 
      message: "Favorites retrieved successfully.", 
      data: favorites 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

// Add product to favorites (POST /favorites - for Flutter app compatibility)
router.post('/', auth, asyncHandler(async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ 
        success: false, 
        message: "Product ID is required." 
      });
    }

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({ 
      userId: req.user._id, 
      productId 
    });

    if (existingFavorite) {
      return res.status(400).json({ 
        success: false, 
        message: "Product is already in favorites." 
      });
    }

    const favorite = new Favorite({
      userId: req.user._id,
      productId
    });

    await favorite.save();
    const populatedFavorite = await Favorite.findById(favorite._id)
      .populate('productId', 'name price offerPrice images proCategoryId proSubCategoryId proBrandId todaysSpecial');

    res.json({ 
      success: true, 
      message: "Product added to favorites successfully.", 
      data: populatedFavorite 
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: "Product is already in favorites." 
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
}));

// Add product to favorites (POST /favorites/add - alternative endpoint)
router.post('/add', auth, asyncHandler(async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ 
        success: false, 
        message: "Product ID is required." 
      });
    }

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({ 
      userId: req.user._id, 
      productId 
    });

    if (existingFavorite) {
      return res.status(400).json({ 
        success: false, 
        message: "Product is already in favorites." 
      });
    }

    const favorite = new Favorite({
      userId: req.user._id,
      productId
    });

    await favorite.save();
    const populatedFavorite = await Favorite.findById(favorite._id)
      .populate('productId', 'name price offerPrice images proCategoryId proSubCategoryId proBrandId todaysSpecial');

    res.json({ 
      success: true, 
      message: "Product added to favorites successfully.", 
      data: populatedFavorite 
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: "Product is already in favorites." 
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
}));

// Check if product is favorited (must be before DELETE /:productId)
router.get('/check/:productId', auth, asyncHandler(async (req, res) => {
  try {
    const { productId } = req.params;

    const favorite = await Favorite.findOne({ 
      userId: req.user._id, 
      productId 
    });

    res.json({ 
      success: true, 
      message: "Favorite status retrieved successfully.", 
      data: { isFavorited: !!favorite } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

// Remove product from favorites (DELETE /favorites/remove/:productId - specific route first)
router.delete('/remove/:productId', auth, asyncHandler(async (req, res) => {
  try {
    const { productId } = req.params;

    const favorite = await Favorite.findOneAndDelete({ 
      userId: req.user._id, 
      productId 
    });

    if (!favorite) {
      return res.status(404).json({ 
        success: false, 
        message: "Favorite not found." 
      });
    }

    res.json({ 
      success: true, 
      message: "Product removed from favorites successfully." 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

// Remove product from favorites (DELETE /favorites/:productId - generic route for Flutter compatibility)
router.delete('/:productId', auth, asyncHandler(async (req, res) => {
  try {
    const { productId } = req.params;

    const favorite = await Favorite.findOneAndDelete({ 
      userId: req.user._id, 
      productId 
    });

    if (!favorite) {
      return res.status(404).json({ 
        success: false, 
        message: "Favorite not found." 
      });
    }

    res.json({ 
      success: true, 
      message: "Product removed from favorites successfully." 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

module.exports = router;

