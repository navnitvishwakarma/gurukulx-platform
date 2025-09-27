const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Define schemas directly in the function to avoid path issues
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const bcrypt = require('bcryptjs');
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(candidatePassword, this.password);
};

// Get public profile
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const User = mongoose.model('User', userSchema);

const assignmentSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  class_name: { type: String, required: true, trim: true, maxlength: 50 },
  subject: { type: String, required: true, trim: true, maxlength: 50 },
  game: { type: String, required: true, trim: true, maxlength: 100 },
  due_date: { type: Date, default: null },
  notes: { type: String, trim: true, maxlength: 500 },
  status: { type: String, enum: ['assigned', 'in_progress', 'completed', 'cancelled'], default: 'assigned' },
  submissions: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    submitted_at: { type: Date, default: Date.now },
    score: { type: Number, default: 0 },
    feedback: { type: String, trim: true }
  }]
}, { timestamps: true });

const Assignment = mongoose.model('Assignment', assignmentSchema);

const gameResultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  game_type: { type: String, required: true, trim: true, maxlength: 50 },
  score: { type: Number, required: true, min: 0 },
  xp_earned: { type: Number, default: 0, min: 0 },
  progress_earned: { type: Number, default: 0, min: 0, max: 100 },
  time_taken: { type: Number, default: 0 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  completed: { type: Boolean, default: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

const GameResult = mongoose.model('GameResult', gameResultSchema);

const feedbackSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, trim: true, lowercase: true, maxlength: 100 },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
  type: { type: String, enum: ['feedback', 'bug_report', 'feature_request', 'general'], default: 'feedback' },
  status: { type: String, enum: ['new', 'in_review', 'resolved', 'closed'], default: 'new' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  response: {
    message: { type: String, trim: true },
    responded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    responded_at: { type: Date }
  }
}, { timestamps: true });

const Feedback = mongoose.model('Feedback', feedbackSchema);

const doubtSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true, trim: true, maxlength: 50 },
  question: { type: String, required: true, trim: true, maxlength: 1000 },
  answer: { type: String, trim: true, maxlength: 2000 },
  status: { type: String, enum: ['pending', 'answered', 'resolved', 'closed'], default: 'pending' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  answered_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  answered_at: { type: Date },
  tags: [{ type: String, trim: true, maxlength: 30 }],
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 }
}, { timestamps: true });

const Doubt = mongoose.model('Doubt', doubtSchema);

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://translate.google.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://generativelanguage.googleapis.com"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
    },
  },
}));

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// MongoDB connection
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Initialize database connection on first request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Initialize default users
const initializeDefaultUsers = async () => {
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

    const studentExists = await User.findOne({ username: 'student' });
    if (!studentExists) {
      const student = new User({
        username: 'student',
        password: 'student123',
        name: 'Sample Student',
        role: 'student',
        class: '6',
        email: 'student@gurukulx.com',
        profile: { score: 0, xp: 0, level: 1, progress: 0, streak: 0, badges: [] }
      });
      await student.save();
      console.log('Student user created');
    }
  } catch (error) {
    console.error('Error initializing default users:', error);
  }
};

// Initialize default users on first connection
let usersInitialized = false;
app.use(async (req, res, next) => {
  if (!usersInitialized) {
    await initializeDefaultUsers();
    usersInitialized = true;
  }
  next();
});

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Authentication routes
app.post('/api/auth/register', [
  body('username').isLength({ min: 3 }).trim().escape(),
  body('password').isLength({ min: 6 }),
  body('name').isLength({ min: 2 }).trim().escape(),
  body('role').isIn(['student', 'teacher']),
  body('userClass').optional().trim().escape(),
  body('email').optional().isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { username, password, name, role, userClass, email } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const user = new User({
      username, password, name, role, class: userClass, email,
      profile: { score: 0, xp: 0, level: 1, progress: 0, streak: 0, badges: [] }
    });

    await user.save();
    res.status(201).json({ message: 'User created successfully', userId: user._id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', [
  body('username').notEmpty().trim().escape(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role, class: user.class },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: user.getPublicProfile() });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// User profile routes
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.getPublicProfile());
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/user/profile', authenticateToken, [
  body('score').optional().isInt({ min: 0 }),
  body('xp').optional().isInt({ min: 0 }),
  body('level').optional().isInt({ min: 1 }),
  body('progress').optional().isInt({ min: 0, max: 100 }),
  body('streak').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { score, xp, level, progress, streak, badges } = req.body;
    const updateData = {};

    if (score !== undefined) updateData['profile.score'] = score;
    if (xp !== undefined) updateData['profile.xp'] = xp;
    if (level !== undefined) updateData['profile.level'] = level;
    if (progress !== undefined) updateData['profile.progress'] = progress;
    if (streak !== undefined) updateData['profile.streak'] = streak;
    if (badges !== undefined) updateData['profile.badges'] = badges;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updateData },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Game results
app.post('/api/game/results', authenticateToken, [
  body('gameType').notEmpty().trim().escape(),
  body('score').isInt({ min: 0 }),
  body('xpEarned').optional().isInt({ min: 0 }),
  body('progressEarned').optional().isInt({ min: 0, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { gameType, score, xpEarned = 0, progressEarned = 0 } = req.body;

    const gameResult = new GameResult({
      user: req.user.userId,
      game_type: gameType,
      score,
      xp_earned: xpEarned,
      progress_earned: progressEarned
    });

    await gameResult.save();

    await User.findByIdAndUpdate(
      req.user.userId,
      {
        $inc: {
          'profile.score': score,
          'profile.xp': xpEarned,
          'profile.progress': progressEarned
        }
      }
    );

    res.json({ message: 'Game results saved successfully', resultId: gameResult._id });
  } catch (error) {
    console.error('Game results error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const leaderboard = await User.find({ role: 'student' })
      .select('name profile.score profile.badges profile.level')
      .sort({ 'profile.score': -1 })
      .limit(50);

    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Assignments
app.get('/api/assignments', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const assignments = await Assignment.find({ teacher: req.user.userId })
      .sort({ created_at: -1 })
      .populate('teacher', 'name username');

    res.json(assignments);
  } catch (error) {
    console.error('Assignments fetch error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/assignments', authenticateToken, [
  body('class_name').notEmpty().trim().escape(),
  body('subject').notEmpty().trim().escape(),
  body('game').notEmpty().trim().escape(),
  body('due_date').optional().trim().escape(),
  body('notes').optional().trim().escape()
], async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { class_name, subject, game, due_date, notes } = req.body;

    const assignment = new Assignment({
      teacher: req.user.userId,
      class_name,
      subject,
      game,
      due_date: due_date ? new Date(due_date) : null,
      notes
    });

    await assignment.save();
    res.status(201).json({ message: 'Assignment created successfully', assignmentId: assignment._id });
  } catch (error) {
    console.error('Assignment creation error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Feedback
app.post('/api/feedback', [
  body('name').notEmpty().trim().escape(),
  body('email').optional().isEmail().normalizeEmail(),
  body('message').notEmpty().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { name, email, message } = req.body;

    const feedback = new Feedback({
      name, email, message
    });

    await feedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Doubts
app.post('/api/doubts', authenticateToken, [
  body('subject').notEmpty().trim().escape(),
  body('question').notEmpty().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { subject, question } = req.body;

    const doubt = new Doubt({
      user: req.user.userId,
      subject,
      question
    });

    await doubt.save();
    res.status(201).json({ message: 'Doubt submitted successfully' });
  } catch (error) {
    console.error('Doubt submission error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// AI endpoint with Gemini API integration
app.post('/api/ai', authenticateToken, [
  body('subject').notEmpty().trim().escape(),
  body('question').notEmpty().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { subject, question, profile } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyALj_4-lYI__CEE9u14RkQAIYCsvN0H6Do';
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your-gemini-api-key-here') {
      return res.json({ 
        answer: `This is a placeholder AI response for the question: "${question}" in subject: "${subject}". Please configure your Gemini API key to get real AI responses.` 
      });
    }

    const user = await User.findById(req.user.userId);
    const userProfile = user?.profile || { level: 1, xp: 0, score: 0 };

    const prompt = `You are an AI tutor for GuruKulX, an educational platform. You help students with their academic questions across various subjects.

Student Profile:
- Name: ${user?.name || 'Student'}
- Class: ${user?.class || 'Not specified'}
- Level: ${userProfile.level || 1}
- Experience Points: ${userProfile.xp || 0}
- Score: ${userProfile.score || 0}

Guidelines:
1. Provide clear, educational explanations appropriate for the student's level
2. Use simple language and examples when possible
3. Encourage learning and provide study tips
4. If the question is unclear, ask for clarification
5. Keep responses concise but comprehensive
6. Always be encouraging and supportive

Subject: ${subject}
Question: ${question}

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
          maxOutputTokens: 500,
          topP: 0.8,
          topK: 10
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received from Gemini';

    res.json({ answer });
  } catch (error) {
    console.error('AI endpoint error:', error);
    res.status(500).json({ error: 'AI service temporarily unavailable' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Export for Netlify Functions
module.exports = app;
