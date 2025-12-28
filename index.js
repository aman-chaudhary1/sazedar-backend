//const express = require('express');
//const bodyParser = require('body-parser');
//const cors = require('cors');
//const mongoose = require('mongoose');
//const asyncHandler = require('express-async-handler');
//const dotenv = require('dotenv');
//
//dotenv.config();
//
//const app = express();
//
//// Base URL for generating image URLs
//const HOST_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT}`;
//app.locals.HOST_URL = HOST_URL;
//
//console.log("SERVER BASE URL:", HOST_URL);
//
//// Middlewares
//app.use(cors({ origin: '*' }));
//app.use(bodyParser.json());
//
//// Static Folders
//app.use('/image/products', express.static('public/products'));
//app.use('/image/category', express.static('public/category'));
//app.use('/image/poster', express.static('public/posters'));
//
//// MongoDB Connection
//const URL = process.env.MONGO_URL;
//
//if (!URL) {
//    console.error('MONGO_URL is missing in .env');
//    process.exit(1);
//}
//
//mongoose.connect(URL, {
//    serverSelectionTimeoutMS: 30000,
//    socketTimeoutMS: 45000,
//    maxPoolSize: 10,
//    retryWrites: true,
//    w: 'majority'
//}).then(() => {
//    console.log('MongoDB connected successfully');
//}).catch((error) => {
//    console.error('MongoDB connection failed:', error.message);
//    process.exit(1);
//});
//
//// Routes
//app.use('/categories', require('./routes/category'));
//app.use('/subCategories', require('./routes/subCategory'));
//app.use('/brands', require('./routes/brand'));
//app.use('/variantTypes', require('./routes/variantType'));
//app.use('/variants', require('./routes/variant'));
//app.use('/products', require('./routes/product'));
//app.use('/couponCodes', require('./routes/couponCode'));
//app.use('/posters', require('./routes/poster'));
//app.use('/users', require('./routes/user'));
//app.use('/orders', require('./routes/order'));
//app.use('/payment', require('./routes/payment'));
//app.use('/notification', require('./routes/notification'));
//app.use('/api/address', require('./routes/address'));
//app.use('/cart', require('./routes/cart'));
//app.use('/favorites', require('./routes/favorite'));
//
//// Test API
//app.get('/', (req, res) => {
//    res.json({ success: true, message: 'API running successfully' });
//});
//
//// Global Error Handler
//app.use((err, req, res, next) => {
//    res.status(500).json({ success: false, message: err.message });
//});
//
//// Start Server
//app.listen(process.env.PORT, () => {
//    console.log(`Server running at http://localhost:${process.env.PORT}`);
//});
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

/* ======================
   CONFIG
====================== */

const PORT = process.env.PORT || 3000;

// Render / Production base URL
const BASE_URL =
  process.env.BASE_URL || `http://localhost:${PORT}`;

app.locals.HOST_URL = BASE_URL;

console.log('SERVER BASE URL:', BASE_URL);

/* ======================
   MIDDLEWARES
====================== */

app.use(cors({
  origin: '*', // later restrict to admin panel domain
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

/* ======================
   STATIC (ONLY IF NEEDED)
   ⚠️ Prefer Cloudinary in production
====================== */

// ❌ Recommended to REMOVE in production if using Cloudinary
// app.use('/image/products', express.static('public/products'));
// app.use('/image/category', express.static('public/category'));
// app.use('/image/poster', express.static('public/posters'));

/* ======================
   DATABASE
====================== */

const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  console.error('❌ MONGO_URL missing');
  process.exit(1);
}

mongoose
  .connect(MONGO_URL, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    retryWrites: true,
    w: 'majority',
  })
  .then(() => {
    console.log('✅ MongoDB connected');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

/* ======================
   ROUTES
====================== */

app.use('/categories', require('./routes/category'));
app.use('/subCategories', require('./routes/subCategory'));
app.use('/brands', require('./routes/brand'));
app.use('/variantTypes', require('./routes/variantType'));
app.use('/variants', require('./routes/variant'));
app.use('/products', require('./routes/product'));
app.use('/couponCodes', require('./routes/couponCode'));
app.use('/posters', require('./routes/poster'));
app.use('/users', require('./routes/user'));
app.use('/orders', require('./routes/order'));
app.use('/payment', require('./routes/payment'));
app.use('/notification', require('./routes/notification'));
app.use('/api/address', require('./routes/address'));
app.use('/cart', require('./routes/cart'));
app.use('/favorites', require('./routes/favorite'));

/* ======================
   HEALTH CHECK
====================== */

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API running successfully',
    baseUrl: BASE_URL,
  });
});

/* ======================
   GLOBAL ERROR HANDLER
====================== */

app.use((err, req, res, next) => {
  console.error('🔥 ERROR:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

/* ======================
   SERVER START
====================== */

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
