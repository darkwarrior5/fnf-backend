const twilio = require('twilio');

class TwilioVerifyService {
    constructor() {
        this.accountSid = process.env.TWILIO_ACCOUNT_SID;
        this.authToken = process.env.TWILIO_AUTH_TOKEN;
        this.verifySid = process.env.TWILIO_VERIFY_SID;
        
        if (this.accountSid && this.authToken) {
            this.client = twilio(this.accountSid, this.authToken);
        }
    }

    /**
     * Send OTP verification code via Twilio Verify
     * @param {string} mobile - Mobile number (10 digits, without country code)
     * @returns {Promise<Object>} - API response
     */
    async sendVerification(mobile) {
        try {
            console.log('📞 Twilio: Sending verification to', mobile);
            
            if (!this.client) {
                throw new Error('Twilio not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.');
            }

            if (!this.verifySid) {
                throw new Error('TWILIO_VERIFY_SID not configured.');
            }

            // Format mobile number (ensure it starts with +91 for India)
            const formattedMobile = mobile.replace(/\D/g, '').slice(-10);
            
            if (formattedMobile.length !== 10) {
                throw new Error('Invalid mobile number format');
            }

            const phoneNumber = `+91${formattedMobile}`;

            console.log('📡 Twilio: Sending to', phoneNumber);

            // Send verification code via Twilio Verify
            const verification = await this.client.verify.v2
                .services(this.verifySid)
                .verifications
                .create({
                    to: phoneNumber,
                    channel: 'sms'
                });

            console.log('✅ Twilio Verification sent:', verification.sid);

            return {
                success: true,
                message: 'Verification code sent successfully',
                verificationSid: verification.sid,
                status: verification.status,
                to: verification.to
            };

        } catch (error) {
            console.error('❌ Twilio Verification Error:', error.message);
            
            // Handle Twilio specific errors
            if (error.code) {
                console.error('🔢 Twilio Error Code:', error.code);
                return {
                    success: false,
                    message: this.getTwilioErrorMessage(error.code),
                    errorCode: error.code,
                    error: error.message
                };
            }
            
            return {
                success: false,
                message: error.message || 'Failed to send verification code',
                error: error.message
            };
        }
    }

    /**
     * Verify OTP code via Twilio Verify
     * @param {string} mobile - Mobile number (10 digits, without country code)
     * @param {string} code - Verification code entered by user
     * @returns {Promise<Object>} - Verification result
     */
    async verifyCode(mobile, code) {
        try {
            console.log('🔍 Twilio: Verifying code for', mobile);
            
            if (!this.client) {
                throw new Error('Twilio not configured');
            }

            if (!this.verifySid) {
                throw new Error('TWILIO_VERIFY_SID not configured');
            }

            // Format mobile number
            const formattedMobile = mobile.replace(/\D/g, '').slice(-10);
            const phoneNumber = `+91${formattedMobile}`;

            // Verify the code
            const verificationCheck = await this.client.verify.v2
                .services(this.verifySid)
                .verificationChecks
                .create({
                    to: phoneNumber,
                    code: code
                });

            console.log('📋 Twilio Verification result:', verificationCheck.status);

            if (verificationCheck.status === 'approved') {
                return {
                    success: true,
                    message: 'Phone number verified successfully',
                    status: verificationCheck.status,
                    verificationSid: verificationCheck.sid
                };
            } else {
                return {
                    success: false,
                    message: 'Invalid verification code',
                    status: verificationCheck.status
                };
            }

        } catch (error) {
            console.error('❌ Twilio Verification Check Error:', error.message);
            
            if (error.code) {
                console.error('🔢 Twilio Error Code:', error.code);
                return {
                    success: false,
                    message: this.getTwilioErrorMessage(error.code),
                    errorCode: error.code,
                    error: error.message
                };
            }
            
            return {
                success: false,
                message: error.message || 'Failed to verify code',
                error: error.message
            };
        }
    }

    /**
     * Get user-friendly error messages for Twilio error codes
     * @param {number} errorCode - Twilio error code
     * @returns {string} - User-friendly error message
     */
    getTwilioErrorMessage(errorCode) {
        const errorMessages = {
            20003: 'Authentication failed - check your credentials',
            20404: 'The requested resource was not found',
            60200: 'Invalid phone number format',
            60202: 'Max verification attempts reached for this number',
            60203: 'Max verification checks reached for this service',
            60205: 'SMS is not supported for this phone number',
            60212: 'Too many verification attempts',
            60223: 'Invalid verification code',
            60200: 'Invalid phone number',
            21211: 'Invalid phone number',
            21614: 'Phone number is not a valid mobile number'
        };

        return errorMessages[errorCode] || 'Verification service error. Please try again.';
    }

    /**
     * Check if Twilio Verify is properly configured
     * @returns {boolean} - Whether Twilio is configured
     */
    isConfigured() {
        return !!(this.accountSid && this.authToken && this.verifySid);
    }

    /**
     * Get Twilio account information
     * @returns {Promise<Object>} - Account information
     */
    async getAccountInfo() {
        try {
            if (!this.client) {
                throw new Error('Twilio not configured');
            }

            const account = await this.client.api.accounts(this.accountSid).fetch();
            
            return {
                success: true,
                account: {
                    sid: account.sid,
                    friendlyName: account.friendlyName,
                    status: account.status,
                    type: account.type
                }
            };

        } catch (error) {
            return {
                success: false,
                message: 'Failed to fetch account information',
                error: error.message
            };
        }
    }

    /**
     * Get Verify service information
     * @returns {Promise<Object>} - Verify service information
     */
    async getVerifyServiceInfo() {
        try {
            if (!this.client || !this.verifySid) {
                throw new Error('Twilio Verify not configured');
            }

            const service = await this.client.verify.v2
                .services(this.verifySid)
                .fetch();
            
            return {
                success: true,
                service: {
                    sid: service.sid,
                    friendlyName: service.friendlyName,
                    codeLength: service.codeLength,
                    lookupEnabled: service.lookupEnabled,
                    skipSmsToLandlines: service.skipSmsToLandlines
                }
            };

        } catch (error) {
            return {
                success: false,
                message: 'Failed to fetch Verify service info',
                error: error.message
            };
        }
    }
}

module.exports = new TwilioVerifyService();