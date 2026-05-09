const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const mongoose = require('mongoose');
console.log('✅ Shopkeeper Routes Ready');
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
    const { uploadProductMemory } = require('../uploadFile');
    uploadProductMemory.array('images', 5)(req, res, (err) => {
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



// TEST ROUTE: To verify if the Order model is working in this file
router.get('/test-ping', auth, isShopkeeper, asyncHandler(async (req, res) => {
    try {
        const count = await Order.countDocuments();
        res.json({ success: true, message: "Order model is connected", count });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
}));

// Get orders for the current shopkeeper (RENAMED TO AVOID CONFLICTS)
router.get('/vendor-orders-list', auth, isShopkeeper, asyncHandler(async (req, res) => {
    console.log('--- [DEBUG] vendor-orders-list Reached ---');
    try {
        const shopkeeperId = req.user._id;
        
        // Use the Order model imported at top of file
        const orders = await Order.find({ 'items.vendorId': shopkeeperId })
            .populate('items.productID')
            .populate('userID', 'name email phoneNo')
            .sort({ orderDate: -1 })
            .lean();

        console.log(`[DEBUG] Found ${orders.length} raw orders for vendor`);

        const vendorOrders = orders.map(order => {
            const vendorItems = (order.items || []).filter(item => 
                item.vendorId && item.vendorId.toString() === shopkeeperId.toString()
            );
            return { ...order, items: vendorItems };
        });

        console.log(`[DEBUG] Sending ${vendorOrders.length} filtered orders`);
        return res.json({ success: true, data: vendorOrders });
    } catch (error) {
        console.error('CRITICAL ERROR in vendor-orders-list:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}));

// Update the status of a specific item in an order (Shopkeeper independent status)
router.put('/update-item-status', auth, isShopkeeper, asyncHandler(async (req, res) => {
    const { orderId, productId, itemStatus } = req.body;
    const shopkeeperId = req.user._id;

    if (!orderId || !productId || !itemStatus) {
        return res.status(400).json({ success: false, message: "orderId, productId, and itemStatus are required." });
    }

    try {
        // Find the order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        // Find the specific item belonging to this shopkeeper
        const itemIndex = order.items.findIndex(item => 
            item.productID.toString() === productId.toString() && 
            item.vendorId && item.vendorId.toString() === shopkeeperId.toString()
        );

        if (itemIndex === -1) {
            return res.status(403).json({ success: false, message: "Item not found in this order or you are not authorized to update it." });
        }

        // Update the item status
        console.log(`[DEBUG] Updating item ${productId} status to ${itemStatus} in order ${orderId}`);
        order.items[itemIndex].status = itemStatus;

        // Global status update logic removed as per user request. 
        // Only Admin can update the global orderStatus now.

        await order.save();
        console.log(`[DEBUG] Order saved with item-level update. Global status remains: ${order.orderStatus}`);

        res.json({ 
            success: true, 
            message: "Item status updated successfully.", 
            data: {
                orderId: order._id,
                productId: productId,
                newItemStatus: itemStatus,
                globalOrderStatus: order.orderStatus
            } 
        });
    } catch (error) {
        console.error('Error updating item status:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}));

module.exports = router;
