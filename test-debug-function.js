
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testDebugFunction() {
  console.log('🔍 Testing debug function...\n');
  
  const baseUrl = 'https://gurukool-x.netlify.app';
  
  try {

    console.log('1. Testing debug function...');
    const debugResponse = await fetch(`${baseUrl}/.netlify/functions/debug`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        test: 'data',
        username: 'student1',
        password: 'student123'
      })
    });
    
    console.log('Debug status:', debugResponse.status);
    const debugData = await debugResponse.json();
    console.log('Debug response:', debugData);
    

    console.log('\n2. Testing main function directly...');
    const mainResponse = await fetch(`${baseUrl}/.netlify/functions/api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'student1',
        password: 'student123'
      })
    });
    
    console.log('Main status:', mainResponse.status);
    const mainData = await mainResponse.json();
    console.log('Main response:', mainData);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDebugFunction();
