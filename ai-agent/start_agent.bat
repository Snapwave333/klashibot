@echo off
echo ============================================================
echo Kalshi AI Trading Agent Launcher
echo ============================================================
echo.
echo Checking Ollama status...
curl -s http://localhost:11434/api/tags >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Ollama is not running!
    echo Please start Ollama first: ollama serve
    pause
    exit /b 1
)
echo [OK] Ollama is running
echo.

echo Starting MCP server in background...
cd ..\mcp-server-kalshi
start /B "MCP Server" cmd /c "uv run start > mcp-server.log 2>&1"
cd ..\ai-agent
timeout /t 3 /nobreak >nul
echo [OK] MCP server starting...
echo.

echo Launching AI Agent...
python agent.py

echo.
echo Agent stopped.
pause
