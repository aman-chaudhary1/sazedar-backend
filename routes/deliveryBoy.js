const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../model/user');
const Order = require('../model/order');
const auth = require('../middleware/authMiddleware');

console.log('📦 Delivery Partner Routes Ready');

// Candidate Signup Application
router.post('/signup', asyncHandler(async (req, res) => {
    const { name, email, password, phoneNo, vehicleType, requestedPanchayats, villagesExperience } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: "Primary identity metrics (Name, email, password) are strictly required." 
        });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: "A candidate or system user account already utilizes this email." 
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const parsedPanchayats = Array.isArray(requestedPanchayats) 
            ? requestedPanchayats 
            : (requestedPanchayats ? [requestedPanchayats] : []);

        const candidate = new User({
            name,
            email,
            password: hashedPassword,
            phoneNo: phoneNo || null,
            role: 'delivery_boy',
            accountApprovalStatus: 'under_review', // Requires administrative verification clearance
            onlineStatus: 'offline',
            vehicleType: vehicleType || 'Motorcycle',
            requestedPanchayats: parsedPanchayats,
            assignedPanchayats: [],
            villagesExperience: villagesExperience || null,
            totalEarnings: 0
        });

        const newCandidate = await candidate.save();

        const token = jwt.sign(
            { id: newCandidate._id, role: newCandidate.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '30d' }
        );

        res.status(201).json({
            success: true,
            message: "Partner request submitted. Operating route mapping pending manual review.",
            data: {
                user: {
                    id: newCandidate._id,
                    name: newCandidate.name,
                    email: newCandidate.email,
                    role: newCandidate.role,
                    accountApprovalStatus: newCandidate.accountApprovalStatus,
                    requestedPanchayats: newCandidate.requestedPanchayats
                },
                token
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Duplicate record match index error." });
        }
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Partner Auth Login
router.post('/login', asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Valid email and password keys required." });
    }

    try {
        const user = await User.findOne({ email });
        if (!user || user.role !== 'delivery_boy') {
            return res.status(401).json({ 
                success: false, 
                message: "Unauthorized lookup: Valid delivery partner profile missing." 
            });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials provided." });
        }

        // Administrative lock safety interception verification
        if (user.accountApprovalStatus === 'blocked') {
            return res.status(403).json({
                success: false,
                message: "Access Intercepted: Your partner authorization has been administratively disabled."
            });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            message: "Rider UI Session token unlocked.",
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phoneNo: user.phoneNo,
                    role: user.role,
                    accountApprovalStatus: user.accountApprovalStatus,
                    onlineStatus: user.onlineStatus,
                    assignedPanchayats: user.assignedPanchayats,
                    totalEarnings: user.totalEarnings
                },
                token
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Presence availability status mutator
router.put('/status', auth, asyncHandler(async (req, res) => {
    try {
        const { onlineStatus } = req.body;
        if (!['online', 'offline'].includes(onlineStatus)) {
            return res.status(400).json({ success: false, message: "Target state must match online or offline strings." });
        }

        const updated = await User.findByIdAndUpdate(
            req.user._id, 
            { onlineStatus }, 
            { new: true }
        ).select('-password');

        res.json({ success: true, message: `Partner device toggled ${onlineStatus}`, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Extract mapped orders matching authenticated rider instance
router.get('/orders', auth, asyncHandler(async (req, res) => {
    try {
        const orders = await Order.find({ deliveryBoyId: req.user._id })
            .populate('userID', 'name phoneNo email')
            .sort({ orderDate: -1 });

        res.json({ success: true, message: "Assigned log routes returned.", data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Secure Handover OTP Sequence Validator
router.put('/orders/:id/verify', auth, asyncHandler(async (req, res) => {
    try {
        const { enteredOtp } = req.body;
        const orderId = req.params.id;

        if (!enteredOtp) {
            return res.status(400).json({ success: false, message: "Numerical OTP sequence payload string is required." });
        }

        const order = await Order.findOne({ _id: orderId, deliveryBoyId: req.user._id });
        if (!order) {
            return res.status(404).json({ success: false, message: "Target order map missing for rider scope." });
        }

        if (order.orderStatus === 'delivered') {
            return res.status(400).json({ success: false, message: "Package state already securely flagged as delivered." });
        }

        if (order.deliveryOtp !== enteredOtp.toString()) {
            return res.status(400).json({ success: false, message: "Handover check failed: Code mismatch detected." });
        }

        // Successfully matches update item status to delivered
        order.orderStatus = 'delivered';
        await order.save();

        // Dynamically increment assigned rider lifetime earnings pool
        const feeEarned = order.deliveryPartnerFee || 20;
        await User.findByIdAndUpdate(req.user._id, {
            $inc: { totalEarnings: feeEarned }
        });

        res.json({
            success: true,
            message: `Delivery successfully confirmed via security token. Rider balance credited +₹${feeEarned}.`,
            data: {
                orderId: order._id,
                orderStatus: order.orderStatus,
                feeCredited: feeEarned
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

module.exports = router;
