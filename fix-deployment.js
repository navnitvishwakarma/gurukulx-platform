
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Netlify deployment issues...\n');


const requiredFiles = [
  'package.json',
  'netlify.toml',
  'netlify/functions/api.js',
  'index.html'
];

console.log('📁 Checking required files...');
let allGood = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allGood = false;
  }
});


console.log('\n📦 Checking package.json...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const requiredDeps = [
  'express', 'cors', 'helmet', 'bcryptjs', 'jsonwebtoken', 
  'mongoose', 'dotenv', 'express-rate-limit', 'express-validator'
];

requiredDeps.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
  } else {
    console.log(`❌ ${dep} - MISSING`);
    allGood = false;
  }
});


console.log('\n⚙️ Checking netlify.toml...');
const netlifyConfig = fs.readFileSync('netlify.toml', 'utf8');

if (netlifyConfig.includes('functions/api')) {
  console.log('✅ netlify.toml configured for api function');
} else {
  console.log('❌ netlify.toml not configured correctly');
  allGood = false;
}

if (netlifyConfig.includes('NODE_VERSION = "18"')) {
  console.log('✅ Node version specified');
} else {
  console.log('❌ Node version not specified');
  allGood = false;
}


console.log('\n🔧 Checking Netlify function...');
const functionFile = fs.readFileSync('netlify/functions/api.js', 'utf8');

if (functionFile.includes('mongoose')) {
  console.log('✅ MongoDB integration in function');
} else {
  console.log('❌ MongoDB not integrated in function');
  allGood = false;
}

if (functionFile.includes('express')) {
  console.log('✅ Express server in function');
} else {
  console.log('❌ Express server not in function');
  allGood = false;
}

console.log('\n📊 Summary:');
if (allGood) {
  console.log('🎉 All checks passed! Your deployment should work now.');
  console.log('\nNext steps:');
  console.log('1. Commit and push your changes:');
  console.log('   git add .');
  console.log('   git commit -m "Fix Netlify deployment"');
  console.log('   git push origin main');
  console.log('2. Netlify will automatically redeploy');
  console.log('3. Check your site URL for the API health endpoint');
} else {
  console.log('❌ Some issues found. Please fix them before deploying.');
}

console.log('\n🔗 Test your deployment:');
console.log('- Health check: https://your-site.netlify.app/api/health');
console.log('- Should return: {"status":"OK","timestamp":"..."}');
