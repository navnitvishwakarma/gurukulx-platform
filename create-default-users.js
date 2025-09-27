// Script to manually create default users in MongoDB Atlas
const mongoose = require('mongoose');

// MongoDB connection string from your env.example
const MONGODB_URI = 'mongodb+srv://digloo:navnit@cluster0.a6xgm1l.mongodb.net/gurukulx?retryWrites=true&w=majority&appName=Cluster0';

// User schema
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

const User = mongoose.model('User', userSchema);

async function createDefaultUsers() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB Atlas');

    // Check if admin user exists
    const adminExists = await User.findOne({ username: 'admin' });
    if (adminExists) {
      console.log('✅ Admin user already exists');
    } else {
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
      console.log('✅ Admin user created successfully');
    }

    // Check if student user exists
    const studentExists = await User.findOne({ username: 'student' });
    if (studentExists) {
      console.log('✅ Student user already exists');
    } else {
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
      console.log('✅ Student user created successfully');
    }

    // List all users
    const allUsers = await User.find({}, 'username name role email');
    console.log('\n📋 All users in database:');
    allUsers.forEach(user => {
      console.log(`- ${user.username} (${user.name}) - ${user.role}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.error('💡 Check your MongoDB username and password');
    } else if (error.message.includes('network')) {
      console.error('💡 Check your IP whitelist in MongoDB Atlas');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('💡 Check your cluster URL and ensure the cluster is running');
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the script
createDefaultUsers();
