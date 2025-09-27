# MongoDB Atlas Setup Guide for GuruKulX

This guide will help you set up MongoDB Atlas as your database for the GuruKulX platform.

## Prerequisites

- A MongoDB Atlas account (free tier available)
- Node.js 18+ installed locally
- Your GuruKulX project files

## Step 1: Create MongoDB Atlas Account

1. **Go to MongoDB Atlas**
   - Visit [mongodb.com/atlas](https://www.mongodb.com/atlas)
   - Click "Try Free" to create an account
   - Sign up with your email or Google account

2. **Create a New Project**
   - Click "New Project"
   - Enter project name: "GuruKulX Platform"
   - Click "Next"

## Step 2: Create a Database Cluster

1. **Choose a Plan**
   - Select "M0 Sandbox" (Free tier)
   - Click "Create"

2. **Configure Cluster**
   - Choose a cloud provider (AWS, Google Cloud, or Azure)
   - Select a region close to your users
   - Keep default cluster name or change it
   - Click "Create Cluster"

3. **Wait for Cluster Creation**
   - This process takes 3-5 minutes
   - You'll see "Your cluster is ready" when complete

## Step 3: Set Up Database Access

1. **Create Database User**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Enter username: `gurukulx-user`
   - Generate a secure password (save it!)
   - Set privileges to "Read and write to any database"
   - Click "Add User"

2. **Whitelist IP Addresses**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - For development: Click "Add Current IP Address"
   - For production: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

## Step 4: Get Connection String

1. **Connect to Your Cluster**
   - Go to "Clusters" in the left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Select "Node.js" as driver
   - Copy the connection string

2. **Update Connection String**
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `gurukulx` (or your preferred database name)
   - Example: `mongodb+srv://gurukulx-user:yourpassword@cluster0.abc123.mongodb.net/gurukulx?retryWrites=true&w=majority`

## Step 5: Configure Your Application

### Local Development

1. **Create .env file**
   ```bash
   cp env.example .env
   ```

2. **Update .env with your MongoDB URI**
   ```env
   MONGODB_URI=mongodb+srv://gurukulx-user:yourpassword@cluster0.abc123.mongodb.net/gurukulx?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key
   GEMINI_API_KEY=your-gemini-api-key
   NODE_ENV=development
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start the server**
   ```bash
   # Use the MongoDB version
   node server-mongodb.js
   
   # Or update package.json scripts
   npm run dev:mongodb
   ```

### Netlify Deployment

1. **Set Environment Variables in Netlify**
   - Go to your Netlify dashboard
   - Navigate to Site settings > Environment variables
   - Add the following variables:
   ```
   MONGODB_URI=mongodb+srv://gurukulx-user:yourpassword@cluster0.abc123.mongodb.net/gurukulx?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key
   GEMINI_API_KEY=your-gemini-api-key
   NODE_ENV=production
   ```

2. **Update netlify.toml**
   ```toml
   [build]
     command = "npm install && npm run build"
     publish = "."

   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/server-mongodb"
     status = 200
   ```

3. **Deploy**
   - Push your changes to Git
   - Netlify will automatically redeploy

## Step 6: Verify Database Connection

1. **Check Health Endpoint**
   - Visit `https://your-site.netlify.app/api/health`
   - Should return: `{"status":"OK","timestamp":"..."}`

2. **Test User Registration**
   - Try registering a new user
   - Check MongoDB Atlas dashboard for new documents

3. **Check Default Users**
   - Default users (admin/student) are created automatically
   - Login with: `admin`/`admin123` or `student`/`student123`

## Database Schema

Your MongoDB database will contain these collections:

### Users Collection
```javascript
{
  _id: ObjectId,
  username: String,
  password: String (hashed),
  name: String,
  role: String (student/teacher),
  class: String,
  email: String,
  profile: {
    score: Number,
    xp: Number,
    level: Number,
    progress: Number,
    streak: Number,
    badges: [String]
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Game Results Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref to Users),
  game_type: String,
  score: Number,
  xp_earned: Number,
  progress_earned: Number,
  time_taken: Number,
  difficulty: String,
  completed: Boolean,
  metadata: Object,
  createdAt: Date
}
```

### Assignments Collection
```javascript
{
  _id: ObjectId,
  teacher: ObjectId (ref to Users),
  class_name: String,
  subject: String,
  game: String,
  due_date: Date,
  notes: String,
  status: String,
  submissions: [Object],
  createdAt: Date
}
```

### Feedback Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  message: String,
  type: String,
  status: String,
  priority: String,
  response: Object,
  createdAt: Date
}
```

### Doubts Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref to Users),
  subject: String,
  question: String,
  answer: String,
  status: String,
  priority: String,
  answered_by: ObjectId (ref to Users),
  answered_at: Date,
  tags: [String],
  upvotes: Number,
  downvotes: Number,
  createdAt: Date
}
```

## Monitoring and Maintenance

### MongoDB Atlas Dashboard
- Monitor database performance
- View query analytics
- Set up alerts for unusual activity
- Monitor storage usage

### Database Indexes
The application automatically creates indexes for:
- User queries by username
- Game results by user and date
- Assignments by teacher and date
- Leaderboard queries by score

### Backup and Security
- MongoDB Atlas provides automatic backups
- Enable additional security features in Atlas
- Regularly rotate database passwords
- Monitor access logs

## Troubleshooting

### Common Issues

1. **Connection Timeout**
   - Check IP whitelist in Network Access
   - Verify connection string format
   - Ensure cluster is running

2. **Authentication Failed**
   - Verify username and password
   - Check database user permissions
   - Ensure password doesn't contain special characters that need encoding

3. **Database Not Found**
   - MongoDB creates databases automatically
   - Check connection string includes database name
   - Verify user has access to the database

4. **Slow Queries**
   - Check MongoDB Atlas performance advisor
   - Add appropriate indexes
   - Monitor query patterns

### Getting Help

1. **MongoDB Atlas Documentation**
   - [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
   - [MongoDB University](https://university.mongodb.com/)

2. **Community Support**
   - MongoDB Community Forum
   - Stack Overflow with `mongodb` and `atlas` tags

3. **Application Logs**
   - Check Netlify function logs
   - Monitor MongoDB Atlas logs

## Cost Optimization

### Free Tier (M0)
- 512 MB storage
- Shared RAM and vCPU
- Good for development and small applications

### Paid Tiers
- M2: $9/month - 2 GB storage
- M5: $25/month - 5 GB storage
- M10: $57/month - 10 GB storage

### Tips to Stay on Free Tier
- Use efficient queries
- Implement data archiving
- Monitor storage usage
- Use indexes effectively

## Security Best Practices

1. **Database Access**
   - Use least privilege principle
   - Regularly rotate passwords
   - Monitor access logs

2. **Network Security**
   - Restrict IP access when possible
   - Use VPC peering for production
   - Enable encryption in transit

3. **Application Security**
   - Use environment variables for secrets
   - Implement proper input validation
   - Use HTTPS for all connections

---

**Congratulations!** Your GuruKulX platform is now connected to MongoDB Atlas with a scalable, cloud-based database solution.
