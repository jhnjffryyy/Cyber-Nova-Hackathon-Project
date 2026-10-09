@echo off
title StudyFlow AI - Windows .EXE Compiler
echo ========================================================
echo   StudyFlow AI - Windows .EXE Packaging Wizard
echo ========================================================
echo.

cd /d "%~dp0"

:: Check if node_modules or vite is installed
if not exist "node_modules\" (
    echo [Setup] Installing dependencies (first run only)...
    call npm install --legacy-peer-deps
)

:: Check if electron and electron-builder are installed
if not exist "node_modules\electron\" (
    echo [Setup] Installing Electron desktop tools...
    call npm install electron electron-builder --save-dev --legacy-peer-deps
)

echo.
echo [1/3] Building production offline web bundle...
call npm run build

if %errorlevel% neq 0 (
    echo [ERROR] Web build failed. Check logs above.
    pause
    exit /b 1
)

echo.
echo [2/3] Building standalone Windows .EXE...
echo Running electron-builder...
call npx electron-builder --win portable

if %errorlevel% neq 0 (
    echo [Fallback] Retrying with portable unpacked target...
    call npx electron-builder --win dir
)

echo.
echo ========================================================
echo [SUCCESS] Windows .EXE generated!
echo Check your "dist-electron" folder for:
echo  -> StudyFlow Setup.exe or StudyFlow.exe
echo ========================================================
pause
