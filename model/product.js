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
    }]
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
