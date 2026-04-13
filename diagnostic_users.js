const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./model/user');

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;

async function checkUsers() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URL);
        console.log('✅ Connected.');

        const userCount = await User.countDocuments();
        const admins = await User.find({ role: 'admin' }).select('name email role');
        const shopkeepers = await User.find({ role: 'shopkeeper' }).countDocuments();

        console.log('---------------------------');
        console.log(`📊 Total Users:  ${userCount}`);
        console.log(`📊 Admins:       ${admins.length}`);
        console.log(`📊 Shopkeepers: ${shopkeepers}`);
        console.log('---------------------------');

        if (admins.length > 0) {
            console.log('✅ Admins found:');
            admins.forEach(a => console.log(`   - ${a.name} (${a.email})`));
        } else {
            console.log('⚠️  CRITICAL: No Admin users found in database!');
            const firstUser = await User.findOne().select('name email role');
            if (firstUser) {
                console.log(`💡 Suggestion: Update user "${firstUser.email}" to role: "admin"`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

checkUsers();
