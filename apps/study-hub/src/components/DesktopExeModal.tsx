import React, { useState } from 'react';
import {
  Monitor,
  Download,
  Terminal,
  Layers,
  CheckCircle2,
  Copy,
  ShieldCheck,
  FileCode,
  PlayCircle,
  HardDrive,
} from 'lucide-react';
import {
  BATCH_LAUNCHER_SCRIPT,
  BUILD_WINDOWS_EXE_SCRIPT,
  POWERSHELL_LAUNCHER_SCRIPT,
  triggerDownload,
} from '../lib/desktop-export';
import { Badge, Button, IconButton, Modal, SegmentedControl } from './ui';

interface DesktopExeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDesktopFrame: boolean;
  setIsDesktopFrame: (enabled: boolean) => void;
}

const codeBlockClass =
  'font-mono text-[13px] bg-subtle border border-line rounded-control p-3 overflow-x-auto whitespace-pre-wrap text-ink';

export const DesktopExeModal: React.FC<DesktopExeModalProps> = ({
  isOpen,
  onClose,
  isDesktopFrame,
  setIsDesktopFrame,
}) => {
  const [activeTab, setActiveTab] = useState<'methods' | 'buildScript' | 'batchScript'>('methods');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CopyBtn = ({ code, id }: { code: string; id: string }) => (
    <IconButton
      icon={copiedCode === id ? CheckCircle2 : Copy}
      label={copiedCode === id ? 'Copied' : 'Copy'}
      size="sm"
      onClick={() => handleCopy(code, id)}
    />
  );

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Run as a Windows desktop app"
      description="Compile, launch, or package Study Hub into a standalone Windows executable."
      size="md"
      footer={
        <>
          <span className="text-xs text-ink-3 mr-auto self-center">
            Works on Windows 10/11
          </span>
          <Button onClick={onClose}>Done</Button>
        </>
      }
    >
      <div className="space-y-5">
        <SegmentedControl
          ariaLabel="Packaging section"
          value={activeTab}
          onChange={(v) => setActiveTab(v as typeof activeTab)}
          options={[
            { value: 'methods', label: 'Packaging options' },
            { value: 'batchScript', label: 'Launcher (.bat)' },
            { value: 'buildScript', label: 'Build script' },
          ]}
        />

        {/* Window frame toggle */}
        <div className="rounded-control border border-line bg-subtle p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium text-ink flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-accent" aria-hidden />
              Simulated window title bar
            </div>
            <p className="text-[13px] text-ink-3 mt-0.5">
              Shows a Windows-style title bar with minimize, maximize and close controls.
            </p>
          </div>
          <Button
            variant={isDesktopFrame ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setIsDesktopFrame(!isDesktopFrame)}
          >
            {isDesktopFrame ? 'On' : 'Off'}
          </Button>
        </div>

        {activeTab === 'methods' && (
          <div className="space-y-4">
            {/* Method 1 */}
            <div className="rounded-control border border-accent/40 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-control bg-accent-soft text-accent-ink">
                    <HardDrive className="w-5 h-5" aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                      Compile to a real .exe
                      <Badge tone="accent">Recommended</Badge>
                    </h3>
                    <p className="text-[13px] text-ink-3">
                      Electron Builder produces a portable/installer StudyHub.exe
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  icon={Download}
                  onClick={() =>
                    triggerDownload('build-exe.bat', BUILD_WINDOWS_EXE_SCRIPT, 'application/x-bat')
                  }
                >
                  build-exe.bat
                </Button>
              </div>
              <p className="text-[13px] text-ink-2">
                The preconfigured <code className="font-mono">electron/main.cjs</code> and{' '}
                <code className="font-mono">build:exe</code> script are already in the
                project. Build with:
              </p>
              <div className={codeBlockClass + ' flex items-center justify-between gap-2'}>
                <span>npm install electron electron-builder --save-dev && npm run build:exe</span>
                <CopyBtn
                  code="npm install electron electron-builder --save-dev && npm run build:exe"
                  id="electron-cmd"
                />
              </div>
              <p className="text-xs text-ink-3">
                Output: <span className="font-mono">dist-electron/StudyHub Setup.exe</span>
              </p>
            </div>

            {/* Method 2 */}
            <div className="rounded-control border border-line p-4 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-control bg-subtle text-ink-2">
                    <PlayCircle className="w-5 h-5" aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">
                      Standalone app-window launcher
                    </h3>
                    <p className="text-[13px] text-ink-3">
                      Zero-compile desktop experience on Windows
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Download}
                  onClick={() =>
                    triggerDownload('Start-StudyFlow.bat', BATCH_LAUNCHER_SCRIPT, 'application/x-bat')
                  }
                >
                  Start-StudyFlow.bat
                </Button>
              </div>
              <p className="text-[13px] text-ink-2">
                Double-clicking the .bat opens the app in a frameless native window
                (Edge/Chrome app mode) — no browser toolbars or tabs.
              </p>
              <button
                type="button"
                onClick={() =>
                  triggerDownload('Start-StudyFlow.ps1', POWERSHELL_LAUNCHER_SCRIPT, 'text/plain')
                }
                className="text-[13px] text-accent-ink hover:underline inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" aria-hidden />
                Download PowerShell (.ps1) version
              </button>
            </div>

            {/* Method 3 */}
            <div className="rounded-control border border-line p-4 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-control bg-subtle text-ink-2">
                  <FileCode className="w-5 h-5" aria-hidden />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-ink">
                    Convert the .bat to .exe
                  </h3>
                  <p className="text-[13px] text-ink-3">
                    Fastest single-file executable converter
                  </p>
                </div>
              </div>
              <p className="text-[13px] text-ink-2">
                Convert <code className="font-mono">Start-StudyFlow.bat</code> directly into{' '}
                <code className="font-mono">StudyFlow.exe</code> with free tools like Bat
                To Exe Converter or Inno Setup. You can assign the app icon (
                <code className="font-mono">public/icon.svg</code> or .ico).
              </p>
            </div>
          </div>
        )}

        {activeTab === 'batchScript' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[13px] font-medium text-ink">
                <Terminal className="w-3.5 h-3.5 inline mr-1.5 text-ink-3" aria-hidden />
                Start-StudyFlow.bat
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={copiedCode === 'batch-script' ? CheckCircle2 : Copy}
                  onClick={() => handleCopy(BATCH_LAUNCHER_SCRIPT, 'batch-script')}
                >
                  {copiedCode === 'batch-script' ? 'Copied' : 'Copy'}
                </Button>
                <Button
                  size="sm"
                  icon={Download}
                  onClick={() =>
                    triggerDownload('Start-StudyFlow.bat', BATCH_LAUNCHER_SCRIPT, 'application/x-bat')
                  }
                >
                  Download
                </Button>
              </div>
            </div>
            <pre className={codeBlockClass + ' max-h-80'}>{BATCH_LAUNCHER_SCRIPT}</pre>
          </div>
        )}

        {activeTab === 'buildScript' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[13px] font-medium text-ink">
                <Terminal className="w-3.5 h-3.5 inline mr-1.5 text-ink-3" aria-hidden />
                build-exe.bat
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={copiedCode === 'build-script' ? CheckCircle2 : Copy}
                  onClick={() => handleCopy(BUILD_WINDOWS_EXE_SCRIPT, 'build-script')}
                >
                  {copiedCode === 'build-script' ? 'Copied' : 'Copy'}
                </Button>
                <Button
                  size="sm"
                  icon={Download}
                  onClick={() =>
                    triggerDownload('build-exe.bat', BUILD_WINDOWS_EXE_SCRIPT, 'application/x-bat')
                  }
                >
                  Download
                </Button>
              </div>
            </div>
            <pre className={codeBlockClass + ' max-h-80'}>{BUILD_WINDOWS_EXE_SCRIPT}</pre>
          </div>
        )}

        <div className="flex items-center gap-2.5 rounded-control bg-subtle p-3 text-[13px] text-ink-2">
          <ShieldCheck className="w-4 h-4 text-success shrink-0" aria-hidden />
          <span>
            <Monitor className="w-3.5 h-3.5 inline mr-1 text-ink-3" aria-hidden />
            All data stays in local storage and the local engine runs fully offline.
          </span>
        </div>
      </div>
    </Modal>
  );
};
