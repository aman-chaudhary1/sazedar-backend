const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Prevent duplicate favorites
favoriteSchema.index({ userId: 1, productId: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorite;

