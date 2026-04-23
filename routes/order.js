const express = require('express');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const Order = require('../model/order');
const AppConfig = require('../model/appConfig');
const auth = require('../middleware/authMiddleware');

// Get all orders
router.get('/', asyncHandler(async (req, res) => {
    try {
        const { date } = req.query;
        let filter = {};

        if (date) {
            // Assuming the date string is 'YYYY-MM-DD' and represents the start of the day in IST
            const startOfDayIST = new Date(`${date}T00:00:00Z`);
            startOfDayIST.setMinutes(startOfDayIST.getMinutes() - 330); // Offset for IST (UTC+5:30)

            const endOfDayIST = new Date(`${date}T23:59:59.999Z`);
            endOfDayIST.setMinutes(endOfDayIST.getMinutes() - 330);

            filter.orderDate = { $gte: startOfDayIST, $lte: endOfDayIST };
        }

        const orders = await Order.find(filter)
        .populate('couponCode', 'id couponCode discountType discountAmount')
        .populate('userID', 'id name').sort({ _id: -1 });
        res.json({ success: true, message: "Orders retrieved successfully.", data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));


router.get('/orderByUserId/:userId', asyncHandler(async (req, res) => {
    try {
        const userId = req.params.userId;
        const orders = await Order.find({ userID: userId })
            .populate('couponCode', 'id couponCode discountType discountAmount')
            .populate('userID', 'id name')
            .sort({ _id: -1 });
        res.json({ success: true, message: "Orders retrieved successfully.", data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));


// Get an order by ID
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const orderID = req.params.id;
        const order = await Order.findById(orderID)
        .populate('couponCode', 'id couponCode discountType discountAmount')
        .populate('userID', 'id name');
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }
        res.json({ success: true, message: "Order retrieved successfully.", data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Create a new order
router.post('/', asyncHandler(async (req, res) => {
    const { userID, orderStatus, items, totalPrice, shippingAddress, paymentMethod, couponCode, orderTotal, trackingUrl } = req.body;
    
    // Server-side logging to debug missing fields
    console.log('--- Incoming Order Data ---');
    console.log('shippingAddress:', JSON.stringify(shippingAddress, null, 2));
    console.log('orderTotal:', JSON.stringify(orderTotal, null, 2));

    if (!userID || !items || !totalPrice || !shippingAddress || !paymentMethod || !orderTotal) {
        return res.status(400).json({ success: false, message: "User ID, items, totalPrice, shippingAddress, paymentMethod, and orderTotal are required." });
    }

    try {
        // Check if ordering is enabled
        const config = await AppConfig.findOne();
        if (config && config.isOrderingEnabled === false) {
            return res.status(403).json({ 
                success: false, 
                message: config.orderBlockedMessage || "Ordering is temporarily disabled." 
            });
        }
        const order = new Order({ 
            userID, 
            orderStatus, 
            items, 
            totalPrice, 
            shippingAddress, 
            paymentMethod, 
            couponCode, 
            orderTotal, 
            trackingUrl 
        });
        
        const newOrder = await order.save();
        console.log('--- Saved Order ---');
        console.log(JSON.stringify(newOrder, null, 2));

        res.json({ success: true, message: "Order created successfully.", data: newOrder });
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Cancel order by user (MUST be before PUT /:id route)
router.put('/cancel/:id', auth, asyncHandler(async (req, res) => {
    try {
        const orderID = req.params.id;
        const userId = req.user._id;

        // Find order and verify ownership
        const order = await Order.findOne({
            _id: orderID,
            userID: userId
        });

        if (!order) {
            return res.status(404).json({ 
                success: false, 
                message: "Order not found or you don't have permission to cancel this order." 
            });
        }

        // Check if order can be cancelled
        if (order.orderStatus === 'cancelled') {
            return res.status(400).json({ 
                success: false, 
                message: "Order is already cancelled." 
            });
        }

        // Only delivered orders cannot be cancelled (pending, processing, and shipped can be cancelled)
        if (order.orderStatus === 'delivered') {
            return res.status(400).json({ 
                success: false, 
                message: "Cannot cancel order. Order is already delivered." 
            });
        }

        // Update order status to cancelled
        order.orderStatus = 'cancelled';
        await order.save();

        res.json({ 
            success: true, 
            message: "Order cancelled successfully.", 
            data: order 
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid order ID." 
            });
        }
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Bulk update orders status
router.put('/bulk-update', asyncHandler(async (req, res) => {
    try {
        const { orderIds, newStatus } = req.body;

        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return res.status(400).json({ success: false, message: "Order IDs are required and must be a non-empty array." });
        }

        if (!newStatus) {
            return res.status(400).json({ success: false, message: "New status is required." });
        }

        const result = await Order.updateMany(
            { _id: { $in: orderIds } },
            { $set: { orderStatus: newStatus } }
        );

        res.json({ 
            success: true, 
            message: `${result.modifiedCount} orders updated successfully.`, 
            data: result 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Update an order (Admin endpoint - for updating status)
router.put('/:id', asyncHandler(async (req, res) => {
    try {
        const orderID = req.params.id;
        const { orderStatus, trackingUrl } = req.body;
        if (!orderStatus) {
            return res.status(400).json({ success: false, message: "Order Status required." });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            orderID,
            { orderStatus, trackingUrl },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        res.json({ success: true, message: "Order updated successfully.", data: null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Delete an order
router.delete('/:id', asyncHandler(async (req, res) => {
    try {
        const orderID = req.params.id;
        const deletedOrder = await Order.findByIdAndDelete(orderID);
        if (!deletedOrder) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }
        res.json({ success: true, message: "Order deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

module.exports = router;
