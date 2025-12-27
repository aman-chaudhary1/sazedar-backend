const express = require('express');
const router = express.Router();
const Category = require('../model/category');
const SubCategory = require('../model/subCategory');
const Product = require('../model/product');
const { uploadCategory } = require('../uploadFile');
const multer = require('multer');
const asyncHandler = require('express-async-handler');
const cloudinary = require('../config/cloudinary');

// =========================
// GET ALL CATEGORIES
// =========================
router.get('/', asyncHandler(async (req, res) => {
    try {
        const categories = await Category.find();
        res.json({ success: true, message: "Categories retrieved successfully.", data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// =========================
// GET CATEGORY BY ID
// =========================
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ success: false, message: "Category not found." });
        res.json({ success: true, message: "Category retrieved successfully.", data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// =========================
// CREATE CATEGORY
// =========================
router.post('/', asyncHandler(async (req, res) => {
    try {
        uploadCategory.single('img')(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') err.message = 'File size is too large. Max 5MB.';
                return res.json({ success: false, message: err.message });
            } else if (err) {
                return res.json({ success: false, message: err.message });
            }

            const { name } = req.body;
            if (!name) return res.status(400).json({ success: false, message: "Name is required." });

            let imageUrl = "";
            if (req.file) {
                // Upload to Cloudinary using file path
                const result = await cloudinary.uploader.upload(req.file.path, { folder: "categories" });
                imageUrl = result.secure_url;
            }

            try {
                const newCategory = new Category({ name, image: imageUrl });
                await newCategory.save();
                res.json({ success: true, message: "Category created successfully.", data: newCategory });
            } catch (error) {
                console.error("Error saving category:", error);
                res.status(500).json({ success: false, message: error.message });
            }
        });
    } catch (error) {
        console.error("Error uploading image or saving category:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}));

// =========================
// UPDATE CATEGORY
// =========================
router.put('/:id', asyncHandler(async (req, res) => {
    try {
        const categoryID = req.params.id;

        uploadCategory.single('img')(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') err.message = 'File size is too large. Max 5MB.';
                return res.json({ success: false, message: err.message });
            } else if (err) {
                return res.json({ success: false, message: err.message });
            }

            const { name } = req.body;
            if (!name) return res.status(400).json({ success: false, message: "Name is required." });

            let imageUrl = req.body.image || "";
            if (req.file) {
                const result = await cloudinary.uploader.upload(req.file.path, { folder: "categories" });
                imageUrl = result.secure_url;
            }

            try {
                const updatedCategory = await Category.findByIdAndUpdate(
                    categoryID,
                    { name, image: imageUrl },
                    { new: true }
                );

                if (!updatedCategory) return res.status(404).json({ success: false, message: "Category not found." });
                res.json({ success: true, message: "Category updated successfully.", data: updatedCategory });
            } catch (error) {
                console.error("Error updating category:", error);
                res.status(500).json({ success: false, message: error.message });
            }
        });
    } catch (error) {
        console.error("Error in update route:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}));

// =========================
// DELETE CATEGORY
// =========================
router.delete('/:id', asyncHandler(async (req, res) => {
    try {
        const categoryID = req.params.id;

        // Check for subcategories
        const subcategories = await SubCategory.find({ categoryId: categoryID });
        if (subcategories.length > 0) return res.status(400).json({ success: false, message: "Cannot delete category. Subcategories exist." });

        // Check for products
        const products = await Product.find({ proCategoryId: categoryID });
        if (products.length > 0) return res.status(400).json({ success: false, message: "Cannot delete category. Products exist." });

        const category = await Category.findByIdAndDelete(categoryID);
        if (!category) return res.status(404).json({ success: false, message: "Category not found." });

        res.json({ success: true, message: "Category deleted successfully." });
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}));

module.exports = router;
