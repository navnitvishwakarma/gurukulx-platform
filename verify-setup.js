// Verification script for GuruKulX deployment setup
const fs = require('fs');
const path = require('path');

console.log('🔍 GuruKulX Deployment Verification');
console.log('=====================================\n');

// Check required files
const requiredFiles = [
  'package.json',
  'server-mongodb.js',
  'netlify/functions/server-mongodb.js',
  'netlify.toml',
  'models/User.js',
  'models/Assignment.js',
  'models/GameResult.js',
  'models/Feedback.js',
  'models/Doubt.js',
  'index.html',
  'js/main.js',
  'css/style.css'
];

console.log('📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

console.log('\n📦 Checking package.json dependencies...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDeps = ['express', 'mongoose', 'bcryptjs', 'jsonwebtoken', 'cors', 'helmet'];

requiredDeps.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
  } else {
    console.log(`❌ ${dep} - MISSING`);
    allFilesExist = false;
  }
});

console.log('\n🔧 Checking configuration...');

// Check netlify.toml
if (fs.existsSync('netlify.toml')) {
  const netlifyConfig = fs.readFileSync('netlify.toml', 'utf8');
  if (netlifyConfig.includes('server-mongodb')) {
    console.log('✅ netlify.toml configured for MongoDB');
  } else {
    console.log('❌ netlify.toml not configured for MongoDB');
    allFilesExist = false;
  }
} else {
  console.log('❌ netlify.toml missing');
  allFilesExist = false;
}

// Check main.js for API key
if (fs.existsSync('js/main.js')) {
  const mainJs = fs.readFileSync('js/main.js', 'utf8');
  if (mainJs.includes('AIzaSyALj_4-lYI__CEE9u14RkQAIYCsvN0H6Do')) {
    console.log('✅ Gemini API key configured in main.js');
  } else {
    console.log('❌ Gemini API key not found in main.js');
    allFilesExist = false;
  }
} else {
  console.log('❌ js/main.js missing');
  allFilesExist = false;
}

console.log('\n🌐 Checking environment configuration...');
if (fs.existsSync('env.example')) {
  const envExample = fs.readFileSync('env.example', 'utf8');
  if (envExample.includes('mongodb+srv://digloo:navnit@cluster0.a6xgm1l.mongodb.net')) {
    console.log('✅ MongoDB URI configured in env.example');
  } else {
    console.log('❌ MongoDB URI not found in env.example');
    allFilesExist = false;
  }
} else {
  console.log('❌ env.example missing');
  allFilesExist = false;
}

console.log('\n📊 Summary:');
if (allFilesExist) {
  console.log('🎉 All checks passed! Your project is ready for deployment.');
  console.log('\nNext steps:');
  console.log('1. Run: node test-mongodb.js (test database connection)');
  console.log('2. Run: node test-gemini.js (test AI integration)');
  console.log('3. Follow NETLIFY_DEPLOYMENT_GUIDE.md for deployment');
} else {
  console.log('❌ Some issues found. Please fix them before deploying.');
  console.log('\nTroubleshooting:');
  console.log('- Make sure all files are in the correct locations');
  console.log('- Check that package.json has all required dependencies');
  console.log('- Verify configuration files are properly set up');
}

console.log('\n=====================================');
