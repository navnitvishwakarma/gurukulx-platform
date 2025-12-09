
const fetch = require('node-fetch');

const API_BASE = 'https://gurukool-x.netlify.app';

async function testAPI() {
  console.log('🧪 Testing GuruKulX API endpoints...\n');
  
  try {

    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE}/api/health`);
    const healthData = await healthResponse.json();
    console.log('Health check:', healthData);
    
    if (healthData.status === 'OK') {
      console.log('✅ Health check passed\n');
    } else {
      console.log('❌ Health check failed\n');
      return;
    }
    

    console.log('2. Testing user registration...');
    const registrationData = {
      username: 'testuser' + Date.now(),
      password: 'password123',
      name: 'Test User',
      role: 'student',
      userClass: '6',
      email: 'test@example.com'
    };
    
    console.log('Registration data:', { ...registrationData, password: '***' });
    
    const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registrationData)
    });
    
    const registerResult = await registerResponse.json();
    console.log('Registration response status:', registerResponse.status);
    console.log('Registration response:', registerResult);
    
    if (registerResponse.ok) {
      console.log('✅ Registration successful\n');
      

      console.log('3. Testing user login...');
      const loginData = {
        username: registrationData.username,
        password: registrationData.password
      };
      
      const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });
      
      const loginResult = await loginResponse.json();
      console.log('Login response status:', loginResponse.status);
      console.log('Login response:', loginResult);
      
      if (loginResponse.ok) {
        console.log('✅ Login successful');
        console.log('Token received:', loginResult.token ? 'Yes' : 'No');
        console.log('User data:', loginResult.user);
      } else {
        console.log('❌ Login failed');
      }
      
    } else {
      console.log('❌ Registration failed');
      console.log('Error details:', registerResult);
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}


testAPI();
