@echo off
echo ========================================
echo Kalshi Trading Dashboard - Full Stack
echo ========================================
echo.
echo Starting services...
echo.

REM Start WebSocket Bridge in new window
echo Starting Kalashi Unified Launcher...
start "Kalashi Launcher" cmd /k "python launcher.py"

echo.
echo Launcher started. Please control the system from the GUI.
echo.
echo Press any key to close this wrapper...
pause >nul
