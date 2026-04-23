const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Notification = require('../model/notification');
const admin = require('../config/firebase');
const User = require('../model/user');

router.post('/send-notification', asyncHandler(async (req, res) => {
    const { title, description, imageUrl, userId } = req.body;

    if (!admin.isInitialized) {
        return res.status(503).json({
            success: false,
            message: "Push notifications are currently disabled (Firebase not configured)."
        });
    }

    try {
        let response;
        const notificationPayload = {
            notification: {
                title: title,
                body: description,
            },
            data: {
                click_action: "FLUTTER_NOTIFICATION_CLICK",
                image: imageUrl || ""
            }
        };

        if (userId) {
            console.log(`Attempting to send to specific user: ${userId}`);
            // Send to specific user
            const user = await User.findById(userId);
            if (!user) {
                console.log(`User not found for ID: ${userId}`);
                return res.status(404).json({ success: false, message: "User not found" });
            }
            if (!user.fcmToken) {
                console.log(`User found (${user.email}), but has NO FCM Token.`);
                return res.status(404).json({ success: false, message: "User has no FCM Token. Ask them to login again." });
            }

            console.log(`Sending to token: ${user.fcmToken.substring(0, 10)}...`);
            response = await admin.messaging().send({
                token: user.fcmToken,
                ...notificationPayload
            });
            console.log('Sent to user:', response);
        } else {
            console.log('Sending to ALL users (topic: all_users)');
            // Send to ALL users via Topic
            response = await admin.messaging().send({
                topic: 'all_users',
                ...notificationPayload
            });
            console.log('Sent to topic all_users:', response);
        }

        const notificationId = response.split('/').pop();
        const notification = new Notification({ 
            notificationId, 
            title, 
            description, 
            imageUrl,
            userId: userId || null // Store userId if it's a targeted notification
        });
        await notification.save();

        res.json({ success: true, message: 'Notification sent successfully', data: null });
    } catch (error) {
        console.error("Error sending notification:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}));

router.get('/track-notification/:id', asyncHandler(async (req, res) => {
    // Basic success response to avoid errors if this legacy endpoint is called.
    res.json({ success: true, message: 'Tracking handled via read-by status', data: null });
}));


router.get('/all-notification', asyncHandler(async (req, res) => {
    try {
        const { userId } = req.query;
        let query = {};
        
        if (userId) {
            // Fetch notifications for THIS user OR global notifications (userId: null)
            query = { 
                $or: [
                    { userId: userId },
                    { userId: null }
                ]
            };
        }

        const notifications = await Notification.find(query)
            .populate('userId', 'name email') // Populate user details
            .sort({ _id: -1 });
        res.json({ success: true, message: "Notifications retrieved successfully.", data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Added alias for the dashboard to fix 404
router.get('/', asyncHandler(async (req, res) => {
    try {
        const notifications = await Notification.find({})
            .populate('userId', 'name email')
            .sort({ _id: -1 });
        res.json({ success: true, message: "Notifications retrieved successfully.", data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));


router.post('/mark-as-read', asyncHandler(async (req, res) => {
    const { notificationId, userId } = req.body;
    try {
        const notification = await Notification.findById(notificationId);
        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found." });
        }

        if (!notification.readBy.includes(userId)) {
            notification.readBy.push(userId);
            await notification.save();
        }
        res.json({ success: true, message: "Marked as read successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));


router.delete('/delete-notification/:id', asyncHandler(async (req, res) => {
    const notificationID = req.params.id;
    try {
        const notification = await Notification.findByIdAndDelete(notificationID);
        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found." });
        }
        res.json({ success: true, message: "Notification deleted successfully.", data: null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));


module.exports = router;
