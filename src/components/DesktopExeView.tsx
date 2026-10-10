import React, { useState } from 'react';
import {
  Download,
  Terminal,
  Package,
  Layers,
  CheckCircle2,
  Copy,
  FileCode,
  PlayCircle,
  Check,
  Laptop,
  WifiOff,
} from 'lucide-react';
import {
  BATCH_LAUNCHER_SCRIPT,
  BUILD_WINDOWS_EXE_SCRIPT,
  POWERSHELL_LAUNCHER_SCRIPT,
  triggerDownload,
} from '../lib/desktop-export';
import { Badge, Button, Card, CardHeader, IconButton, PageHeader, SegmentedControl } from './ui';

interface DesktopExeViewProps {
  isDesktopFrame: boolean;
  setIsDesktopFrame: (enabled: boolean) => void;
  onOpenModelModal: () => void;
}

const codeBlockClass =
  'font-mono text-[13px] bg-subtle border border-line rounded-control p-3 overflow-x-auto text-ink';

const setupScript = `@echo off\ncd /d "%~dp0"\necho Installing offline dependencies...\ncall npm install\necho Building offline bundle...\ncall npm run build\necho Ready!\npause`;

export const DesktopExeView: React.FC<DesktopExeViewProps> = ({
  isDesktopFrame,
  setIsDesktopFrame,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<'vscode' | 'exe' | 'scripts'>('vscode');

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CopyBtn = ({ code, id }: { code: string; id: string }) => (
    <IconButton
      icon={copiedCode === id ? Check : Copy}
      label={copiedCode === id ? 'Copied' : 'Copy'}
      size="sm"
      onClick={() => handleCopy(code, id)}
    />
  );

  const Step = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
    <Card>
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-7 h-7 rounded-control bg-accent-soft text-accent-ink text-[13px] font-semibold grid place-items-center shrink-0">
          {n}
        </div>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
      </div>
      <div className="text-[13px] text-ink-2 leading-relaxed space-y-2">{children}</div>
    </Card>
  );

  const CmdRow = ({ cmd, id }: { cmd: string; id: string }) => (
    <div className="flex items-center justify-between gap-2 font-mono text-[13px] bg-subtle border border-line rounded-control px-3 py-2 text-ink">
      <span>{cmd}</span>
      <CopyBtn code={cmd} id={id} />
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Desktop app"
        description="Run Study Hub offline in VS Code, or package it as a standalone Windows app."
        actions={
          <Button
            icon={Download}
            onClick={() => triggerDownload('setup-offline.bat', setupScript, 'application/x-bat')}
          >
            Download setup-offline.bat
          </Button>
        }
      />

      <div className="mb-5">
        <SegmentedControl
          ariaLabel="Desktop setup section"
          value={viewTab}
          onChange={(v) => setViewTab(v as typeof viewTab)}
          options={[
            { value: 'vscode', label: 'Run in VS Code' },
            { value: 'exe', label: 'Package as .exe' },
            { value: 'scripts', label: 'Launcher scripts' },
          ]}
        />
      </div>

      {/* Tab: VS Code */}
      {viewTab === 'vscode' && (
        <div className="space-y-6">
          <Card padding="lg" className="border-accent/40">
            <div className="flex items-center gap-2 text-accent-ink text-[13px] font-medium mb-2">
              <WifiOff className="w-4 h-4" aria-hidden />
              Fully offline
            </div>
            <h2 className="font-display text-lg font-semibold text-ink">
              Run locally on your laptop with zero internet
            </h2>
            <p className="text-sm text-ink-2 leading-relaxed mt-2 max-w-2xl">
              Once you run <code className="font-mono text-[13px]">npm install</code> once,
              everything — the dev server, timetable, schedule assistant, Clutch Notes
              generator, exam grading and the local engine — runs entirely in your
              laptop's memory. You can turn Wi-Fi off completely.
            </p>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Step n={1} title="Open the project in VS Code">
              <p>
                Extract the project folder to your laptop (e.g.{' '}
                <code className="font-mono">C:\StudyHub</code>), then in VS Code choose{' '}
                <strong>File &gt; Open Folder…</strong>.
              </p>
            </Step>
            <Step n={2} title="Install Node.js if needed">
              <p>
                Get a Node.js LTS (v18+) from{' '}
                <a
                  href="https://nodejs.org"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent-ink underline"
                >
                  nodejs.org
                </a>
                . Check with:
              </p>
              <CmdRow cmd="node -v && npm -v" id="check-node" />
            </Step>
            <Step n={3} title="Install dependencies once">
              <p>
                Open the VS Code terminal (<kbd className="px-1.5 py-0.5 rounded bg-subtle border border-line text-xs font-mono">Ctrl + `</kbd>) and run:
              </p>
              <CmdRow cmd="npm install" id="npm-install" />
              <p className="text-xs text-ink-3">
                This caches all offline packages into <code className="font-mono">node_modules/</code>.
              </p>
            </Step>
            <Step n={4} title="Start the app">
              <p>Run in the VS Code terminal:</p>
              <CmdRow cmd="npm run dev" id="npm-dev" />
              <p className="text-xs text-ink-3">
                Then open <strong>http://localhost:3000</strong> in any browser.
              </p>
            </Step>
          </div>

          <Card>
            <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-accent" aria-hidden />
                <h3 className="text-sm font-semibold text-ink">
                  Preconfigured VS Code launcher included
                </h3>
              </div>
              <Badge tone="accent">.vscode ready</Badge>
            </div>
            <p className="text-[13px] text-ink-2 leading-relaxed">
              <code className="font-mono">.vscode/launch.json</code> and{' '}
              <code className="font-mono">.vscode/tasks.json</code> ship with the project —
              press <kbd className="px-1.5 py-0.5 rounded bg-subtle border border-line text-xs font-mono">F5</kbd>{' '}
              and VS Code starts the server and opens the app in a standalone window.
            </p>
          </Card>
        </div>
      )}

      {/* Tab: .exe */}
      {viewTab === 'exe' && (
        <div className="space-y-6">
          <Card className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-accent" aria-hidden />
                <h3 className="text-sm font-semibold text-ink">
                  Simulated Windows title bar
                </h3>
              </div>
              <p className="text-[13px] text-ink-3 mt-0.5">
                Shows a Windows 11 style title bar (minimize, maximize, close) atop the app.
              </p>
            </div>
            <Button
              variant={isDesktopFrame ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setIsDesktopFrame(!isDesktopFrame)}
            >
              {isDesktopFrame ? 'Desktop title bar: on' : 'Enable desktop title bar'}
            </Button>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {/* Method 1 */}
            <Card className="border-accent/40 relative">
              <div className="absolute top-0 right-0 px-2.5 py-1 bg-accent text-on-accent text-xs font-semibold rounded-bl-control rounded-tr-card">
                Standalone .exe
              </div>
              <div className="w-10 h-10 rounded-control bg-accent-soft text-accent-ink grid place-items-center mb-3">
                <Package className="w-5 h-5" aria-hidden />
              </div>
              <h3 className="text-sm font-semibold text-ink">Compile to StudyHub.exe</h3>
              <p className="text-[13px] text-ink-2 mt-2 leading-relaxed">
                Electron + electron-builder packages the Vite build, assets and local
                engine into an installer or portable <code className="font-mono">.exe</code>.
              </p>
              <div className="mt-4">
                <span className="text-xs text-ink-3 block mb-1.5">Command:</span>
                <CmdRow cmd="npm run build:exe" id="npm-build-exe" />
              </div>
              <div className="pt-3 mt-4 border-t border-line space-y-2">
                <Button
                  size="sm"
                  icon={Download}
                  className="w-full"
                  onClick={() =>
                    triggerDownload('build-exe.bat', BUILD_WINDOWS_EXE_SCRIPT, 'application/x-bat')
                  }
                >
                  Download build-exe.bat
                </Button>
                <p className="text-xs text-ink-3 text-center">
                  Output: dist-electron/StudyHub.exe
                </p>
              </div>
            </Card>

            {/* Method 2 */}
            <Card>
              <div className="w-10 h-10 rounded-control bg-subtle text-ink-2 grid place-items-center mb-3">
                <PlayCircle className="w-5 h-5" aria-hidden />
              </div>
              <h3 className="text-sm font-semibold text-ink">Standalone window launcher</h3>
              <p className="text-[13px] text-ink-2 mt-2 leading-relaxed">
                Double-clicking <code className="font-mono">Start-StudyFlow.bat</code> boots
                the local engine and opens a clean, chromeless app window — no compiling.
              </p>
              <div className="mt-4 rounded-control bg-subtle p-3 space-y-1.5 text-[13px] text-ink-2">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" aria-hidden /> Zero compilation
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" aria-hidden /> Native app mode
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" aria-hidden /> Instant startup
                </div>
              </div>
              <div className="pt-3 mt-4 border-t border-line space-y-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Download}
                  className="w-full"
                  onClick={() =>
                    triggerDownload('Start-StudyFlow.bat', BATCH_LAUNCHER_SCRIPT, 'application/x-bat')
                  }
                >
                  Download Start-StudyFlow.bat
                </Button>
                <button
                  type="button"
                  onClick={() =>
                    triggerDownload('Start-StudyFlow.ps1', POWERSHELL_LAUNCHER_SCRIPT, 'text/plain')
                  }
                  className="block mx-auto text-[13px] text-accent-ink hover:underline"
                >
                  Or download the PowerShell (.ps1) script
                </button>
              </div>
            </Card>

            {/* Method 3 */}
            <Card>
              <div className="w-10 h-10 rounded-control bg-subtle text-ink-2 grid place-items-center mb-3">
                <FileCode className="w-5 h-5" aria-hidden />
              </div>
              <h3 className="text-sm font-semibold text-ink">Bat-to-exe converter</h3>
              <p className="text-[13px] text-ink-2 mt-2 leading-relaxed">
                Convert <code className="font-mono">Start-StudyFlow.bat</code> into a
                compiled binary with a custom icon using a standard converter.
              </p>
              <div className="mt-4 rounded-control bg-subtle p-3 text-[13px] text-ink-2">
                <span className="font-medium text-ink block mb-1">Recommended tools:</span>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Bat To Exe Converter</li>
                  <li>Inno Setup (Windows Setup.exe)</li>
                  <li>Advanced BAT to EXE Converter</li>
                </ul>
              </div>
              <div className="pt-3 mt-4 border-t border-line space-y-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Download}
                  className="w-full"
                  onClick={() =>
                    triggerDownload('StudyHub-Launcher.bat', BATCH_LAUNCHER_SCRIPT, 'application/x-bat')
                  }
                >
                  Download source script
                </Button>
                <p className="text-xs text-ink-3 text-center">Embed icon.svg as .ico</p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab: scripts */}
      {viewTab === 'scripts' && (
        <Card>
          <CardHeader
            title="Downloadable launcher scripts"
            icon={Terminal}
            description="Save these to your project folder."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(
              [
                ['setup-offline.bat', 'One-time setup: runs npm install and pre-builds assets.', setupScript],
                ['Start-StudyFlow.bat', 'Daily launcher: boots the server and opens a frameless window.', BATCH_LAUNCHER_SCRIPT],
                ['build-exe.bat', 'Compiles a real Windows .exe via electron-builder.', BUILD_WINDOWS_EXE_SCRIPT],
              ] as const
            ).map(([name, desc, script]) => (
              <div
                key={name}
                className="rounded-control border border-line p-4 flex flex-col gap-3"
              >
                <div>
                  <span className="text-sm font-medium text-ink font-mono">{name}</span>
                  <p className="text-[13px] text-ink-3 mt-1">{desc}</p>
                </div>
                <Button
                  size="sm"
                  icon={Download}
                  className="mt-auto"
                  onClick={() => triggerDownload(name, script, 'application/x-bat')}
                >
                  Download {name}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
