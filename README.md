# GuruKulX - Gamified Environmental Education Platform

A comprehensive educational platform that makes environmental education engaging for schools and colleges through gamification, AI tutoring, and interactive learning experiences.

## Features

- 🎮 **Gamified Learning**: Earn XP, unlock badges, maintain streaks
- 🌱 **Environmental Focus**: Every activity promotes environmental awareness
- 👥 **Multi-role Support**: Separate interfaces for students and teachers
- 🤖 **AI Tutoring**: Integrated AI assistance for instant help
- 📊 **Progress Tracking**: Detailed analytics and reporting
- 🌐 **Multi-language**: Support for English, Hindi, and Odia
- 📱 **Responsive Design**: Works on all devices

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas (cloud) / MongoDB (local)
- **Authentication**: JWT tokens
- **AI Integration**: Google Gemini API
- **Deployment**: Netlify Functions

## Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd gurukulx-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up MongoDB Atlas**
   - Follow the [MongoDB Setup Guide](MONGODB_SETUP.md)
   - Get your MongoDB Atlas connection string

4. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your MongoDB URI and other values
   ```

5. **Start the development server**
   ```bash
   # For MongoDB version
   node server-mongodb.js
   
   # Or update package.json to add:
   # "dev:mongodb": "node server-mongodb.js"
   ```

5. **Open your browser**
   Navigate to `http://localhost:8080`

### Default Login Credentials

- **Admin/Teacher**: 
  - Username: `admin`
  - Password: `admin123`

- **Student**: 
  - Username: `student`
  - Password: `student123`

## Deployment on Netlify

### Method 1: Deploy from Git Repository

1. **Push your code to GitHub/GitLab/Bitbucket**

2. **Connect to Netlify**
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Connect your repository

3. **Configure build settings**
   - Build command: `npm install && npm run build`
   - Publish directory: `.` (root directory)
   - Node version: `18`

4. **Set environment variables**
   In Netlify dashboard, go to Site settings > Environment variables:
   ```
   MONGODB_URI=mongodb+srv://digloo:password@cluster0.a6xgm1l.mongodb.net/gurukulx?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=gurukulx-super-secret-jwt-key-2024
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY
   NODE_ENV=production
   ```

5. **Update netlify.toml redirect**
   Change the API redirect to use the MongoDB version:
   ```toml
   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/server-mongodb"
     status = 200
   ```

5. **Deploy**
   - Click "Deploy site"
   - Wait for deployment to complete

### Method 2: Deploy via Netlify CLI

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

4. **Deploy**
   ```bash
   netlify deploy --prod
   ```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string | Yes | - |
| `JWT_SECRET` | Secret key for JWT tokens | Yes | - |
| `GEMINI_API_KEY` | Google Gemini AI API key | No | - |
| `NODE_ENV` | Environment (development/production) | No | development |
| `PORT` | Server port | No | 8080 |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile

### Game & Learning
- `POST /api/game/results` - Save game results
- `GET /api/leaderboard` - Get leaderboard
- `POST /api/ai` - AI tutoring endpoint

### Teacher Features
- `GET /api/assignments` - Get assignments
- `POST /api/assignments` - Create assignment

### Feedback & Support
- `POST /api/feedback` - Submit feedback
- `POST /api/doubts` - Submit doubt

## Project Structure

```
gurukulx-platform/
├── assets/                 # Static assets (images, avatars)
├── css/                   # Stylesheets
├── js/                    # JavaScript files
├── games/                 # Game-specific HTML files
├── subjects/              # Subject-specific pages
├── netlify/
│   └── functions/
│       └── server.js      # Netlify Functions backend
├── server.js              # Local development server
├── package.json           # Dependencies and scripts
├── netlify.toml          # Netlify configuration
├── env.example           # Environment variables template
└── README.md             # This file
```

## Database Schema

The application uses MongoDB with the following collections:

- **users**: User accounts, profiles, and progress data
- **assignments**: Teacher-created assignments
- **game_results**: Game performance data
- **feedback**: User feedback submissions
- **doubts**: Student doubt submissions

For detailed schema information, see [MongoDB Setup Guide](MONGODB_SETUP.md#database-schema).

## AI Integration

The platform integrates with Google Gemini AI for:
- Instant tutoring and Q&A
- Subject-specific assistance
- Personalized learning recommendations

To enable AI features:
1. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Set the `GEMINI_API_KEY` environment variable
3. The AI features will automatically activate

## Customization

### Adding New Subjects
1. Create subject HTML file in `subjects/`
2. Add subject to navigation in `js/main.js`
3. Update subject mapping in assignment controls

### Adding New Games
1. Create game HTML file in `games/`
2. Add game to subject mapping in `js/main.js`
3. Implement game logic and scoring

### Styling
- Main styles: `css/style.css`
- Component-specific styles in `css/` directory
- Uses CSS custom properties for theming

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Create an issue in the repository
- Contact: support@gurukulx.com

## Roadmap

- [ ] Real-time multiplayer features
- [ ] Advanced analytics dashboard
- [ ] Mobile app development
- [ ] Integration with school management systems
- [ ] Advanced AI features with machine learning
- [ ] Offline mode support
