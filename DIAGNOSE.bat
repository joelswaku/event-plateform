@echo off
echo ========================================
echo   LiteEvent - System Diagnostic
echo ========================================
echo.

echo [Checking Services]
echo.

echo 1. PostgreSQL:
pg_isready
if %ERRORLEVEL% EQU 0 (
    echo ✓ PostgreSQL is running
) else (
    echo ✗ PostgreSQL is NOT running
    echo   Fix: net start postgresql-x64-14
)
echo.

echo 2. Redis:
redis-cli ping 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Redis is running
) else (
    echo ✗ Redis is NOT running (optional)
    echo   Fix: redis-server
)
echo.

echo 3. API Server:
curl -s http://localhost:5000/api/auth/me >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✓ API Server is running on port 5000
) else (
    echo ✗ API Server is NOT running
    echo   Fix: cd api && npm run dev
)
echo.

echo 4. Web Server:
curl -s http://localhost:3000 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✓ Web Server is running on port 3000
) else (
    echo ✗ Web Server is NOT running
    echo   Fix: cd web && npm run dev
)
echo.

echo [Checking Configuration]
echo.

echo 5. API .env file:
if exist "api\.env" (
    echo ✓ api\.env exists
) else (
    echo ✗ api\.env is missing
    echo   Fix: Copy api\.env.example to api\.env
)
echo.

echo 6. Web .env.local file:
if exist "web\.env.local" (
    echo ✓ web\.env.local exists
) else (
    echo ✗ web\.env.local is missing
    echo   Fix: Copy web\.env.example to web\.env.local
)
echo.

echo 7. Mobile .env.local file:
if exist "eventapp-mobile\.env.local" (
    echo ✓ eventapp-mobile\.env.local exists
) else (
    echo ✗ eventapp-mobile\.env.local is missing
    echo   Fix: Copy eventapp-mobile\.env.example to eventapp-mobile\.env.local
)
echo.

echo [Network Information]
echo.
echo Your IP Address:
ipconfig | findstr /C:"IPv4" | findstr /V "127.0.0.1"
echo.
echo Mobile app should use this IP in EXPO_PUBLIC_API_URL
echo Example: http://192.168.0.63:5000/api
echo.

echo ========================================
echo   Diagnostic Complete
echo ========================================
echo.

pause
