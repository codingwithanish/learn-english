@echo off
echo 🔥 Killing everything on port 8000...
echo.

REM Kill Docker containers
echo 🐳 Stopping Docker containers...
docker-compose -f docker-compose.simple.yml down 2>nul
docker-compose -f docker-compose.scaled.yml down 2>nul
docker-compose down 2>nul

REM Kill containers using port 8000
for /f "tokens=*" %%i in ('docker ps -q --filter "publish=8000"') do (
    echo Killing Docker container: %%i
    docker kill %%i 2>nul
    docker rm %%i 2>nul
)

REM Kill Windows processes
echo 🖥️ Killing Windows processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    if not "%%a"=="0" (
        echo Killing process: %%a
        taskkill /F /PID %%a 2>nul
    )
)

REM Kill WSL processes
echo 🐧 Killing WSL processes...
wsl pkill -f ".*:8000" 2>nul

REM Kill Python/FastAPI processes
echo 🐍 Killing Python processes...
taskkill /F /IM python.exe 2>nul
taskkill /F /IM pythonw.exe 2>nul

echo.
echo ✅ Done! Checking if port 8000 is free...
timeout /t 2 /nobreak >nul

netstat -ano | findstr :8000
if %ERRORLEVEL% EQU 0 (
    echo ❌ Port 8000 is still in use. Try running as Administrator.
) else (
    echo ✅ Port 8000 is now free!
)

echo.
echo Press any key to exit...
pause >nul