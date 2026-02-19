
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
  .then(async () => {
    console.log('✅ MongoDB connected');

    // Migration: Drop old unique index on addresses.userId if it exists
    try {
      const Address = require('./model/address');
      const indexes = await Address.collection.getIndexes();

      // Find unique index on userId
      const userIdUniqueIndex = Object.keys(indexes).find(indexName => {
        const index = indexes[indexName];
        return index.key && index.key.userId === 1 && index.unique === true;
      });

      if (userIdUniqueIndex) {
        console.log('🔄 Dropping old unique index on addresses.userId...');
        await Address.collection.dropIndex(userIdUniqueIndex);
        console.log('✅ Old unique index dropped successfully');

        // Ensure non-unique index exists
        await Address.collection.createIndex({ userId: 1 }, { unique: false });
        console.log('✅ New non-unique index created');
      }
    } catch (migrationError) {
      // Ignore if collection doesn't exist or index already dropped
      if (migrationError.code !== 26 && migrationError.code !== 27) {
        console.log('⚠️ Index migration note:', migrationError.message);
      }
    }
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

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
