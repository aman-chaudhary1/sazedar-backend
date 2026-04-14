const mongoose = require('mongoose');

const appVersionSchema = new mongoose.Schema({
    latest_version: {
        type: String,
        required: true,
        default: '1.0.0'
    },
    min_required_version: {
        type: String,
        required: true,
        default: '1.0.0'
    },
    force_update: {
        type: Boolean,
        default: false
    },
    message: {
        type: String,
        default: 'New update available. Please update the app.'
    }
}, { timestamps: true });

module.exports = mongoose.model('AppVersion', appVersionSchema);
