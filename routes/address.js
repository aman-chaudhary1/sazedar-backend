const express = require('express');
const router = express.Router();
const Address = require('../model/address');
const auth = require('../middleware/authMiddleware');
const asyncHandler = require('express-async-handler');

// =========================
// GET ALL ADDRESSES (for logged-in user)
// =========================
router.get('/', auth, asyncHandler(async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user._id })
      .sort({ isDefault: -1, createdAt: -1 }); // Default address first, then by creation date

    res.json({
      success: true,
      message: 'Addresses fetched successfully',
      data: addresses,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

// =========================
// GET SINGLE ADDRESS BY ID
// =========================
router.get('/:id', auth, asyncHandler(async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      userId: req.user._id // Ensure user owns this address
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    res.json({
      success: true,
      message: 'Address fetched successfully',
      data: address,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid address ID',
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
}));

// =========================
// ADD NEW ADDRESS
// =========================
router.post('/', auth, asyncHandler(async (req, res) => {
  try {
    const { phone, street, city, state, postalCode, country, addressType, label, isDefault } = req.body;

    // Validation
    if (!phone || !street || !city || !state || !postalCode) {
      return res.status(400).json({
        success: false,
        message: 'Phone, street, city, state, and postal code are required',
      });
    }

    // If setting as default, unset other default addresses
    if (isDefault === true) {
      await Address.updateMany(
        { userId: req.user._id },
        { $set: { isDefault: false } }
      );
    }

    const address = new Address({
      userId: req.user._id,
      phone,
      street,
      city,
      state,
      postalCode,
      country: country || 'India',
      addressType: addressType || 'home',
      label: label || null,
      isDefault: isDefault || false,
    });

    await address.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: address,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

// =========================
// UPDATE ADDRESS BY ID
// =========================
router.put('/:id', auth, asyncHandler(async (req, res) => {
  try {
    const { phone, street, city, state, postalCode, country, addressType, label, isDefault } = req.body;

    const address = await Address.findOne({
      _id: req.params.id,
      userId: req.user._id // Ensure user owns this address
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    // Update fields if provided
    if (phone !== undefined) address.phone = phone;
    if (street !== undefined) address.street = street;
    if (city !== undefined) address.city = city;
    if (state !== undefined) address.state = state;
    if (postalCode !== undefined) address.postalCode = postalCode;
    if (country !== undefined) address.country = country;
    if (addressType !== undefined) address.addressType = addressType;
    if (label !== undefined) address.label = label;

    // Handle default address
    if (isDefault === true && !address.isDefault) {
      // Unset other default addresses
      await Address.updateMany(
        { userId: req.user._id, _id: { $ne: address._id } },
        { $set: { isDefault: false } }
      );
      address.isDefault = true;
    } else if (isDefault === false) {
      address.isDefault = false;
    }

    await address.save();

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: address,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid address ID',
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
}));

// =========================
// DELETE ADDRESS BY ID
// =========================
router.delete('/:id', auth, asyncHandler(async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id // Ensure user owns this address
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    res.json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid address ID',
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
}));

// =========================
// SET DEFAULT ADDRESS
// =========================
router.put('/:id/set-default', auth, asyncHandler(async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    // Unset all other default addresses
    await Address.updateMany(
      { userId: req.user._id, _id: { $ne: address._id } },
      { $set: { isDefault: false } }
    );

    // Set this address as default
    address.isDefault = true;
    await address.save();

    res.json({
      success: true,
      message: 'Default address set successfully',
      data: address,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid address ID',
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
}));

module.exports = router;
