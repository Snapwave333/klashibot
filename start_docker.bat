@echo off
echo ==========================================
echo    Kalashi Docker Launcher
echo ==========================================
echo.
echo [1/2] Building and Starting Docker Containers...
docker-compose up -d --build

echo.
echo [2/2] Waiting for services to stabilize...
timeout /t 5

echo.
echo ==========================================
echo    Stack is RUNNING!
echo    Frontend: http://localhost:3003
echo    Backend:  ws://localhost:8766
echo ==========================================
echo.
pause
