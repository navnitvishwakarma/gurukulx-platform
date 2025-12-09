


const API_BASE = 'http://localhost:8080'; // Local development server

async function testNvidiaIntegration() {
    console.log('🧪 Testing NVIDIA API Integration...\n');

    try {

        console.log('1. Checking server health...');
        try {
            const health = await fetch(`${API_BASE}/api/health`);
            if (!health.ok) throw new Error('Server not reachable');
            console.log('✅ Server is running\n');
        } catch (e) {
            console.error('❌ Server is not running. Please start the server with "node server-mongodb.js"');
            return;
        }


        console.log('2. Logging in as admin...');
        const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });

        if (!loginRes.ok) {
            console.error('❌ Login failed. Ensure default users are seeded.');
            return;
        }

        const { token } = await loginRes.json();
        console.log('✅ Login successful, token received\n');


        console.log('3. Testing /api/ai endpoint with NVIDIA API...');
        const aiRes = await fetch(`${API_BASE}/api/ai`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                subject: 'Math',
                question: 'What is the Pythagorean theorem?',
                profile: { class: '10' }
            })
        });

        if (aiRes.ok) {
            const data = await aiRes.json();
            console.log('✅ AI Response Received:');
            console.log('--------------------------------------------------');
            console.log(data.answer);
            console.log('--------------------------------------------------');

            if (data.answer && data.answer.length > 10 && !data.answer.includes('placeholder')) {
                console.log('✅ Verification Passed: Real response received.');
            } else {
                console.log('⚠️ Warning: Response might be a placeholder or empty.');
            }

        } else {
            console.error(`❌ AI Endpoint Error: ${aiRes.status}`);
            const err = await aiRes.text();
            console.error(err);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testNvidiaIntegration();
