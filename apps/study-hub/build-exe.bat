@echo off
title Study Hub - Windows .EXE Compiler
echo ========================================================
echo   Study Hub - Windows .EXE Packaging Wizard
echo ========================================================
echo.

cd /d "%~dp0"

:: Install dependencies (includes electron + electron-builder devDeps)
if not exist "node_modules\" (
    echo [Setup] Installing dependencies (first run only)...
    call npm install
)

echo.
echo [1/2] Building production offline web bundle + Windows .EXE...
call npm run build:exe

if %errorlevel% neq 0 (
    echo [Fallback] Retrying with unpacked dir target...
    call npx electron-builder --win dir
)

echo.
echo ========================================================
echo [SUCCESS] Windows .EXE generated!
echo Check your "dist-electron" folder for:
echo  -> Study-Hub-Setup-^<version^>.exe      (installer)
echo  -> Study-Hub-Portable-^<version^>.exe   (portable)
echo  -> win-unpacked\Study Hub.exe           (unpacked)
echo ========================================================
pause
