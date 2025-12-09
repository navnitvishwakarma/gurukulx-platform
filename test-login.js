
const fetch = require('node-fetch');

const API_BASE = 'https://gurukool-x.netlify.app';


const testCredentials = [
  { username: 'teacher1', password: 'teacher123', role: 'teacher', name: 'Ms. Priya Sharma' },
  { username: 'student1', password: 'student123', role: 'student', name: 'Arjun Singh' },
  { username: 'admin', password: 'admin123', role: 'teacher', name: 'Admin User' },
  { username: 'student2', password: 'student123', role: 'student', name: 'Priya Patel' }
];

async function testLogin() {
  console.log('🔐 Testing login functionality...\n');
  
  try {

    console.log('1. Testing API health...');
    const healthResponse = await fetch(`${API_BASE}/api/health`);
    const healthData = await healthResponse.json();
    
    if (healthData.status === 'OK') {
      console.log('✅ API is healthy\n');
    } else {
      console.log('❌ API health check failed\n');
      return;
    }
    

    for (let i = 0; i < testCredentials.length; i++) {
      const cred = testCredentials[i];
      console.log(`${i + 2}. Testing login for ${cred.name} (${cred.role})...`);
      
      try {
        const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: cred.username,
            password: cred.password
          })
        });
        
        const loginData = await loginResponse.json();
        
        if (loginResponse.ok) {
          console.log(`✅ Login successful for ${cred.username}`);
          console.log(`   Token: ${loginData.token ? 'Received' : 'Missing'}`);
          console.log(`   User: ${loginData.user?.name} (${loginData.user?.role})`);
          console.log(`   Profile: Level ${loginData.user?.profile?.level}, Score: ${loginData.user?.profile?.score}\n`);
        } else {
          console.log(`❌ Login failed for ${cred.username}`);
          console.log(`   Error: ${loginData.error}\n`);
        }
        
      } catch (error) {
        console.log(`❌ Network error for ${cred.username}: ${error.message}\n`);
      }
    }
    
    console.log('🎉 Login testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}


testLogin();
