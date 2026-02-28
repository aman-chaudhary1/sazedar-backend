const admin = require("firebase-admin");

let isFirebaseInitialized = false;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    isFirebaseInitialized = true;
    console.log("✅ Firebase Admin initialized successfully");
  } catch (error) {
    console.error("❌ Firebase Admin initialization failed:", error.message);
  }
} else {
  console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT is not set. Push notifications will be disabled.");
}

admin.isInitialized = isFirebaseInitialized;
module.exports = admin;
