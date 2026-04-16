const mongoose = require('mongoose');

const appConfigSchema = new mongoose.Schema({
    isOrderingEnabled: {
        type: Boolean,
        default: true
    },
    welcomeMessage: {
        type: String,
        default: 'Welcome to Gravito! 🚀 Thank you for joining our community.'
    },
    orderBlockedMessage: {
        type: String,
        default: 'Thank you for installing Gravito! We are currently fine-tuning our services to ensure you get the best experience. Ordering will be enabled in just a few days. Stay tuned!'
    },
    showWelcomePopup: {
        type: Boolean,
        default: true
    },
    reviewEnabled: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('AppConfig', appConfigSchema);
