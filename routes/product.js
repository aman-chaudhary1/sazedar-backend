const express = require('express');
const router = express.Router();
const Product = require('../model/product');
const multer = require('multer');
const { uploadProduct } = require('../uploadFile');
const asyncHandler = require('express-async-handler');
const cloudinary = require('../config/cloudinary');

// Get all products
router.get('/', asyncHandler(async (req, res) => {
    try {
        const filter = {};

        // Optional filter to get only today's special products: /products?todaysSpecial=true
        if (req.query.todaysSpecial === 'true') {
          filter.todaysSpecial = true;
        }

        const products = await Product.find(filter)
        .populate('proCategoryId', 'id name')
        .populate('proSubCategoryId', 'id name')
        .populate('proBrandId', 'id name')
        .populate('proVariantTypeId', 'id type')
        .populate('proVariantId', 'id name');
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
            .populate('proCategoryId', 'id name')
            .populate('proSubCategoryId', 'id name')
            .populate('proBrandId', 'id name')
            .populate('proVariantTypeId', 'id name')
            .populate('proVariantId', 'id name');
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
      return res.json({ success: false, message: err });
    }

    try {
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
        proVariantId
      } = req.body;

      // Only these fields are strictly required
      if (!name || !quantity || !price || !proCategoryId) {
        return res.status(400).json({ success: false, message: "Required fields are missing." });
      }

      // Normalize offerPrice so that empty / "null" does not try to cast to Number
      const parsedOfferPrice = (offerPrice === undefined || offerPrice === null || offerPrice === '' || offerPrice === 'null')
        ? undefined
        : Number(offerPrice);
      if (parsedOfferPrice !== undefined && Number.isNaN(parsedOfferPrice)) {
        return res.status(400).json({ success: false, message: "offerPrice must be a number." });
      }

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

      const newProduct = new Product({
        name,
        description,
        quantity,
        price,
        offerPrice: parsedOfferPrice,
        todaysSpecial: todaysSpecial === 'true' || todaysSpecial === true,
        proCategoryId,
        proSubCategoryId: proSubCategoryId || null,
        proBrandId: proBrandId || null,
        proVariantTypeId: proVariantTypeId || null,
        proVariantId: proVariantId || [],
        images: imageUrls,
      });

      await newProduct.save();

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
      return res.status(500).json({ success: false, message: err.message });
    }

    try {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found." });
      }

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
        proVariantId
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

// Delete a product
router.delete('/:id', asyncHandler(async (req, res) => {
    const productID = req.params.id;
    try {
        const product = await Product.findByIdAndDelete(productID);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }
        res.json({ success: true, message: "Product deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

module.exports = router;
