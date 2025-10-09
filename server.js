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

// Check Twilio configuration endpoint
app.get('/api/verify/config', (req, res) => {
  res.json({
    success: true,
    configured: twilioVerifyService.isConfigured(),
    message: twilioVerifyService.isConfigured() ? 'Twilio Verify is configured' : 'Twilio Verify not configured'
  });
});

// Get Twilio account info (admin only)
app.get('/api/verify/account', async (req, res) => {
  try {
    const result = await twilioVerifyService.getAccountInfo();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch account info',
      error: error.message
    });
  }
});

// Debug endpoint to check credentials format
app.get('/api/verify/debug', async (req, res) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const verifySid = process.env.TWILIO_VERIFY_SID;
    
    res.json({
      success: true,
      debug: {
        hasAccountSid: !!accountSid,
        accountSidLength: accountSid ? accountSid.length : 0,
        accountSidPrefix: accountSid ? accountSid.substring(0, 5) + '...' : null,
        hasAuthToken: !!authToken,
        authTokenLength: authToken ? authToken.length : 0,
        hasVerifySid: !!verifySid,
        verifySidLength: verifySid ? verifySid.length : 0,
        verifySidPrefix: verifySid ? verifySid.substring(0, 5) + '...' : null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Debug check failed',
      error: error.message
    });
  }
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
    message: 'FNF Backend API is running with Firebase OTP!',
    version: '2.0.0',
    provider: 'Firebase',
    endpoints: {
      auth: '/api/auth',
      orders: '/api/orders',
      customers: '/api/customers',
      firebaseStatus: '/api/firebase/status'
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


