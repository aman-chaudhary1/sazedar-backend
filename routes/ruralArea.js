const express = require('express');
const router = express.Router();
const Block = require('../model/block');
const Panchayat = require('../model/panchayat');
const Village = require('../model/village');
const Address = require('../model/address');
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
    const { name, panchayatId, deliveryFee } = req.body;
    const village = new Village({ name, panchayatId, deliveryFee });
    await village.save();
    res.status(201).json({ success: true, data: village });
}));

// Update block
router.put('/blocks/:id', asyncHandler(async (req, res) => {
    const { name } = req.body;
    const block = await Block.findByIdAndUpdate(req.params.id, { name }, { new: true });
    if (!block) return res.status(404).json({ success: false, message: 'Block not found' });
    res.json({ success: true, data: block });
}));

// Delete block
router.delete('/blocks/:id', asyncHandler(async (req, res) => {
    await Block.findByIdAndDelete(req.params.id);
    // Also delete dependent panchayats and villages (optional but recommended for data integrity)
    const panchayats = await Panchayat.find({ blockId: req.params.id });
    for (const p of panchayats) {
        await Village.deleteMany({ panchayatId: p._id });
    }
    await Panchayat.deleteMany({ blockId: req.params.id });
    res.json({ success: true, message: 'Block deleted' });
}));

// Update panchayat
router.put('/panchayats/:id', asyncHandler(async (req, res) => {
    const { name } = req.body;
    const panchayat = await Panchayat.findByIdAndUpdate(req.params.id, { name }, { new: true });
    if (!panchayat) return res.status(404).json({ success: false, message: 'Panchayat not found' });
    res.json({ success: true, data: panchayat });
}));

// Delete panchayat
router.delete('/panchayats/:id', asyncHandler(async (req, res) => {
    await Village.deleteMany({ panchayatId: req.params.id });
    await Panchayat.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Panchayat deleted' });
}));

// Update village
router.put('/villages/:id', asyncHandler(async (req, res) => {
    const { name, deliveryFee } = req.body;

    // Get the old village data first to find matching addresses if name changes
    const oldVillage = await Village.findById(req.params.id);
    if (!oldVillage) return res.status(404).json({ success: false, message: 'Village not found' });

    const village = await Village.findByIdAndUpdate(req.params.id, { name, deliveryFee }, { new: true });

    // Sync with existing user addresses
    // We update addresses where the village name matches the old village name
    try {
        await Address.updateMany(
            { village: oldVillage.name },
            { $set: { village: name, deliveryFee: deliveryFee } }
        );
        console.log(`Synced deliveryFee for village: ${name}`);
    } catch (syncError) {
        console.error('Error syncing addresses with village update:', syncError);
        // We don't fail the request if sync fails, but we log it
    }

    res.json({ success: true, data: village });
}));

// Delete village
router.delete('/villages/:id', asyncHandler(async (req, res) => {
    await Village.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Village deleted' });
}));

module.exports = router;
