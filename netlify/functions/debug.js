// Debug function to test routing
const handler = async (event, context) => {
  console.log('Debug function called:', { 
    path: event.path, 
    method: event.method,
    body: event.body,
    headers: event.headers
  });
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      message: 'Debug function working',
      path: event.path,
      method: event.method,
      timestamp: new Date().toISOString(),
      body: event.body ? JSON.parse(event.body) : null
    })
  };
};

module.exports = { handler };
