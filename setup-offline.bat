@echo off
title StudyFlow AI - Offline Laptop Setup
echo ========================================================
echo   StudyFlow AI - 1-Time Offline Setup for Laptop
echo ========================================================
echo.
echo This script prepares your laptop so StudyFlow AI will run
echo 100%% OFFLINE without any internet connection.
echo.

cd /d "%~dp0"

echo [1/3] Checking Node.js installation...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on your system!
    echo Please download and install Node.js LTS from: https://nodejs.org
    pause
    exit /b 1
)
node -v
npm -v

echo.
echo [2/3] Installing and caching all offline dependencies...
call npm install --legacy-peer-deps

if %errorlevel% neq 0 (
    echo [WARNING] npm install finished with warnings, retrying standard install...
    call npm install
)

echo.
echo [3/3] Pre-building local production offline assets...
call npm run build

echo.
echo ========================================================
echo [SUCCESS] Your laptop is now 100%% offline ready!
echo.
echo How to launch on your laptop:
echo 1. In VS Code: Press Ctrl + ` to open terminal, then run: npm run dev
echo    OR press F5 in VS Code!
echo 2. Outside VS Code: Double-click "Start-StudyFlow.bat"
echo 3. To make a Windows .EXE: Run "build-exe.bat"
echo ========================================================
pause
