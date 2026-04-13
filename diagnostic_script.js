const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./model/product');
const Category = require('./model/category');
const Order = require('./model/order');

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;

async function checkDatabase() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URL);
        console.log('✅ Connected to:', mongoose.connection.name);

        const productCount = await Product.countDocuments();
        const categoryCount = await Category.countDocuments();
        const orderCount = await Order.countDocuments();

        console.log('---------------------------');
        console.log(`📊 DB Name:    ${mongoose.connection.name}`);
        console.log(`📊 Categories: ${categoryCount}`);
        console.log(`📊 Products:   ${productCount}`);
        console.log(`📊 Orders:     ${orderCount}`);
        console.log('---------------------------');

        if (productCount > 0) {
            const sample = await Product.findOne();
            console.log('✅ Sample Product:', sample.name, 'Status:', sample.status);
            console.log('✅ Sample Category ID:', sample.proCategoryId);
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

checkDatabase();
