const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./model/user');
const bcrypt = require('bcryptjs');

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;

async function setupAdmin() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URL);
        console.log('✅ Connected.');

        const adminEmail = 'admin@admin.com';
        const adminPass = 'admin123';
        
        console.log(`Searching for admin user: ${adminEmail}...`);
        let adminUser = await User.findOne({ email: adminEmail });

        if (adminUser) {
            console.log(`Found user: ${adminUser.name}. Current role: ${adminUser.role || 'NONE'}`);
            adminUser.role = 'admin';
            adminUser.userStatus = 'active';
            await adminUser.save();
            console.log(`🚀 SUCCESS: ${adminEmail} is now an ADMIN.`);
        } else {
            console.log(`⚠️ Admin user ${adminEmail} NOT FOUND in database. Creating it now...`);
            
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminPass, salt);
            
            adminUser = new User({
                name: 'System Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                userStatus: 'active'
            });
            
            await adminUser.save();
            console.log(`🚀 SUCCESS: Created new Admin user: ${adminEmail}`);
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

setupAdmin();
