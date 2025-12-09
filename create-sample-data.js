
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://digloo:navnit@cluster0.a6xgm1l.mongodb.net/gurukulx?retryWrites=true&w=majority&appName=Cluster0';


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


userSchema.methods.comparePassword = async function(candidatePassword) {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(candidatePassword, this.password);
};


userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const User = mongoose.model('User', userSchema);


const sampleUsers = [

  {
    username: 'teacher1',
    password: 'teacher123',
    name: 'Ms. Priya Sharma',
    role: 'teacher',
    class: '6',
    email: 'priya.sharma@gurukulx.com',
    profile: { score: 1500, xp: 2500, level: 5, progress: 75, streak: 12, badges: ['Expert Teacher', 'Mentor'] }
  },
  {
    username: 'teacher2',
    password: 'teacher123',
    name: 'Mr. Rajesh Kumar',
    role: 'teacher',
    class: '7',
    email: 'rajesh.kumar@gurukulx.com',
    profile: { score: 1200, xp: 2000, level: 4, progress: 60, streak: 8, badges: ['Science Expert', 'Innovator'] }
  },
  {
    username: 'admin',
    password: 'admin123',
    name: 'Admin User',
    role: 'teacher',
    class: 'admin',
    email: 'admin@gurukulx.com',
    profile: { score: 2000, xp: 3000, level: 6, progress: 90, streak: 20, badges: ['Super Admin', 'Platform Manager'] }
  },
  

  {
    username: 'student1',
    password: 'student123',
    name: 'Arjun Singh',
    role: 'student',
    class: '6',
    email: 'arjun.singh@student.com',
    profile: { score: 850, xp: 1200, level: 3, progress: 45, streak: 5, badges: ['Math Whiz', 'Quick Learner'] }
  },
  {
    username: 'student2',
    password: 'student123',
    name: 'Priya Patel',
    role: 'student',
    class: '6',
    email: 'priya.patel@student.com',
    profile: { score: 920, xp: 1400, level: 3, progress: 55, streak: 7, badges: ['Science Star', 'Team Player'] }
  },
  {
    username: 'student3',
    password: 'student123',
    name: 'Rahul Verma',
    role: 'student',
    class: '7',
    email: 'rahul.verma@student.com',
    profile: { score: 750, xp: 1000, level: 2, progress: 35, streak: 3, badges: ['Curious Mind'] }
  },
  {
    username: 'student4',
    password: 'student123',
    name: 'Sneha Gupta',
    role: 'student',
    class: '6',
    email: 'sneha.gupta@student.com',
    profile: { score: 1100, xp: 1600, level: 4, progress: 65, streak: 10, badges: ['Top Performer', 'Creative Thinker'] }
  },
  {
    username: 'student5',
    password: 'student123',
    name: 'Vikram Joshi',
    role: 'student',
    class: '7',
    email: 'vikram.joshi@student.com',
    profile: { score: 680, xp: 900, level: 2, progress: 30, streak: 2, badges: ['Newcomer'] }
  }
];

async function createSampleData() {
  try {
    console.log('🚀 Creating sample data for GuruKulX...\n');
    

    console.log('1. Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    

    console.log('\n2. Clearing existing users...');
    await User.deleteMany({});
    console.log('✅ Existing users cleared');
    

    console.log('\n3. Creating sample users...');
    for (let i = 0; i < sampleUsers.length; i++) {
      const userData = sampleUsers[i];
      const user = new User(userData);
      await user.save();
      console.log(`✅ Created ${userData.role}: ${userData.username} (${userData.name})`);
    }
    
    console.log('\n4. Verifying created users...');
    const allUsers = await User.find({});
    console.log(`✅ Total users created: ${allUsers.length}`);
    

    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log('='.repeat(50));
    console.log('TEACHERS:');
    sampleUsers.filter(u => u.role === 'teacher').forEach(user => {
      console.log(`Username: ${user.username} | Password: ${user.password} | Name: ${user.name}`);
    });
    
    console.log('\nSTUDENTS:');
    sampleUsers.filter(u => u.role === 'student').forEach(user => {
      console.log(`Username: ${user.username} | Password: ${user.password} | Name: ${user.name}`);
    });
    
    console.log('\n🎉 Sample data created successfully!');
    console.log('\nYou can now test login with any of these credentials.');
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}


createSampleData();
