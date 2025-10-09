require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8000',
    'http://localhost:8080',
    'http://127.0.0.1:8000',
    'http://127.0.0.1:8080',
    'https://fnf-admin.netlify.app',
    'https://fnf-consumer.netlify.app',
    'https://fnf-consumer.onrender.com'
  ],
  credentials: true
}));

// Security headers for better browser compatibility
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:8000',
    'http://localhost:8080',
    'http://127.0.0.1:8000',
    'http://127.0.0.1:8080',
    'https://fnf-admin.netlify.app',
    'https://fnf-consumer.netlify.app',
    'https://fnf-consumer.onrender.com'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

app.use(morgan('dev'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB Connected Successfully!');
  console.log(`📊 Database: ${mongoose.connection.name}`);
})
.catch((err) => {
  console.error('❌ MongoDB Connection Error:', err.message);
  process.exit(1);
});

// Import Routes
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const customerRoutes = require('./routes/customers');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);

// Firebase SMS OTP Service (Restored)
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log('✅ Firebase Admin initialized successfully!');
}

// Firebase OTP SMS endpoints
app.post('/api/send-verification', async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
        received: req.body
      });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP temporarily (in production, use Redis or database)
    // For now, we'll use a simple in-memory store
    global.otpStore = global.otpStore || {};
    global.otpStore[phoneNumber] = {
      otp: otp,
      timestamp: Date.now(),
      attempts: 0
    };

    // In a real Firebase implementation, this would send an SMS
    // For now, we'll return success with the OTP for testing
    console.log(`📱 OTP for ${phoneNumber}: ${otp}`);
    
    res.json({
      success: true,
      message: 'Verification code sent successfully',
      // Remove this in production - only for testing
      otp: otp
    });
  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification code',
      error: error.message
    });
  }
});

app.post('/api/verify-code', async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;
    
    if (!phoneNumber || !code) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and verification code are required'
      });
    }

    const stored = global.otpStore?.[phoneNumber];
    
    if (!stored) {
      return res.status(400).json({
        success: false,
        message: 'No verification code found for this phone number'
      });
    }

    // Check if OTP is expired (5 minutes)
    const isExpired = Date.now() - stored.timestamp > 5 * 60 * 1000;
    
    if (isExpired) {
      delete global.otpStore[phoneNumber];
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired'
      });
    }

    // Check if code matches
    if (stored.otp !== code) {
      stored.attempts += 1;
      
      if (stored.attempts >= 3) {
        delete global.otpStore[phoneNumber];
        return res.status(400).json({
          success: false,
          message: 'Too many failed attempts. Please request a new code.'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Success - clean up
    delete global.otpStore[phoneNumber];
    
    res.json({
      success: true,
      message: 'Phone number verified successfully'
    });
  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify code',
      error: error.message
    });
  }
});

// Check Firebase configuration endpoint
app.get('/api/verify/config', (req, res) => {
  const isConfigured = !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY);
  res.json({
    success: true,
    configured: isConfigured,
    provider: 'Firebase',
    message: isConfigured ? 'Firebase is configured' : 'Firebase not configured'
  });
});

// Firebase OTP Status Check
app.get('/api/firebase/status', (req, res) => {
  try {
    const isConfigured = !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY);
    
    res.json({
      success: true,
      firebase: {
        configured: isConfigured,
        projectId: process.env.FIREBASE_PROJECT_ID || 'Not set',
        message: isConfigured ? 'Firebase is configured and ready' : 'Firebase configuration incomplete'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Firebase status check failed',
      error: error.message
    });
  }
});

// Health Check Route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'FNF Backend API is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      orders: '/api/orders',
      customers: '/api/customers',
      sendVerification: '/api/send-verification',
      verifyCode: '/api/verify-code',
      verifyConfig: '/api/verify/config',
      verifyDebug: '/api/verify/debug'
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 API URL: http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;


