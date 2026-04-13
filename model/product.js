const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    quantity: {
        type: Number,
        required: true
    },
    unit: {
        type: String, // e.g., 'Kg', 'Gm', 'Ltr', 'Pc'
        default: 'Pc'
    },
    productSize: {
        type: Number, // e.g., 400, 1, 500
        default: null
    },
    price: {
        type: Number,
        required: true
    },
    offerPrice: {
        type: Number
    },
    // Flag to mark product as today's special for home screen
    todaysSpecial: {
        type: Boolean,
        default: false
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    proCategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    // Optional sub-category
    proSubCategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCategory',
        default: null
    },
    proBrandId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand'
    },
    proVariantTypeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VariantType'
    },
    proVariantId: [String],
    images: [{
        image: {
            type: Number,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    }],
    // Multi-vendor fields
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // null indicates added by Admin
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'approved' // Default to approved for legacy data compatibility
    },
    shopkeeperPrice: {
        type: Number,
        default: 0
    },
    shopkeeperOfferPrice: {
        type: Number,
        default: 0
    },
    rejectionReason: {
        type: String,
        default: ""
    }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
