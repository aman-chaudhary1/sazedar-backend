const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  items: [
    {
      productID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      productName: {
        type: String,
        required: true
      },
      quantity: {
        type: Number,
        required: true
      },
      price: {
        type: Number,
        required: true
      },
      variant: {
        type: String,
      },
      unit: {
        type: String,
      },
      vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      shopkeeperPrice: {
        type: Number
      }
    }
  ],
  shopkeeperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  totalPrice: {
    type: Number,
    required: true
  },
  shippingAddress: {
    phone: { type: String },
    landmark: { type: String },
    village: { type: String },
    panchayat: { type: String },
    block: { type: String },
    deliveryFee: { type: Number, default: 0 }
  },

  paymentMethod: {
    type: String,
    enum: ['cod', 'prepaid']
  },

  couponCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon'
  },
  orderTotal: {
    subtotal: { type: Number },
    discount: { type: Number },
    shipping: { type: Number, default: 0 },
    total: { type: Number }
  },
  trackingUrl: {
    type: String
  },
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
