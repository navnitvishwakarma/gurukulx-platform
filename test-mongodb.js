// Quick test script for MongoDB Atlas connection
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://digloo:navnit@cluster0.a6xgm1l.mongodb.net/gurukulx?retryWrites=true&w=majority&appName=Cluster0';

async function testMongoDBConnection() {
  try {
    console.log('Testing MongoDB Atlas connection...');
    console.log('URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in output
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB Atlas connection successful!');
    console.log('Database:', mongoose.connection.db.databaseName);
    console.log('Host:', mongoose.connection.host);
    console.log('Port:', mongoose.connection.port);
    
    // Test creating a simple document
    const testSchema = new mongoose.Schema({
      test: String,
      timestamp: { type: Date, default: Date.now }
    });
    
    const TestModel = mongoose.model('ConnectionTest', testSchema);
    
    const testDoc = new TestModel({
      test: 'GuruKulX connection test'
    });
    
    await testDoc.save();
    console.log('✅ Test document created successfully');
    
    // Clean up test document
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('✅ Test document cleaned up');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.error('💡 Check your username and password in the connection string');
    } else if (error.message.includes('network')) {
      console.error('💡 Check your IP whitelist in MongoDB Atlas');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('💡 Check your cluster URL and ensure the cluster is running');
    }
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed');
  }
}

// Run the test
testMongoDBConnection();
