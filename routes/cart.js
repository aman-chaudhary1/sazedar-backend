const express = require('express');
const router = express.Router();
const Cart = require('../model/cart');
const auth = require('../middleware/authMiddleware');
const asyncHandler = require('express-async-handler');

// Get user's cart
router.get('/', auth, asyncHandler(async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id })
      .populate('items.productId', 'name price offerPrice images unit productSize proCategoryId proSubCategoryId proBrandId');

    if (!cart) {
      return res.json({
        success: true,
        message: "Cart retrieved successfully.",
        data: { items: [] }
      });
    }

    res.json({
      success: true,
      message: "Cart retrieved successfully.",
      data: cart
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

// Add item to cart
router.post('/add', auth, asyncHandler(async (req, res) => {
  try {
    const { productId, quantity, variant } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Product ID and quantity are required."
      });
    }

    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      // Create new cart
      cart = new Cart({
        userId: req.user._id,
        items: [{ productId, quantity: parseInt(quantity), variant: variant || null }]
      });
    } else {
      // Check if product already exists in cart
      const existingItemIndex = cart.items.findIndex(
        item => item.productId.toString() === productId.toString()
      );

      if (existingItemIndex > -1) {
        // Update quantity
        cart.items[existingItemIndex].quantity += parseInt(quantity);
      } else {
        // Add new item
        cart.items.push({ productId, quantity: parseInt(quantity), variant: variant || null });
      }
    }

    await cart.save();
    const updatedCart = await Cart.findById(cart._id)
      .populate('items.productId', 'name price offerPrice images unit productSize');

    res.json({
      success: true,
      message: "Item added to cart successfully.",
      data: updatedCart
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

// Update cart item quantity
router.put('/update', auth, asyncHandler(async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Product ID and quantity are required."
      });
    }

    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found."
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId.toString()
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart."
      });
    }

    cart.items[itemIndex].quantity = parseInt(quantity);
    await cart.save();

    const updatedCart = await Cart.findById(cart._id)
      .populate('items.productId', 'name price offerPrice images unit productSize');

    res.json({
      success: true,
      message: "Cart updated successfully.",
      data: updatedCart
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

// Remove item from cart
router.delete('/remove/:productId', auth, asyncHandler(async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found."
      });
    }

    cart.items = cart.items.filter(
      item => item.productId.toString() !== productId.toString()
    );

    await cart.save();

    const updatedCart = await Cart.findById(cart._id)
      .populate('items.productId', 'name price offerPrice images unit productSize');

    res.json({
      success: true,
      message: "Item removed from cart successfully.",
      data: updatedCart
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

// Clear entire cart
router.delete('/clear', auth, asyncHandler(async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found."
      });
    }

    cart.items = [];
    await cart.save();

    res.json({
      success: true,
      message: "Cart cleared successfully.",
      data: cart
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

module.exports = router;

