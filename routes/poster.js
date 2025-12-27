const express = require('express');
const router = express.Router();
const Poster = require('../model/poster');
const { uploadPosters } = require('../uploadFile');
const multer = require('multer');
const asyncHandler = require('express-async-handler');
const cloudinary = require('../config/cloudinary');

// =========================
// GET ALL POSTERS
// =========================
router.get('/', asyncHandler(async (req, res) => {
    const posters = await Poster.find({});
    res.json({
        success: true,
        message: "Posters retrieved successfully.",
        data: posters
    });
}));

// =========================
// GET POSTER BY ID
// =========================
router.get('/:id', asyncHandler(async (req, res) => {
    const poster = await Poster.findById(req.params.id);

    if (!poster) {
        return res.status(404).json({ success: false, message: "Poster not found." });
    }

    res.json({
        success: true,
        message: "Poster retrieved successfully.",
        data: poster
    });
}));

// =========================
// CREATE POSTER
// =========================
router.post('/', asyncHandler(async (req, res) => {

    uploadPosters.single('img')(req, res, async function (err) {

        if (err instanceof multer.MulterError) {
            return res.json({ success: false, message: err.message });
        } else if (err) {
            return res.json({ success: false, message: err.message });
        }

        const { posterName } = req.body;

        if (!posterName) {
            return res.status(400).json({ success: false, message: "Poster name is required." });
        }

        let imageUrl = "";

        // Upload to Cloudinary
        if (req.file) {
            const result = await cloudinary.uploader.upload(
                `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
                { folder: "posters" }
            );
            imageUrl = result.secure_url;
        }

        const newPoster = new Poster({
            posterName,
            imageUrl
        });

        await newPoster.save();

        res.json({
            success: true,
            message: "Poster created successfully.",
            data: newPoster
        });
    });
}));

// =========================
// UPDATE POSTER
// =========================
router.put('/:id', asyncHandler(async (req, res) => {

    uploadPosters.single('img')(req, res, async function (err) {

        if (err instanceof multer.MulterError) {
            return res.json({ success: false, message: err.message });
        } else if (err) {
            return res.json({ success: false, message: err.message });
        }

        const { posterName } = req.body;

        if (!posterName) {
            return res.status(400).json({ success: false, message: "Poster name is required." });
        }

        let poster = await Poster.findById(req.params.id);

        if (!poster) {
            return res.status(404).json({ success: false, message: "Poster not found." });
        }

        let imageUrl = poster.imageUrl; // Keep existing image by default

        // Upload new image to Cloudinary if provided
        if (req.file) {
            const result = await cloudinary.uploader.upload(
                `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
                { folder: "posters" }
            );
            imageUrl = result.secure_url;
        }

        // Update poster
        poster.posterName = posterName;
        poster.imageUrl = imageUrl;
        await poster.save();

        res.json({
            success: true,
            message: "Poster updated successfully.",
            data: poster
        });
    });
}));

// =========================
// DELETE POSTER
// =========================
router.delete('/:id', asyncHandler(async (req, res) => {
    const poster = await Poster.findById(req.params.id);

    if (!poster) {
        return res.status(404).json({ success: false, message: "Poster not found." });
    }

    // Optionally: Delete image from Cloudinary if needed
    // if (poster.imageUrl) {
    //     const publicId = poster.imageUrl.split('/').pop().split('.')[0];
    //     await cloudinary.uploader.destroy(`posters/${publicId}`);
    // }

    await Poster.findByIdAndDelete(req.params.id);

    res.json({
        success: true,
        message: "Poster deleted successfully."
    });
}));

module.exports = router;
