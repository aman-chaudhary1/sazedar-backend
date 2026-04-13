const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./model/user');

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;

async function fixSpecificAdmin() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URL);
        console.log('✅ Connected.');

        const email = 'manuragn@gmail.com';
        
        console.log(`Searching for user: ${email}...`);
        const user = await User.findOne({ email: email });

        if (user) {
            console.log(`Found user: ${user.name}. Current role: ${user.role || 'MISSING'}`);
            
            // Set as admin
            user.role = 'admin';
            user.userStatus = 'active'; // Ensure they are active too
            await user.save();
            
            console.log(`🚀 SUCCESS: ${email} is now an ADMIN.`);
        } else {
            console.log(`❌ User ${email} not found. Promoting first available user instead...`);
            const firstUser = await User.findOne();
            if (firstUser) {
                firstUser.role = 'admin';
                await firstUser.save();
                console.log(`🚀 SUCCESS: promoted ${firstUser.email} to ADMIN.`);
            }
        }

        // Also fix any other users that have no role
        const result = await User.updateMany(
            { role: { $exists: false } },
            { $set: { role: 'user' } }
        );
        console.log(`🛠️ Fixed ${result.modifiedCount} other users who were missing a role.`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

fixSpecificAdmin();
