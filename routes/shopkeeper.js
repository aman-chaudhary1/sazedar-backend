const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const User = require('../model/user');
const Product = require('../model/product');
const Category = require('../model/category');
const SubCategory = require('../model/subCategory');
const Order = require('../model/order');
const auth = require('../middleware/authMiddleware');
const roleCheck = require('../middleware/roleMiddleware');
const { uploadUserProfile } = require('../uploadFile');
const cloudinary = require('../config/cloudinary');

// Shopkeeper check
const isShopkeeper = roleCheck(['shopkeeper', 'admin']);

// Get categories assigned to the current shopkeeper
router.get('/my-categories', auth, isShopkeeper, asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('assignedCategories')
            .populate('assignedSubCategories');
        if (!user) {
            return res.status(404).json({ success: false, message: "Shopkeeper not found." });
        }
        res.json({ 
            success: true, 
            data: {
                categories: user.assignedCategories,
                subCategories: user.assignedSubCategories
            } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Add a product (Shopkeeper specific) with Image Upload
router.post('/add-product', auth, isShopkeeper, (req, res, next) => {
    uploadUserProfile.array('images', 5)(req, res, (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        next();
    });
}, asyncHandler(async (req, res) => {
    try {
        const { name, description, shopkeeperPrice, shopkeeperOfferPrice, proCategoryId, quantity, unit } = req.body;
        
        if (!proCategoryId) {
            return res.status(400).json({ success: false, message: "Category ID is required." });
        }

        // Authorization check: Does the shopkeeper have access to this category?
        const user = await User.findById(req.user._id);
        if (!user.assignedCategories.some(id => id.toString() === proCategoryId.toString())) {
            return res.status(403).json({ success: false, message: "You are not authorized to add products to this category." });
        }

        // SubCategory Check: If shopkeeper has assigned subcategories for this category, one must be selected
        let { proSubCategoryId } = req.body;
        if (proSubCategoryId === "") proSubCategoryId = null;

        const assignedSubCatsForThisCategory = await SubCategory.find({
            _id: { $in: user.assignedSubCategories },
            categoryId: proCategoryId
        });

        if (assignedSubCatsForThisCategory.length > 0) {
            if (!proSubCategoryId) {
                return res.status(400).json({ success: false, message: "A sub-category is required for this category." });
            }
            if (!assignedSubCatsForThisCategory.some(sc => sc._id.toString() === proSubCategoryId.toString())) {
                return res.status(403).json({ success: false, message: "You are not authorized to add products to this sub-category." });
            }
        }

        // Upload images to Cloudinary
        const imageUrls = [];
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
                const result = await cloudinary.uploader.upload(dataUri, {
                    folder: 'products',
                });
                imageUrls.push({
                    image: i + 1,
                    url: result.secure_url
                });
            }
        }

        const product = new Product({
            name,
            description,
            quantity: Number(quantity),
            unit,
            price: Number(shopkeeperPrice), // Use shopkeeper price as base price
            shopkeeperPrice: Number(shopkeeperPrice),
            shopkeeperOfferPrice: Number(shopkeeperOfferPrice) || 0,
            offerPrice: Number(shopkeeperOfferPrice) || undefined, // Suggestion
            proCategoryId,
            proSubCategoryId,
            images: imageUrls,
            addedBy: req.user._id,
            status: 'pending' // Admin must approve
        });

        await product.save();
        res.json({ success: true, message: "Product submitted for approval.", data: product });
    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}));


// Get products added by the current shopkeeper (Only their own)
router.get('/my-products', auth, isShopkeeper, asyncHandler(async (req, res) => {
    try {
        const products = await Product.find({ addedBy: req.user._id })
            .populate('proCategoryId', 'name')
            .populate('proSubCategoryId', 'name')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));



// Get orders for the current shopkeeper

router.get('/my-orders', auth, isShopkeeper, asyncHandler(async (req, res) => {
    try {
        const orders = await Order.find({ 'items.vendorId': req.user._id })
            .populate('items.productID')
            .populate('userID', 'name email phoneNo');
        
        // Filter items in each order to only show those belonging to this vendor
        const vendorOrders = orders.map(order => {
            const vendorItems = order.items.filter(item => 
                item.vendorId && item.vendorId.toString() === req.user._id.toString()
            );
            return {
                ...order._doc,
                items: vendorItems
            };
        });

        res.json({ success: true, data: vendorOrders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

module.exports = router;
