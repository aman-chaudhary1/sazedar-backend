const axios = require('axios');

if (!process.env.BREVO_API_KEY) {
    console.warn('⚠️ BREVO_API_KEY environment variable is missing! OTP emails will fail.');
} else {
    console.log('✅ Brevo API Key detected');
}

const sendOtpEmail = async (email, otp, subject = 'Your OTP', title = 'Verification Code') => {
    console.log(`📧 Attempting to send ${subject} to: ${email} via Brevo HTTP API...`);

    const url = 'https://api.brevo.com/v3/smtp/email';

    const data = {
        sender: {
            name: "Sazedar MultiGrocery",
            email: process.env.EMAIL_USER || "amanchaudhary4510@gmail.com"
        },
        to: [{ email: email }],
        subject: subject,
        htmlContent: `
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
        // Mask the API key for logging to help troubleshoot
        const key = process.env.BREVO_API_KEY || '';
        const maskedKey = key.length > 10 ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}` : 'INVALID_LENGTH';
        console.log(`🔑 Using Brevo API Key: ${maskedKey}`);

        const response = await axios.post(url, data, {
            headers: {
                'api-key': process.env.BREVO_API_KEY,
                'x-sib-api-key': process.env.BREVO_API_KEY, // Compatibility header
                'Content-Type': 'application/json'
            }
        });

        console.log(`✅ OTP email sent successfully via Brevo to ${email}. Message ID: ${response.data.messageId}`);
        return true;
    } catch (error) {
        if (error.response && error.response.data) {
            console.error('❌ Brevo API Error:', error.response.data);
            if (error.response.data.code === 'unauthorized') {
                console.error('💡 TIP: Make sure you are using an "API Key" and NOT a "SMTP Password". API Keys start with "xkeysib-".');
            }
        } else {
            console.error('❌ Error sending email via Brevo:', error.message);
        }
        return false;
    }
};

module.exports = { sendOtpEmail };
