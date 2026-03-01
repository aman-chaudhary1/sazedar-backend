const express = require('express');
const router = express.Router();
const Block = require('../model/block');
const Panchayat = require('../model/panchayat');
const Village = require('../model/village');
const asyncHandler = require('express-async-handler');

// =========================
// BLOCKS
// =========================

// Get all blocks
router.get('/blocks', asyncHandler(async (req, res) => {
    const blocks = await Block.find().sort({ name: 1 });
    res.json({ success: true, data: blocks });
}));

// Add new block (Admin)
router.post('/blocks', asyncHandler(async (req, res) => {
    const { name } = req.body;
    const block = new Block({ name });
    await block.save();
    res.status(201).json({ success: true, data: block });
}));

// =========================
// PANCHAYATS
// =========================

// Get panchayats (can filter by blockId)
router.get('/panchayats', asyncHandler(async (req, res) => {
    const query = {};
    if (req.query.blockId) query.blockId = req.query.blockId;
    const panchayats = await Panchayat.find(query).sort({ name: 1 });
    res.json({ success: true, data: panchayats });
}));

// Add new panchayat (Admin)
router.post('/panchayats', asyncHandler(async (req, res) => {
    const { name, blockId } = req.body;
    const panchayat = new Panchayat({ name, blockId });
    await panchayat.save();
    res.status(201).json({ success: true, data: panchayat });
}));

// =========================
// VILLAGES
// =========================

// Get villages (can filter by panchayatId)
router.get('/villages', asyncHandler(async (req, res) => {
    const query = {};
    if (req.query.panchayatId) query.panchayatId = req.query.panchayatId;
    const villages = await Village.find(query).sort({ name: 1 });
    res.json({ success: true, data: villages });
}));

// Add new village (Admin)
router.post('/villages', asyncHandler(async (req, res) => {
    const { name, panchayatId } = req.body;
    const village = new Village({ name, panchayatId });
    await village.save();
    res.status(201).json({ success: true, data: village });
}));

module.exports = router;
