const express = require('express');
const router = express.Router();
const Address = require('../model/address');
const auth = require('../middleware/authMiddleware');

// 🔹 Get logged-in user's address
router.get('/', auth, async (req, res) => {
  const address = await Address.findOne({ userId: req.user._id });
  res.json({
    success: true,
    message: 'Address fetched',
    data: address,
  });
});

// 🔹 Create or Update address
router.post('/', auth, async (req, res) => {
  try {
    const { phone, street, city, state, postalCode, country } = req.body;

    let address = await Address.findOne({ userId: req.user._id });

    if (address) {
      address.phone = phone || address.phone;
      address.street = street || address.street;
      address.city = city || address.city;
      address.state = state || address.state;
      address.postalCode = postalCode || address.postalCode;
      address.country = country || address.country;
      await address.save();
    } else {
      address = new Address({
        userId: req.user._id,
        phone,
        street,
        city,
        state,
        postalCode,
        country,
      });
      await address.save();
    }

    res.json({
      success: true,
      message: 'Address saved successfully',
      data: address,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
