const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const AppVersion = require('../model/appVersion');
const auth = require('../middleware/authMiddleware');
const roleCheck = require('../middleware/roleMiddleware');

const isAdmin = roleCheck(['admin']);

// Get current app version settings (Public)
router.get('/', asyncHandler(async (req, res) => {
    try {
        let versionInfo = await AppVersion.findOne();
        
        // If no record exists, create a default one
        if (!versionInfo) {
            versionInfo = await AppVersion.create({
                latest_version: '1.0.0',
                min_required_version: '1.0.0',
                force_update: false,
                message: 'New update available. Please update the app.'
            });
        }

        res.json({
            success: true,
            message: "App version retrieved successfully.",
            data: versionInfo
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Update app version settings (Admin only)
router.post('/update', auth, isAdmin, asyncHandler(async (req, res) => {
    const { latest_version, min_required_version, force_update, message } = req.body;

    try {
        let versionInfo = await AppVersion.findOne();

        if (versionInfo) {
            if (latest_version !== undefined) versionInfo.latest_version = latest_version;
            if (min_required_version !== undefined) versionInfo.min_required_version = min_required_version;
            if (force_update !== undefined) versionInfo.force_update = force_update;
            if (message !== undefined) versionInfo.message = message;
            
            await versionInfo.save();
        } else {
            versionInfo = await AppVersion.create({
                latest_version: latest_version || '1.0.0',
                min_required_version: min_required_version || '1.0.0',
                force_update: force_update || false,
                message: message || 'New update available. Please update the app.'
            });
        }

        res.json({
            success: true,
            message: "App version updated successfully.",
            data: versionInfo
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

module.exports = router;
