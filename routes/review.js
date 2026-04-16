const express = require('express');
const router = express.Router();
const Review = require('../model/review');

// Get all reviews (for Admin)
router.get('/', async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: reviews });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Add a review
router.post('/add', async (req, res) => {
    try {
        const { userId, rating, feedback } = req.body;
        if (!userId || !rating || !feedback) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        const review = new Review({ userId, rating, feedback });
        await review.save();
        res.json({ success: true, message: 'Review submitted successfully', data: review });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
