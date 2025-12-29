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

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  message: { type: String, required: true },
  type: { type: String, default: 'info' }, // info, warning, success, error
  link: String,
  is_read: { type: Boolean, default: false }
}, { timestamps: true });
const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

const assignmentSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  class_name: { type: String, required: true },
  subject: { type: String, required: true },
  game: { type: String, required: true },
  due_date: Date,
  notes: String,
  status: { type: String, default: 'Active' }
}, { timestamps: true });
const Assignment = mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema);

const doubtSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  question: { type: String, required: true },
  status: { type: String, default: 'Open' }, // Open, Answered
  answers: [{
    answered_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    answer: String,
    created_at: { type: Date, default: Date.now }
  }]
}, { timestamps: true });
const Doubt = mongoose.models.Doubt || mongoose.model('Doubt', doubtSchema);

const gameResultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  game_type: { type: String, required: true },
  score: { type: Number, required: true },
  xp_earned: { type: Number, default: 0 },
  progress_earned: { type: Number, default: 0 }
}, { timestamps: true });
const GameResult = mongoose.models.GameResult || mongoose.model('GameResult', gameResultSchema);

const announcementSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  message: { type: String, required: true, trim: true, maxlength: 500 },
  recipients: { type: String, required: true, trim: true } // 'all' or class name
}, { timestamps: true });
const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);

const scheduleSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  class_name: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  time: { type: String, required: true }, // HH:MM
  notes: { type: String, trim: true, maxlength: 200 }
}, { timestamps: true });
const Schedule = mongoose.models.Schedule || mongoose.model('Schedule', scheduleSchema);

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  group: { type: String },
  content: { type: String, required: true, trim: true },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });
const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

const feedbackSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true },
  message: { type: String, required: true, trim: true },
  type: { type: String, default: 'feedback' },
  status: { type: String, default: 'new' }
}, { timestamps: true });
const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);

const questionSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  difficulty: { type: String, default: 'medium' },
  question: { type: String, required: true },
  options: [{ type: String }],
  answer: { type: mongoose.Schema.Types.Mixed, required: true },
  type: { type: String, default: 'mcq' },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);



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


    // --- Authentication Helper ---
    const getAuth = () => {
      const authHeader = headers['authorization'] || headers['Authorization'];
      if (!authHeader) throw new Error('No token provided');
      const token = authHeader.split(' ')[1];
      if (!token) throw new Error('No token provided');
      return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    };

    // --- Route Handlers ---

    // 1. GET /api/user/profile
    if (path === '/api/user/profile' && actualMethod === 'GET') {
      try {
        const decoded = getAuth();
        const user = await User.findById(decoded.userId);
        if (!user) return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(user.getPublicProfile())
        };
      } catch (err) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
      }
    }

    // 2. PUT /api/user/profile
    if (path === '/api/user/profile' && actualMethod === 'PUT') {
      try {
        const decoded = getAuth();
        const { score, xp, level, progress, streak, badges, subject } = data;
        const updateData = {};
        if (score !== undefined) updateData['profile.score'] = score;
        if (xp !== undefined) updateData['profile.xp'] = xp;
        if (level !== undefined) updateData['profile.level'] = level;
        if (progress !== undefined) updateData['profile.progress'] = progress;
        if (streak !== undefined) updateData['profile.streak'] = streak;
        if (badges !== undefined) updateData['profile.badges'] = badges;
        if (subject !== undefined) updateData['subject'] = subject;

        const user = await User.findByIdAndUpdate(decoded.userId, { $set: updateData }, { new: true });
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Profile updated' })
        };
      } catch (err) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
      }
    }

    // 3. GET /api/leaderboard
    if (path === '/api/leaderboard' && actualMethod === 'GET') {
      const leaderboard = await User.find({ role: 'student' })
        .select('name class profile.score profile.badges profile.level')
        .sort({ 'profile.score': -1 })
        .limit(50);
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(leaderboard)
      };
    }

    // 4. GET /api/assignments
    if (path === '/api/assignments' && actualMethod === 'GET') {
      try {
        const decoded = getAuth();
        const user = await User.findById(decoded.userId);
        let query = {};
        if (user.role === 'teacher') {
          query = { teacher: decoded.userId };
        } else {
          // Simple matching for student class
          const cls = user.class || (user.profile && user.profile.class) || '';
          if (cls) {
            // Regex query to match class number loosely
            const classNum = cls.replace(/\D/g, '');
            if (classNum) {
              query = { class_name: { $regex: classNum, $options: 'i' } };
            } else {
              query = { class_name: cls };
            }
          } else {
            // No class set, return empty
            return { statusCode: 200, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify([]) };
          }
        }
        const assignments = await Assignment.find(query).sort({ createdAt: -1 });
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(assignments)
        };
      } catch (err) {
        console.log(err);
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
      }
    }

    // 5. GET /api/notifications
    if (path === '/api/notifications' && actualMethod === 'GET') {
      try {
        const decoded = getAuth();
        const notifs = await Notification.find({ user: decoded.userId }).sort({ createdAt: -1 }).limit(20);
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(notifs)
        };
      } catch (err) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
      }
    }

    // 6. DELETE /api/notifications
    if (path === '/api/notifications' && actualMethod === 'DELETE') {
      try {
        const decoded = getAuth();
        await Notification.deleteMany({ user: decoded.userId });
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Cleared' })
        };
      } catch (err) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
      }
    }

    // 7. GET /api/doubts
    if (path === '/api/doubts' && actualMethod === 'GET') {
      try {
        const decoded = getAuth();
        let query = {};
        if (decoded.role === 'student') query = { user: decoded.userId };
        const doubts = await Doubt.find(query).sort({ createdAt: -1 }).populate('user', 'name profile.class').limit(50);
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(doubts)
        };
      } catch (err) {
        // If populate fails or other internal error, try basic fetch
        try {
          const doubts = await Doubt.find({}).sort({ createdAt: -1 }).limit(50);
          return { statusCode: 200, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(doubts) };
        } catch (e) {
          return { statusCode: 500, body: JSON.stringify({ error: 'Server Error' }) };
        }
      }
    }

    // 8. POST /api/doubts
    if (path === '/api/doubts' && actualMethod === 'POST') {
      try {
        const decoded = getAuth();
        const { subject, question } = data;
        const doubt = new Doubt({ user: decoded.userId, subject, question });
        await doubt.save();
        return {
          statusCode: 201,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Doubt sent' })
        };
      } catch (err) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Error saving doubt' }) };
      }
    }


    // 9. POST /api/game/results
    if (path === '/api/game/results' && actualMethod === 'POST') {
      try {
        const decoded = getAuth();
        const { gameType, score, xpEarned = 0, progressEarned = 0 } = data;

        const gameResult = new GameResult({
          user: decoded.userId,
          game_type: gameType,
          score,
          xp_earned: xpEarned,
          progress_earned: progressEarned
        });
        await gameResult.save();

        await User.findByIdAndUpdate(decoded.userId, {
          $inc: {
            'profile.score': score,
            'profile.xp': xpEarned,
            'profile.progress': progressEarned
          }
        });

        return {
          statusCode: 201,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Saved', resultId: gameResult._id })
        };

      } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
      }
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
