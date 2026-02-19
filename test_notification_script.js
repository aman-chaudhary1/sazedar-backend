const axios = require('axios');

// API Endpoint
const API_URL = 'http://localhost:3000/notification/send-notification';

const notificationData = {
    title: "Test Notification 🔔",
    description: "This is a test notification sent from the verification script! " + new Date().toLocaleTimeString(),
    imageUrl: "https://cdn-icons-png.flaticon.com/512/3119/3119338.png",
    // userId: "66145..." // OPTIONAL: Uncomment and replace with a User ID from MongoDB to test specific user delivery
};

async function sendNotification() {
    try {
        console.log(`Sending notification to ${API_URL}...`);
        console.log(`Payload:`, notificationData);

        const response = await axios.post(API_URL, notificationData);

        console.log("\n✅ Success! Response from server:");
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error("\n❌ Error sending notification:");
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data:`, error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

sendNotification();
