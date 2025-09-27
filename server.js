const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

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

// Database setup
const db = new sqlite3.Database(':memory:', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    class TEXT,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // User profiles table
  db.run(`CREATE TABLE IF NOT EXISTS user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    score INTEGER DEFAULT 0,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    progress INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    badges TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Assignments table
  db.run(`CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL,
    class_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    game TEXT NOT NULL,
    due_date TEXT,
    notes TEXT,
    status TEXT DEFAULT 'assigned',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users (id)
  )`);

  // Feedback table
  db.run(`CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Doubts table
  db.run(`CREATE TABLE IF NOT EXISTS doubts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    subject TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Game results table
  db.run(`CREATE TABLE IF NOT EXISTS game_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    game_type TEXT NOT NULL,
    score INTEGER NOT NULL,
    xp_earned INTEGER DEFAULT 0,
    progress_earned INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Create default admin user
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.run(`INSERT OR IGNORE INTO users (username, password, name, role, class, email) 
          VALUES ('admin', ?, 'Admin User', 'teacher', 'admin', 'admin@gurukulx.com')`, 
          [hashedPassword]);

  // Create sample student
  const studentPassword = bcrypt.hashSync('student123', 10);
  db.run(`INSERT OR IGNORE INTO users (username, password, name, role, class, email) 
          VALUES ('student', ?, 'Sample Student', 'student', '6', 'student@gurukulx.com')`, 
          [studentPassword]);

  console.log('Database initialized successfully');
}

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
    db.get('SELECT id FROM users WHERE username = ?', [username], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (row) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      db.run(
        'INSERT INTO users (username, password, name, role, class, email) VALUES (?, ?, ?, ?, ?, ?)',
        [username, hashedPassword, name, role, userClass, email],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create user' });
          }

          const userId = this.lastID;

          // Create user profile
          db.run(
            'INSERT INTO user_profiles (user_id, score, xp, level, progress, streak) VALUES (?, 0, 0, 1, 0, 0)',
            [userId],
            (err) => {
              if (err) {
                console.error('Error creating user profile:', err);
              }
            }
          );

          res.status(201).json({ message: 'User created successfully', userId });
        }
      );
    });
  } catch (error) {
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

    db.get(
      'SELECT * FROM users WHERE username = ?',
      [username],
      async (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Get user profile
        db.get(
          'SELECT * FROM user_profiles WHERE user_id = ?',
          [user.id],
          (err, profile) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }

            const token = jwt.sign(
              { 
                userId: user.id, 
                username: user.username, 
                role: user.role,
                class: user.class 
              },
              JWT_SECRET,
              { expiresIn: '24h' }
            );

            res.json({
              token,
              user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role,
                class: user.class,
                email: user.email,
                profile: profile || { score: 0, xp: 0, level: 1, progress: 0, streak: 0 }
              }
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// User profile routes
app.get('/api/user/profile', authenticateToken, (req, res) => {
  db.get(
    'SELECT u.*, p.* FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE u.id = ?',
    [req.user.userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        class: user.class,
        email: user.email,
        profile: {
          score: user.score || 0,
          xp: user.xp || 0,
          level: user.level || 1,
          progress: user.progress || 0,
          streak: user.streak || 0,
          badges: user.badges || '[]'
        }
      });
    }
  );
});

app.put('/api/user/profile', authenticateToken, [
  body('score').optional().isInt({ min: 0 }),
  body('xp').optional().isInt({ min: 0 }),
  body('level').optional().isInt({ min: 1 }),
  body('progress').optional().isInt({ min: 0, max: 100 }),
  body('streak').optional().isInt({ min: 0 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }

  const { score, xp, level, progress, streak, badges } = req.body;
  const updates = [];
  const values = [];

  if (score !== undefined) {
    updates.push('score = ?');
    values.push(score);
  }
  if (xp !== undefined) {
    updates.push('xp = ?');
    values.push(xp);
  }
  if (level !== undefined) {
    updates.push('level = ?');
    values.push(level);
  }
  if (progress !== undefined) {
    updates.push('progress = ?');
    values.push(progress);
  }
  if (streak !== undefined) {
    updates.push('streak = ?');
    values.push(streak);
  }
  if (badges !== undefined) {
    updates.push('badges = ?');
    values.push(JSON.stringify(badges));
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(req.user.userId);

  db.run(
    `UPDATE user_profiles SET ${updates.join(', ')} WHERE user_id = ?`,
    values,
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Profile updated successfully' });
    }
  );
});

// Game results
app.post('/api/game/results', authenticateToken, [
  body('gameType').notEmpty().trim().escape(),
  body('score').isInt({ min: 0 }),
  body('xpEarned').optional().isInt({ min: 0 }),
  body('progressEarned').optional().isInt({ min: 0, max: 100 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }

  const { gameType, score, xpEarned = 0, progressEarned = 0 } = req.body;

  db.run(
    'INSERT INTO game_results (user_id, game_type, score, xp_earned, progress_earned) VALUES (?, ?, ?, ?, ?)',
    [req.user.userId, gameType, score, xpEarned, progressEarned],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Update user profile
      db.run(
        'UPDATE user_profiles SET score = score + ?, xp = xp + ?, progress = MIN(100, progress + ?), updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [score, xpEarned, progressEarned, req.user.userId],
        (err) => {
          if (err) {
            console.error('Error updating user profile:', err);
          }
        }
      );

      res.json({ message: 'Game results saved successfully', resultId: this.lastID });
    }
  );
});

// Leaderboard
app.get('/api/leaderboard', (req, res) => {
  db.all(
    `SELECT u.name, p.score, p.badges, p.level 
     FROM users u 
     JOIN user_profiles p ON u.id = p.user_id 
     WHERE u.role = 'student' 
     ORDER BY p.score DESC 
     LIMIT 50`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

// Assignments
app.get('/api/assignments', authenticateToken, (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied' });
  }

  db.all(
    'SELECT * FROM assignments WHERE teacher_id = ? ORDER BY created_at DESC',
    [req.user.userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

app.post('/api/assignments', authenticateToken, [
  body('class_name').notEmpty().trim().escape(),
  body('subject').notEmpty().trim().escape(),
  body('game').notEmpty().trim().escape(),
  body('due_date').optional().trim().escape(),
  body('notes').optional().trim().escape()
], (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }

  const { class_name, subject, game, due_date, notes } = req.body;

  db.run(
    'INSERT INTO assignments (teacher_id, class_name, subject, game, due_date, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [req.user.userId, class_name, subject, game, due_date, notes],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ message: 'Assignment created successfully', assignmentId: this.lastID });
    }
  );
});

// Feedback
app.post('/api/feedback', [
  body('name').notEmpty().trim().escape(),
  body('email').optional().isEmail().normalizeEmail(),
  body('message').notEmpty().trim().escape()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }

  const { name, email, message } = req.body;

  db.run(
    'INSERT INTO feedback (name, email, message) VALUES (?, ?, ?)',
    [name, email, message],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ message: 'Feedback submitted successfully' });
    }
  );
});

// Doubts
app.post('/api/doubts', authenticateToken, [
  body('subject').notEmpty().trim().escape(),
  body('question').notEmpty().trim().escape()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }

  const { subject, question } = req.body;

  db.run(
    'INSERT INTO doubts (user_id, subject, question) VALUES (?, ?, ?)',
    [req.user.userId, subject, question],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ message: 'Doubt submitted successfully' });
    }
  );
});

// AI endpoint (placeholder - integrate with your Gemini API)
app.post('/api/ai', authenticateToken, [
  body('subject').notEmpty().trim().escape(),
  body('question').notEmpty().trim().escape()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }

  const { subject, question, profile } = req.body;

  // This is a placeholder - you can integrate with Gemini API here
  const response = `This is a placeholder AI response for the question: "${question}" in subject: "${subject}". 
  In a real implementation, this would call the Gemini API with the user's profile information.`;

  res.json({ answer: response });
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
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});
