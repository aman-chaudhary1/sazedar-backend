const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  phoneNo: {
    type: String,
    trim: true
  },
  fcmToken: {
    type: String,
    default: null
  },

  profileImage: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['admin', 'shopkeeper', 'user', 'delivery_boy'],
    default: 'user'
  },
  // Shopkeeper specific fields
  shopName: {
    type: String,
    default: null
  },
  shopAddress: {
    type: String,
    default: null
  },
  assignedCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  assignedSubCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory'
  }],
  shopStatus: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  userStatus: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  // Delivery Partner specific fields
  accountApprovalStatus: {
    type: String,
    enum: ['under_review', 'approved', 'rejected', 'blocked'],
    default: 'under_review'
  },
  onlineStatus: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline'
  },
  vehicleType: {
    type: String,
    default: 'Motorcycle'
  },
  requestedPanchayats: [{
    type: String
  }],
  assignedPanchayats: [{
    type: String
  }],
  villagesExperience: {
    type: String,
    default: null
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
