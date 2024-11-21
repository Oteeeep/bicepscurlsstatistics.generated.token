const admin = require('firebase-admin');
const serviceAccount = require('./config/firebase-admin-sdk-key.json');  // Path to your Firebase Admin SDK key
const express = require('express');
const app = express();

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Function to generate a custom token
async function generateCustomToken(uid) {
    try {
        const customToken = await admin.auth().createCustomToken(uid);
        console.log("Custom token generated:", customToken);
        return customToken;
    } catch (error) {
        console.log("Error creating custom token:", error);
        throw error;
    }
}

// Function to send custom token via FCM
async function sendCustomTokenToDevice(fcmToken, customToken) {
    const message = {
        data: {
            token: customToken, // Firebase custom token generated
        },
        token: fcmToken, // FCM token of the device to receive the message
    };

    try {
        const response = await admin.messaging().send(message);
        console.log("Successfully sent message:", response);
    } catch (error) {
        console.error("Error sending message:", error);
    }
}

// Define route to generate token dynamically and send to device
app.get('/generateToken', async (req, res) => {
    const uid = req.query.uid;  // UID sent as a query parameter
    const fcmToken = req.query.fcmToken;  // FCM token for the target device

    if (!uid || !fcmToken) {
        return res.status(400).json({ error: "UID and FCM token are required" });
    }

    try {
        const customToken = await generateCustomToken(uid);
        await sendCustomTokenToDevice(fcmToken, customToken); // Send custom token to device via FCM
        res.json({ token: customToken, message: 'Token sent to device via FCM' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start Express server
app.listen(3000, () => {
    console.log("Server running on port 3000");
});
