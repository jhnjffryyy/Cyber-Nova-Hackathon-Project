import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Download,
  Terminal,
  Package,
  Layers,
  Sparkles,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  FileCode,
  PlayCircle,
  HardDrive,
  Cpu,
  Check,
  Laptop,
  FolderOpen,
  WifiOff,
  Code,
} from 'lucide-react';
import {
  BATCH_LAUNCHER_SCRIPT,
  BUILD_WINDOWS_EXE_SCRIPT,
  POWERSHELL_LAUNCHER_SCRIPT,
  triggerDownload,
} from '../lib/desktop-export';
import { qwenLLM } from '../lib/local-llm';
import { HardwareInfo } from '../types';

interface DesktopExeViewProps {
  isDesktopFrame: boolean;
  setIsDesktopFrame: (enabled: boolean) => void;
  onOpenModelModal: () => void;
}

export const DesktopExeView: React.FC<DesktopExeViewProps> = ({
  isDesktopFrame,
  setIsDesktopFrame,
  onOpenModelModal,
}) => {
  const [hardware, setHardware] = useState<HardwareInfo | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<'vscode' | 'exe' | 'scripts'>('vscode');

  useEffect(() => {
    qwenLLM.detectHardware().then(setHardware);
  }, []);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            VS Code & Windows .EXE Setup
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            How to run offline in VS Code on your laptop and package into a standalone Windows .EXE
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              triggerDownload('setup-offline.bat', `@echo off\ncd /d "%~dp0"\necho Installing offline dependencies...\ncall npm install\necho Building offline bundle...\ncall npm run build\necho Ready!\npause`, 'application/x-bat')
            }
            className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-emerald-300" />
            Download setup-offline.bat
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setViewTab('vscode')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            viewTab === 'vscode'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900'
          }`}
        >
          <Code className="w-4 h-4" />
          1. Run in VS Code (Offline Laptop)
        </button>
        <button
          onClick={() => setViewTab('exe')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            viewTab === 'exe'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900'
          }`}
        >
          <Package className="w-4 h-4" />
          2. Package into Windows .EXE
        </button>
        <button
          onClick={() => setViewTab('scripts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            viewTab === 'scripts'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900'
          }`}
        >
          <Terminal className="w-4 h-4" />
          3. Download Launcher Scripts
        </button>
      </div>

      {/* TAB 1: VS Code & Laptop Setup */}
      {viewTab === 'vscode' && (
        <div className="space-y-6">
          {/* Hero Banner: 100% Offline Promise */}
          <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 border border-emerald-900/60 shadow-md space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <WifiOff className="w-4 h-4" />
              Guaranteed Offline in VS Code
            </div>
            <h2 className="text-xl font-black text-white">
              Running StudyFlow AI locally on your Laptop with Zero Internet
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              Once you download this project folder onto your laptop and run <code className="text-emerald-400 font-mono">npm install</code> once, everything (Vite dev server, course timetables, schedule assistant, Clutch Notes generator, exam grading, and the local AI engine) runs completely isolated in your laptop memory and local browser. You can turn off Wi-Fi completely!
            </p>
          </div>

          {/* 4-Step VS Code Walkthrough */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
                  1
                </div>
                <h3 className="font-bold text-sm text-gray-900">
                  Open Project in VS Code
                </h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Extract the project files to a folder on your laptop (e.g. <code className="text-gray-800 font-mono">C:\StudyFlow</code>). In VS Code, click <strong>File &gt; Open Folder...</strong> and choose that folder.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
                  2
                </div>
                <h3 className="font-bold text-sm text-gray-900">
                  Install Node.js (If not already installed)
                </h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Make sure you have Node.js installed on your laptop from <a href="https://nodejs.org" target="_blank" rel="noreferrer" className="text-emerald-700 font-semibold underline">nodejs.org</a> (v18, v20, or v22 LTS). Check by opening terminal and typing:
              </p>
              <div className="flex items-center justify-between text-xs font-mono bg-gray-50 p-2 rounded-lg border border-gray-200">
                <span>node -v && npm -v</span>
                <button
                  onClick={() => handleCopy('node -v && npm -v', 'check-node')}
                  className="text-gray-400 hover:text-emerald-700"
                >
                  {copiedCode === 'check-node' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
                  3
                </div>
                <h3 className="font-bold text-sm text-gray-900">
                  Run One-Time Offline Cache (Terminal)
                </h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Press <kbd className="px-1.5 py-0.5 rounded bg-gray-100 border text-[11px] font-mono">Ctrl + `</kbd> in VS Code to open the terminal, then run:
              </p>
              <div className="flex items-center justify-between text-xs font-mono bg-gray-50 p-2 rounded-lg border border-gray-200">
                <span>npm install</span>
                <button
                  onClick={() => handleCopy('npm install', 'npm-install')}
                  className="text-gray-400 hover:text-emerald-700"
                >
                  {copiedCode === 'npm-install' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <span className="text-[10px] text-gray-400 block">
                This downloads and caches all offline packages into your local <code className="text-gray-600">node_modules/</code>.
              </span>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
                  4
                </div>
                <h3 className="font-bold text-sm text-gray-900">
                  Start Offline App (or Press F5!)
                </h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                In the VS Code terminal, start the server:
              </p>
              <div className="flex items-center justify-between text-xs font-mono bg-gray-50 p-2 rounded-lg border border-gray-200">
                <span>npm run dev</span>
                <button
                  onClick={() => handleCopy('npm run dev', 'npm-dev')}
                  className="text-gray-400 hover:text-emerald-700"
                >
                  {copiedCode === 'npm-dev' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-gray-500">
                Open <strong>http://localhost:3000</strong> in any browser (Chrome/Edge/Brave).
              </p>
            </div>
          </div>

          {/* VS Code F5 Preconfiguration Box */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-emerald-700" />
                <h3 className="font-black text-sm text-gray-900">
                  Preconfigured VS Code F5 Launcher Included
                </h3>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                .vscode/launch.json Ready
              </span>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              We already created <code className="text-emerald-800 font-mono font-bold">.vscode/launch.json</code> and <code className="text-emerald-800 font-mono font-bold">.vscode/tasks.json</code> in this project. When you open the folder in VS Code, you can literally just press <kbd className="px-2 py-1 rounded bg-gray-100 border text-xs font-bold text-gray-800">F5</kbd> on your keyboard! VS Code will start the server and open the app in a standalone offline window automatically.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: Packaging into Windows .EXE */}
      {viewTab === 'exe' && (
        <div className="space-y-6">
          {/* Windows Frame Simulated Toggle */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs font-bold text-gray-900">
                  Native Windows Application Window Simulation
                </h3>
              </div>
              <p className="text-[11px] text-gray-500">
                Enables a native Windows 11 style title bar (minimize, maximize, close) atop the app window
              </p>
            </div>
            <button
              onClick={() => setIsDesktopFrame(!isDesktopFrame)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isDesktopFrame
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isDesktopFrame ? 'Desktop Title Bar: Active' : 'Enable Desktop Title Bar'}
            </button>
          </div>

          {/* 3 Packaging Paths */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Method 1: Electron Builder to .EXE */}
            <div className="bg-white rounded-2xl border border-emerald-300/80 p-6 shadow-sm flex flex-col justify-between space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-800 text-white text-[10px] font-black rounded-bl-xl uppercase tracking-wider">
                STANDALONE .EXE
              </div>
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="font-black text-sm text-gray-900">
                  1. Compile to StudyFlow.exe
                </h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Uses Electron & Electron-Builder. Packages the Vite build, assets, and the local AI engine into an installer or portable <code className="text-emerald-800 font-bold">.exe</code> file.
                </p>

                <div className="mt-4 p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">Command in VS Code Terminal:</span>
                  <div className="flex items-center justify-between text-xs font-mono text-gray-800 bg-white p-2 rounded-lg border border-gray-200">
                    <span className="truncate">npm run build:exe</span>
                    <button
                      onClick={() => handleCopy('npm run build:exe', 'npm-build-exe')}
                      className="text-gray-400 hover:text-emerald-700 ml-2"
                    >
                      {copiedCode === 'npm-build-exe' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                <button
                  onClick={() =>
                    triggerDownload('build-exe.bat', BUILD_WINDOWS_EXE_SCRIPT, 'application/x-bat')
                  }
                  className="w-full py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download build-exe.bat
                </button>
                <span className="text-[10px] text-gray-400 text-center">
                  Output: dist-electron/StudyFlow.exe
                </span>
              </div>
            </div>

            {/* Method 2: Instant Standalone Batch Window */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mb-3">
                  <PlayCircle className="w-5 h-5" />
                </div>
                <h3 className="font-black text-sm text-gray-900">
                  2. Standalone Windows Launcher
                </h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Launch directly on any Windows PC without compiling! Double-clicking <code className="text-blue-800 font-bold">Start-StudyFlow.bat</code> boots the local engine and opens in a clean, chromeless app window.
                </p>
                <div className="mt-4 p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 space-y-1">
                  <div className="flex items-center gap-1.5 text-gray-800 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Zero compilation required
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-800 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Native app mode (--app flag)
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-800 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Instant startup & offline data
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                <button
                  onClick={() =>
                    triggerDownload('Start-StudyFlow.bat', BATCH_LAUNCHER_SCRIPT, 'application/x-bat')
                  }
                  className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  Download Start-StudyFlow.bat
                </button>
                <button
                  onClick={() =>
                    triggerDownload('Start-StudyFlow.ps1', POWERSHELL_LAUNCHER_SCRIPT, 'text/plain')
                  }
                  className="text-[11px] text-gray-500 hover:text-gray-900 text-center"
                >
                  Or download PowerShell (.ps1) script
                </button>
              </div>
            </div>

            {/* Method 3: Bat to Exe Converter */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
                  <FileCode className="w-5 h-5" />
                </div>
                <h3 className="font-black text-sm text-gray-900">
                  3. Bat To Exe Converter
                </h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Convert the provided <code className="text-gray-800 font-bold">Start-StudyFlow.bat</code> directly into a compiled Windows binary with custom icon using any standard Windows compiler.
                </p>
                <div className="mt-4 p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 space-y-1.5">
                  <span className="font-bold text-gray-800 block">Recommended Tools:</span>
                  <ul className="list-disc pl-4 space-y-1 text-[11px]">
                    <li>Bat To Exe Converter (Fatih Kodak)</li>
                    <li>Inno Setup (creates Windows Setup.exe)</li>
                    <li>Advanced BAT to EXE Converter</li>
                  </ul>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                <button
                  onClick={() =>
                    triggerDownload('StudyFlow-Launcher.bat', BATCH_LAUNCHER_SCRIPT, 'application/x-bat')
                  }
                  className="w-full py-2 border border-gray-300 hover:border-gray-400 bg-white text-gray-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-amber-600" />
                  Download Source Script
                </button>
                <span className="text-[10px] text-gray-400 text-center">
                  Embed icon.svg as .ico icon
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Script Downloads */}
      {viewTab === 'scripts' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-sm text-gray-900 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-600" />
            1-Click Downloadable Windows Automation Scripts
          </h3>
          <p className="text-xs text-gray-500">
            Download these scripts directly to your laptop's project folder:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col justify-between space-y-3">
              <div>
                <span className="font-bold text-xs text-gray-900 block">setup-offline.bat</span>
                <p className="text-[11px] text-gray-500 mt-1">
                  1-time laptop preparation: runs npm install and pre-builds assets so you can turn off Wi-Fi.
                </p>
              </div>
              <button
                onClick={() =>
                  triggerDownload('setup-offline.bat', `@echo off\ncd /d "%~dp0"\ncall npm install\ncall npm run build\necho Ready!\npause`, 'application/x-bat')
                }
                className="w-full py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download setup-offline.bat
              </button>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col justify-between space-y-3">
              <div>
                <span className="font-bold text-xs text-gray-900 block">Start-StudyFlow.bat</span>
                <p className="text-[11px] text-gray-500 mt-1">
                  Daily launcher: boots local server and opens frameless window.
                </p>
              </div>
              <button
                onClick={() =>
                  triggerDownload('Start-StudyFlow.bat', BATCH_LAUNCHER_SCRIPT, 'application/x-bat')
                }
                className="w-full py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download Start-StudyFlow.bat
              </button>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col justify-between space-y-3">
              <div>
                <span className="font-bold text-xs text-gray-900 block">build-exe.bat</span>
                <p className="text-[11px] text-gray-500 mt-1">
                  Compiles into true Windows StudyFlow.exe via electron-builder.
                </p>
              </div>
              <button
                onClick={() =>
                  triggerDownload('build-exe.bat', BUILD_WINDOWS_EXE_SCRIPT, 'application/x-bat')
                }
                className="w-full py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download build-exe.bat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Hardware Diagnostics */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-600" />
            <h3 className="font-black text-sm text-gray-900">
              Offline Diagnostics for your Laptop
            </h3>
          </div>
          <button
            onClick={onOpenModelModal}
            className="text-xs text-emerald-700 hover:underline font-bold"
          >
            Configure Engine Settings
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Storage Layer</span>
            <span className="font-bold text-gray-900 mt-0.5 block">LocalStorage / CacheStorage</span>
            <span className="text-[10px] text-emerald-600 mt-0.5 block">0% Cloud Reliance</span>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">GPU Acceleration</span>
            <span className="font-bold text-gray-900 mt-0.5 block">
              {hardware?.hasWebGPU ? 'WebGPU Enabled' : 'Standard Renderer'}
            </span>
            <span className="text-[10px] text-gray-500 mt-0.5 block">
              {hardware?.adapterName || 'Integrated Graphics'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">AI Intelligence</span>
            <span className="font-bold text-gray-900 mt-0.5 block">Local AI Engine</span>
            <span className="text-[10px] text-emerald-600 mt-0.5 block">Instant Zero-Delay Mode Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
