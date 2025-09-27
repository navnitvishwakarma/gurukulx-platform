// Test CORS and API accessibility
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testCORS() {
  console.log('🔍 Testing CORS and API accessibility...\n');
  
  const baseUrl = 'https://gurukool-x.netlify.app';
  
  try {
    // Test 1: Health check with CORS headers
    console.log('1. Testing health check with CORS...');
    const healthResponse = await fetch(`${baseUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://gurukool-x.netlify.app'
      }
    });
    
    console.log('Health status:', healthResponse.status);
    console.log('CORS headers:', {
      'access-control-allow-origin': healthResponse.headers.get('access-control-allow-origin'),
      'access-control-allow-methods': healthResponse.headers.get('access-control-allow-methods'),
      'access-control-allow-headers': healthResponse.headers.get('access-control-allow-headers')
    });
    const healthData = await healthResponse.json();
    console.log('Health data:', healthData);
    
    // Test 2: Login with CORS headers
    console.log('\n2. Testing login with CORS...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://gurukool-x.netlify.app'
      },
      body: JSON.stringify({
        username: 'student1',
        password: 'student123'
      })
    });
    
    console.log('Login status:', loginResponse.status);
    console.log('CORS headers:', {
      'access-control-allow-origin': loginResponse.headers.get('access-control-allow-origin'),
      'access-control-allow-methods': loginResponse.headers.get('access-control-allow-methods'),
      'access-control-allow-headers': loginResponse.headers.get('access-control-allow-headers')
    });
    const loginData = await loginResponse.json();
    console.log('Login data:', loginData);
    
    // Test 3: Check if the issue is with the redirect
    console.log('\n3. Testing direct function call...');
    const directResponse = await fetch(`${baseUrl}/.netlify/functions/api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'student1',
        password: 'student123'
      })
    });
    
    console.log('Direct function status:', directResponse.status);
    const directData = await directResponse.json();
    console.log('Direct function data:', directData);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  }
}

testCORS();
