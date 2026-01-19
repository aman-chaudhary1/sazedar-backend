const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const User = require('../model/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/authMiddleware');
const Order = require('../model/order');
const Address = require('../model/address');
const multer = require('multer');
const { uploadUserProfile } = require('../uploadFile');
const cloudinary = require('../config/cloudinary');

// Get all users
router.get('/', asyncHandler(async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({ success: true, message: "Users retrieved successfully.", data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// User Signup/Register with profile image
router.post('/register', (req, res, next) => {
    const contentType = req.headers['content-type'] || '';
    
    // Only use multer if it's multipart/form-data
    if (contentType.includes('multipart/form-data')) {
        // Use any() to accept any file fields - more permissive
        uploadUserProfile.any()(req, res, (err) => {
            if (err) {
                if (err instanceof multer.MulterError) {
                    // Handle multer-specific errors
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return res.status(400).json({ success: false, message: 'File size is too large. Maximum filesize is 5MB.' });
                    }
                    // Log multer errors but continue (image is optional)
                    console.log('Multer warning:', err.code, err.message);
                    return next();
                } else {
                    // Handle other errors (like file type validation errors)
                    if (err.message && err.message.includes('Only image files')) {
                        return res.status(400).json({ success: false, message: err.message });
                    }
                    // For other errors, log and continue (image is optional)
                    console.log('Multer warning:', err.message);
                    return next();
                }
            }
            // Extract profileImage file from req.files
            if (req.files) {
                // Debug: Log what we received
                console.log('📁 req.files type:', Array.isArray(req.files) ? 'Array' : typeof req.files);
                console.log('📁 req.files content:', Array.isArray(req.files) 
                    ? req.files.map(f => ({ fieldname: f.fieldname, originalname: f.originalname }))
                    : Object.keys(req.files));
                
                let profileImageFile = null;
                
                // Handle array format (from .any())
                if (Array.isArray(req.files) && req.files.length > 0) {
                    // Try to find exact match first (trim to handle tab/whitespace issues)
                    profileImageFile = req.files.find(file => 
                        file.fieldname && file.fieldname.trim() === 'profileImage'
                    );
                    // If not found, use first file
                    if (!profileImageFile && req.files.length > 0) {
                        profileImageFile = req.files[0];
                        console.log('⚠️ Using first file as profileImage (fieldname:', profileImageFile.fieldname.trim(), ')');
                    }
                } 
                // Handle object format (from .fields() or .single())
                else if (req.files.profileImage) {
                    profileImageFile = Array.isArray(req.files.profileImage) 
                        ? req.files.profileImage[0] 
                        : req.files.profileImage;
                }
                // Handle single file format
                else if (req.file) {
                    profileImageFile = req.file;
                }
                
                if (profileImageFile) {
                    req.file = profileImageFile;
                    console.log('✅ Profile image extracted:', req.file.originalname, req.file.mimetype, (req.file.size / 1024).toFixed(2) + 'KB');
                } else {
                    console.log('ℹ️ No profile image file could be extracted');
                }
            } else {
                console.log('ℹ️ req.files is undefined or null');
            }
            // No error, continue to next middleware
            next();
        });
    } else {
        // Not form-data, skip multer
        next();
    }
}, asyncHandler(async (req, res) => {
    const { name, email, password, phoneNo } = req.body;
    
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "Name, email, and password are required." });
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User with this email already exists." });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Upload profile image to Cloudinary if provided
        let profileImageUrl = null;
        if (req.file) {
            console.log('Uploading profile image to Cloudinary...');
            try {
                // Convert buffer to data URI format (same as poster route)
                const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
                const result = await cloudinary.uploader.upload(dataUri, {
                    folder: 'user-profiles',
                    resource_type: 'image',
                });
                profileImageUrl = result.secure_url;
                console.log('✅ Profile image uploaded successfully:', profileImageUrl);
            } catch (uploadError) {
                console.error("❌ Error uploading profile image to Cloudinary:", uploadError.message);
                // Continue without profile image if upload fails
            }
        } else {
            console.log('No profile image file to upload');
        }

        // Create new user
        const user = new User({ 
            name, 
            email, 
            password: hashedPassword,
            phoneNo: phoneNo || null,
            profileImage: profileImageUrl
        });
        
        const newUser = await user.save();
        
        // Generate JWT token
        const token = jwt.sign(
            { id: newUser._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '30d' }
        );

        res.json({ 
            success: true, 
            message: "User created successfully.", 
            data: {
                user: {
                    id: newUser._id,
                    name: newUser.name,
                    email: newUser.email,
                    phoneNo: newUser.phoneNo,
                    profileImage: newUser.profileImage
                },
                token
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Email already exists." });
        }
        res.status(500).json({ success: false, message: error.message });
    }
}));

// User Login
router.post('/login', asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    try {
        // Check if the user exists
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid email or password." });
        }

        // Check if the password is correct
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: "Invalid email or password." });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '30d' }
        );

        // Authentication successful
        res.status(200).json({ 
            success: true, 
            message: "Login successful.",
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phoneNo: user.phoneNo,
                    profileImage: user.profileImage
                },
                token
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Get user profile with orders, cart, favorites, and address (MUST be before /:id route)
router.get('/profile', auth, asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;

        // Get user details
        const user = await User.findById(userId).select('-password');
        
        // Get user orders
        const orders = await Order.find({ userID: userId })
            .populate('couponCode', 'id couponCode discountType discountAmount')
            .populate('items.productID', 'name price offerPrice images')
            .sort({ _id: -1 });

        // Get user addresses (multiple addresses support)
        const addresses = await Address.find({ userId: userId })
            .sort({ isDefault: -1, createdAt: -1 });

        // Get user cart
        const Cart = require('../model/cart');
        let cart = await Cart.findOne({ userId: userId })
            .populate('items.productId', 'name price offerPrice images');
        if (!cart) {
            cart = { items: [] };
        }

        // Get user favorites
        const Favorite = require('../model/favorite');
        const favorites = await Favorite.find({ userId: userId })
            .populate('productId', 'name price offerPrice images todaysSpecial');

        res.json({
            success: true,
            message: "User profile retrieved successfully.",
            data: {
                user,
                orders: orders || [],
                cart: cart,
                favorites: favorites || [],
                addresses: addresses || []
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Get a user by ID (MUST be after /profile route)
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const userID = req.params.id;
        const user = await User.findById(userID);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        res.json({ success: true, message: "User retrieved successfully.", data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Update a user (authenticated users can update their own profile) with profile image
router.put('/profile', auth, (req, res, next) => {
    // Handle multer middleware with comprehensive error handling
    uploadUserProfile.single('profileImage')(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                // Handle multer-specific errors
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ success: false, message: 'File size is too large. Maximum filesize is 5MB.' });
                }
                // For "Unexpected field" or other multer errors, log and continue (image is optional)
                if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.message?.includes('Unexpected field')) {
                    console.log('Multer: Image field not found or unexpected field - continuing without image');
                    return next();
                }
                // Log other multer errors but continue (image is optional)
                console.log('Multer warning:', err.message);
                return next();
            } else {
                // Handle other errors (like file type validation errors)
                if (err.message && err.message.includes('Only image files')) {
                    return res.status(400).json({ success: false, message: err.message });
                }
                // For other errors, log and continue (image is optional)
                console.log('Multer warning:', err.message);
                return next();
            }
        }
        // No error, continue to next middleware
        next();
    });
}, asyncHandler(async (req, res) => {
    try {
        const { name, email, phoneNo, password } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        // Update fields if provided
        if (name) user.name = name;
        if (email) {
            // Check if email is already taken by another user
            const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
            if (existingUser) {
                return res.status(400).json({ success: false, message: "Email already exists." });
            }
            user.email = email;
        }
        if (phoneNo !== undefined) user.phoneNo = phoneNo;
        
        // Update password if provided
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        // Update profile image if provided
        if (req.file) {
            try {
                // Delete old image from Cloudinary if exists
                if (user.profileImage) {
                    const publicId = user.profileImage.split('/').pop().split('.')[0];
                    await cloudinary.uploader.destroy(`user-profiles/${publicId}`).catch(() => {
                        // Ignore errors if image doesn't exist in Cloudinary
                    });
                }

                // Upload new image using data URI format
                const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
                const result = await cloudinary.uploader.upload(dataUri, {
                    folder: 'user-profiles',
                    resource_type: 'image',
                });
                user.profileImage = result.secure_url;
            } catch (uploadError) {
                console.error("Error uploading profile image:", uploadError);
                return res.status(500).json({ success: false, message: "Failed to upload profile image." });
            }
        }

        await user.save();

        res.json({ 
            success: true, 
            message: "User updated successfully.", 
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                phoneNo: user.phoneNo,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Email already exists." });
        }
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Change Password
router.put('/change-password', auth, asyncHandler(async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        // Validation
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: "Old password and new password are required." 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: "New password must be at least 6 characters long." 
            });
        }

        // Get user with password
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found." 
            });
        }

        // Verify old password
        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isOldPasswordValid) {
            return res.status(400).json({ 
                success: false, 
                message: "Old password is incorrect." 
            });
        }

        // Check if new password is same as old password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({ 
                success: false, 
                message: "New password must be different from old password." 
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        user.password = hashedNewPassword;
        await user.save();

        res.json({ 
            success: true, 
            message: "Successfully changed password",
            data: {
                message: "Password has been changed successfully"
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Delete a user
router.delete('/:id', asyncHandler(async (req, res) => {
    try {
        const userID = req.params.id;
        const deletedUser = await User.findByIdAndDelete(userID);
        if (!deletedUser) {
            return res.status(404).json({ success: false, message: "User not found." });
        }
        res.json({ success: true, message: "User deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

module.exports = router;
