@echo off
title StudyFlow AI Desktop Launcher
echo ========================================================
echo   Starting StudyFlow AI Desktop (.EXE Mode)
echo   100%% Offline Academic Workspace & Qwen 2.5 3B Engine
echo ========================================================
echo.

cd /d "%~dp0"

:: Check if node_modules exists
if not exist "node_modules\" (
    echo [1/3] First run setup: installing dependencies...
    call npm install --legacy-peer-deps
)

echo [2/3] Launching background local engine...
start /b cmd /c "npm run dev > nul 2>&1"

:: Wait for Vite local server to initialize
timeout /t 2 /nobreak > nul

echo [3/3] Launching StudyFlow standalone window...
:: Launches in frameless application window (without browser navigation bars)
start msedge --app=http://localhost:3000 2>nul || start chrome --app=http://localhost:3000 2>nul || start http://localhost:3000

echo StudyFlow is now running! Keep this window minimized.
exit
