
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

async function testRegistration() {
  try {
    console.log('🔍 Testing user registration...\n');
    

    console.log('1. Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    

    const testUser = {
      username: 'testuser123',
      password: 'password123',
      name: 'Test User',
      role: 'student',
      class: '6',
      email: 'test@example.com'
    };
    
    console.log('\n2. Testing user creation...');
    console.log('Test data:', { ...testUser, password: '***' });
    

    const existingUser = await User.findOne({ username: testUser.username });
    if (existingUser) {
      console.log('⚠️  User already exists, deleting...');
      await User.deleteOne({ username: testUser.username });
    }
    

    const user = new User({
      username: testUser.username,
      password: testUser.password,
      name: testUser.name,
      role: testUser.role,
      class: testUser.class,
      email: testUser.email,
      profile: { score: 0, xp: 0, level: 1, progress: 0, streak: 0, badges: [] }
    });
    
    await user.save();
    console.log('✅ User created successfully');
    console.log('User ID:', user._id);
    

    console.log('\n3. Testing password verification...');
    const isValidPassword = await user.comparePassword('password123');
    console.log('Password verification:', isValidPassword ? '✅ Valid' : '❌ Invalid');
    

    console.log('\n4. Testing public profile...');
    const publicProfile = user.getPublicProfile();
    console.log('Public profile:', publicProfile);
    

    console.log('\n5. Cleaning up test user...');
    await User.deleteOne({ username: testUser.username });
    console.log('✅ Test user deleted');
    
    console.log('\n🎉 All tests passed! Registration should work.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}


testRegistration();
