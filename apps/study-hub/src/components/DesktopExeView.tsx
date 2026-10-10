import React, { useEffect, useState } from 'react';
import { Download, ExternalLink, Laptop, WifiOff } from 'lucide-react';
import { Button, Card, CardHeader, PageHeader } from './ui';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const PROJECT_ZIP_URL =
  'https://github.com/jhnjffryyy/Cyber-Nova-Hackathon-Project/archive/refs/heads/main.zip';

export const DesktopExeView: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);

  useEffect(() => {
    setIsInstalled(window.matchMedia('(display-mode: standalone)').matches);

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') setIsInstalled(true);
      setInstallPrompt(null);
    } catch (error) {
      console.error('Failed to start PWA installation', error);
      setInstallError('The browser could not start installation. Use the browser menu to install the app.');
      setInstallPrompt(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Run in VS Code"
        description="Download Study Hub, run it locally, and install it as a Progressive Web App (PWA)."
      />

      <Card padding="lg" className="border-accent/40">
        <div className="flex items-center gap-2 text-accent-ink text-[13px] font-medium mb-2">
          <WifiOff className="w-4 h-4" aria-hidden />
          Installable and available offline after setup
        </div>
        <p className="text-sm text-ink-2 leading-relaxed">
          Study Hub is a web app you can install from a supported browser. Its app shell is cached
          on your device; AI or model features that need a separate download or online service may
          still require those resources.
        </p>
      </Card>

      <Card>
        <CardHeader title="Download and run the project" icon={Laptop} />
        <div className="space-y-4 text-[13px] text-ink-2 leading-relaxed">
          <div>
            <p className="font-medium text-ink">1. Download and open the project</p>
            <p className="mt-1">
              Download the latest project ZIP, extract it, then open the extracted
              <code className="font-mono"> Cyber-Nova-Hackathon-Project-main </code>
              folder in VS Code.
            </p>
            <a
              href={PROJECT_ZIP_URL}
              className="press mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-control bg-accent px-3.5 text-sm font-medium text-on-accent shadow-card transition-colors hover:bg-accent-hover"
            >
              <Download className="w-4 h-4" aria-hidden />
              Download Study Hub project ZIP
              <ExternalLink className="w-3.5 h-3.5" aria-hidden />
            </a>
          </div>

          <div>
            <p className="font-medium text-ink">2. Install dependencies</p>
            <p className="mt-1">
              Open the VS Code terminal at the repository root and run:
            </p>
            <pre className="mt-2 overflow-x-auto rounded-control border border-line bg-subtle p-3 font-mono text-ink">
              npm install
            </pre>
          </div>

          <div>
            <p className="font-medium text-ink">3. Build and preview Study Hub</p>
            <p className="mt-1">
              Build the production app, then start the local preview server:
            </p>
            <pre className="mt-2 overflow-x-auto rounded-control border border-line bg-subtle p-3 font-mono text-ink">
              npm run build{'\n'}npm run preview
            </pre>
            <p className="mt-1">
              Open <code className="font-mono">http://localhost:4173</code> in Edge or Chrome.
            </p>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-medium text-ink">4. Install Study Hub as a PWA</p>
              {isInstalled ? (
                <span className="text-xs font-medium text-accent-ink">Already installed</span>
              ) : installPrompt ? (
                <Button size="sm" icon={Download} onClick={handleInstall}>
                  Install Study Hub
                </Button>
              ) : null}
            </div>
            <p className="mt-1">
              If the install button is unavailable, open the browser menu and choose
              <strong> Install app </strong> or <strong> Add to Home screen</strong>. A deployed
              website must use HTTPS; localhost is supported for this local preview.
            </p>
            {installError && (
              <p role="alert" className="mt-2 text-danger-ink">
                {installError}
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Run it again" />
        <p className="text-[13px] text-ink-2 leading-relaxed">
          To run Study Hub later, open the project folder in VS Code, start the preview server
          with <code className="font-mono">npm run preview</code>, then launch the installed app
          or visit <code className="font-mono">http://localhost:4173</code>. Keep the local
          server running while using this locally installed PWA.
        </p>
      </Card>
    </div>
  );
};
