const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const path = require('path');
require('dotenv').config();

// Import MongoDB models
const { connectDB } = require('./models');
const User = require('./models/User');
const Assignment = require('./models/Assignment');
const GameResult = require('./models/GameResult');
const Feedback = require('./models/Feedback');
const Doubt = require('./models/Doubt');

const app = express();
const PORT = process.env.PORT || 8080;

// Connect to MongoDB
connectDB();

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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Serve static files
app.use(express.static('.'));

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

// Initialize default users
const initializeDefaultUsers = async () => {
  try {
    // Check if admin user exists
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const admin = new User({
        username: 'admin',
        password: 'admin123',
        name: 'Admin User',
        role: 'teacher',
        class: 'admin',
        email: 'admin@gurukulx.com',
        profile: {
          score: 0,
          xp: 0,
          level: 1,
          progress: 0,
          streak: 0,
          badges: []
        }
      });
      await admin.save();
      console.log('Admin user created');
    }

    // Check if student user exists
    const studentExists = await User.findOne({ username: 'student' });
    if (!studentExists) {
      const student = new User({
        username: 'student',
        password: 'student123',
        name: 'Sample Student',
        role: 'student',
        class: '6',
        email: 'student@gurukulx.com',
        profile: {
          score: 0,
          xp: 0,
          level: 1,
          progress: 0,
          streak: 0,
          badges: []
        }
      });
      await student.save();
      console.log('Student user created');
    }
  } catch (error) {
    console.error('Error initializing default users:', error);
  }
};

// Initialize default users
initializeDefaultUsers();

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

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Create user
    const user = new User({
      username,
      password,
      name,
      role,
      class: userClass,
      email,
      profile: {
        score: 0,
        xp: 0,
        level: 1,
        progress: 0,
        streak: 0,
        badges: []
      }
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
      { 
        userId: user._id, 
        username: user.username, 
        role: user.role,
        class: user.class 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: user.getPublicProfile()
    });
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

    // Save game result
    const gameResult = new GameResult({
      user: req.user.userId,
      game_type: gameType,
      score,
      xp_earned: xpEarned,
      progress_earned: progressEarned
    });

    await gameResult.save();

    // Update user profile
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
      name,
      email,
      message
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

    // Get user profile for context
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  try {
    await mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error closing database:', error);
    process.exit(1);
  }
});
