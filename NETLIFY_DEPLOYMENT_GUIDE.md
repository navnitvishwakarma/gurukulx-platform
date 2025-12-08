# Complete Netlify Deployment Guide for GuruKulX

This guide will walk you through deploying your GuruKulX platform on Netlify with MongoDB Atlas backend and Gemini AI integration.

## Prerequisites Checklist

- [ ] GitHub account
- [ ] Netlify account (free)
- [ ] MongoDB Atlas account (free)
- [ ] Google account (for Gemini API)
- [ ] Your project files ready

## Step 1: Prepare Your Code for Git

### 1.1 Initialize Git Repository

```bash
# Navigate to your project folder
cd "C:\Users\NAVNIT KUMAR\OneDrive\Desktop\final p\public"

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: GuruKulX platform with MongoDB and AI"
```

### 1.2 Create .gitignore (if not exists)

```bash
# Create .gitignore file
echo "node_modules/" > .gitignore
echo ".env" >> .gitignore
echo "*.log" >> .gitignore
echo ".DS_Store" >> .gitignore
echo "Thumbs.db" >> .gitignore
```

## Step 2: Push to GitHub

### 2.1 Create GitHub Repository

1. Go to [GitHub.com](https://github.com)
2. Click "New repository"
3. Name: `gurukulx-platform`
4. Description: `GuruKulX - Gamified Environmental Education Platform`
5. Set to **Public** (for free Netlify deployment)
6. **Don't** initialize with README (you already have files)
7. Click "Create repository"

### 2.2 Push Your Code

```bash
# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/gurukulx-platform.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Set Up MongoDB Atlas

### 3.1 Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free"
3. Sign up with Google or email
4. Create account

### 3.2 Create Database Cluster

1. Click "New Project"
2. Name: `GuruKulX Platform`
3. Click "Create Project"

4. Choose "M0 Sandbox" (Free tier)
5. Click "Create"
6. Choose cloud provider (AWS recommended)
7. Select region closest to you
8. Click "Create Cluster"

### 3.3 Set Up Database Access

1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. Authentication Method: "Password"
4. Username: `gurukulx-user`
5. Password: Generate secure password (save it!)
6. Database User Privileges: "Read and write to any database"
7. Click "Add User"

### 3.4 Configure Network Access

1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. For development: Click "Add Current IP Address"
4. For production: Click "Allow Access from Anywhere" (0.0.0.0/0)
5. Click "Confirm"

### 3.5 Get Connection String

1. Go to "Clusters" in left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Driver: "Node.js"
5. Version: "4.1 or later"
6. Copy the connection string
7. Replace `<password>` with your database user password
8. Replace `<dbname>` with `gurukulx`

**Your connection string should look like:**
```
mongodb+srv://gurukulx-user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/gurukulx?retryWrites=true&w=majority
```

## Step 4: Deploy to Netlify

### 4.1 Connect to Netlify

1. Go to [Netlify.com](https://netlify.com)
2. Sign up/Login with GitHub
3. Click "New site from Git"
4. Choose "GitHub"
5. Authorize Netlify to access your repositories
6. Select your `gurukulx-platform` repository

### 4.2 Configure Build Settings

**Build Settings:**
- Build command: `npm install && npm run build`
- Publish directory: `.` (root directory)
- Node version: `18`

**Advanced Settings:**
- Click "Show advanced"
- Add environment variable: `NODE_VERSION` = `18`

### 4.3 Set Environment Variables

1. Go to Site settings > Environment variables
2. Click "Add variable" for each:

```
MONGODB_URI = mongodb+srv://gurukulx-user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/gurukulx?retryWrites=true&w=majority

JWT_SECRET = gurukulx-super-secret-jwt-key-2024

GEMINI_API_KEY = YOUR_GEMINI_API_KEY

NODE_ENV = production
```

### 4.4 Deploy

1. Click "Deploy site"
2. Wait for deployment (2-3 minutes)
3. Your site will be available at `https://your-site-name.netlify.app`

## Step 5: Verify Deployment

### 5.1 Test Basic Functionality

1. Visit your Netlify URL
2. Check if the homepage loads correctly
3. Test navigation between pages

### 5.2 Test API Endpoints

1. Visit `https://your-site.netlify.app/api/health`
2. Should return: `{"status":"OK","timestamp":"..."}`

### 5.3 Test User Registration

1. Go to login page
2. Try registering a new user
3. Check MongoDB Atlas dashboard for new documents

### 5.4 Test Default Users

**Login Credentials:**
- Admin: `admin` / `admin123`
- Student: `student` / `student123`

### 5.5 Test AI Features

1. Login as a student
2. Go to "Ask Doubt" or "AI Tutor"
3. Ask a question like "What is photosynthesis?"
4. Verify you get AI responses

## Step 6: Configure Custom Domain (Optional)

### 6.1 Add Custom Domain

1. In Netlify dashboard, go to Domain settings
2. Click "Add custom domain"
3. Enter your domain name
4. Follow DNS configuration instructions

### 6.2 Update DNS Records

1. Go to your domain registrar
2. Add CNAME record pointing to your Netlify site
3. Wait for DNS propagation (up to 24 hours)

## Step 7: Monitor and Maintain

### 7.1 Monitor Performance

1. **Netlify Analytics**: Available in dashboard
2. **Function Logs**: Check for errors
3. **MongoDB Atlas**: Monitor database usage

### 7.2 Regular Updates

1. Make changes to your code
2. Push to GitHub
3. Netlify automatically redeploys
4. Check deployment status

### 7.3 Environment Variables

- Update in Netlify dashboard when needed
- Redeploy after changes

## Troubleshooting Common Issues

### Issue 1: Build Fails

**Symptoms:** Deployment fails during build
**Solutions:**
- Check Node.js version (should be 18)
- Verify all dependencies in package.json
- Check build logs in Netlify dashboard

### Issue 2: API Not Working

**Symptoms:** API endpoints return errors
**Solutions:**
- Verify environment variables are set correctly
- Check function logs for errors
- Ensure MongoDB URI is correct

### Issue 3: Database Connection Failed

**Symptoms:** Users can't register/login
**Solutions:**
- Check MongoDB Atlas IP whitelist
- Verify username/password in connection string
- Ensure cluster is running

### Issue 4: AI Not Responding

**Symptoms:** AI tutor returns placeholder responses
**Solutions:**
- Verify Gemini API key is correct
- Check API key has proper permissions
- Review function logs for API errors

## Security Checklist

- [ ] Change default JWT secret in production
- [ ] Use strong database passwords
- [ ] Enable HTTPS (automatic with Netlify)
- [ ] Regular security updates
- [ ] Monitor access logs

## Performance Optimization

- [ ] Enable Netlify's CDN
- [ ] Optimize images and assets
- [ ] Monitor function execution time
- [ ] Consider upgrading to paid plan for better performance

## Support and Resources

### Getting Help

1. **Netlify Documentation**: [docs.netlify.com](https://docs.netlify.com)
2. **MongoDB Atlas Docs**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
3. **GitHub Issues**: Create issues in your repository
4. **Community Forums**: Stack Overflow, Reddit

### Useful Commands

```bash
# Test MongoDB connection locally
node test-mongodb.js

# Test Gemini API locally
node test-gemini.js

# Start local development server
npm run dev

# Check deployment status
netlify status

# View function logs
netlify functions:log
```

## Success Checklist

- [ ] Code pushed to GitHub
- [ ] MongoDB Atlas cluster created and configured
- [ ] Netlify site deployed successfully
- [ ] Environment variables set correctly
- [ ] API endpoints working
- [ ] User registration/login working
- [ ] AI tutoring functional
- [ ] All features tested

---

**Congratulations!** Your GuruKulX platform is now live on Netlify with a fully functional MongoDB backend and AI integration! 🎉

**Your live site:** `https://your-site-name.netlify.app`

**Next steps:**
1. Share your platform with students and teachers
2. Monitor usage and performance
3. Add more content and features
4. Consider upgrading to paid plans as you scale
