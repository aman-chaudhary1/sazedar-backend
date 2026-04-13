const express = require('express');
const router = express.Router();
const Product = require('../model/product');
const multer = require('multer');
const { uploadProduct } = require('../uploadFile');
const asyncHandler = require('express-async-handler');
const cloudinary = require('../config/cloudinary');
const auth = require('../middleware/authMiddleware');
const roleCheck = require('../middleware/roleMiddleware');

// Get all products (User App)
router.get('/', asyncHandler(async (req, res) => {
  try {
    const filter = {};
    // 1. Core Safety Filter (Default for Customers/Dashboard)
    filter.status = { $nin: ['pending', 'rejected'] };

    // 2. Admin Override (Only if authorized and requested)
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const User = require('../model/user');
        const user = await User.findById(decoded.id);

        if (user && user.role === 'admin') {
          if (req.query.status === 'all') {
            delete filter.status; // Admin sees everything
          } else if (req.query.status) {
            filter.status = req.query.status; // Admin filters by specific status
          }
        }
      } catch (err) {
        // Token invalid, proceed with safety filter
      }
    }

    // 3. Attribute Filters (Inherit safety filter)
    if (req.query.todaysSpecial === 'true') {
      filter.todaysSpecial = true;
    }
    if (req.query.proCategoryId) {
      filter.proCategoryId = req.query.proCategoryId;
    }
    if (req.query.proSubCategoryId) {
      filter.proSubCategoryId = req.query.proSubCategoryId;
    }

    console.log('🔹 [GET PRODUCTS] Final Filter:', JSON.stringify(filter));
    const products = await Product.find(filter)
      .populate('proCategoryId', 'name')
      .populate('proSubCategoryId', 'name')
      .populate('proBrandId', 'name')
      .populate('proVariantTypeId', 'type')
      .populate('proVariantId', 'name')
      .populate('addedBy', 'name shopName');

    res.json({ success: true, message: "Products retrieved successfully.", data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

// Get a product by ID
router.get('/:id', asyncHandler(async (req, res) => {
  try {
    const productID = req.params.id;
    const product = await Product.findById(productID)
      .populate('proCategoryId', 'name')
      .populate('proSubCategoryId', 'name')
      .populate('proBrandId', 'name')
      .populate('proVariantTypeId', 'name')
      .populate('proVariantId', 'name')
      .populate('addedBy', 'name shopName');

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }
    res.json({ success: true, message: "Product retrieved successfully.", data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));



// create new product
router.post('/', asyncHandler(async (req, res) => {
  uploadProduct.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 },
    { name: 'image5', maxCount: 1 },
  ])(req, res, async function (err) {

    if (err instanceof multer.MulterError) {
      return res.json({ success: false, message: err.message });
    } else if (err) {
      return res.json({ success: false, message: err.message || "File upload error" });
    }

    try {
      const token = req.headers.authorization?.split(' ')[1];
      let user = null;

      if (token) {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
          const User = require('../model/user');
          user = await User.findById(decoded.id);
        } catch (err) {
          // Token invalid or expired
        }
      }

      console.log('🔹 [CREATE PRODUCT] Request Body:', req.body);
      console.log('🔹 [CREATE PRODUCT] Request Files:', req.files ? Object.keys(req.files) : 'No files');

      const {
        name,
        description,
        quantity,
        price,
        offerPrice,
        todaysSpecial,
        proCategoryId,
        proSubCategoryId,
        proBrandId,
        proVariantTypeId,
        proVariantId,
        unit,
        productSize,
        shopkeeperPrice
      } = req.body;

      // Only these fields are strictly required (Allow 0 for quantity)
      if (!name || isNaN(Number(quantity)) || !price || !proCategoryId) {
        return res.status(400).json({ success: false, message: "Required fields are missing or invalid." });
      }

      // Normalize numbers
      const parsedQuantity = Number(quantity);
      const parsedPrice = Number(price);
      const parsedShopkeeperPrice = shopkeeperPrice ? Number(shopkeeperPrice) : 0;
      const parsedOfferPrice = (offerPrice === undefined || offerPrice === null || offerPrice === '' || offerPrice === 'null')
        ? undefined
        : Number(offerPrice);

      const imageUrls = [];
      const fields = ['image1', 'image2', 'image3', 'image4', 'image5'];

      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];

        if (req.files[field] && req.files[field][0]) {
          const file = req.files[field][0];

          // ✅ Upload to Cloudinary
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'products',
          });

          imageUrls.push({
            image: i + 1,
            url: result.secure_url, // 🌍 GLOBAL URL
          });
        }
      }

      // Smart Defaults based on user role
      let finalStatus = 'approved';
      let addedById = null;

      if (user) {
        if (user.role === 'shopkeeper') {
          finalStatus = 'pending';
          addedById = user._id;
        } else if (user.role === 'admin') {
          finalStatus = 'approved';
          addedById = null;
        }
      }

      const newProduct = new Product({
        name,
        description,
        quantity: parsedQuantity,
        price: parsedPrice,
        offerPrice: parsedOfferPrice,
        shopkeeperPrice: parsedShopkeeperPrice,
        status: finalStatus,
        addedBy: addedById,
        todaysSpecial: todaysSpecial === 'true' || todaysSpecial === true,
        proCategoryId,
        proSubCategoryId: proSubCategoryId || null,
        proBrandId: proBrandId || null,
        proVariantTypeId: proVariantTypeId || null,
        proVariantId: proVariantId || [],
        unit: unit || 'Pc',
        productSize: productSize ? Number(productSize) : null,
        images: imageUrls,
        isAvailable: req.body.isAvailable === 'true' || req.body.isAvailable === true,
      });

      await newProduct.save();
      console.log('✅ [CREATE PRODUCT] Saved to DB:', newProduct);

      res.json({
        success: true,
        message: "Product created successfully.",
        data: newProduct,
      });

    } catch (error) {

      console.error("Error creating product:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
}));




// Update a product
router.put('/:id', asyncHandler(async (req, res) => {
  const productId = req.params.id;

  uploadProduct.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 },
    { name: 'image5', maxCount: 1 },
  ])(req, res, async function (err) {

    if (err) {
      return res.status(500).json({ success: false, message: err.message || "File upload error" });
    }

    try {
      const token = req.headers.authorization?.split(' ')[1];
      let user = null;
      if (token) {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
          const User = require('../model/user');
          user = await User.findById(decoded.id);
        } catch (err) {
          return res.status(401).json({ success: false, message: "Invalid or expired token." });
        }
      } else {
        return res.status(401).json({ success: false, message: "Authorization token required." });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found." });
      }

      // 🔐 Security Check: Only Owner or Admin can update
      if (user.role === 'shopkeeper' && product.addedBy?.toString() !== user._id.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized: You can only update your own products." });
      }

      console.log('🔸 [UPDATE PRODUCT] Product ID:', productId);
      console.log('🔸 [UPDATE PRODUCT] Request Body:', req.body);
      console.log('🔸 [UPDATE PRODUCT] Request Files:', req.files ? Object.keys(req.files) : 'No files');


      const {
        name,
        description,
        quantity,
        price,
        offerPrice,
        todaysSpecial,
        proCategoryId,
        proSubCategoryId,
        proBrandId,
        proVariantTypeId,
        proVariantId,
        unit,
        productSize,
        shopkeeperPrice,
        shopkeeperOfferPrice
      } = req.body;

      product.name = name || product.name;
      product.description = description || product.description;
      product.quantity = quantity || product.quantity;
      product.price = price || product.price;
      if (typeof offerPrice !== 'undefined') {
        if (offerPrice === '' || offerPrice === 'null' || offerPrice === null) {
          product.offerPrice = undefined;
        } else {
          const updatedOffer = Number(offerPrice);
          if (Number.isNaN(updatedOffer)) {
            return res.status(400).json({ success: false, message: "offerPrice must be a number." });
          }
          product.offerPrice = updatedOffer;
        }
      }
      if (typeof todaysSpecial !== 'undefined') {
        product.todaysSpecial = todaysSpecial === 'true' || todaysSpecial === true;
      }
      product.proCategoryId = proCategoryId || product.proCategoryId;
      product.proSubCategoryId = proSubCategoryId || product.proSubCategoryId;
      product.proBrandId = proBrandId || product.proBrandId;
      product.proVariantTypeId = proVariantTypeId || product.proVariantTypeId;
      product.proVariantId = proVariantId || product.proVariantId;
      product.unit = unit || product.unit;
      if (typeof productSize !== 'undefined') {
        if (productSize === '' || productSize === 'null' || productSize === null) {
          product.productSize = null;
        } else {
          const updatedSize = Number(productSize);
          if (Number.isNaN(updatedSize)) {
            // If valid number check fails, we can either ignore or error. 
            // Given the issue, let's error to be safe, or just ignore if it's garbage.
            // But following offerPrice pattern:
            return res.status(400).json({ success: false, message: "productSize must be a number." });
          }
          product.productSize = updatedSize;
        }
      }

      // Shopkeeper suggested prices
      if (typeof shopkeeperPrice !== 'undefined') {
        product.shopkeeperPrice = Number(shopkeeperPrice) || 0;
      }
      if (typeof shopkeeperOfferPrice !== 'undefined') {
        product.shopkeeperOfferPrice = Number(shopkeeperOfferPrice) || 0;
      }

      if (typeof req.body.isAvailable !== 'undefined') {
        product.isAvailable = req.body.isAvailable === 'true' || req.body.isAvailable === true;
      }

      // 🔄 Status Reset: If shopkeeper updates, set back to pending
      if (user.role === 'shopkeeper') {
        product.status = 'pending';
        // Update price/offerPrice as suggestions for administrative review
        if (typeof shopkeeperPrice !== 'undefined') product.price = Number(shopkeeperPrice);
        if (typeof shopkeeperOfferPrice !== 'undefined') product.offerPrice = Number(shopkeeperOfferPrice) || undefined;
      }

      const fields = ['image1', 'image2', 'image3', 'image4', 'image5'];

      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];

        if (req.files[field] && req.files[field][0]) {
          const file = req.files[field][0];

          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'products',
          });

          const existing = product.images.find(img => img.image === i + 1);
          if (existing) {
            existing.url = result.secure_url;
          } else {
            product.images.push({ image: i + 1, url: result.secure_url });
          }
        }
      }

      await product.save();
      console.log('✅ [UPDATE PRODUCT] Updated in DB:', product);

      res.json({
        success: true,
        message: "Product updated successfully.",
        data: product,
      });

    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
}));

// Update only Availability
router.put('/availability/:id', asyncHandler(async (req, res) => {
  const productID = req.params.id;
  const { isAvailable } = req.body;

  if (typeof isAvailable === 'undefined') {
    return res.status(400).json({ success: false, message: "isAvailable field is required." });
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];
    let user = null;
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const User = require('../model/user');
        user = await User.findById(decoded.id);
      } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid or expired token." });
      }
    } else {
      return res.status(401).json({ success: false, message: "Authorization token required." });
    }

    const product = await Product.findById(productID);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    // 🔐 Security Check: Only Owner or Admin can update
    if (user.role === 'shopkeeper' && product.addedBy?.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized: You can only update your own products." });
    }

    product.isAvailable = isAvailable === 'true' || isAvailable === true;
    // ⚠️ Note: We explicitly do NOT touch the 'status' field here.
    
    await product.save();

    res.json({ 
      success: true, 
      message: `Product marked as ${product.isAvailable ? 'In Stock' : 'Out of Stock'}.`,
      data: product 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

// Delete a product
router.delete('/:id', asyncHandler(async (req, res) => {
  const productID = req.params.id;
  try {
    const token = req.headers.authorization?.split(' ')[1];
    let user = null;
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const User = require('../model/user');
        user = await User.findById(decoded.id);
      } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid or expired token." });
      }
    } else {
      return res.status(401).json({ success: false, message: "Authorization token required." });
    }

    const product = await Product.findById(productID);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    // 🔐 Security Check: Only Owner or Admin can delete
    if (user.role === 'shopkeeper' && product.addedBy?.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized: You can only delete your own products." });
    }

    await Product.findByIdAndDelete(productID);
    res.json({ success: true, message: "Product deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

// Get pending products (Admin only)
router.get('/admin/pending', auth, roleCheck(['admin']), asyncHandler(async (req, res) => {
  try {
    const products = await Product.find({ status: 'pending' })
      .populate('addedBy', 'name shopName')
      .populate('proCategoryId', 'name')
      .populate('proSubCategoryId', 'name');
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

// Approve a product and set final selling price (Admin only)
router.put('/admin/approve/:id', auth, roleCheck(['admin']), asyncHandler(async (req, res) => {
  try {
    const { price, offerPrice } = req.body;
    if (!price) {
      return res.status(400).json({ success: false, message: "Final selling price is required for approval." });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', price: price, offerPrice: offerPrice || undefined },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    res.json({ success: true, message: "Product approved successfully.", data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

// Reject a product (Admin only)
router.put('/admin/reject/:id', auth, roleCheck(['admin']), asyncHandler(async (req, res) => {
  try {
    const { reason } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason: reason || "No reason provided" },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    res.json({ success: true, message: "Product rejected.", data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

module.exports = router;
