import React, { useState } from 'react';
import { UploadCloud, FileCheck, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { cn } from '../lib/cn';
import { Badge, ProgressBar } from './ui';

export interface FileMeta {
  fileName: string;
  wordCount: number;
  isScannedImage: boolean;
}

interface FileDropzoneProps {
  accept?: string;
  onFile: (file: File) => void;
  isReading: boolean;
  percent: number;
  status: string;
  meta: FileMeta | null;
  error?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  accept,
  onFile,
  isReading,
  percent,
  status,
  meta,
  error,
}) => {
  const [dragging, setDragging] = useState(false);

  return (
    <div>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) onFile(file);
        }}
        className={cn(
          'block rounded-card border border-dashed border-line-strong p-6 text-center cursor-pointer hover:border-accent transition-[border-color,background-color] duration-150',
          dragging && 'border-accent bg-accent-soft'
        )}
      >
        <input
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) onFile(file);
          }}
        />
        <UploadCloud className="w-6 h-6 text-ink-3 mx-auto mb-2" aria-hidden />
        <div className="text-sm font-medium text-ink">Choose a file or drop it here</div>
        <div className="text-xs text-ink-3 mt-1">PDF, PNG, JPG, TXT or MD</div>
      </label>

      <div aria-live="polite">
        {isReading && (
          <div className="mt-3 space-y-1.5">
            <ProgressBar value={percent / 100} label="Reading file" />
            <div className="text-[13px] text-ink-2">
              {status}
              {percent > 0 ? ` ${percent}%` : ''}
            </div>
          </div>
        )}
        {meta && !isReading && (
          <div className="mt-3 flex items-center gap-2 text-[13px] text-ink-2">
            {meta.isScannedImage ? (
              <ImageIcon className="w-4 h-4 text-ink-3 shrink-0" aria-hidden />
            ) : (
              <FileCheck className="w-4 h-4 text-success shrink-0" aria-hidden />
            )}
            <span className="truncate">{meta.fileName}</span>
            <Badge tone="neutral">{meta.wordCount} words</Badge>
          </div>
        )}
        {error && (
          <div className="mt-3 flex items-center gap-2 text-[13px] text-danger-ink">
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
