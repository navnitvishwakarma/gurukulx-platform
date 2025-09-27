@echo off
echo 🚀 Setting up sample data for GuruKulX...
echo.

echo 1. Installing dependencies...
call npm install
echo.

echo 2. Creating sample users in MongoDB...
call node create-sample-data.js
echo.

echo 3. Testing login functionality...
call node test-login.js
echo.

echo 4. Testing API health...
call node test-api.js
echo.

echo ✅ Setup complete!
echo.
echo 📋 You can now test login with these credentials:
echo    Teachers: teacher1/teacher123, teacher2/teacher123, admin/admin123
echo    Students: student1/student123, student2/student123, student3/student123
echo.
echo 🌐 Open test-login.html in your browser to test the login form
echo.
pause
