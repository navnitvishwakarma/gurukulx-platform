// Test the new simplified function
const fetch = require('node-fetch');

async function testNewFunction() {
  console.log('🧪 Testing new simplified function...\n');
  
  const baseUrl = 'https://gurukool-x.netlify.app';
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    console.log('Status:', healthResponse.status);
    const healthData = await healthResponse.json();
    console.log('Response:', healthData);
    
    if (healthResponse.ok) {
      console.log('✅ Health check passed\n');
    } else {
      console.log('❌ Health check failed\n');
      return;
    }
    
    // Test 2: Login
    console.log('2. Testing login...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'student1',
        password: 'student123'
      })
    });
    
    console.log('Login Status:', loginResponse.status);
    const loginData = await loginResponse.json();
    console.log('Login Response:', loginData);
    
    if (loginResponse.ok) {
      console.log('✅ Login test passed');
      console.log('Token received:', !!loginData.token);
      console.log('User data:', loginData.user);
    } else {
      console.log('❌ Login test failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testNewFunction();
