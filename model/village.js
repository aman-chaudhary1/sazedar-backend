const mongoose = require('mongoose');

const villageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Village name is required'],
        trim: true
    },
    panchayatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Panchayat',
        required: [true, 'Panchayat ID is required']
    }
}, { timestamps: true });

// Compound index to ensure village names are unique within a panchayat
villageSchema.index({ name: 1, panchayatId: 1 }, { unique: true });

module.exports = mongoose.model('Village', villageSchema);
