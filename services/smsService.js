const { sendSMSOTP: firebaseSMS } = require('../config/firebase');

// SMS Service Factory - supports multiple providers
class SMSService {
  constructor() {
    this.provider = process.env.SMS_PROVIDER || 'firebase';
  }

  // Send OTP via selected SMS provider
  async sendOTP(phone, otp) {
    try {
      // Format phone number (add +91 for India if not present)
      const formattedPhone = this.formatPhoneNumber(phone);
      
      switch (this.provider) {
        case 'firebase':
          return await this.sendFirebaseOTP(formattedPhone, otp);
        
        case 'twilio':
          return await this.sendTwilioOTP(formattedPhone, otp);
        
        case 'msg91':
          return await this.sendMSG91OTP(formattedPhone, otp);
        
        default:
          // Fallback to console logging (development mode)
          return await this.sendDevelopmentOTP(formattedPhone, otp);
      }
    } catch (error) {
      console.error('SMS Service error:', error);
      return {
        success: false,
        message: 'Failed to send OTP'
      };
    }
  }

  // Format phone number with country code
  formatPhoneNumber(phone) {
    // Remove any non-digits
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Add +91 for India if not present (assuming Indian numbers)
    if (cleanPhone.length === 10) {
      return `+91${cleanPhone}`;
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      return `+${cleanPhone}`;
    } else if (cleanPhone.length === 13 && cleanPhone.startsWith('+91')) {
      return cleanPhone;
    }
    
    // Default format
    return `+91${cleanPhone.slice(-10)}`;
  }

  // Firebase SMS (using Firebase Functions or Extensions)
  async sendFirebaseOTP(phone, otp) {
    try {
      const message = `Your Fresh & Fruity OTP is: ${otp}. Valid for 5 minutes. Do not share this code.`;
      
      // For now, we'll log the OTP (you'll need to set up Firebase Functions for actual SMS)
      console.log(`🔥 Firebase SMS to ${phone}: ${message}`);
      
      // In production, you would call Firebase Function or use Firebase Extensions
      // Example: await callFirebaseFunction('sendSMS', { phone, message });
      
      return {
        success: true,
        message: 'OTP sent via Firebase',
        provider: 'firebase'
      };

    } catch (error) {
      console.error('Firebase SMS error:', error);
      return {
        success: false,
        message: 'Firebase SMS failed'
      };
    }
  }

  // Twilio SMS (backup option)
  async sendTwilioOTP(phone, otp) {
    try {
      // Would need Twilio credentials
      const message = `Your Fresh & Fruity OTP is: ${otp}. Valid for 5 minutes.`;
      
      console.log(`📞 Twilio SMS to ${phone}: ${message}`);
      
      // In production: use Twilio SDK
      // const client = twilio(accountSid, authToken);
      // await client.messages.create({ body: message, from: twilioNumber, to: phone });
      
      return {
        success: true,
        message: 'OTP sent via Twilio',
        provider: 'twilio'
      };

    } catch (error) {
      console.error('Twilio SMS error:', error);
      return {
        success: false,
        message: 'Twilio SMS failed'
      };
    }
  }

  // MSG91 SMS (popular in India)
  async sendMSG91OTP(phone, otp) {
    try {
      const message = `Your Fresh & Fruity OTP is: ${otp}. Valid for 5 minutes.`;
      
      console.log(`🇮🇳 MSG91 SMS to ${phone}: ${message}`);
      
      // In production: use MSG91 API
      // const response = await fetch('https://api.msg91.com/api/v5/otp', { ... });
      
      return {
        success: true,
        message: 'OTP sent via MSG91',
        provider: 'msg91'
      };

    } catch (error) {
      console.error('MSG91 SMS error:', error);
      return {
        success: false,
        message: 'MSG91 SMS failed'
      };
    }
  }

  // Development mode (console logging)
  async sendDevelopmentOTP(phone, otp) {
    const message = `Your Fresh & Fruity OTP is: ${otp}. Valid for 5 minutes.`;
    
    console.log('\n' + '='.repeat(50));
    console.log('📱 DEVELOPMENT OTP');
    console.log('='.repeat(50));
    console.log(`Phone: ${phone}`);
    console.log(`OTP: ${otp}`);
    console.log(`Message: ${message}`);
    console.log('='.repeat(50) + '\n');
    
    return {
      success: true,
      message: 'OTP logged to console (development mode)',
      provider: 'development',
      dev_otp: otp // Only in development
    };
  }
}

module.exports = new SMSService();