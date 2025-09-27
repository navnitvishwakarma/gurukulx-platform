@echo off
echo ========================================
echo Quick Fix for Netlify Deployment
echo ========================================
echo.

echo Step 1: Adding changes to Git...
git add .

echo Step 2: Committing changes...
git commit -m "Remove old functions and sqlite3 dependency - use MongoDB only"

echo Step 3: Pushing to GitHub...
git push origin main

echo.
echo ========================================
echo Changes pushed! Netlify will redeploy automatically.
echo ========================================
echo.
echo Your site will be available at:
echo https://gurukool-x.netlify.app
echo.
echo Test the API:
echo https://gurukool-x.netlify.app/api/health
echo.
pause
