@echo off
echo ========================================
echo   LiteEvent - Starting All Servers
echo ========================================
echo.

REM Check if PostgreSQL is running
echo [1/4] Checking PostgreSQL...
pg_isready -q
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PostgreSQL is not running!
    echo Please start PostgreSQL service first.
    echo.
    echo Windows: net start postgresql-x64-14
    pause
    exit /b 1
)
echo ✓ PostgreSQL is running
echo.

REM Check if Redis is running (optional)
echo [2/4] Checking Redis...
redis-cli ping >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Redis is not running
    echo This is optional, but recommended for session management.
    echo.
) else (
    echo ✓ Redis is running
    echo.
)

REM Start API server in new terminal
echo [3/4] Starting API Server...
start "LiteEvent API" cmd /k "cd /d %~dp0api && npm run dev"
timeout /t 3 /nobreak >nul
echo ✓ API Server starting on http://localhost:5000
echo.

REM Start Web server in new terminal
echo [4/4] Starting Web App...
start "LiteEvent Web" cmd /k "cd /d %~dp0web && npm run dev"
echo ✓ Web App starting on http://localhost:3000
echo.

echo ========================================
echo   All servers are starting!
echo ========================================
echo.
echo API:  http://localhost:5000
echo Web:  http://localhost:3000
echo Mobile: Use Expo Go app
echo.
echo Press any key to close this window...
pause >nul
