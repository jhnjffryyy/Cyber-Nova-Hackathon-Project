import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  GraduationCap,
  Sparkles,
  RefreshCw,
  FileCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Image as ImageIcon,
  History,
} from 'lucide-react';
import { Course, Cheatsheet, Exam, ExamAttempt } from '../types';
import { extractTextFromFile } from '../lib/file-parser';
import {
  QUESTION_COUNT_PRESETS,
  clampQuestionCount,
  generateExamFromNotes,
  gradeExam,
  feedbackFor,
  buildAttemptReview,
} from '../lib/exam-generator';
import { usePersistentState } from '../lib/usePersistentState';
import { cleanDisplayText } from '../lib/text-clean';

interface ExamSimViewProps {
  courses: Course[];
  cheatsheets: Cheatsheet[];
  exams: Exam[];
  attempts: ExamAttempt[];
  onSaveExam: (exam: Exam) => void;
  onSaveAttempt: (attempt: ExamAttempt) => void;
  searchQuery?: string;
}

const QUESTION_TYPES = ['Multiple Choice', 'True/False', 'Identification'];

const TYPE_LABELS: Record<string, string> = {
  'multiple-choice': 'Multiple choice',
  'true-false': 'True or false',
  identification: 'Identification',
};

type ExamPhase = 'setup' | 'taking' | 'results' | 'review';

interface ExtractedFileMeta {
  fileName: string;
  wordCount: number;
  isScannedImage: boolean;
}

interface ExamSession {
  sourceMode: 'upload' | 'cheatsheet';
  notesFileText: string;
  extractedFileMeta: ExtractedFileMeta | null;
  targetCourseName: string;
  customSubjectName: string;
  selectedCheatsheetId: string;
  countPreset: string;
  customCount: string;
  selectedTypes: string[];
  genWarning: string;
  currentExam: Exam | null;
  phase: ExamPhase;
  answers: Record<string, string>;
  confirmSubmit: boolean;
  currentQuestionIdx: number;
  lastAttemptId: string | null;
  reviewedAttemptId: string | null;
}

const SESSION_KEY = 'studyflow_exam_session_v1';

function defaultSession(courses: Course[], cheatsheets: Cheatsheet[]): ExamSession {
  return {
    sourceMode: 'upload',
    notesFileText: '',
    extractedFileMeta: null,
    targetCourseName: courses[0]?.title || '',
    customSubjectName: '',
    selectedCheatsheetId: cheatsheets[0]?.id || '',
    countPreset: '10',
    customCount: '',
    selectedTypes: [...QUESTION_TYPES],
    genWarning: '',
    currentExam: null,
    phase: 'setup',
    answers: {},
    confirmSubmit: false,
    currentQuestionIdx: 0,
    lastAttemptId: null,
    reviewedAttemptId: null,
  };
}

export const ExamSimView: React.FC<ExamSimViewProps> = ({
  courses,
  cheatsheets,
  exams,
  attempts,
  onSaveExam,
  onSaveAttempt,
  searchQuery = '',
}) => {
  const [session, setSession] = usePersistentState<ExamSession>(SESSION_KEY, () =>
    defaultSession(courses, cheatsheets)
  );
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>('');
  const [scanPercent, setScanPercent] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const patch = (p: Partial<ExamSession>) => setSession((prev) => ({ ...prev, ...p }));

  const {
    sourceMode, notesFileText, extractedFileMeta, targetCourseName, customSubjectName,
    selectedCheatsheetId, countPreset, customCount, selectedTypes, genWarning,
    currentExam, phase, answers, confirmSubmit, currentQuestionIdx,
    lastAttemptId, reviewedAttemptId,
  } = session;

  // Scroll back to the question the user was on when the session was restored
  useEffect(() => {
    if (phase === 'taking' && currentQuestionIdx > 0) {
      document.getElementById(`exam-q-${currentQuestionIdx}`)?.scrollIntoView({ block: 'center' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastAttempt = lastAttemptId
    ? attempts.find((a) => a.id === lastAttemptId) || null
    : null;
  const reviewedAttempt = reviewedAttemptId
    ? attempts.find((a) => a.id === reviewedAttemptId) || null
    : null;
  const review = reviewedAttempt ? buildAttemptReview(reviewedAttempt, exams) : null;

  const customCountNum = countPreset === 'custom' ? Number(customCount) : NaN;
  const customCountValid =
    countPreset !== 'custom' ||
    (customCount.trim() !== '' && Number.isInteger(customCountNum) && customCountNum >= 1 && customCountNum <= 50);
  const questionCount = countPreset === 'custom' ? clampQuestionCount(customCountNum) : Number(countPreset);

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length > 1) {
        patch({ selectedTypes: selectedTypes.filter((t) => t !== type) });
      }
    } else {
      patch({ selectedTypes: [...selectedTypes, type] });
    }
  };

  const setAnswer = (qid: string, value: string, idx: number) => {
    patch({ answers: { ...answers, [qid]: value }, currentQuestionIdx: idx });
  };

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
        notesFileText: extracted.text,
      });
      if (!targetCourseName) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        patch({ customSubjectName: cleanName });
      }
    } catch (err) {
      console.error('File parsing error', err);
    } finally {
      setIsReadingFile(false);
    }
  };

  const handleGenerate = async () => {
    let courseName = targetCourseName || customSubjectName.trim() || 'Uploaded Study Notes';
    let extraNotes = notesFileText;
    if (sourceMode === 'cheatsheet') {
      const sheet = cheatsheets.find((s) => s.id === selectedCheatsheetId);
      if (sheet) {
        courseName = sheet.courseName;
        extraNotes =
          `${sheet.title}\n${sheet.summary}\n` +
          sheet.sections
            .map((s) => `${s.heading}\n${s.bulletPoints.join('\n')}`)
            .join('\n') +
          '\n' +
          sheet.keyTerms.map((kt) => `${kt.term}: ${kt.definition}`).join('\n');
      }
    }
    if (!extraNotes.trim()) return;

    setIsGenerating(true);
    try {
      const result = generateExamFromNotes({
        courseName,
        questionCount,
        questionTypes: selectedTypes,
        notes: extraNotes,
      });
      patch({ genWarning: result.warning || '' });
      if (result.generated === 0) return;
      onSaveExam(result.exam);
      patch({
        currentExam: result.exam,
        phase: 'taking',
        answers: {},
        confirmSubmit: false,
        lastAttemptId: null,
        reviewedAttemptId: null,
        currentQuestionIdx: 0,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const unansweredCount = currentExam
    ? currentExam.questions.filter((q) => !(answers[q.id] || '').trim()).length
    : 0;

  const requestSubmit = () => {
    if (unansweredCount > 0) {
      patch({ confirmSubmit: true });
    } else {
      handleSubmitExam();
    }
  };

  const handleSubmitExam = () => {
    if (!currentExam) return;
    const graded = gradeExam(currentExam, answers);
    const attempt: ExamAttempt = {
      id: `att-${Date.now()}`,
      examId: currentExam.id,
      examTitle: currentExam.title,
      courseName: currentExam.courseName,
      score: graded.score,
      maxScore: graded.maxScore,
      percentage: graded.percentage,
      userAnswers: answers,
      completedAt: new Date().toISOString(),
      timeSpentSeconds: 0,
      questions: currentExam.questions,
      examSnapshot: { title: currentExam.title, courseName: currentExam.courseName },
    };
    onSaveAttempt(attempt);
    patch({ lastAttemptId: attempt.id, phase: 'results', confirmSubmit: false });

    if (graded.percentage >= 80) {
      try {
        confetti({ particleCount: 80, spread: 60 });
      } catch {
        // ok
      }
    }
  };

  const handleRetake = (exam: Exam) => {
    patch({
      currentExam: exam,
      phase: 'taking',
      answers: {},
      confirmSubmit: false,
      lastAttemptId: null,
      reviewedAttemptId: null,
      currentQuestionIdx: 0,
    });
  };

  const handleNewExam = () => {
    patch({
      phase: 'setup',
      currentExam: null,
      answers: {},
      confirmSubmit: false,
      lastAttemptId: null,
      reviewedAttemptId: null,
      genWarning: '',
    });
  };

  const handleStartOver = () => {
    setSession(defaultSession(courses, cheatsheets));
  };

  const openReview = (att: ExamAttempt) => {
    patch({ phase: 'review', reviewedAttemptId: att.id, lastAttemptId: null });
  };

  const examForReview: Exam | null =
    reviewedAttempt && review?.available
      ? {
          id: reviewedAttempt.examId,
          courseName: reviewedAttempt.courseName,
          title: reviewedAttempt.examTitle,
          topic: reviewedAttempt.courseName,
          difficulty: 'Medium',
          timeLimitMinutes: 0,
          questionTypes: [],
          questions: review.questions,
          createdAt: reviewedAttempt.completedAt,
        }
      : null;

  const gradedResults = lastAttempt && currentExam ? gradeExam(currentExam, lastAttempt.userAnswers) : null;
  const showHistory = phase === 'setup' || phase === 'review';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Exam Simulator
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Simulate realistic exam questions from your scanned PDF, PNG notes, or Clutch Notes
          </p>
        </div>
      </div>

      {/* Generator Card */}
      {phase === 'setup' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <h2 className="font-black text-sm text-gray-900">Exam Simulator</h2>
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Upload notes (PDF or photo/PNG) or pick saved Clutch Notes. Questions are generated only from your material.
              </p>
            </div>
            <button
              onClick={handleStartOver}
              className="text-[11px] font-bold text-gray-400 hover:text-rose-600 shrink-0"
            >
              Start over
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => patch({ sourceMode: 'upload' })}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sourceMode === 'upload'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              Upload PDF or Notes Photo
            </button>
            <button
              onClick={() => patch({ sourceMode: 'cheatsheet' })}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sourceMode === 'cheatsheet'
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              Use saved Clutch Notes
            </button>
          </div>

          <div className="space-y-4 pt-1">
            {sourceMode === 'upload' ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Notes File or Photo (PDF, PNG, JPG, TXT, MD)
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
                            {scanStatus || 'Scanning file with OCR...'}
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

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Subject
                    </label>
                    {courses.length > 0 ? (
                      <select
                        value={targetCourseName}
                        onChange={(e) => patch({ targetCourseName: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-emerald-500"
                      >
                        {courses.map((c) => (
                          <option key={c.id} value={c.title}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="e.g. Physics, Operating Systems, Chemistry..."
                        value={customSubjectName}
                        onChange={(e) => patch({ customSubjectName: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-emerald-500"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Study Notes / Extracted Material
                  </label>
                  <textarea
                    rows={4}
                    value={notesFileText}
                    onChange={(e) => patch({ notesFileText: e.target.value })}
                    placeholder="Upload a PDF or PNG image above, or paste your study material here..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-800 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Select Saved Clutch Notes
                </label>
                {cheatsheets.length > 0 ? (
                  <select
                    value={selectedCheatsheetId}
                    onChange={(e) => patch({ selectedCheatsheetId: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-emerald-500"
                  >
                    {cheatsheets.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.courseName}: {s.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-400">
                    No Clutch Notes saved yet. Use "Upload PDF or Notes Photo" above or create one in the Clutch Notes tab.
                  </div>
                )}
              </div>
            )}

            {/* Question count & Question types row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Questions
                </label>
                <select
                  value={countPreset}
                  onChange={(e) => patch({ countPreset: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-emerald-500"
                >
                  {QUESTION_COUNT_PRESETS.map((n) => (
                    <option key={n} value={String(n)}>
                      {n} Questions
                    </option>
                  ))}
                  <option value="custom">Custom</option>
                </select>
                {countPreset === 'custom' && (
                  <div className="mt-2">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      step={1}
                      value={customCount}
                      onChange={(e) => patch({ customCount: e.target.value })}
                      placeholder="1-50"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-emerald-500"
                    />
                    {!customCountValid && (
                      <span className="text-[10px] text-rose-600 font-medium">
                        Enter a whole number from 1 to 50
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Question types
                </label>
                <div className="flex flex-wrap gap-2">
                  {QUESTION_TYPES.map((type) => {
                    const isSelected = selectedTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleType(type)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-emerald-800 text-white shadow-2xs'
                            : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Warning banner */}
            {genWarning && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                {genWarning}
              </div>
            )}

            {/* Generate Exam Button */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Questions are generated only from your material.
              </span>
              <button
                onClick={handleGenerate}
                disabled={
                  isGenerating ||
                  !customCountValid ||
                  (sourceMode === 'upload' && !notesFileText.trim()) ||
                  (sourceMode === 'cheatsheet' && cheatsheets.length === 0)
                }
                className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating exam questions...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-300" />
                    Generate Exam
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Exam Taking Mode */}
      {phase === 'taking' && currentExam && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                {currentExam.courseName}
              </span>
              <h2 className="text-base font-black text-gray-900 mt-0.5">
                {currentExam.title}
              </h2>
              <span className="text-[11px] text-gray-400">
                Answered {currentExam.questions.length - unansweredCount} of {currentExam.questions.length}
              </span>
            </div>
            <button
              onClick={requestSubmit}
              className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
            >
              Finish & Grade
            </button>
          </div>

          {confirmSubmit && unansweredCount > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between gap-3">
              <span>You have {unansweredCount} unanswered questions. Submit anyway?</span>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleSubmitExam}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  Submit anyway
                </button>
                <button
                  onClick={() => patch({ confirmSubmit: false })}
                  className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-800 font-bold"
                >
                  Keep answering
                </button>
              </div>
            </div>
          )}

          {/* Question List */}
          <div className="space-y-6">
            {currentExam.questions.map((q, idx) => (
              <div
                key={q.id}
                id={`exam-q-${idx}`}
                className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-xs text-gray-500">Question {idx + 1}</span>
                    <span className="font-bold text-xs text-gray-900 leading-relaxed">
                      {cleanDisplayText(q.question)}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-200 text-gray-700 shrink-0">
                    {TYPE_LABELS[q.type] || q.type}
                  </span>
                </div>

                {/* Multiple Choice Options */}
                {q.type === 'multiple-choice' && q.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt, oIdx) => {
                      const isChosen = answers[q.id] === opt;
                      return (
                        <div
                          key={oIdx}
                          onClick={() => setAnswer(q.id, opt, idx)}
                          className={`p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-all flex items-center gap-2 ${
                            isChosen
                              ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-bold'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span>{cleanDisplayText(opt)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* True / False Buttons */}
                {q.type === 'true-false' && (
                  <div className="flex gap-2 pt-1">
                    {['True', 'False'].map((tf) => {
                      const isChosen = answers[q.id] === tf;
                      return (
                        <button
                          key={tf}
                          type="button"
                          onClick={() => setAnswer(q.id, tf, idx)}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                            isChosen
                              ? 'bg-emerald-800 text-white'
                              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {tf}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Identification Input */}
                {q.type === 'identification' && (
                  <div className="pt-1">
                    <input
                      type="text"
                      placeholder="Type your answer here..."
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswer(q.id, e.target.value, idx)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={requestSubmit}
              className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
            >
              Submit Exam
            </button>
          </div>
        </div>
      )}

      {/* Results Mode */}
      {phase === 'results' && lastAttempt && currentExam && gradedResults && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-black text-gray-900">Exam Results</h2>
              <p className="text-xs text-gray-500">{lastAttempt.examTitle}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleRetake(currentExam)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retake
              </button>
              <button
                onClick={handleNewExam}
                className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                New Exam
              </button>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-around text-center">
            <div>
              <span className="text-3xl font-black text-gray-900 block">
                {lastAttempt.percentage}%
              </span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Accuracy
              </span>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div>
              <span className="text-3xl font-black text-emerald-700 block">
                {lastAttempt.score} / {lastAttempt.maxScore}
              </span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Score
              </span>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div>
              <span className="text-3xl font-black text-gray-900 block">
                {gradedResults.correctCount}
              </span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Correct
              </span>
            </div>
          </div>

          <p className="text-xs font-semibold text-gray-700">
            {feedbackFor(lastAttempt.percentage)}
          </p>

          {/* Per-type breakdown */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(gradedResults.byType).map(([label, v]) => (
              <span
                key={label}
                className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-semibold text-gray-700"
              >
                {label}: {v.correct}/{v.total}
              </span>
            ))}
          </div>

          {/* Detailed Question Review */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Question Breakdown
            </h3>
            {currentExam.questions.map((q, idx) => {
              const res = gradedResults.results.find((r) => r.questionId === q.id);
              const isCorrect = res?.correct ?? false;
              return (
                <div key={q.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-xs text-gray-900">
                      Question {idx + 1} {cleanDisplayText(q.question)}
                    </span>
                    {isCorrect ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> Correct
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1 shrink-0">
                        <XCircle className="w-3 h-3" /> Incorrect
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 flex gap-4 pt-1">
                    <span><strong>Your answer:</strong> {res?.userAnswer || 'None'}</span>
                    <span><strong>Correct:</strong> {cleanDisplayText(q.correctAnswer)}</span>
                  </div>
                  {q.explanation && (
                    <p className="text-[11px] text-gray-500 bg-white p-2.5 rounded-lg border border-gray-200">
                      {cleanDisplayText(q.explanation)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Read-only Attempt Review */}
      {phase === 'review' && reviewedAttempt && review && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-black text-gray-900">{reviewedAttempt.examTitle}</h2>
              <p className="text-xs text-gray-500">
                {reviewedAttempt.courseName} · completed {new Date(reviewedAttempt.completedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleNewExam}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1.5"
              >
                <History className="w-3.5 h-3.5" />
                Back to history
              </button>
              {examForReview && (
                <button
                  onClick={() => handleRetake(examForReview)}
                  className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Retake this exam
                </button>
              )}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-around text-center">
            <div>
              <span className="text-3xl font-black text-gray-900 block">
                {review.percentage}%
              </span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Accuracy
              </span>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div>
              <span className="text-3xl font-black text-emerald-700 block">
                {review.score} / {review.maxScore}
              </span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Score
              </span>
            </div>
          </div>

          <p className="text-xs font-semibold text-gray-700">
            {feedbackFor(review.percentage)}
          </p>

          {review.available ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const byType: Record<string, { correct: number; total: number }> = {};
                  for (const r of review.perQuestion) {
                    const label = TYPE_LABELS[r.question.type] || r.question.type;
                    if (!byType[label]) byType[label] = { correct: 0, total: 0 };
                    byType[label].total += 1;
                    if (r.correct) byType[label].correct += 1;
                  }
                  return Object.entries(byType).map(([label, v]) => (
                    <span
                      key={label}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-semibold text-gray-700"
                    >
                      {label}: {v.correct}/{v.total}
                    </span>
                  ));
                })()}
              </div>
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Question Breakdown
              </h3>
              {review.perQuestion.map(({ question: q, userAnswer, correct }, idx) => (
                <div key={q.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-xs text-gray-900">
                      Question {idx + 1} {cleanDisplayText(q.question)}
                    </span>
                    {correct ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> Correct
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1 shrink-0">
                        <XCircle className="w-3 h-3" /> Incorrect
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 flex gap-4 pt-1">
                    <span><strong>Your answer:</strong> {userAnswer || 'None'}</span>
                    <span><strong>Correct:</strong> {cleanDisplayText(q.correctAnswer)}</span>
                  </div>
                  {q.explanation && (
                    <p className="text-[11px] text-gray-500 bg-white p-2.5 rounded-lg border border-gray-200">
                      {cleanDisplayText(q.explanation)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 p-4 rounded-xl bg-gray-50 border border-gray-200">
              The questions for this attempt are no longer available.
            </p>
          )}
        </div>
      )}

      {/* Past Attempts Library */}
      {attempts.length > 0 && showHistory && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-3">
          <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
            Past Exam Attempts ({attempts.length})
          </h3>
          <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto pr-1">
            {[...attempts].reverse().map((att) => (
              <button
                key={att.id}
                onClick={() => openReview(att)}
                className="w-full py-2.5 flex items-center justify-between text-xs text-left hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
              >
                <div>
                  <span className="font-bold text-gray-900 block">{att.examTitle}</span>
                  <span className="text-[11px] text-gray-400">
                    <span>{att.courseName}</span>
                    <span className="ml-2">{new Date(att.completedAt).toLocaleDateString()}</span>
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={`font-black text-xs ${
                      att.percentage >= 80
                        ? 'text-emerald-700'
                        : att.percentage >= 60
                        ? 'text-amber-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {att.percentage}%
                  </span>
                  <span className="text-[10px] text-gray-400 block">
                    {att.score} / {att.maxScore} pts
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
