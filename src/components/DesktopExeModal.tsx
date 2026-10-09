import React, { useState } from 'react';
import {
  X,
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
  FolderDown,
  PlayCircle,
  HardDrive,
} from 'lucide-react';
import {
  BATCH_LAUNCHER_SCRIPT,
  BUILD_WINDOWS_EXE_SCRIPT,
  POWERSHELL_LAUNCHER_SCRIPT,
  triggerDownload,
} from '../lib/desktop-export';

interface DesktopExeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDesktopFrame: boolean;
  setIsDesktopFrame: (enabled: boolean) => void;
}

export const DesktopExeModal: React.FC<DesktopExeModalProps> = ({
  isOpen,
  onClose,
  isDesktopFrame,
  setIsDesktopFrame,
}) => {
  const [activeTab, setActiveTab] = useState<'methods' | 'buildScript' | 'batchScript'>('methods');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Run & Implement as Windows .EXE
                <span className="text-[10px] uppercase px-2 py-0.5 rounded font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Options to compile, launch, and package StudyFlow AI into a standalone Windows Desktop Executable
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-800 px-6 pt-3 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('methods')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'methods'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            Packaging Options
          </button>
          <button
            onClick={() => setActiveTab('batchScript')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'batchScript'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            Instant Launcher (.BAT)
          </button>
          <button
            onClick={() => setActiveTab('buildScript')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'buildScript'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Compile to .EXE (Electron)
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick toggle: Simulated Desktop Window Frame */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                Simulate Native Windows App Window Bar
              </span>
              <p className="text-[11px] text-slate-400">
                Display the Windows Desktop title bar with minimize, maximize, and close controls in this UI
              </p>
            </div>
            <button
              onClick={() => setIsDesktopFrame(!isDesktopFrame)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isDesktopFrame
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isDesktopFrame ? 'Window Frame: ON' : 'Window Frame: OFF'}
            </button>
          </div>

          {activeTab === 'methods' && (
            <div className="space-y-4">
              {/* Option 1: Electron Builder to actual .EXE */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 hover:border-emerald-500/60 transition-all space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <HardDrive className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">
                        Method 1: Compile to Real Windows .EXE (Electron Builder)
                      </h3>
                      <span className="text-[11px] text-emerald-400 font-semibold">
                        Produces standalone StudyFlow.exe (Portable / Installer)
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      triggerDownload('build-exe.bat', BUILD_WINDOWS_EXE_SCRIPT, 'application/x-bat')
                    }
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download build-exe.bat
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  We preconfigured <code className="text-emerald-300">electron/main.cjs</code> and added{' '}
                  <code className="text-emerald-300">"build:exe"</code> into <code className="text-slate-300">package.json</code>. You can build the genuine Windows executable with 2 simple commands:
                </p>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 flex items-center justify-between">
                  <span>npm install electron electron-builder --save-dev && npm run build:exe</span>
                  <button
                    onClick={() =>
                      handleCopy(
                        'npm install electron electron-builder --save-dev && npm run build:exe',
                        'electron-cmd'
                      )
                    }
                    className="text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    {copiedCode === 'electron-cmd' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Target output folder:{' '}
                  <span className="text-slate-300 font-mono">dist-electron/StudyFlow Setup.exe</span>
                </p>
              </div>

              {/* Option 2: 1-Click Desktop Batch / Portable EXE Wrapper */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                      <PlayCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">
                        Method 2: Standalone App Window Launcher (Start-StudyFlow.bat)
                      </h3>
                      <span className="text-[11px] text-indigo-400 font-semibold">
                        Instant zero-compile desktop experience on Windows
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      triggerDownload('Start-StudyFlow.bat', BATCH_LAUNCHER_SCRIPT, 'application/x-bat')
                    }
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg flex items-center gap-1.5 border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    Download .BAT
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Double-clicking <code className="text-indigo-300">Start-StudyFlow.bat</code> launches StudyFlow in a frameless native Windows application window (Edge/Chrome app mode) without browser toolbars, tabs, or address bars.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() =>
                      triggerDownload('Start-StudyFlow.ps1', POWERSHELL_LAUNCHER_SCRIPT, 'text/plain')
                    }
                    className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download PowerShell (.ps1) version
                  </button>
                </div>
              </div>

              {/* Option 3: Convert BAT to EXE */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">
                      Method 3: Turn Start-StudyFlow.bat into StudyFlow.exe with Bat To Exe Converter
                    </h3>
                    <span className="text-[11px] text-amber-400 font-semibold">
                      Fastest single-click executable converter
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  You can convert <code className="text-slate-300">Start-StudyFlow.bat</code> directly into an executable binary (<code className="text-emerald-300">StudyFlow.exe</code>) using free tools like <strong>Bat To Exe Converter</strong> or <strong>Inno Setup</strong>. You can even assign our app icon (<code className="text-slate-300">public/icon.svg</code> or <code className="text-slate-300">.ico</code>) to it!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'batchScript' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">
                  File content: <code className="text-emerald-400">Start-StudyFlow.bat</code>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(BATCH_LAUNCHER_SCRIPT, 'batch-script')}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 border border-slate-700"
                  >
                    {copiedCode === 'batch-script' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Copy
                  </button>
                  <button
                    onClick={() =>
                      triggerDownload('Start-StudyFlow.bat', BATCH_LAUNCHER_SCRIPT, 'application/x-bat')
                    }
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download File
                  </button>
                </div>
              </div>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-80">
                {BATCH_LAUNCHER_SCRIPT}
              </pre>
            </div>
          )}

          {activeTab === 'buildScript' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">
                  File content: <code className="text-emerald-400">build-exe.bat</code>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(BUILD_WINDOWS_EXE_SCRIPT, 'build-script')}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 border border-slate-700"
                  >
                    {copiedCode === 'build-script' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Copy
                  </button>
                  <button
                    onClick={() =>
                      triggerDownload('build-exe.bat', BUILD_WINDOWS_EXE_SCRIPT, 'application/x-bat')
                    }
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download File
                  </button>
                </div>
              </div>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-80">
                {BUILD_WINDOWS_EXE_SCRIPT}
              </pre>
            </div>
          )}

          {/* Privacy Guarantee */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Offline Capability:</strong> StudyFlow stores all data in local storage and runs its local AI engine offline. No cloud account or external API keys needed.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900 sticky bottom-0">
          <span className="text-xs text-slate-500">
            Executable ready in Windows 10/11
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
          >
            Got it, Continue
          </button>
        </div>
      </div>
    </div>
  );
};
