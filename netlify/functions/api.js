const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://digloo:navnit@cluster0.a6xgm1l.mongodb.net/gurukulx?retryWrites=true&w=majority&appName=Cluster0';


const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  role: {
    type: String,
    enum: ['student', 'teacher'],
    default: 'student'
  },
  class: {
    type: String,
    trim: true,
    maxlength: 20
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 100
  },
  profile: {
    score: { type: Number, default: 0, min: 0 },
    xp: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1 },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    streak: { type: Number, default: 0, min: 0 },
    badges: [{ type: String, trim: true }]
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });


userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});


userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};


userSchema.methods.getPublicProfile = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const User = mongoose.model('User', userSchema);


let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};


let usersInitialized = false;
const initializeDefaultUsers = async () => {
  if (usersInitialized) return;

  try {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const admin = new User({
        username: 'admin',
        password: 'admin123',
        name: 'Admin User',
        role: 'teacher',
        class: 'admin',
        email: 'admin@gurukulx.com',
        profile: { score: 0, xp: 0, level: 1, progress: 0, streak: 0, badges: [] }
      });
      await admin.save();
      console.log('Admin user created');
    }

    const studentExists = await User.findOne({ username: 'student1' });
    if (!studentExists) {
      const student = new User({
        username: 'student1',
        password: 'student123',
        name: 'Arjun Singh',
        role: 'student',
        class: '6',
        email: 'arjun@student.com',
        profile: { score: 850, xp: 1200, level: 3, progress: 45, streak: 5, badges: ['Math Whiz', 'Quick Learner'] }
      });
      await student.save();
      console.log('Student user created');
    }

    usersInitialized = true;
  } catch (error) {
    console.error('Error initializing users:', error);
  }
};


const handler = async (event, context) => {
  console.log('Function called:', {
    path: event.path,
    method: event.method,
    body: event.body,
    headers: event.headers
  });


  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.method === 'OPTIONS' || event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS request:', {
      method: event.method,
      httpMethod: event.httpMethod,
      path: event.path,
      headers: event.headers
    });
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: 'CORS preflight handled' })
    };
  }

  try {

    await connectDB();
    await initializeDefaultUsers();

    const { path, method, body, httpMethod } = event;
    const data = body ? JSON.parse(body) : {};


    const actualMethod = method || httpMethod || 'GET';

    console.log('Processing request:', {
      path,
      method: actualMethod,
      originalMethod: method,
      httpMethod: httpMethod,
      data,
      rawQuery: event.rawQuery
    });


    if (path === '/api/health') {
      console.log('Matched health route');
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'OK', timestamp: new Date().toISOString() })
      };
    }


    if (path === '/api/auth/login' && actualMethod === 'POST') {
      console.log('Matched login route - processing login request');

      const { username, password } = data;

      if (!username || !password) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Username and password required' })
        };
      }

      const user = await User.findOne({ username });
      if (!user) {
        console.log('User not found:', username);
        return {
          statusCode: 401,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Invalid credentials' })
        };
      }

      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        console.log('Invalid password for user:', username);
        return {
          statusCode: 401,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Invalid credentials' })
        };
      }

      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
      const token = jwt.sign(
        { userId: user._id, username: user.username, role: user.role, class: user.class },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log('Login successful for user:', username);
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Login successful',
          token,
          user: user.getPublicProfile()
        })
      };
    }


    if (path === '/api/auth/register' && actualMethod === 'POST') {
      console.log('Matched registration route - processing registration request');

      const { username, password, name, role, userClass, email } = data;

      if (!username || !password || !name || !role) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Missing required fields' })
        };
      }

      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return {
          statusCode: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Username already exists' })
        };
      }

      const user = new User({
        username, password, name, role, class: userClass, email,
        profile: { score: 0, xp: 0, level: 1, progress: 0, streak: 0, badges: [] }
      });

      await user.save();
      console.log('User created successfully:', user._id);

      return {
        statusCode: 201,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'User created successfully', userId: user._id })
      };
    }


    if (path === '/api/ai' && actualMethod === 'POST') {
      console.log('Matched AI route - processing request');

      const { subject = 'General', question, profile } = data;

      const OpenAI = require('openai');
      const NV_API_KEY = process.env.NV_API_KEY;
      const NV_BASE_URL = "https://integrate.api.nvidia.com/v1";

      if (!NV_API_KEY) {
        console.error('NV_API_KEY is missing');
        return {
          statusCode: 500,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Server configuration error' })
        };
      }

      const client = new OpenAI({
        apiKey: NV_API_KEY,
        baseURL: NV_BASE_URL
      });

      // Need user context for system prompt
      // For simple implementation, we might skip detailed profile or fetch if needed
      // But let's try to match server logic
      const systemPrompt = `You are an AI tutor for GuruKulX. Subject: ${subject}. Question: ${question}`;

      try {
        const completion = await client.chat.completions.create({
          model: "mistralai/mamba-codestral-7b-v0.1",
          messages: [
            { role: "system", content: "You are a helpful AI tutor." },
            { role: "user", content: question }
          ],
          temperature: 0.5,
          top_p: 1,
          max_tokens: 1024
        });

        const answer = completion.choices[0]?.message?.content || 'No response received.';
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ answer })
        };
      } catch (aiError) {
        console.error('AI API Error:', aiError);
        return {
          statusCode: 500,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'AI Error' })
        };
      }
    }

    console.log('No route matched:', { path, actualMethod, originalMethod: method, httpMethod, rawQuery: event.rawQuery, availableRoutes: ['/api/health', '/api/auth/login', '/api/auth/register', '/api/ai'] });
    return {
      statusCode: 404,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Route not found',
        path,
        method: actualMethod,
        originalMethod: method,
        httpMethod: httpMethod,
        rawQuery: event.rawQuery,
        availableRoutes: ['/api/health', '/api/auth/login', '/api/auth/register']
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error: ' + error.message })
    };
  }
};

module.exports = { handler };
