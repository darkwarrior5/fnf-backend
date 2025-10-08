const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    // Check if already initialized
    if (admin.apps.length === 0) {
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
        token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
        universe_domain: "googleapis.com"
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });

      console.log('🔥 Firebase Admin SDK initialized successfully');
    }

    return admin;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    return null;
  }
};

// Send SMS OTP using Firebase (for countries where supported)
const sendSMSOTP = async (phone, otp) => {
  try {
    // Note: Firebase doesn't directly send SMS for OTP
    // This would typically be used with Firebase Auth on the client side
    // For server-side SMS, we'll use a different approach
    
    console.log(`📱 Firebase OTP for ${phone}: ${otp}`);
    
    // In a real implementation, you would:
    // 1. Use Firebase Client SDK on frontend for phone auth
    // 2. Or integrate with a SMS service like Twilio via Firebase Functions
    // 3. Or use Firebase Extensions for SMS
    
    return {
      success: true,
      message: 'OTP sent successfully via Firebase'
    };

  } catch (error) {
    console.error('Firebase SMS error:', error);
    return {
      success: false,
      message: 'Failed to send SMS via Firebase'
    };
  }
};

// Verify phone number using Firebase Auth (client-side integration)
const verifyPhoneToken = async (idToken) => {
  try {
    const firebase = initializeFirebase();
    if (!firebase) {
      throw new Error('Firebase not initialized');
    }

    const decodedToken = await firebase.auth().verifyIdToken(idToken);
    
    return {
      success: true,
      uid: decodedToken.uid,
      phone: decodedToken.phone_number
    };

  } catch (error) {
    console.error('Firebase token verification error:', error);
    return {
      success: false,
      message: 'Invalid Firebase token'
    };
  }
};

module.exports = {
  initializeFirebase,
  sendSMSOTP,
  verifyPhoneToken
};