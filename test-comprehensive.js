// Comprehensive test to see all event data
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testComprehensive() {
  console.log('🔍 Comprehensive function test...\n');
  
  const baseUrl = 'https://gurukool-x.netlify.app';
  
  try {
    // Test with a simple request to see what the function receives
    console.log('1. Testing with POST request...');
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
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    // Test with GET request
    console.log('\n2. Testing with GET request...');
    const getResponse = await fetch(`${baseUrl}/api/health`);
    console.log('GET Response status:', getResponse.status);
    const getData = await getResponse.json();
    console.log('GET Response data:', JSON.stringify(getData, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testComprehensive();
