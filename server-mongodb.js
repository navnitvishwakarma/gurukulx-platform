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
const Question = require('./models/Question');
const Classroom = require('./models/Classroom');
const Resource = require('./models/Resource');
const Notification = require('./models/Notification');
const AuditLog = require('./models/AuditLog');
const Doubt = require('./models/Doubt');
const Message = require('./models/Message');
const Announcement = require('./models/Announcement');
const Schedule = require('./models/Schedule');
const Quiz = require('./models/Quiz');

const app = express();
const PORT = process.env.PORT || 8080;

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://translate.googleapis.com", "https://www.gstatic.com", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://translate.google.com", "https://translate.googleapis.com", "https://www.gstatic.com", "https://www.google.com", "http://translate.google.com", "https://translate-pa.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "http:", "https://www.google.com", "https://www.gstatic.com"],
      connectSrc: ["'self'", "https://generativelanguage.googleapis.com", "https://translate.googleapis.com", "https://translate.google.com", "https://translate-pa.googleapis.com", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com", "https://fonts.googleapis.com"],
      frameSrc: ["'self'", "https://translate.google.com", "https://translate.googleapis.com", "http://translate.google.com"],
    },
  },
}));

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3000, // limit each IP to 3000 requests per windowMs
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

    // Seed extra leaderboard users
    const seedUsers = [
      { name: "Aditi", username: "aditi", score: 820, badges: ["Eco Hero"], class: "6" },
      { name: "Ravi", username: "ravi", score: 760, badges: ["Quiz Ace"], class: "7" },
      { name: "Zara", username: "zara", score: 740, badges: ["Math Star"], class: "8" },
      { name: "Ishan", username: "ishan", score: 690, badges: ["Lab Champ"], class: "9" },
    ];

    for (const u of seedUsers) {
      const exists = await User.findOne({ username: u.username });
      if (!exists) {
        await new User({
          username: u.username,
          password: 'password123', // Default password
          name: u.name,
          role: 'student',
          class: u.class,
          profile: {
            score: u.score,
            xp: u.score, // Approx XP
            level: Math.floor(u.score / 500) + 1,
            progress: 50,
            streak: 5,
            badges: u.badges
          }
        }).save();
        console.log(`Seeded user: ${u.name}`);
      }
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
  body('subject').optional().trim().escape(),
  body('email').optional().isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { username, password, name, role, userClass, subject, email } = req.body;

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
      subject,
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
  body('streak').optional().isInt({ min: 0 }),
  body('subject').optional().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { score, xp, level, progress, streak, badges, subject } = req.body;
    const updateData = {};

    if (score !== undefined) updateData['profile.score'] = score;
    if (xp !== undefined) updateData['profile.xp'] = xp;
    if (level !== undefined) updateData['profile.level'] = level;
    if (progress !== undefined) updateData['profile.progress'] = progress;
    if (streak !== undefined) updateData['profile.streak'] = streak;
    if (badges !== undefined) updateData['profile.badges'] = badges;
    if (subject !== undefined) updateData['subject'] = subject;
    if (req.body.lastVisit !== undefined) updateData['profile.lastVisit'] = req.body.lastVisit;

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
      .select('name class profile.score profile.badges profile.level')
      .sort({ 'profile.score': -1 })
      .limit(50);

    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Teachers list
app.get('/api/teachers', async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' })
      .select('name subject profile.badges')
      .sort({ name: 1 });

    res.json(teachers);
  } catch (error) {
    console.error('Teachers fetch error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Assignments
app.get('/api/assignments', authenticateToken, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'teacher') {
      query = { teacher: req.user.userId };
    } else if (req.user.role === 'student') {
      // Find user to get their class
      const user = await User.findById(req.user.userId);
      // Check user.class (root field) or user.profile.class (legacy/fallback)
      const studentClass = user.class || (user.profile && user.profile.class);

      if (user && studentClass) {
        // Match assignments for this class
        // Try to match exact number or "Grade X"
        const classNum = studentClass.replace(/\D/g, ''); // Extract number
        console.log(`[API] Fetching assignments for student: ${user.username}, Class: ${studentClass}, Num: ${classNum}`);

        if (classNum) {
          query = {
            class_name: { $regex: classNum, $options: 'i' }
          };
        } else {
          // Fallback for non-numeric class names
          query = {
            class_name: studentClass
          };
        }
      } else {
        // If no class assigned, return empty
        return res.json([]);
      }
    }

    const assignments = await Assignment.find(query)
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

// --- Advanced Features Routes ---

// Questions
app.get('/api/questions', async (req, res) => {
  try {
    const { subject, topic, difficulty } = req.query;
    const query = {};
    if (subject) query.subject = subject;
    if (topic) query.topic = topic;
    if (difficulty) query.difficulty = difficulty;
    const questions = await Question.find(query).limit(20);
    res.json(questions);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/questions', authenticateToken, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Access denied' });
  try {
    const q = new Question({ ...req.body, created_by: req.user.userId });
    await q.save();
    res.status(201).json(q);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Classrooms
app.get('/api/classrooms', authenticateToken, async (req, res) => {
  try {
    const query = req.user.role === 'teacher' ? { teacher: req.user.userId } : { students: req.user.userId };
    const classes = await Classroom.find(query).populate('teacher', 'name').populate('students', 'name');
    res.json(classes);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/classrooms', authenticateToken, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Access denied' });
  try {
    const c = new Classroom({ ...req.body, teacher: req.user.userId, code: Math.random().toString(36).substring(7) });
    await c.save();
    res.status(201).json(c);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/classrooms/join', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;
    const c = await Classroom.findOne({ code });
    if (!c) return res.status(404).json({ error: 'Class not found' });
    if (!c.students.includes(req.user.userId)) {
      c.students.push(req.user.userId);
      await c.save();
    }
    res.json({ message: 'Joined successfully', classroom: c });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Resources
app.get('/api/resources', authenticateToken, async (req, res) => {
  try {
    const resources = await Resource.find().sort({ createdAt: -1 }).limit(50);
    res.json(resources);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/resources', authenticateToken, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Access denied' });
  try {
    const r = new Resource({ ...req.body, uploaded_by: req.user.userId });
    await r.save();
    res.status(201).json(r);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Quizzes
app.get('/api/quizzes', async (req, res) => {
  try {
    const { subject, class: className } = req.query;
    let query = {};
    if (subject && subject !== 'All') query.subject = subject;

    // Filter by class (match specific class, 'all', or null)
    if (className && className !== 'all') {
      query.$or = [
        { class: className },
        { class: 'all' },
        { class: { $exists: false } },
        { class: null }
      ];
    }

    const quizzes = await Quiz.find(query).sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/quizzes', authenticateToken, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Access denied' });
  try {
    const quiz = new Quiz({
      ...req.body,
      createdBy: req.user.userId,
      createdByName: req.user.name || req.user.username
    });
    await quiz.save();
    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assignments
app.post('/api/assignments', authenticateToken, [
  body('class_name').notEmpty(),
  body('subject').notEmpty(),
  body('game').notEmpty(),
  body('due_date').optional(),
  body('notes').optional()
], async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Access denied' });

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const assignment = new Assignment({
      teacher: req.user.userId,
      ...req.body
    });
    await assignment.save();

    // Notify students of that class
    console.log(`Creating assignment for class: ${req.body.class_name}`);
    const students = await User.find({ role: 'student', 'class': req.body.class_name });
    console.log(`Found ${students.length} students for notification.`);
    // Based on User model, it is 'class' at root

    const notifications = students.map(s => ({
      user: s._id,
      message: `New Assignment: ${req.body.subject} - ${req.body.game}`,
      type: 'warning', // Warning color for attention
      link: '/assignments.html'
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json(assignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Announcements
app.post('/api/announcements', authenticateToken, [
  body('title').notEmpty().trim().escape(),
  body('message').notEmpty().trim().escape(),
  body('recipients').notEmpty().trim()
], async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Access denied' });

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const announcement = new Announcement({
      teacher: req.user.userId,
      ...req.body
    });
    await announcement.save();

    // Notify students
    let query = { role: 'student' };
    if (req.body.recipients !== 'all') {
      query.class = req.body.recipients;
    }

    const students = await User.find(query);

    const notifications = students.map(s => ({
      user: s._id,
      message: `Announcement: ${req.body.title}`,
      type: 'info',
      link: '#'
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json(announcement);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Schedule
app.post('/api/schedule', authenticateToken, [
  body('class_name').notEmpty(),
  body('subject').notEmpty(),
  body('date').notEmpty(),
  body('time').notEmpty(),
  body('notes').optional()
], async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Access denied' });

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const schedule = new Schedule({
      teacher: req.user.userId,
      ...req.body
    });
    await schedule.save();

    // Notify students of that class
    const students = await User.find({ role: 'student', 'class': req.body.class_name });

    const notifications = students.map(s => ({
      user: s._id,
      message: `New Class Scheduled: ${req.body.subject} on ${req.body.date} at ${req.body.time}`,
      type: 'success',
      link: '#'
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json(schedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const notifs = await Notification.find({ user: req.user.userId }).sort({ createdAt: -1 }).limit(20);
    res.json(notifs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Clear all notifications
app.delete('/api/notifications', authenticateToken, async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user.userId });
    res.json({ message: 'Notifications cleared' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/notifications/send', authenticateToken, async (req, res) => {
  if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Access denied' });

  try {
    const { title, message, recipients } = req.body;
    let query = { role: 'student' };

    if (recipients && recipients !== 'all') {
      // recipients could be a specific class like "6" or "grade6"
      const classNum = recipients.replace('grade', '');
      query.class = classNum;
    }

    const students = await User.find(query);
    const notifications = students.map(s => ({
      user: s._id,
      title,
      message,
      type: 'announcement',
      is_read: false
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.json({ message: `Sent to ${notifications.length} students` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Audit Log Middleware (Helper)
const logAction = async (userId, action, details, req) => {
  try {
    await new AuditLog({ user: userId, action, details, ip: req.ip, user_agent: req.get('User-Agent') }).save();
  } catch (e) { console.error('Audit log failed', e); }
};

// Messages (Chat)
app.get('/api/messages/:otherUserId', authenticateToken, async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.userId;

    let query;
    if (otherUserId.startsWith('group:')) {
      const groupId = otherUserId.replace('group:', '');
      query = { group: groupId };
    } else {
      query = {
        $or: [
          { sender: userId, recipient: otherUserId },
          { sender: otherUserId, recipient: userId }
        ]
      };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: 1 }) // Oldest first for chat history
      .limit(100);

    res.json(messages);
  } catch (error) {
    console.error('Messages fetch error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get list of users who have messaged the current user (for teacher dashboard)
app.get('/api/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    // Find unique senders where recipient is current user
    const senders = await Message.distinct('sender', { recipient: userId });
    // Also find unique recipients where sender is current user (in case teacher initiated)
    const recipients = await Message.distinct('recipient', { sender: userId });

    const userIds = [...new Set([...senders, ...recipients].map(id => id.toString()))];

    const users = await User.find({ _id: { $in: userIds } })
      .select('name role class subject');

    // Add class groups for teachers
    if (req.user.role === 'teacher') {
      const classes = ['6', '7', '8', '9', '10', '11', '12'];
      const groupChats = classes.map(c => ({
        _id: `group:class-${c}`,
        name: `Class ${c} Group`,
        isGroup: true,
        class: c
      }));
      res.json([...groupChats, ...users]);
    } else {
      res.json(users);
    }
  } catch (error) {
    console.error('Conversations fetch error:', error);
    res.status(500).json({ error: 'Database error', details: error.message, stack: error.stack });
  }
});

app.post('/api/messages', authenticateToken, [
  body('content').notEmpty().trim().escape(),
  body('recipientId').optional(),
  body('groupId').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { recipientId, groupId, content } = req.body;
    const senderId = req.user.userId;

    if (!recipientId && !groupId) {
      return res.status(400).json({ error: 'Recipient or Group ID required' });
    }

    const message = new Message({
      sender: senderId,
      recipient: recipientId || undefined,
      group: groupId || undefined,
      content
    });

    await message.save();
    res.status(201).json(message);
  } catch (error) {
    console.error('Message send error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Doubts
app.get('/api/doubts', authenticateToken, async (req, res) => {
  try {
    let query = {};
    // If student, only show their own doubts
    if (req.user.role === 'student') {
      query = { user: req.user.userId };
    }
    // Teachers see all doubts (or could filter by subject/status via query params)

    const doubts = await Doubt.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name username profile.class') // Get student details
      .limit(50);

    res.json(doubts);
  } catch (error) {
    console.error('Doubts fetch error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

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

    // Notify teachers
    // Find teachers of this subject or all teachers if subject is generic
    const teachers = await User.find({ role: 'teacher', $or: [{ subject: subject }, { subject: 'General' }] });

    // If no specific teachers found, notify all teachers
    const recipients = teachers.length > 0 ? teachers : await User.find({ role: 'teacher' });

    const notifications = recipients.map(t => ({
      user: t._id,
      message: `New doubt in ${subject}: ${question.substring(0, 30)}...`,
      type: 'info',
      link: '/teacher-doubts.html'
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json({ message: 'Doubt submitted successfully' });
  } catch (error) {
    console.error('Doubt submission error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// AI endpoint with Gemini API integration
app.post('/api/ai', authenticateToken, [
  body('question').notEmpty().trim().escape()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { subject = 'General', question, profile } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
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
