import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Printer,
  Bookmark,
  RefreshCw,
  Copy,
  Check,
  FileCheck,
  Trash2,
  BookOpen,
  Image as ImageIcon,
  Scan,
} from 'lucide-react';
import { Course, Cheatsheet } from '../types';
import { qwenLLM } from '../lib/local-llm';
import { extractTextFromFile } from '../lib/file-parser';
import { cleanDisplayText } from '../lib/text-clean';
import { usePersistentState } from '../lib/usePersistentState';

interface CheatsheetGeneratorViewProps {
  courses: Course[];
  cheatsheets: Cheatsheet[];
  onSaveCheatsheet: (sheet: Cheatsheet) => void;
  onDeleteCheatsheet: (id: string) => void;
  searchQuery?: string;
}

interface ClutchSession {
  selectedCourseName: string;
  customSubjectName: string;
  notesText: string;
  extractedFileMeta: { fileName: string; wordCount: number; isScannedImage: boolean } | null;
  selectedSheetId: string;
  debugEnabled: boolean;
}

const SESSION_KEY = 'studyflow_clutch_session_v1';

export const CheatsheetGeneratorView: React.FC<CheatsheetGeneratorViewProps> = ({
  courses,
  cheatsheets,
  onSaveCheatsheet,
  onDeleteCheatsheet,
  searchQuery = '',
}) => {
  const [session, setSession] = usePersistentState<ClutchSession>(SESSION_KEY, () => ({
    selectedCourseName: courses.length > 0 ? courses[0].title : 'None',
    customSubjectName: '',
    notesText: '',
    extractedFileMeta: null,
    selectedSheetId: cheatsheets[0]?.id || '',
    debugEnabled: false,
  }));
  const patch = (p: Partial<ClutchSession>) => setSession((prev) => ({ ...prev, ...p }));
  const {
    selectedCourseName, customSubjectName, notesText, extractedFileMeta,
    selectedSheetId, debugEnabled,
  } = session;
  const setSelectedCourseName = (v: string) => patch({ selectedCourseName: v });
  const setCustomSubjectName = (v: string) => patch({ customSubjectName: v });
  const setNotesText = (v: string) => patch({ notesText: v });
  const setDebugEnabled = (v: boolean) => patch({ debugEnabled: v });

  const [isReadingFile, setIsReadingFile] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>('');
  const [scanPercent, setScanPercent] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const generatedSheet =
    cheatsheets.find((s) => s.id === selectedSheetId) || cheatsheets[0] || null;
  const [isCopied, setIsCopied] = useState(false);
  const [copiedFormula, setCopiedFormula] = useState<number | null>(null);
  const [debugData, setDebugData] = useState<{ blocks?: any; chunks?: any; detectedType?: string; removalLog?: any } | null>(null);
  const [progressStep, setProgressStep] = useState<string>('');

  const filteredSheets = searchQuery.trim()
    ? cheatsheets.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.courseName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : cheatsheets;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsReadingFile(true);
    setScanPercent(5);
    setScanStatus('Starting document analysis...');
    try {
      const extracted = await extractTextFromFile(file, (pct, status) => {
        setScanPercent(pct);
        setScanStatus(status);
      });
      patch({
        extractedFileMeta: {
          fileName: extracted.fileName,
          wordCount: extracted.wordCount,
          isScannedImage: Boolean(extracted.isScannedImage),
        },
        notesText: extracted.text,
      });
      if (selectedCourseName === 'None' || !selectedCourseName) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setCustomSubjectName(cleanName);
      }
    } catch (err) {
      console.error('File parsing error', err);
    } finally {
      setIsReadingFile(false);
    }
  };

  const handleGenerate = async () => {
    if (!notesText.trim()) return;
    setIsGenerating(true);
    setProgressStep('Parsing document...');
    setDebugData(null);
    const targetCourse =
      selectedCourseName !== 'None' && selectedCourseName
        ? selectedCourseName
        : customSubjectName.trim() || 'Uploaded Course Notes';
    try {
      setProgressStep('Extracting content...');
      // Note: In a real implementation, this would track pipeline progress
      const sheet = await qwenLLM.generateCheatsheet(
        {
          courseName: targetCourse,
          rawNotes: notesText,
        },
        'embedded'
      );
      patch({ selectedSheetId: sheet.id });
      if (debugEnabled) {
        setDebugData({
          blocks: notesText.split('\n').filter(l => l.trim()).length,
          chunks: sheet.sections.length,
          detectedType: 'auto-detected',
          removalLog: { removed: 0, reasons: [] },
        });
      }
      onSaveCheatsheet(sheet);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
      setProgressStep('');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    if (!generatedSheet) return;
    navigator.clipboard.writeText(
      `${cleanDisplayText(generatedSheet.title)}\n\n${cleanDisplayText(generatedSheet.summary)}\n\n` +
        generatedSheet.sections
          .map(
            (s) =>
              `${cleanDisplayText(s.heading)}\n${s.bulletPoints.map((b) => `- ${cleanDisplayText(b)}`).join('\n')}${
                s.codeOrFormula ? '\n' + s.codeOrFormula : ''
              }`
          )
          .join('\n\n')
    );
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopyFormula = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedFormula(idx);
    setTimeout(() => setCopiedFormula(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Clutch Notes
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Upload your lecture notes (PDF, PNG, JPG, or text) to scan & synthesize high-yield Clutch Notes
          </p>
        </div>
      </div>

      {/* Generator Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <h2 className="font-black text-sm text-gray-900">Clutch Notes generator</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Upload any note file (PDF, PNG/JPG photos of handwriting/board, TXT, MD, DOCX). It is scanned locally with OCR and distilled into exam-ready Clutch Notes. Zero cloud upload.
          </p>
        </div>

        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File picker */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Upload File or Photo (PDF, PNG, JPG, TXT, MD)
              </label>
              <input
                type="file"
                accept=".txt,.pdf,.md,.csv,.json,image/png,image/jpeg,image/webp,image/*"
                onChange={handleFileUpload}
                className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-800 hover:file:bg-emerald-100 border border-gray-200 rounded-xl p-1"
              />

              {isReadingFile && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-emerald-700 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      {scanStatus || 'Scanning file...'}
                    </span>
                    <span>{scanPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full transition-all duration-300"
                      style={{ width: `${scanPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {extractedFileMeta && !isReadingFile && (
                <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 truncate">
                    {extractedFileMeta.isScannedImage ? (
                      <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    {extractedFileMeta.fileName}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700 shrink-0">
                    {extractedFileMeta.wordCount.toLocaleString()} words scanned
                  </span>
                </div>
              )}
            </div>

            {/* Subject Association */}
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Subject / Course Name
              </label>
              {courses.length > 0 ? (
                <>
                  <select
                    value={selectedCourseName}
                    onChange={(e) => setSelectedCourseName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="None">Custom / Other Course</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.title}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                  {selectedCourseName === 'None' && (
                    <input
                      type="text"
                      placeholder="Enter subject name (e.g. Organic Chemistry, Algorithms)..."
                      value={customSubjectName}
                      onChange={(e) => setCustomSubjectName(e.target.value)}
                      className="w-full mt-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-emerald-500"
                    />
                  )}
                </>
              ) : (
                <input
                  type="text"
                  placeholder="Enter subject name (e.g. Physics, Biology, History)..."
                  value={customSubjectName}
                  onChange={(e) => setCustomSubjectName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-emerald-500"
                />
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-gray-700 block">
                Scanned / Extracted Notes Content
              </label>
              <button
                type="button"
                onClick={() => {
                  if (!notesText && !extractedFileMeta) return;
                  if (window.confirm('Clear the current draft notes and file? Your saved Clutch Notes will not be deleted.')) {
                    patch({ notesText: '', extractedFileMeta: null });
                  }
                }}
                className="text-[11px] font-bold text-gray-400 hover:text-rose-600"
              >
                Clear
              </button>
            </div>
            <textarea
              rows={4}
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Upload a PDF or PNG image above, or paste raw study notes here..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-800 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !notesText.trim()}
            className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating Clutch Notes...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Clutch Notes
              </>
            )}
          </button>
        </div>

        {/* Debug Toggle */}
        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={debugEnabled}
              onChange={(e) => setDebugEnabled(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
            />
            <span className="text-xs text-gray-600">Show debug info</span>
          </label>
          {progressStep && (
            <span className="text-xs text-emerald-600 font-semibold">{progressStep}</span>
          )}
        </div>

        {/* Debug Data Display */}
        {debugEnabled && debugData && (
          <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
            <h4 className="text-xs font-bold text-gray-700 mb-2">Debug Information</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-gray-500">Blocks:</span> {debugData.blocks || 0}</div>
              <div><span className="text-gray-500">Chunks:</span> {debugData.chunks || 0}</div>
              <div><span className="text-gray-500">Type:</span> {debugData.detectedType || 'N/A'}</div>
              <div><span className="text-gray-500">Removed:</span> {debugData.removalLog?.removed || 0}</div>
            </div>
          </div>
        )}
      </div>

      {/* Cheatsheet Library selector if multiple sheets exist */}
      {filteredSheets.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filteredSheets.map((sheet) => (
            <button
              key={sheet.id}
              onClick={() => patch({ selectedSheetId: sheet.id })}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                generatedSheet?.id === sheet.id
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              {sheet.courseName}: {sheet.title}
            </button>
          ))}
        </div>
      )}

      {/* Empty State when no cheatsheet generated yet */}
      {!generatedSheet && cheatsheets.length === 0 && (
        <div className="p-8 text-center bg-white border border-dashed border-gray-200 rounded-2xl space-y-2">
          <FileText className="w-8 h-8 text-gray-300 mx-auto" />
          <h3 className="font-bold text-xs text-gray-700">No Clutch Notes created yet</h3>
          <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
            Upload a PDF document, lecture slides, or PNG/JPG notes photo above and click "Generate Clutch Notes" to make your first review sheet.
          </p>
        </div>
      )}

      {/* Generated Result Card */}
      {generatedSheet && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between pb-3 border-b border-gray-100">
            <div>
              <span className="text-[10px] font-mono font-semibold text-emerald-700 block">
                {generatedSheet.courseName}
              </span>
              <h3 className="text-base font-black text-gray-900 mt-0.5">
                {cleanDisplayText(generatedSheet.title)}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {cleanDisplayText(generatedSheet.summary)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </button>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {isCopied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={() => {
                  onDeleteCheatsheet(generatedSheet.id);
                  const next = cheatsheets.find((s) => s.id !== generatedSheet.id);
                  patch({ selectedSheetId: next?.id || '' });
                }}
                className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg transition-colors"
                title="Delete Clutch Notes"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {generatedSheet.sections.map((sec, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-2">
                <h4 className="text-xs font-black text-gray-900">
                  {cleanDisplayText(sec.heading)}
                </h4>
                <ul className="text-xs text-gray-700 space-y-1 list-disc pl-5">
                  {sec.bulletPoints.map((bp, bIdx) => (
                    <li key={bIdx}>{cleanDisplayText(bp)}</li>
                  ))}
                </ul>
                {sec.codeOrFormula && (
                  <div className="relative mt-2">
                    <pre className="p-3 rounded-lg bg-white border border-gray-200 font-mono text-xs text-emerald-800 overflow-x-auto whitespace-pre-wrap">
                      {sec.codeOrFormula}
                    </pre>
                    <button
                      onClick={() => handleCopyFormula(sec.codeOrFormula!, idx)}
                      className="absolute top-2 right-2 p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] flex items-center gap-1"
                    >
                      {copiedFormula === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy
                    </button>
                  </div>
                )}
              </div>
            ))}

            {generatedSheet.keyTerms && generatedSheet.keyTerms.length > 0 && (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-2">
                <h4 className="text-xs font-black text-gray-900">
                  Key Terminology
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {generatedSheet.keyTerms.map((kt, kIdx) => (
                    <div key={kIdx} className="p-2.5 rounded-lg bg-white border border-gray-200 text-xs">
                      <strong className="text-gray-900 block">{cleanDisplayText(kt.term)}:</strong>
                      <span className="text-gray-600 mt-0.5 block">{cleanDisplayText(kt.definition)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {generatedSheet.mnemonics && generatedSheet.mnemonics.length > 0 && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                <span className="font-bold block mb-1">Memory Hook / Mnemonic:</span>
                <ul className="list-disc pl-5 space-y-0.5">
                  {generatedSheet.mnemonics.map((m, mIdx) => (
                    <li key={mIdx}>{cleanDisplayText(m)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
