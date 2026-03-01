const mongoose = require('mongoose');

const panchayatSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Panchayat name is required'],
        trim: true
    },
    blockId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Block',
        required: [true, 'Block ID is required']
    }
}, { timestamps: true });

// Compound index to ensure panchayat names are unique within a block
panchayatSchema.index({ name: 1, blockId: 1 }, { unique: true });

module.exports = mongoose.model('Panchayat', panchayatSchema);
