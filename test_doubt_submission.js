const http = require('http');

async function testDoubt() {
    const loginData = JSON.stringify({
        username: 'student',
        password: 'student123'
    });

    const loginOptions = {
        hostname: 'localhost',
        port: 8080,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': loginData.length
        }
    };

    console.log('1. Logging in as student...');

    const token = await new Promise((resolve, reject) => {
        const req = http.request(loginOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const json = JSON.parse(data);
                    resolve(json.token);
                } else {
                    reject(`Login failed: ${res.statusCode} ${data}`);
                }
            });
        });
        req.on('error', reject);
        req.write(loginData);
        req.end();
    });

    console.log('   Login successful! Token received.');

    const doubtData = JSON.stringify({
        subject: 'Math',
        question: 'Test doubt from script ' + Date.now()
    });

    const doubtOptions = {
        hostname: 'localhost',
        port: 8080,
        path: '/api/doubts',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': doubtData.length,
            'Authorization': `Bearer ${token}`
        }
    };

    console.log('2. Submitting doubt...');

    await new Promise((resolve, reject) => {
        const req = http.request(doubtOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 201) {
                    console.log('   Doubt submitted successfully!');
                    resolve();
                } else {
                    reject(`Doubt submission failed: ${res.statusCode} ${data}`);
                }
            });
        });
        req.on('error', reject);
        req.write(doubtData);
        req.end();
    });

}

testDoubt().catch(console.error);
