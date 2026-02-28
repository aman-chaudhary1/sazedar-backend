const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      // Removed unique: true to allow multiple addresses per user
    },
    phone: {
      type: String,
      required: true
    },
    landmark: {
      type: String,
      required: true
    },
    village: {
      type: String,
      required: true
    },
    panchayat: {
      type: String,
      required: true
    },
    block: {
      type: String,
      required: true
    },
    addressType: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home'
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    label: {
      type: String, // e.g., "Home", "Office", "Mom's House"
      trim: true
    }
  },
  { timestamps: true }
);

// Index for faster queries (non-unique to allow multiple addresses per user)
addressSchema.index({ userId: 1 });

module.exports = mongoose.model('Address', addressSchema);
