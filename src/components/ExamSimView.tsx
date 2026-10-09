import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, ArrowLeft } from 'lucide-react';
import { Course, Cheatsheet, Exam, ExamAttempt } from '../types';
import { extractTextFromFile } from '../lib/file-parser';
import {
  clampQuestionCount,
  generateExamFromNotes,
  gradeExam,
  buildAttemptReview,
} from '../lib/exam-generator';
import { usePersistentState } from '../lib/usePersistentState';
import { formatDate, formatDuration } from '../lib/format';
import { scoreTone } from '../lib/score';
import { TabId } from '../lib/navigation';
import { Badge, Button, Card, CardHeader, PageHeader } from './ui';
import { ExamSetup } from './exam/ExamSetup';
import { ExamTaking } from './exam/ExamTaking';
import { ExamResults } from './exam/ExamResults';
import { ScoreSummary } from './exam/ScoreSummary';
import { QuestionReview } from './exam/QuestionReview';

interface ExamSimViewProps {
  courses: Course[];
  cheatsheets: Cheatsheet[];
  exams: Exam[];
  attempts: ExamAttempt[];
  onSaveExam: (exam: Exam) => void;
  onSaveAttempt: (attempt: ExamAttempt) => void;
  searchQuery?: string;
  retakeExam?: Exam | null;
  onRetakeHandled?: () => void;
  onNavigateTab: (tab: TabId) => void;
  onOpenAttempt: (id: string) => void;
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
  startedAt?: number | null;
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
    startedAt: null,
  };
}

function byTypeFromItems(
  items: { question: { type: string }; correct: boolean }[]
): Record<string, { correct: number; total: number }> {
  const byType: Record<string, { correct: number; total: number }> = {};
  for (const r of items) {
    const label = TYPE_LABELS[r.question.type] || r.question.type;
    if (!byType[label]) byType[label] = { correct: 0, total: 0 };
    byType[label].total += 1;
    if (r.correct) byType[label].correct += 1;
  }
  return byType;
}

export const ExamSimView: React.FC<ExamSimViewProps> = ({
  courses,
  cheatsheets,
  exams,
  attempts,
  onSaveExam,
  onSaveAttempt,
  searchQuery = '',
  retakeExam = null,
  onRetakeHandled,
  onNavigateTab,
  onOpenAttempt,
}) => {
  const [session, setSession] = usePersistentState<ExamSession>(SESSION_KEY, () =>
    defaultSession(courses, cheatsheets)
  );
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>('');
  const [scanPercent, setScanPercent] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fileError, setFileError] = useState('');

  const patch = (p: Partial<ExamSession>) => setSession((prev) => ({ ...prev, ...p }));

  const {
    sourceMode, notesFileText, extractedFileMeta, targetCourseName, customSubjectName,
    selectedCheatsheetId, countPreset, customCount, selectedTypes, genWarning,
    currentExam, phase, answers, confirmSubmit, currentQuestionIdx,
    lastAttemptId, reviewedAttemptId, startedAt,
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

  const setAnswer = (qid: string, value: string, idx: number) => {
    patch({ answers: { ...answers, [qid]: value }, currentQuestionIdx: idx });
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
        notesFileText: extracted.text,
      });
      if (!targetCourseName) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        patch({ customSubjectName: cleanName });
      }
    } catch (err) {
      console.error('File parsing error', err);
      setFileError('Couldn’t read this file. Try another file or paste the text below.');
    } finally {
      setIsReadingFile(false);
    }
  };

  const handleGenerate = async () => {
    const selectValue = courses.some((c) => c.title === targetCourseName)
      ? targetCourseName
      : '';
    let courseName = selectValue || customSubjectName.trim() || 'Uploaded Study Notes';
    let extraNotes = notesFileText;
    if (sourceMode === 'cheatsheet') {
      const effectiveSheetId = cheatsheets.some((s) => s.id === selectedCheatsheetId)
        ? selectedCheatsheetId
        : cheatsheets[0]?.id ?? '';
      const sheet = cheatsheets.find((s) => s.id === effectiveSheetId);
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
        startedAt: Date.now(),
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
      timeSpentSeconds: startedAt
        ? Math.max(0, Math.round((Date.now() - startedAt) / 1000))
        : 0,
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
      startedAt: Date.now(),
    });
  };

  // Cross-screen request: start a retake (e.g. from Overview/History).
  useEffect(() => {
    if (!retakeExam) return;
    handleRetake(retakeExam);
    onRetakeHandled?.();
  }, [retakeExam]);

  const handleNewExam = () => {
    patch({
      phase: 'setup',
      currentExam: null,
      answers: {},
      confirmSubmit: false,
      lastAttemptId: null,
      reviewedAttemptId: null,
      genWarning: '',
      startedAt: null,
    });
  };

  const handleStartOver = () => {
    setSession(defaultSession(courses, cheatsheets));
    setFileError('');
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

  const gradedResults =
    lastAttempt && currentExam ? gradeExam(currentExam, lastAttempt.userAnswers) : null;

  const recentAttempts = [...attempts]
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, 3);

  const filteredRecent = searchQuery.trim()
    ? recentAttempts.filter(
        (a) =>
          a.examTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.courseName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : recentAttempts;

  return (
    <div>
      <PageHeader
        title="Exam Simulator"
        description="Practice with questions generated only from your own material."
      />

      {phase === 'setup' && (
        <div className="space-y-6">
          <ExamSetup
            courses={courses}
            cheatsheets={cheatsheets}
            sourceMode={sourceMode}
            notesFileText={notesFileText}
            extractedFileMeta={extractedFileMeta}
            targetCourseName={targetCourseName}
            customSubjectName={customSubjectName}
            selectedCheatsheetId={selectedCheatsheetId}
            countPreset={countPreset}
            customCount={customCount}
            selectedTypes={selectedTypes}
            genWarning={genWarning}
            isReadingFile={isReadingFile}
            scanPercent={scanPercent}
            scanStatus={scanStatus}
            fileError={fileError}
            isGenerating={isGenerating}
            customCountValid={customCountValid}
            patch={patch}
            onFile={handleFile}
            onGenerate={handleGenerate}
            onStartOver={handleStartOver}
            onNavigateTab={onNavigateTab}
          />

          {recentAttempts.length > 0 && (
            <Card>
              <CardHeader
                title="Recent attempts"
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigateTab('history')}
                  >
                    View all
                  </Button>
                }
              />
              {filteredRecent.length === 0 ? (
                <p className="text-[13px] text-ink-3">
                  No attempts match the current search.
                </p>
              ) : (
                <div className="divide-y divide-line">
                  {filteredRecent.map((att) => (
                    <button
                      key={att.id}
                      type="button"
                      onClick={() =>
                        onOpenAttempt ? onOpenAttempt(att.id) : openReview(att)
                      }
                      className="w-full flex items-center gap-3 -mx-2 px-2 py-3 rounded-control text-left hover:bg-subtle transition-[background-color] duration-150"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-ink truncate">
                          {att.examTitle}
                        </div>
                        <div className="text-[13px] text-ink-3 truncate">
                          {[
                            att.courseName,
                            formatDate(att.completedAt),
                            att.timeSpentSeconds > 0
                              ? formatDuration(att.timeSpentSeconds)
                              : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </div>
                      </div>
                      <Badge tone={scoreTone(att.percentage)}>{att.percentage}%</Badge>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {phase === 'taking' && currentExam && (
        <ExamTaking
          exam={currentExam}
          answers={answers}
          onAnswer={setAnswer}
          onSubmit={requestSubmit}
          confirmSubmit={confirmSubmit}
          unansweredCount={unansweredCount}
          onConfirmSubmit={handleSubmitExam}
          onKeepAnswering={() => patch({ confirmSubmit: false })}
          startedAt={startedAt}
        />
      )}

      {phase === 'results' && lastAttempt && currentExam && gradedResults && (
        <ExamResults
          attempt={lastAttempt}
          exam={currentExam}
          items={currentExam.questions.map((q) => {
            const res = gradedResults.results.find((r) => r.questionId === q.id);
            return {
              question: q,
              userAnswer: res?.userAnswer || '',
              correct: res?.correct ?? false,
            };
          })}
          byType={gradedResults.byType}
          onRetake={() => handleRetake(currentExam)}
          onNewExam={handleNewExam}
        />
      )}

      {phase === 'review' && reviewedAttempt && review && (
        <Card padding="lg" className="space-y-6">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="text-xs font-medium text-accent-ink">
                {reviewedAttempt.courseName}
              </div>
              <h2 className="font-display text-xl font-semibold text-ink">
                {reviewedAttempt.examTitle}
              </h2>
              <p className="text-[13px] text-ink-3 mt-0.5">
                {new Date(reviewedAttempt.completedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" icon={ArrowLeft} onClick={handleNewExam}>
                Back
              </Button>
              {examForReview && (
                <Button icon={RotateCcw} onClick={() => handleRetake(examForReview)}>
                  Retake this exam
                </Button>
              )}
            </div>
          </div>

          <ScoreSummary
            percentage={review.percentage}
            score={review.score}
            maxScore={review.maxScore}
            correctCount={review.perQuestion.filter((r) => r.correct).length}
            total={review.perQuestion.length}
            timeSpentSeconds={reviewedAttempt.timeSpentSeconds}
            byType={byTypeFromItems(review.perQuestion)}
          />

          <div className="border-t border-line pt-5">
            {review.available ? (
              <QuestionReview items={review.perQuestion} />
            ) : (
              <p className="text-sm text-ink-2 rounded-control bg-subtle p-4">
                The questions for this attempt are no longer available.
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
