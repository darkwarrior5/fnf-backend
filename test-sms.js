const axios = require('axios');

async function testSMS() {
  try {
    console.log('Testing Firebase SMS endpoint...');
    
    const response = await axios.post('https://fnf-backend-z406.onrender.com/api/send-verification', {
      phoneNumber: '+919876543210'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('Success!', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testSMS();