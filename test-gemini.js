// Quick test script for Gemini API integration
const GEMINI_API_KEY = 'YOUR_API_KEY_HERE'; // Replace with your key for local testing
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

async function testGeminiAPI() {
  try {
    console.log('Testing Gemini API integration...');

    const prompt = `You are an AI tutor for GuruKulX, an educational platform. 
    
    Student Profile:
    - Name: Test Student
    - Class: 6
    - Level: 1
    - Experience Points: 0
    - Score: 0

    Subject: Math
    Question: What is 2 + 2?

    Please provide a helpful educational response:`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
          topP: 0.8,
          topK: 10
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received';

    console.log('✅ Gemini API Test Successful!');
    console.log('Response:', answer);

  } catch (error) {
    console.error('❌ Gemini API Test Failed:', error.message);
  }
}

// Run the test
testGeminiAPI();
