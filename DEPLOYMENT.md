# GuruKulX Deployment Guide

This guide will walk you through deploying your GuruKulX educational platform on Netlify with a backend API.

## Prerequisites

- A GitHub, GitLab, or Bitbucket account
- A Netlify account (free tier available)
- Node.js 18+ installed locally (for testing)
- A Google account (for Gemini AI API key)

## Step 1: Prepare Your Repository

1. **Initialize Git** (if not already done)
   ```bash
   git init
   git add .
   git commit -m "Initial commit: GuruKulX platform"
   ```

2. **Create a GitHub repository**
   - Go to GitHub and create a new repository
   - Push your code:
   ```bash
   git remote add origin https://github.com/yourusername/gurukulx-platform.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Get API Keys

### Google Gemini AI API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key (you'll need this later)

## Step 3: Deploy to Netlify

### Option A: Deploy from Git Repository (Recommended)

1. **Go to Netlify**
   - Visit [netlify.com](https://netlify.com)
   - Sign up/Login with your account

2. **Create New Site**
   - Click "New site from Git"
   - Choose your Git provider (GitHub/GitLab/Bitbucket)
   - Select your GuruKulX repository

3. **Configure Build Settings**
   - Build command: `npm install && npm run build`
   - Publish directory: `.` (root directory)
   - Node version: `18`

4. **Set Environment Variables**
   - Go to Site settings > Environment variables
   - Add the following variables:
   ```
   MONGODB_URI=mongodb+srv://digloo:navnit@cluster0.a6xgm1l.mongodb.net/gurukulx?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=gurukulx-super-secret-jwt-key-2024
   GEMINI_API_KEY=AIzaSyALj_4-lYI__CEE9u14RkQAIYCsvN0H6Do
   NODE_ENV=production
   ```

5. **Deploy**
   - Click "Deploy site"
   - Wait for deployment to complete (usually 2-3 minutes)

### Option B: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize the site**
   ```bash
   netlify init
   ```
   - Choose "Create & configure a new site"
   - Enter a site name (e.g., "gurukulx-platform")
   - Choose your team

4. **Deploy**
   ```bash
   netlify deploy --prod
   ```

## Step 4: Configure Custom Domain (Optional)

1. **In Netlify Dashboard**
   - Go to Site settings > Domain management
   - Click "Add custom domain"
   - Enter your domain name
   - Follow the DNS configuration instructions

2. **Update DNS Records**
   - Add a CNAME record pointing to your Netlify site
   - Wait for DNS propagation (up to 24 hours)

## Step 5: Test Your Deployment

1. **Visit your site**
   - Go to your Netlify URL (e.g., `https://your-site-name.netlify.app`)
   - Test the main functionality

2. **Test Authentication**
   - Try registering a new user
   - Test login with default credentials:
     - Admin: `admin` / `admin123`
     - Student: `student` / `student123`

3. **Test API Endpoints**
   - Check if the API is working: `https://your-site.netlify.app/api/health`
   - Test game functionality
   - Verify AI features (if Gemini API key is set)

## Step 6: Monitor and Maintain

### Monitoring
- **Netlify Analytics**: Available in the dashboard
- **Function Logs**: Check function logs for errors
- **Performance**: Monitor site speed and uptime

### Updates
- Push changes to your Git repository
- Netlify will automatically redeploy
- Check deployment status in the dashboard

### Environment Variables
- Update environment variables in Netlify dashboard
- Redeploy after making changes

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (should be 18+)
   - Verify all dependencies are in package.json
   - Check build logs in Netlify dashboard

2. **API Not Working**
   - Verify environment variables are set
   - Check function logs for errors
   - Ensure JWT_SECRET is set

3. **Database Issues**
   - SQLite database resets on each function call
   - Consider upgrading to a persistent database for production
   - Check function timeout settings

4. **CORS Errors**
   - Verify CORS configuration in server.js
   - Check if frontend and backend are on same domain

### Getting Help

1. **Check Logs**
   - Netlify Function logs in dashboard
   - Browser console for frontend errors

2. **Test Locally**
   - Run `npm run dev` to test locally
   - Compare with deployed version

3. **Community Support**
   - Netlify Community Forum
   - GitHub Issues
   - Stack Overflow

## Production Considerations

### Security
- Change default JWT_SECRET
- Use strong, unique passwords
- Enable HTTPS (automatic with Netlify)
- Regular security updates

### Performance
- Enable Netlify's CDN
- Optimize images and assets
- Monitor function execution time
- Consider upgrading to paid plan for better performance

### Scalability
- Monitor function usage
- Consider database upgrade for high traffic
- Implement caching strategies
- Load testing for peak usage

## Next Steps

1. **Customize the Platform**
   - Update branding and colors
   - Add your school's content
   - Customize subjects and games

2. **Add Features**
   - Real-time notifications
   - Advanced analytics
   - Mobile app integration

3. **Scale Up**
   - Upgrade to paid Netlify plan
   - Add persistent database
   - Implement advanced monitoring

## Support

For deployment issues:
- Check this guide first
- Review Netlify documentation
- Create an issue in the repository
- Contact support: support@gurukulx.com

---

**Congratulations!** Your GuruKulX platform is now live on Netlify with a fully functional backend API. Students and teachers can start using the platform immediately.
