
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testNewFunction() {
  console.log('🧪 Testing new simplified function...\n');
  
  const baseUrl = 'https://gurukool-x.netlify.app';
  
  try {

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
