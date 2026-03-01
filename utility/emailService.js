const nodemailer = require('nodemailer');
const dns = require('dns');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ EMAIL_USER or EMAIL_PASS environment variables are missing!');
} else {
    console.log('✅ Email credentials detected');
}

const sendOtpEmail = async (email, otp, subject = 'Your OTP', title = 'Verification Code') => {
    console.log(`📧 Attempting to send ${subject} to: ${email}...`);
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: subject,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2>${title}</h2>
                <p>Your One-Time Password (OTP) is:</p>
                <h1 style="color: #2697FF; letter-spacing: 5px;">${otp}</h1>
                <p>This OTP is valid for 5 minutes.</p>
                <p>If you didn't request this code, please ignore this email.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${email} with subject: ${subject}`);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

module.exports = { sendOtpEmail };
