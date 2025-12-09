
const fetch = require('node-fetch');

async function testFunction() {
  console.log('🧪 Testing Netlify function locally...\n');
  
  try {

    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch('https://gurukool-x.netlify.app/api/health');
    const healthData = await healthResponse.json();
    console.log('Health check result:', healthData);
    
    if (healthData.status === 'OK') {
      console.log('✅ Health check passed\n');
    } else {
      console.log('❌ Health check failed\n');
      return;
    }
    

    console.log('2. Testing login with sample credentials...');
    const loginData = {
      username: 'student1',
      password: 'student123'
    };
    
    const loginResponse = await fetch('https://gurukool-x.netlify.app/api/auth/login', {
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
      console.log('✅ Login test passed\n');
    } else {
      console.log('❌ Login test failed\n');
    }
    

    console.log('3. Testing registration...');
    const registrationData = {
      username: 'testuser' + Date.now(),
      password: 'password123',
      name: 'Test User',
      role: 'student',
      userClass: '6',
      email: 'test@example.com'
    };
    
    const registerResponse = await fetch('https://gurukool-x.netlify.app/api/auth/register', {
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
      console.log('✅ Registration test passed\n');
    } else {
      console.log('❌ Registration test failed\n');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}


testFunction();
