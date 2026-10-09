import React, { useState } from 'react';
import {
  X,
  Database,
  Download,
  Upload,
  RotateCcw,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { exportAllDataJSON, importAllDataJSON, resetAllDataToDefault } from '../lib/storage';

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

  if (!isOpen) return null;

  const handleExport = () => {
    const json = exportAllDataJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studyflow-offline-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ text: 'Backup downloaded successfully!', type: 'success' });
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const ok = importAllDataJSON(importText);
    if (ok) {
      setMessage({ text: 'Backup restored successfully!', type: 'success' });
      onRefreshData();
      setImportText('');
    } else {
      setMessage({ text: 'Invalid JSON format. Please verify the backup file.', type: 'error' });
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all courses, exams, Clutch Notes and tasks to the default demo data?')) {
      resetAllDataToDefault();
      onRefreshData();
      setMessage({ text: 'Reset to sample data successfully.', type: 'success' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-200 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-slate-100">Local Data Storage & Backups</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {message && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}
          >
            {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {message.text}
          </div>
        )}

        {/* Export Card */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-200 block">Export JSON Archive</span>
            <span className="text-[11px] text-slate-400">Save all courses, exams, Clutch Notes & tasks</span>
          </div>
          <button
            onClick={handleExport}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>

        {/* Import Card */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 block">
            Import Backup JSON:
          </label>
          <textarea
            rows={3}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste your exported JSON backup text here..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleImport}
            disabled={!importText.trim()}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            Restore from JSON
          </button>
        </div>

        {/* Reset to Default */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">Need fresh demonstration data?</span>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Sample Data
          </button>
        </div>
      </div>
    </div>
  );
};
