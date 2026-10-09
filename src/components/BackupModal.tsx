import React, { useRef, useState } from 'react';
import { Download, Upload, Check, AlertTriangle, RotateCcw } from 'lucide-react';
import { exportAllDataJSON, importAllDataJSON, resetAllDataToDefault } from '../lib/storage';
import { Button, Field, Modal, Textarea } from './ui';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
}) => {
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [confirmErase, setConfirmErase] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = exportAllDataJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studyhub-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ text: 'Backup downloaded.', type: 'success' });
  };

  const handlePickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportText(await file.text());
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const ok = importAllDataJSON(importText);
    if (ok) {
      setMessage({ text: 'Backup restored.', type: 'success' });
      onRefreshData();
      setImportText('');
    } else {
      setMessage({ text: 'Invalid backup file. Check that the JSON is complete.', type: 'error' });
    }
  };

  const handleErase = () => {
    resetAllDataToDefault();
    onRefreshData();
    setConfirmErase(false);
    setMessage({ text: 'All data erased.', type: 'success' });
  };

  const close = () => {
    setConfirmErase(false);
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={close}
      title="Backup & data"
      description="Everything is stored locally on this device."
      size="md"
    >
      <div className="space-y-5">
        {message && (
          <div
            role="status"
            className={`p-3 rounded-control text-[13px] flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-success-soft text-success-ink'
                : 'bg-danger-soft text-danger-ink'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" aria-hidden />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden />
            )}
            {message.text}
          </div>
        )}

        {/* Export */}
        <div>
          <h3 className="text-sm font-medium text-ink mb-1">Export</h3>
          <p className="text-[13px] text-ink-3 mb-2">
            Download a JSON file with all classes, tasks, exams, attempts and Clutch Notes.
          </p>
          <Button icon={Download} onClick={handleExport}>
            Download backup
          </Button>
        </div>

        {/* Import */}
        <div>
          <h3 className="text-sm font-medium text-ink mb-1">Import</h3>
          <p className="text-[13px] text-ink-3 mb-2">
            Restore from a previous backup file or paste its contents.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            aria-label="Choose backup file"
            onChange={handlePickFile}
          />
          <div className="mb-2">
            <Button
              variant="secondary"
              icon={Upload}
              onClick={() => fileRef.current?.click()}
            >
              Choose backup file
            </Button>
          </div>
          <Field label="Backup JSON" htmlFor="backup-json">
            <Textarea
              id="backup-json"
              rows={3}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste your exported backup here…"
              className="font-mono text-[13px]"
            />
          </Field>
          <div className="mt-2">
            <Button onClick={handleImport} disabled={!importText.trim()}>
              Restore backup
            </Button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="border-t border-line pt-5">
          <h3 className="text-sm font-medium text-ink mb-1">Erase all data</h3>
          <p className="text-[13px] text-ink-3 mb-3">
            Removes all classes, tasks, exams, attempts and Clutch Notes saved on this
            device. Download a backup first.
          </p>
          {confirmErase ? (
            <div className="rounded-control bg-danger-soft p-3 flex items-center gap-3 flex-wrap">
              <span className="text-[13px] text-danger-ink flex-1">
                This can't be undone.
              </span>
              <Button variant="secondary" size="sm" onClick={() => setConfirmErase(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" icon={RotateCcw} onClick={handleErase}>
                Erase everything
              </Button>
            </div>
          ) : (
            <Button variant="danger-soft" onClick={() => setConfirmErase(true)}>
              Erase all data
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
