// Test user registration functionality
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testRegistration() {
  console.log('🧪 Testing user registration...\n');
  
  const baseUrl = 'https://gurukool-x.netlify.app';
  
  try {
    // Test 1: Registration
    console.log('1. Testing user registration...');
    const registrationData = {
      username: 'newuser' + Date.now(),
      password: 'password123',
      name: 'New Test User',
      role: 'student',
      userClass: '6',
      email: 'newuser@example.com'
    };
    
    console.log('Registration data:', { ...registrationData, password: '***' });
    
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registrationData)
    });
    
    console.log('Registration status:', registerResponse.status);
    const registerData = await registerResponse.json();
    console.log('Registration response:', registerData);
    
    if (registerResponse.ok) {
      console.log('✅ Registration successful!');
      
      // Test 2: Login with new user
      console.log('\n2. Testing login with new user...');
      const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: registrationData.username,
          password: registrationData.password
        })
      });
      
      console.log('Login status:', loginResponse.status);
      const loginData = await loginResponse.json();
      console.log('Login response:', loginData);
      
      if (loginResponse.ok) {
        console.log('✅ Login with new user successful!');
        console.log('User data:', loginData.user);
      } else {
        console.log('❌ Login with new user failed');
      }
      
    } else {
      console.log('❌ Registration failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRegistration();
