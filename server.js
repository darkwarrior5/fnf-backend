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

// Twilio Verify Service
const twilioVerifyService = require('./services/twilioVerifyService');

// Send verification code endpoint
app.post('/api/send-verification', async (req, res) => {
  try {
    const { phone } = req.body;

    // Validate input
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Check if Twilio is configured
    if (!twilioVerifyService.isConfigured()) {
      return res.status(500).json({
        success: false,
        message: 'Twilio Verify not configured. Please set TWILIO credentials in environment variables.'
      });
    }

    // Send verification code via Twilio
    const result = await twilioVerifyService.sendVerification(phone);

    res.json(result);

  } catch (error) {
    console.error('❌ Send Verification Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification code',
      error: error.message
    });
  }
});

// Verify code endpoint
app.post('/api/verify-code', async (req, res) => {
  try {
    const { phone, code } = req.body;

    // Validate inputs
    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and verification code are required'
      });
    }

    // Check if Twilio is configured
    if (!twilioVerifyService.isConfigured()) {
      return res.status(500).json({
        success: false,
        message: 'Twilio Verify not configured'
      });
    }

    // Verify code via Twilio
    const result = await twilioVerifyService.verifyCode(phone, code);

    res.json(result);

  } catch (error) {
    console.error('❌ Verify Code Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify code',
      error: error.message
    });
  }
});

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
      verifyConfig: '/api/verify/config'
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


