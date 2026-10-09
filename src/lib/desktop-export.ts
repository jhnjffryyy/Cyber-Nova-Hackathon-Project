/**
 * Utilities for Desktop packaging, Windows .EXE generation and launchers
 */

export const BATCH_LAUNCHER_SCRIPT = `@echo off
title StudyFlow AI Desktop
echo ========================================================
echo   Starting StudyFlow AI Desktop (.EXE Mode)
echo   Offline Academic Workspace & Local AI Engine
echo ========================================================
echo.

cd /d "%~dp0"

:: Check if node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is required to run the local background engine.
    echo Please install Node.js from https://nodejs.org/ (LTS version).
    pause
    exit /b 1
)

:: Install dependencies if node_modules is missing
if not exist "node_modules\\" (
    echo [1/3] First-time setup: installing dependencies...
    call npm install --legacy-peer-deps
)

echo [2/3] Launching background local engine...
start /b cmd /c "npm run dev > nul 2>&1"

:: Wait for Vite server
timeout /t 2 /nobreak > nul

echo [3/3] Launching StudyFlow standalone window...
:: Launches in frameless desktop application mode (without browser toolbars)
start msedge --app=http://localhost:3000 2>nul || start chrome --app=http://localhost:3000 2>nul || start http://localhost:3000

echo StudyFlow AI Desktop is running! You can keep this window minimized.
exit
`;

export const POWERSHELL_LAUNCHER_SCRIPT = `# StudyFlow AI Desktop PowerShell Runner
$host.UI.RawUI.WindowTitle = "StudyFlow AI Desktop"
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   StudyFlow AI Desktop (.EXE Standalone Mode)" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

Set-Location -Path $PSScriptRoot

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run dev"
Start-Sleep -Seconds 2

# Open in application window mode
Start-Process "msedge.exe" -ArgumentList "--app=http://localhost:3000" -ErrorAction SilentlyContinue
if (-not $?) {
    Start-Process "chrome.exe" -ArgumentList "--app=http://localhost:3000" -ErrorAction SilentlyContinue
}
`;

export const BUILD_WINDOWS_EXE_SCRIPT = `@echo off
title StudyFlow AI - Build Windows .EXE Installer
echo ========================================================
echo   StudyFlow AI - Windows .EXE Packaging Wizard
echo ========================================================
echo.
cd /d "%~dp0"

if not exist "node_modules\\" (
    echo [Setup] Installing base dependencies with legacy peer deps...
    call npm install --legacy-peer-deps
)

if not exist "node_modules\\electron\\" (
    echo [Setup] Installing Electron desktop tools...
    call npm install electron electron-builder --save-dev --legacy-peer-deps
)

echo [Step 1/2] Building production React web bundle...
call npm run build

if %errorlevel% neq 0 (
    echo [ERROR] Web build failed. Please check errors above.
    pause
    exit /b 1
)

echo.
echo [Step 2/2] Packaging standalone Windows executable...
call npx electron-builder --win portable

echo.
echo ========================================================
echo [SUCCESS] Your Windows .EXE is built!
echo Look inside the "dist-electron" folder:
echo -> StudyFlow Setup.exe or StudyFlow.exe
echo ========================================================
pause
`;

export const ELECTRON_MAIN_CJS_CONTENT = `const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: 'StudyFlow AI - Offline School Dashboard',
    icon: path.join(__dirname, '../public/icon.svg'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    autoHideMenuBar: false,
    frame: true,
    backgroundColor: '#0f172a',
  });

  // Try loading local production build or development URL
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    win.loadURL('http://localhost:3000');
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Open external links in user's default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
`;

export function triggerDownload(filename: string, content: string, contentType = 'text/plain') {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function isDesktopApp(): boolean {
  if (typeof window === 'undefined') return false;
  // Check for Electron user agent or standalone PWA
  const isElectron = navigator.userAgent.toLowerCase().includes('electron');
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  return isElectron || isStandalone;
}
