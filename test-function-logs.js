// Test to see what the function is actually receiving
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testFunctionLogs() {
  console.log('🔍 Testing function logs...\n');
  
  const baseUrl = 'https://gurukool-x.netlify.app';
  
  try {
    // Test with a simple request to see what the function receives
    console.log('1. Testing with simple request...');
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'student1',
        password: 'student123'
      })
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
    // Check if the function is receiving the correct path
    if (data.path === '/api/auth/login') {
      console.log('✅ Function is receiving the correct path');
    } else {
      console.log('❌ Function is receiving wrong path:', data.path);
    }
    
    // Check if the function is receiving the correct method
    if (data.method === 'POST') {
      console.log('✅ Function is receiving the correct method');
    } else {
      console.log('❌ Function is receiving wrong method:', data.method);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFunctionLogs();
