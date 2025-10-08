# Firebase SMS OTP Setup Guide

This guide will help you set up real SMS OTP using Firebase Phone Authentication.

## Step 1: Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing project
3. Enable **Authentication** service
4. Go to **Authentication > Sign-in method**
5. Enable **Phone** authentication
6. Add your domain to authorized domains

## Step 2: Firebase Service Account

1. Go to **Project Settings > Service accounts**
2. Click **Generate new private key**
3. Download the JSON file
4. Copy the values to your `.env` file:

```env
FIREBASE_PROJECT_ID=your-project-id-here
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com
```

## Step 3: Consumer App Firebase Config

Add to your consumer app's Firebase configuration:

```javascript
// firebase-config.js
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## Step 4: Phone Authentication Flow

### Option A: Client-Side Firebase Auth (Recommended)
- Use Firebase SDK on frontend
- Handle reCAPTCHA verification
- Send ID token to backend for verification

### Option B: Server-Side SMS (Current Implementation)
- Use SMS service providers (Twilio, MSG91, etc.)
- Backend generates and sends OTP
- Standard OTP verification flow

## Step 5: Production Deployment

1. Add your production domain to Firebase authorized domains
2. Set up proper SMS provider credentials
3. Update CORS settings for production
4. Set NODE_ENV=production

## Quick Start for Development

1. For now, the system will log OTP to console
2. Use the logged OTP to test authentication
3. Set up real SMS provider when ready for production

## SMS Provider Options

### Firebase Functions (Recommended)
- Create Firebase Function to send SMS
- Use Twilio/SendGrid with Firebase Functions
- Most secure and scalable

### Direct Integration
- Twilio: Easy to setup, reliable
- MSG91: Popular in India, cost-effective
- AWS SNS: Good for AWS ecosystem

## Testing

1. Start the backend: `npm run dev`
2. Open consumer app in browser
3. Try registering with your phone number
4. Check console for OTP
5. Use the OTP to complete registration

## Security Notes

- Never expose Firebase private keys in frontend
- Use environment variables for all credentials
- Implement rate limiting for OTP requests
- Set proper CORS origins
- Use HTTPS in production