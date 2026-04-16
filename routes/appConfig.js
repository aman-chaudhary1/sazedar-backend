const express = require('express');
const router = express.Router();
const AppConfig = require('../model/appConfig');

// GET app config
router.get('/', async (req, res) => {
    try {
        let config = await AppConfig.findOne();
        if (!config) {
            // Create default config if not found
            config = new AppConfig();
            await config.save();
        }
        res.json({ success: true, message: 'Config retrieved successfully', data: config });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Update app config (Admin only logic can be added here if there's an auth middleware)
router.post('/update', async (req, res) => {
    try {
        let config = await AppConfig.findOne();
        if (!config) {
            config = new AppConfig(req.body);
        } else {
            Object.assign(config, req.body);
        }
        await config.save();
        res.json({ success: true, message: 'Configuration updated successfully', data: config });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
