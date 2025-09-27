// Direct test of the API endpoints
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testDirect() {
  console.log('🔍 Direct API test...\n');
  
  const baseUrl = 'https://gurukool-x.netlify.app';
  
  try {
    // Test health
    console.log('1. Health check...');
    const health = await fetch(`${baseUrl}/api/health`);
    console.log('Health status:', health.status);
    const healthData = await health.json();
    console.log('Health data:', healthData);
    
    // Test login with detailed logging
    console.log('\n2. Login test...');
    console.log('URL:', `${baseUrl}/api/auth/login`);
    console.log('Method: POST');
    console.log('Body:', JSON.stringify({ username: 'student1', password: 'student123' }));
    
    const login = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'student1',
        password: 'student123'
      })
    });
    
    console.log('Login status:', login.status);
    console.log('Login headers:', Object.fromEntries(login.headers.entries()));
    const loginData = await login.json();
    console.log('Login data:', loginData);
    
    // Test registration
    console.log('\n3. Registration test...');
    const register = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'testuser' + Date.now(),
        password: 'password123',
        name: 'Test User',
        role: 'student',
        userClass: '6',
        email: 'test@example.com'
      })
    });
    
    console.log('Register status:', register.status);
    const registerData = await register.json();
    console.log('Register data:', registerData);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testDirect();
