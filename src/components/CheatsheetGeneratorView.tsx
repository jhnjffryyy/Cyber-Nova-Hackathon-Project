import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import {
  Sparkles,
  Printer,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  NotebookText,
  ChevronDown,
  ChevronUp,
  Search,
  Plus,
} from 'lucide-react';
import { Course, Cheatsheet } from '../types';
import { qwenLLM } from '../lib/local-llm';
import { extractTextFromFile } from '../lib/file-parser';
import { cleanDisplayText } from '../lib/text-clean';
import { usePersistentState } from '../lib/usePersistentState';
import { formatDate } from '../lib/format';
import { cn } from '../lib/cn';
import { FileDropzone } from './FileDropzone';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  IconButton,
  Input,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from './ui';

interface CheatsheetGeneratorViewProps {
  courses: Course[];
  cheatsheets: Cheatsheet[];
  onSaveCheatsheet: (sheet: Cheatsheet) => void;
  onDeleteCheatsheet: (id: string) => void;
  searchQuery?: string;
  focusSheetId?: string | null;
  onFocusSheetHandled?: () => void;
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

type SheetSort = 'newest' | 'oldest' | 'subject';

export const CheatsheetGeneratorView: React.FC<CheatsheetGeneratorViewProps> = ({
  courses,
  cheatsheets,
  onSaveCheatsheet,
  onDeleteCheatsheet,
  searchQuery = '',
  focusSheetId = null,
  onFocusSheetHandled,
}) => {
  const reduced = useReducedMotion();
  const [session, setSession] = usePersistentState<ClutchSession>(SESSION_KEY, () => ({
    selectedCourseName: courses.length > 0 ? courses[0].title : 'None',
    customSubjectName: '',
    notesText: '',
    extractedFileMeta: null,
    selectedSheetId: cheatsheets[0]?.id || '',
    debugEnabled: false,
  }));
  const patch = (p: Partial<ClutchSession>) => setSession((prev) => ({ ...prev, ...p }));

  // Cross-screen request: open a specific sheet (e.g. from Overview).
  useEffect(() => {
    if (!focusSheetId) return;
    if (cheatsheets.some((s) => s.id === focusSheetId)) {
      patch({ selectedSheetId: focusSheetId });
    }
    onFocusSheetHandled?.();
  }, [focusSheetId]);

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
  const [fileError, setFileError] = useState('');
  const [genOpen, setGenOpen] = useState(
    cheatsheets.length === 0 || notesText.trim().length > 0
  );
  const [libraryQuery, setLibraryQuery] = useState('');
  const [sheetSort, setSheetSort] = useState<SheetSort>('newest');
  const [confirmClear, setConfirmClear] = useState(false);
  const [deleteSheet, setDeleteSheet] = useState<Cheatsheet | null>(null);
  const [genStats, setGenStats] = useState<{
    inputLines: number;
    sections: number;
    keyTerms: number;
  } | null>(null);

  const generatorRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const generatedSheet =
    cheatsheets.find((s) => s.id === selectedSheetId) || cheatsheets[0] || null;
  const [isCopied, setIsCopied] = useState(false);
  const [copiedFormula, setCopiedFormula] = useState<number | null>(null);
  const [progressStep, setProgressStep] = useState<string>('');

  const q = libraryQuery.trim().toLowerCase();
  const gq = searchQuery.trim().toLowerCase();
  const filteredSheets = cheatsheets
    .filter((s) => {
      if (gq) {
        const hay = `${s.title} ${s.courseName} ${s.topic}`.toLowerCase();
        if (!hay.includes(gq)) return false;
      }
      if (q) {
        const hay = `${s.title} ${s.courseName} ${s.topic}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sheetSort === 'oldest') return a.createdAt.localeCompare(b.createdAt);
      if (sheetSort === 'subject')
        return a.courseName.localeCompare(b.courseName) || a.title.localeCompare(b.title);
      return b.createdAt.localeCompare(a.createdAt);
    });

  const selectSheet = (id: string) => {
    patch({ selectedSheetId: id });
    if (window.matchMedia('(max-width: 1023.98px)').matches) {
      requestAnimationFrame(() =>
        detailRef.current?.scrollIntoView({
          block: 'start',
          behavior: reduced ? 'auto' : 'smooth',
        })
      );
    }
  };

  const openGenerator = () => {
    setGenOpen(true);
    requestAnimationFrame(() => {
      generatorRef.current?.scrollIntoView({
        block: 'start',
        behavior: reduced ? 'auto' : 'smooth',
      });
      generatorRef.current?.querySelector<HTMLElement>('input, textarea, select, button')?.focus();
    });
  };

  const handleFile = async (file: File) => {
    setFileError('');
    setIsReadingFile(true);
    setScanPercent(5);
    setScanStatus('Starting document analysis...');
    try {
      const extracted = await extractTextFromFile(file, (pct, status) => {
        setScanPercent(pct);
        setScanStatus(status);
      });
      if (!extracted.text.trim()) {
        setFileError('No readable text was found in this file.');
        return;
      }
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
      setFileError('Couldn’t read this file. Try another file or paste the text below.');
    } finally {
      setIsReadingFile(false);
    }
  };

  const handleGenerate = async () => {
    if (!notesText.trim()) return;
    setIsGenerating(true);
    setProgressStep('Parsing document...');
    setGenStats(null);
    const targetCourse =
      selectedCourseName !== 'None' && selectedCourseName
        ? selectedCourseName
        : customSubjectName.trim() || 'Uploaded Course Notes';
    try {
      setProgressStep('Extracting content...');
      const sheet = await qwenLLM.generateCheatsheet(
        {
          courseName: targetCourse,
          rawNotes: notesText,
        },
        'embedded'
      );
      patch({ selectedSheetId: sheet.id });
      setGenStats({
        inputLines: notesText.split('\n').filter((l) => l.trim()).length,
        sections: sheet.sections.length,
        keyTerms: sheet.keyTerms.length,
      });
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
    <div>
      <PageHeader
        title="Clutch Notes"
        description="Turn lecture notes into focused review sheets."
        actions={
          <Button icon={Plus} onClick={openGenerator}>
            New Clutch Notes
          </Button>
        }
      />

      {/* Generator */}
      <div ref={generatorRef} className="scroll-mt-24">
      <Card className="mb-6">
        <CardHeader
          title="Create Clutch Notes"
          description="Runs locally on your device — nothing is uploaded."
          className={genOpen ? undefined : 'mb-0'}
          action={
            <IconButton
              icon={genOpen ? ChevronUp : ChevronDown}
              label={genOpen ? 'Collapse generator' : 'Expand generator'}
              onClick={() => setGenOpen((v) => !v)}
            />
          }
        />
        <div aria-expanded={genOpen}>
          {genOpen && (
            <div className="space-y-4">
              <FileDropzone
                accept=".txt,.pdf,.md,.csv,.json,image/png,image/jpeg,image/webp,image/*"
                onFile={handleFile}
                isReading={isReadingFile}
                percent={scanPercent}
                status={scanStatus}
                meta={extractedFileMeta}
                error={fileError || undefined}
              />

              {courses.length > 0 ? (
                <Field label="Subject" htmlFor="clutch-subject">
                  <Select
                    id="clutch-subject"
                    value={selectedCourseName}
                    onChange={(e) => setSelectedCourseName(e.target.value)}
                  >
                    <option value="None">Other subject</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.title}>
                        {c.title}
                      </option>
                    ))}
                  </Select>
                  {selectedCourseName === 'None' && (
                    <Input
                      className="mt-2"
                      aria-label="Custom subject name"
                      placeholder="e.g. Organic Chemistry, Algorithms"
                      value={customSubjectName}
                      onChange={(e) => setCustomSubjectName(e.target.value)}
                    />
                  )}
                </Field>
              ) : (
                <Field label="Subject" htmlFor="clutch-subject">
                  <Input
                    id="clutch-subject"
                    placeholder="e.g. Physics, Biology, History"
                    value={customSubjectName}
                    onChange={(e) => setCustomSubjectName(e.target.value)}
                  />
                </Field>
              )}

              <Field label="Notes text" htmlFor="clutch-notes">
                <Textarea
                  id="clutch-notes"
                  rows={6}
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Paste raw study notes here..."
                  className="font-mono text-[13px]"
                />
                <div className="mt-1.5 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!notesText && !extractedFileMeta}
                    onClick={() => setConfirmClear(true)}
                  >
                    Clear draft
                  </Button>
                </div>
              </Field>

              {isGenerating && progressStep && (
                <p className="text-[13px] text-accent-ink flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden />
                  {progressStep}
                </p>
              )}

              <div className="flex items-center justify-between gap-3 flex-wrap border-t border-line pt-4">
                <label className="flex items-center gap-2 text-[13px] text-ink-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={debugEnabled}
                    onChange={(e) => setDebugEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[var(--accent)]"
                  />
                  Show generation details
                </label>
                <Button
                  icon={Sparkles}
                  loading={isGenerating}
                  disabled={isGenerating || !notesText.trim()}
                  onClick={handleGenerate}
                >
                  {isGenerating ? 'Generating…' : 'Generate Clutch Notes'}
                </Button>
              </div>

              {debugEnabled && genStats && (
                <div className="rounded-control bg-subtle p-3 grid grid-cols-3 gap-2 text-[13px]">
                  <div>
                    <span className="text-ink-3 block text-xs">Input lines</span>
                    <span className="text-ink font-medium tabular-nums">{genStats.inputLines}</span>
                  </div>
                  <div>
                    <span className="text-ink-3 block text-xs">Sections</span>
                    <span className="text-ink font-medium tabular-nums">{genStats.sections}</span>
                  </div>
                  <div>
                    <span className="text-ink-3 block text-xs">Key terms</span>
                    <span className="text-ink font-medium tabular-nums">{genStats.keyTerms}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
      </div>

      {/* Library + detail */}
      {cheatsheets.length === 0 ? (
        <EmptyState
          icon={NotebookText}
          title="No Clutch Notes yet"
          description="Upload a PDF, image or text file, or paste notes, to create your first review sheet."
          action={
            <Button size="sm" onClick={openGenerator}>
              Create Clutch Notes
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] items-start">
          {/* Library list */}
          <Card padding="none">
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-semibold text-ink">Library</h2>
                <Badge tone="neutral">{filteredSheets.length}</Badge>
              </div>
            </div>
            <div className="px-4 pb-3 space-y-2">
              <div className="relative">
                <Search
                  className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden
                />
                <Input
                  type="search"
                  aria-label="Search Clutch Notes"
                  placeholder="Search"
                  value={libraryQuery}
                  onChange={(e) => setLibraryQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <Select
                aria-label="Sort Clutch Notes"
                value={sheetSort}
                onChange={(e) => setSheetSort(e.target.value as SheetSort)}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="subject">Subject A–Z</option>
              </Select>
            </div>
            <div className="max-h-[60dvh] overflow-y-auto divide-y divide-line">
              {filteredSheets.length === 0 ? (
                <EmptyState
                  compact
                  icon={NotebookText}
                  title={`No Clutch Notes match “${libraryQuery.trim() || searchQuery.trim()}”`}
                />
              ) : (
                filteredSheets.map((sheet) => (
                  <button
                    key={sheet.id}
                    type="button"
                    aria-current={generatedSheet?.id === sheet.id || undefined}
                    onClick={() => selectSheet(sheet.id)}
                    className={cn(
                      'w-full px-4 py-3 text-left transition-[background-color] duration-150',
                      generatedSheet?.id === sheet.id
                        ? 'bg-accent-soft'
                        : 'hover:bg-subtle'
                    )}
                  >
                    <div className="text-xs font-medium text-accent-ink">
                      {sheet.courseName}
                    </div>
                    <div className="text-sm font-medium text-ink line-clamp-2">
                      {sheet.title}
                    </div>
                    <div className="text-xs text-ink-3 mt-0.5">
                      {formatDate(sheet.createdAt)} · {sheet.sections.length} sections
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>

          {/* Detail */}
          <div ref={detailRef} className="scroll-mt-24">
            {generatedSheet && (
              <Card padding="lg">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-accent-ink">
                      {generatedSheet.courseName}
                    </div>
                    <h3 className="font-display text-xl sm:text-2xl font-semibold text-ink mt-0.5">
                      {cleanDisplayText(generatedSheet.title)}
                    </h3>
                    <p className="text-sm text-ink-2 mt-1">
                      {cleanDisplayText(generatedSheet.summary)}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge tone="neutral">{formatDate(generatedSheet.createdAt)}</Badge>
                      <Badge tone="neutral">{generatedSheet.sections.length} sections</Badge>
                      <Badge tone="neutral">{generatedSheet.keyTerms.length} key terms</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 print:hidden">
                    <Button variant="secondary" size="sm" icon={isCopied ? Check : Copy} onClick={handleCopy}>
                      {isCopied ? 'Copied' : 'Copy'}
                    </Button>
                    <Button variant="secondary" size="sm" icon={Printer} onClick={handlePrint}>
                      Print
                    </Button>
                    <IconButton
                      icon={Trash2}
                      label="Delete Clutch Notes"
                      variant="secondary"
                      size="sm"
                      onClick={() => setDeleteSheet(generatedSheet)}
                    />
                  </div>
                </div>

                <div className="border-t border-line pt-5 mt-5 space-y-5">
                  {generatedSheet.sections.map((sec, idx) => (
                    <div key={idx}>
                      <h4 className="text-[15px] font-semibold text-ink mb-2">
                        {cleanDisplayText(sec.heading)}
                      </h4>
                      <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed text-ink marker:text-ink-3">
                        {sec.bulletPoints.map((bp, bIdx) => (
                          <li key={bIdx}>{cleanDisplayText(bp)}</li>
                        ))}
                      </ul>
                      {sec.codeOrFormula && (
                        <div className="relative mt-3">
                          <pre className="font-mono text-[13px] bg-subtle border border-line rounded-control p-3 whitespace-pre-wrap text-ink">
                            {sec.codeOrFormula}
                          </pre>
                          <IconButton
                            icon={copiedFormula === idx ? Check : Copy}
                            label={copiedFormula === idx ? 'Copied' : 'Copy formula'}
                            size="sm"
                            variant="secondary"
                            onClick={() => handleCopyFormula(sec.codeOrFormula!, idx)}
                            className="absolute top-2 right-2"
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  {generatedSheet.keyTerms && generatedSheet.keyTerms.length > 0 && (
                    <div>
                      <h4 className="text-[15px] font-semibold text-ink mb-2">Key terms</h4>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {generatedSheet.keyTerms.map((kt, kIdx) => (
                          <div key={kIdx} className="rounded-control border border-line p-3">
                            <div className="text-sm font-medium text-ink">
                              {cleanDisplayText(kt.term)}
                            </div>
                            <div className="text-[13px] text-ink-2 mt-0.5">
                              {cleanDisplayText(kt.definition)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {generatedSheet.mnemonics && generatedSheet.mnemonics.length > 0 && (
                    <div className="rounded-control bg-accent-soft text-accent-ink p-4">
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {generatedSheet.mnemonics.map((m, mIdx) => (
                          <li key={mIdx}>{cleanDisplayText(m)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Clear draft confirm */}
      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear draft?"
        description="Your saved Clutch Notes are not affected."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                patch({ notesText: '', extractedFileMeta: null });
                setFileError('');
                setConfirmClear(false);
              }}
            >
              Clear
            </Button>
          </>
        }
      >
        <div />
      </Modal>

      {/* Delete sheet confirm */}
      <Modal
        open={deleteSheet !== null}
        onClose={() => setDeleteSheet(null)}
        title="Delete these Clutch Notes?"
        description={
          deleteSheet
            ? `“${deleteSheet.title}” will be permanently removed. Exams you already generated are not affected.`
            : undefined
        }
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteSheet(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteSheet) {
                  onDeleteCheatsheet(deleteSheet.id);
                  const next = cheatsheets.find((s) => s.id !== deleteSheet.id);
                  patch({ selectedSheetId: next?.id || '' });
                }
                setDeleteSheet(null);
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <div />
      </Modal>
    </div>
  );
};
