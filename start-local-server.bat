@echo off
echo Starting local server for testing...
echo.
echo The server will be available at: http://localhost:8000
echo.
echo Test pages:
echo - http://localhost:8000/test-local-server.html
echo - http://localhost:8000/test-api-browser.html
echo.
echo Press Ctrl+C to stop the server
echo.
python -m http.server 8000
