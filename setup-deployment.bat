@echo off
echo ========================================
echo GuruKulX Deployment Setup Script
echo ========================================
echo.

echo Step 1: Initializing Git repository...
git init
if %errorlevel% neq 0 (
    echo Error: Git not found. Please install Git first.
    pause
    exit /b 1
)

echo Step 2: Adding files to Git...
git add .
if %errorlevel% neq 0 (
    echo Error: Failed to add files to Git.
    pause
    exit /b 1
)

echo Step 3: Creating initial commit...
git commit -m "Initial commit: GuruKulX platform with MongoDB and AI"
if %errorlevel% neq 0 (
    echo Error: Failed to create commit.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Git setup complete!
echo ========================================
echo.
echo Next steps:
echo 1. Create a GitHub repository
echo 2. Add your GitHub remote:
echo    git remote add origin https://github.com/YOUR_USERNAME/gurukulx-platform.git
echo 3. Push to GitHub:
echo    git push -u origin main
echo.
echo Then follow the NETLIFY_DEPLOYMENT_GUIDE.md for complete deployment steps.
echo.
pause
