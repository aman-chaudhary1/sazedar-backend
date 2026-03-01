const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Block name is required'],
        trim: true,
        unique: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Block', blockSchema);
