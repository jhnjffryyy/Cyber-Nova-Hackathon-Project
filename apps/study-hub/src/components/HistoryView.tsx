import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, GraduationCap, RotateCcw, FileText, NotebookText } from 'lucide-react';
import { Cheatsheet, Exam, ExamAttempt } from '../types';
import { buildAttemptReview } from '../lib/exam-generator';
import { formatDate, formatDuration } from '../lib/format';
import { scoreTone } from '../lib/score';
import { TabId } from '../lib/navigation';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  SegmentedControl,
  Select,
  Stat,
} from './ui';
import { ScoreSummary } from './exam/ScoreSummary';
import { QuestionReview } from './exam/QuestionReview';

interface HistoryViewProps {
  attempts: ExamAttempt[];
  exams: Exam[];
  cheatsheets: Cheatsheet[];
  searchQuery?: string;
  historyAttemptId?: string | null;
  onHistoryAttemptHandled?: () => void;
  onRetake: (exam: Exam) => void;
  onOpenCheatsheet: (id: string) => void;
  onNavigateTab: (tab: TabId) => void;
}

type HistoryTab = 'attempts' | 'exams' | 'sheets';
type ScoreBand = 'all' | 'high' | 'mid' | 'low';
type AttemptSort = 'newest' | 'oldest' | 'highest' | 'lowest';

const TYPE_LABELS: Record<string, string> = {
  'multiple-choice': 'Multiple choice',
  'true-false': 'True or false',
  identification: 'Identification',
};

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const monthLabel = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

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

const TONE_FILL: Record<string, string> = {
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
};

const ScoreTrend: React.FC<{ attempts: ExamAttempt[] }> = ({ attempts }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = Math.round(entries[0].contentRect.width);
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const chrono = [...attempts].sort((a, b) => a.completedAt.localeCompare(b.completedAt));
  if (chrono.length < 2) {
    return (
      <p className="text-[13px] text-ink-3">
        Complete at least two attempts to see a trend.
      </p>
    );
  }
  const W = width;
  const H = 180;
  const padL = 32;
  const padR = 12;
  const padT = 12;
  const padB = 12;
  const x = (i: number) =>
    padL + (i / Math.max(1, chrono.length - 1)) * (W - padL - padR);
  const y = (pct: number) => padT + (1 - pct / 100) * (H - padT - padB);
  const pts = chrono.map((a, i) => `${x(i)},${y(a.percentage)}`).join(' ');

  return (
    <div ref={wrapRef}>
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="block max-w-full h-auto"
      role="img"
      aria-label={`Scores from ${chrono[0].percentage}% to ${chrono[chrono.length - 1].percentage}% across ${chrono.length} attempts`}
    >
      {[0, 50, 100].map((v) => (
        <g key={v}>
          <line
            x1={padL}
            x2={W - padR}
            y1={y(v)}
            y2={y(v)}
            stroke="var(--line)"
            strokeWidth="1"
          />
          <text
            x={padL - 8}
            y={y(v) + 4}
            textAnchor="end"
            fontSize="11"
            fill="var(--ink-3)"
          >
            {v}
          </text>
        </g>
      ))}
      <polyline
        points={pts}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {chrono.map((a, i) => (
        <circle
          key={a.id}
          cx={x(i)}
          cy={y(a.percentage)}
          r="4"
          fill={TONE_FILL[scoreTone(a.percentage)]}
        >
          <title>
            {a.examTitle} · {a.percentage}% · {formatDate(a.completedAt)}
          </title>
        </circle>
      ))}
    </svg>
    </div>
  );
};

export const HistoryView: React.FC<HistoryViewProps> = ({
  attempts,
  exams,
  cheatsheets,
  searchQuery = '',
  historyAttemptId = null,
  onHistoryAttemptHandled,
  onRetake,
  onOpenCheatsheet,
  onNavigateTab,
}) => {
  const [tab, setTab] = useState<HistoryTab>('attempts');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [subject, setSubject] = useState('all');
  const [band, setBand] = useState<ScoreBand>('all');
  const [sort, setSort] = useState<AttemptSort>('newest');

  const resetFilters = () => {
    setSubject('all');
    setBand('all');
    setSort('newest');
  };

  // Cross-screen request: open a specific attempt's detail.
  useEffect(() => {
    if (!historyAttemptId) return;
    setTab('attempts');
    resetFilters();
    if (attempts.some((a) => a.id === historyAttemptId)) {
      setDetailId(historyAttemptId);
    }
    onHistoryAttemptHandled?.();
  }, [historyAttemptId]);

  const gq = searchQuery.trim().toLowerCase();
  const subjects = useMemo(
    () => [...new Set(attempts.map((a) => a.courseName))].sort(),
    [attempts]
  );

  const filtered = useMemo(() => {
    let list = attempts.filter((a) => {
      if (gq && !`${a.examTitle} ${a.courseName}`.toLowerCase().includes(gq)) return false;
      if (subject !== 'all' && a.courseName !== subject) return false;
      if (band === 'high' && a.percentage < 80) return false;
      if (band === 'mid' && (a.percentage < 60 || a.percentage >= 80)) return false;
      if (band === 'low' && a.percentage >= 60) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === 'oldest') return a.completedAt.localeCompare(b.completedAt);
      if (sort === 'highest') return b.percentage - a.percentage;
      if (sort === 'lowest') return a.percentage - b.percentage;
      return b.completedAt.localeCompare(a.completedAt);
    });
    return list;
  }, [attempts, gq, subject, band, sort]);

  const stats = useMemo(() => {
    if (filtered.length === 0) return null;
    const avg = Math.round(
      filtered.reduce((s, a) => s + a.percentage, 0) / filtered.length
    );
    const best = Math.max(...filtered.map((a) => a.percentage));
    const latest = [...filtered].sort((a, b) =>
      b.completedAt.localeCompare(a.completedAt)
    )[0];
    return { count: filtered.length, avg, best, latest: latest.percentage };
  }, [filtered]);

  const detailAttempt = detailId ? attempts.find((a) => a.id === detailId) || null : null;
  const detailReview = detailAttempt ? buildAttemptReview(detailAttempt, exams) : null;
  const detailExam: Exam | null =
    detailAttempt && detailReview?.available
      ? exams.find((e) => e.id === detailAttempt.examId) ?? {
          id: detailAttempt.examId,
          courseName: detailAttempt.courseName,
          title: detailAttempt.examTitle,
          topic: detailAttempt.courseName,
          difficulty: 'Medium',
          timeLimitMinutes: 0,
          questionTypes: [],
          questions: detailReview.questions,
          createdAt: detailAttempt.completedAt,
        }
      : null;

  const sortedExams = [...exams].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const sheetGroups = useMemo(() => {
    const sorted = [...cheatsheets].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const groups: { label: string; sheets: Cheatsheet[] }[] = [];
    for (const s of sorted) {
      if (gq && !`${s.title} ${s.courseName} ${s.topic}`.toLowerCase().includes(gq))
        continue;
      const label = monthLabel(s.createdAt);
      const g = groups.find((x) => x.label === label);
      if (g) g.sheets.push(s);
      else groups.push({ label, sheets: [s] });
    }
    return groups;
  }, [cheatsheets, gq]);

  return (
    <div>
      <PageHeader
        title="History"
        description="Your past exam attempts, saved exams and Clutch Notes."
      />

      <div className="mb-5">
        <SegmentedControl
          ariaLabel="History section"
          value={tab}
          onChange={(v) => setTab(v as HistoryTab)}
          options={[
            { value: 'attempts', label: 'Exam attempts', count: attempts.length },
            { value: 'exams', label: 'Saved exams', count: exams.length },
            { value: 'sheets', label: 'Clutch Notes', count: cheatsheets.length },
          ]}
        />
      </div>

      {tab === 'attempts' && (
        <>
          {detailAttempt && detailReview ? (
            <Card padding="lg" className="space-y-6">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={ArrowLeft}
                    className="-ml-2 mb-2"
                    onClick={() => setDetailId(null)}
                  >
                    All attempts
                  </Button>
                  <h2 className="font-display text-xl font-semibold text-ink">
                    {detailAttempt.examTitle}
                  </h2>
                  <p className="text-[13px] text-ink-3 mt-0.5">
                    {detailAttempt.courseName} · {fmtDateTime(detailAttempt.completedAt)}
                  </p>
                </div>
                {detailExam && (
                  <Button icon={RotateCcw} onClick={() => onRetake(detailExam)}>
                    Retake exam
                  </Button>
                )}
              </div>

              <ScoreSummary
                percentage={detailAttempt.percentage}
                score={detailAttempt.score}
                maxScore={detailAttempt.maxScore}
                correctCount={detailReview.perQuestion.filter((r) => r.correct).length}
                total={detailReview.perQuestion.length}
                timeSpentSeconds={detailAttempt.timeSpentSeconds}
                byType={byTypeFromItems(detailReview.perQuestion)}
              />

              <div className="border-t border-line pt-5">
                {detailReview.available ? (
                  <QuestionReview items={detailReview.perQuestion} />
                ) : (
                  <p className="text-sm text-ink-2 rounded-control bg-subtle p-4">
                    The questions for this attempt are no longer available.
                  </p>
                )}
              </div>
            </Card>
          ) : attempts.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No exam attempts yet"
              description="Finish a practice exam and it will appear here."
              action={
                <Button size="sm" onClick={() => onNavigateTab('exam')}>
                  Start an exam
                </Button>
              }
            />
          ) : (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <Select
                  aria-label="Filter by subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full sm:w-52"
                >
                  <option value="all">All subjects</option>
                  {subjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
                <SegmentedControl
                  ariaLabel="Filter by score"
                  value={band}
                  onChange={(v) => setBand(v as ScoreBand)}
                  options={[
                    { value: 'all', label: 'All' },
                    { value: 'high', label: '80%+' },
                    { value: 'mid', label: '60–79%' },
                    { value: 'low', label: 'Below 60%' },
                  ]}
                />
                <Select
                  aria-label="Sort attempts"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as AttemptSort)}
                  className="w-full sm:w-44 sm:ml-auto"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="highest">Highest score</option>
                  <option value="lowest">Lowest score</option>
                </Select>
              </div>

              {filtered.length === 0 ? (
                <EmptyState
                  compact
                  icon={GraduationCap}
                  title="No attempts match these filters"
                  action={
                    <Button variant="ghost" size="sm" onClick={resetFilters}>
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <>
                  {/* Stats */}
                  {stats && (
                    <Card>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <Stat label="Attempts" value={String(stats.count)} />
                        <Stat label="Average score" value={`${stats.avg}%`} />
                        <Stat label="Best score" value={`${stats.best}%`} tone="success" />
                        <Stat label="Latest score" value={`${stats.latest}%`} />
                      </div>
                    </Card>
                  )}

                  {/* Trend */}
                  <Card>
                    <CardHeader title="Score trend" />
                    <ScoreTrend attempts={filtered} />
                  </Card>

                  {/* List */}
                  <Card padding="none">
                    <div className="divide-y divide-line">
                      {filtered.map((att) => (
                        <button
                          key={att.id}
                          type="button"
                          onClick={() => setDetailId(att.id)}
                          className="w-full text-left px-4 sm:px-5 py-3.5 hover:bg-subtle flex items-center gap-3 transition-[background-color] duration-150"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-ink truncate">
                              {att.examTitle}
                            </div>
                            <div className="text-[13px] text-ink-3 truncate">
                              {[
                                att.courseName,
                                fmtDateTime(att.completedAt),
                                att.timeSpentSeconds > 0
                                  ? formatDuration(att.timeSpentSeconds)
                                  : null,
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </div>
                          </div>
                          <span className="text-xs text-ink-3 tabular-nums shrink-0">
                            {att.score}/{att.maxScore} pts
                          </span>
                          <Badge tone={scoreTone(att.percentage)}>
                            {att.percentage}%
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </Card>
                </>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'exams' &&
        (sortedExams.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No saved exams yet"
            action={
              <Button size="sm" onClick={() => onNavigateTab('exam')}>
                Create an exam
              </Button>
            }
          />
        ) : (
          <Card padding="none">
            <div className="divide-y divide-line">
              {sortedExams.map((exam) => {
                const examAttempts = attempts.filter((a) => a.examId === exam.id);
                const best = examAttempts.length
                  ? Math.max(...examAttempts.map((a) => a.percentage))
                  : null;
                return (
                  <div
                    key={exam.id}
                    className="flex items-center gap-3 px-4 sm:px-5 py-3.5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink truncate">
                        {exam.title}
                      </div>
                      <div className="text-[13px] text-ink-3 truncate">
                        {exam.courseName} · {exam.questions.length} questions ·{' '}
                        {formatDate(exam.createdAt)}
                        {examAttempts.length > 0 &&
                          ` · ${examAttempts.length} attempt${examAttempts.length === 1 ? '' : 's'}`}
                      </div>
                    </div>
                    {best !== null && (
                      <Badge tone={scoreTone(best)}>Best {best}%</Badge>
                    )}
                    <Button size="sm" onClick={() => onRetake(exam)}>
                      {examAttempts.length > 0 ? 'Take again' : 'Start'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}

      {tab === 'sheets' &&
        (sheetGroups.length === 0 ? (
          <EmptyState
            icon={NotebookText}
            title="No Clutch Notes yet"
            action={
              <Button size="sm" onClick={() => onNavigateTab('cheatsheets')}>
                Create Clutch Notes
              </Button>
            }
          />
        ) : (
          <div className="space-y-5">
            {sheetGroups.map((g) => (
              <div key={g.label}>
                <h3 className="text-[13px] font-medium text-ink-2 mb-1.5">{g.label}</h3>
                <Card padding="none">
                  <div className="divide-y divide-line">
                    {g.sheets.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => onOpenCheatsheet(s.id)}
                        className="w-full text-left px-4 sm:px-5 py-3.5 hover:bg-subtle transition-[background-color] duration-150"
                      >
                        <div className="text-xs font-medium text-accent-ink">
                          {s.courseName}
                        </div>
                        <div className="text-sm font-medium text-ink line-clamp-2">
                          {s.title}
                        </div>
                        <div className="text-[13px] text-ink-3 mt-0.5">
                          {s.sections.length} sections · {s.keyTerms.length} key terms ·{' '}
                          {formatDate(s.createdAt)}
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
};
