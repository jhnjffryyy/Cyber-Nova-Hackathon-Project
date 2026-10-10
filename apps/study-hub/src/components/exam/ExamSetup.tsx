import React from 'react';
import { Sparkles, NotebookText } from 'lucide-react';
import { Cheatsheet, Course } from '../../types';
import { QUESTION_COUNT_PRESETS } from '../../lib/exam-generator';
import { FileDropzone, FileMeta } from '../FileDropzone';
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  SegmentedControl,
  Select,
  Textarea,
} from '../ui';

const QUESTION_TYPES = ['Multiple Choice', 'True/False', 'Identification'];

export interface ExamSetupProps {
  courses: Course[];
  cheatsheets: Cheatsheet[];
  sourceMode: 'upload' | 'cheatsheet';
  notesFileText: string;
  extractedFileMeta: FileMeta | null;
  targetCourseName: string;
  customSubjectName: string;
  selectedCheatsheetId: string;
  countPreset: string;
  customCount: string;
  selectedTypes: string[];
  genWarning: string;
  isReadingFile: boolean;
  scanPercent: number;
  scanStatus: string;
  fileError: string;
  isGenerating: boolean;
  customCountValid: boolean;
  patch: (p: Record<string, unknown>) => void;
  onFile: (file: File) => void;
  onGenerate: () => void;
  onStartOver: () => void;
  onNavigateTab: (tab: 'cheatsheets') => void;
}

const sectionTitle = (n: number, label: string) => (
  <div className="flex items-center gap-2.5 mb-3">
    <span className="h-6 w-6 rounded-full bg-subtle text-xs font-medium text-ink-2 grid place-items-center shrink-0">
      {n}
    </span>
    <span className="text-sm font-semibold text-ink">{label}</span>
  </div>
);

export const ExamSetup: React.FC<ExamSetupProps> = (props) => {
  const {
    courses,
    cheatsheets,
    sourceMode,
    notesFileText,
    extractedFileMeta,
    targetCourseName,
    customSubjectName,
    selectedCheatsheetId,
    countPreset,
    customCount,
    selectedTypes,
    genWarning,
    isReadingFile,
    scanPercent,
    scanStatus,
    fileError,
    isGenerating,
    customCountValid,
    patch,
    onFile,
    onGenerate,
    onStartOver,
    onNavigateTab,
  } = props;

  const selectValue = courses.some((c) => c.title === targetCourseName)
    ? targetCourseName
    : '';
  const effectiveSheetId = cheatsheets.some((s) => s.id === selectedCheatsheetId)
    ? selectedCheatsheetId
    : cheatsheets[0]?.id ?? '';

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length > 1) {
        patch({ selectedTypes: selectedTypes.filter((t) => t !== type) });
      }
    } else {
      patch({ selectedTypes: [...selectedTypes, type] });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Create a practice exam"
          description="Questions are generated only from your material, on this device."
        />

        {/* 1. Source */}
        <div className="mb-5">
          {sectionTitle(1, 'Source')}
          <SegmentedControl
            ariaLabel="Exam source"
            value={sourceMode}
            onChange={(v) => patch({ sourceMode: v })}
            options={[
              { value: 'upload', label: 'Upload or paste notes' },
              { value: 'cheatsheet', label: 'Saved Clutch Notes' },
            ]}
          />
        </div>

        {/* 2. Material */}
        <div className="mb-5">
          {sectionTitle(2, 'Material')}
          {sourceMode === 'upload' ? (
            <div className="space-y-4">
              <FileDropzone
                accept=".txt,.pdf,.md,.csv,.json,image/png,image/jpeg,image/webp,image/*"
                onFile={onFile}
                isReading={isReadingFile}
                percent={scanPercent}
                status={scanStatus}
                meta={extractedFileMeta}
                error={fileError || undefined}
              />
              <Field label="Notes text" htmlFor="exam-notes">
                <Textarea
                  id="exam-notes"
                  rows={6}
                  value={notesFileText}
                  onChange={(e) => patch({ notesFileText: e.target.value })}
                  placeholder="Paste your study material here..."
                  className="font-mono text-[13px]"
                />
              </Field>
              {courses.length > 0 ? (
                <Field label="Subject" htmlFor="exam-subject">
                  <Select
                    id="exam-subject"
                    value={selectValue}
                    onChange={(e) => patch({ targetCourseName: e.target.value })}
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.title}>
                        {c.title}
                      </option>
                    ))}
                    <option value="">Other subject</option>
                  </Select>
                  {selectValue === '' && (
                    <Input
                      className="mt-2"
                      aria-label="Custom subject name"
                      placeholder="e.g. Physics, Operating Systems"
                      value={customSubjectName}
                      onChange={(e) => patch({ customSubjectName: e.target.value })}
                    />
                  )}
                </Field>
              ) : (
                <Field label="Subject" htmlFor="exam-subject">
                  <Input
                    id="exam-subject"
                    placeholder="e.g. Physics, Operating Systems"
                    value={customSubjectName}
                    onChange={(e) => patch({ customSubjectName: e.target.value })}
                  />
                </Field>
              )}
            </div>
          ) : cheatsheets.length > 0 ? (
            <Field label="Clutch Notes" htmlFor="exam-sheet">
              <Select
                id="exam-sheet"
                value={effectiveSheetId}
                onChange={(e) => patch({ selectedCheatsheetId: e.target.value })}
              >
                {cheatsheets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.courseName}: {s.title}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <EmptyState
              compact
              icon={NotebookText}
              title="No Clutch Notes saved yet"
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigateTab('cheatsheets')}
                >
                  Open Clutch Notes
                </Button>
              }
            />
          )}
        </div>

        {/* 3. Options */}
        <div className="mb-5">
          {sectionTitle(3, 'Options')}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Questions" htmlFor="exam-count">
              <Select
                id="exam-count"
                value={countPreset}
                onChange={(e) => patch({ countPreset: e.target.value })}
              >
                {QUESTION_COUNT_PRESETS.map((n) => (
                  <option key={n} value={String(n)}>
                    {n} questions
                  </option>
                ))}
                <option value="custom">Custom</option>
              </Select>
              {countPreset === 'custom' && (
                <div className="mt-2">
                  <Input
                    type="number"
                    aria-label="Custom question count"
                    min={1}
                    max={50}
                    step={1}
                    value={customCount}
                    onChange={(e) => patch({ customCount: e.target.value })}
                    placeholder="1-50"
                  />
                  {!customCountValid && (
                    <p className="text-xs text-danger-ink mt-1.5">
                      Enter a whole number from 1 to 50
                    </p>
                  )}
                </div>
              )}
            </Field>
            <Field label="Question types" htmlFor="exam-types">
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUESTION_TYPES.map((type) => {
                  const active = selectedTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleType(type)}
                      className={
                        active
                          ? 'h-8 px-3 rounded-control text-[13px] font-medium bg-accent text-on-accent transition-[background-color,color] duration-150'
                          : 'h-8 px-3 rounded-control text-[13px] font-medium bg-subtle text-ink-2 hover:text-ink transition-[background-color,color] duration-150'
                      }
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>
        </div>

        {genWarning && (
          <div className="rounded-control bg-warning-soft text-warning-ink p-3 text-[13px] mb-4">
            {genWarning}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
          <Button variant="ghost" size="sm" onClick={onStartOver}>
            Reset form
          </Button>
          <Button
            size="lg"
            icon={Sparkles}
            loading={isGenerating}
            onClick={onGenerate}
            disabled={
              isGenerating ||
              !customCountValid ||
              (sourceMode === 'upload' && !notesFileText.trim()) ||
              (sourceMode === 'cheatsheet' && cheatsheets.length === 0)
            }
          >
            {isGenerating ? 'Generating…' : 'Generate exam'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
