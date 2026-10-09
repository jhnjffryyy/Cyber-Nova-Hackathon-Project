import React, { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { Clock } from 'lucide-react';
import { Exam } from '../../types';
import { cleanDisplayText } from '../../lib/text-clean';
import { formatDuration } from '../../lib/format';
import { cn } from '../../lib/cn';
import { Badge, Button, Card, Input, Modal, ProgressBar } from '../ui';

const TYPE_LABELS: Record<string, string> = {
  'multiple-choice': 'Multiple choice',
  'true-false': 'True or false',
  identification: 'Identification',
};

interface ExamTakingProps {
  exam: Exam;
  answers: Record<string, string>;
  onAnswer: (questionId: string, value: string, idx: number) => void;
  onSubmit: () => void;
  confirmSubmit: boolean;
  unansweredCount: number;
  onConfirmSubmit: () => void;
  onKeepAnswering: () => void;
  startedAt?: number | null;
}

const ElapsedClock: React.FC<{ startedAt: number }> = ({ startedAt }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-3 tabular-nums">
      <Clock className="w-3.5 h-3.5" aria-hidden />
      {formatDuration((now - startedAt) / 1000)}
    </span>
  );
};

export const ExamTaking: React.FC<ExamTakingProps> = ({
  exam,
  answers,
  onAnswer,
  onSubmit,
  confirmSubmit,
  unansweredCount,
  onConfirmSubmit,
  onKeepAnswering,
  startedAt,
}) => {
  const reduced = useReducedMotion();
  const total = exam.questions.length;
  const answeredCount = total - unansweredCount;

  const jumpTo = (idx: number) => {
    document
      .getElementById(`exam-q-${idx}`)
      ?.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <div className="space-y-4">
      {/* Sticky header */}
      <Card padding="md" className="sticky top-14 sm:top-16 z-20">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-accent-ink">{exam.courseName}</div>
            <h2 className="text-base font-semibold text-ink truncate">{exam.title}</h2>
            <div className="flex items-center gap-3 text-[13px] text-ink-3 mt-0.5">
              <span>
                Answered {answeredCount} of {total}
              </span>
              {startedAt ? <ElapsedClock startedAt={startedAt} /> : null}
            </div>
          </div>
          <Button onClick={onSubmit}>Submit</Button>
        </div>
        <div className="mt-3">
          <ProgressBar value={total > 0 ? answeredCount / total : 0} label="Answered" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar mt-3">
          {exam.questions.map((q, i) => {
            const answered = Boolean((answers[q.id] || '').trim());
            return (
              <button
                key={q.id}
                type="button"
                aria-label={`Question ${i + 1}, ${answered ? 'answered' : 'unanswered'}`}
                onClick={() => jumpTo(i)}
                className={cn(
                  'h-8 min-w-8 px-2 rounded-[8px] text-xs font-medium tabular-nums shrink-0 transition-[background-color,color,border-color] duration-150',
                  answered
                    ? 'bg-accent-soft text-accent-ink'
                    : 'border border-line text-ink-2 hover:border-line-strong'
                )}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        {exam.questions.map((q, idx) => {
          const qTitleId = `exam-q-${idx}-title`;
          return (
            <Card key={q.id} id={`exam-q-${idx}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-ink-3">
                  Question {idx + 1} of {total}
                </span>
                <Badge tone="neutral">{TYPE_LABELS[q.type] || q.type}</Badge>
              </div>
              <p id={qTitleId} className="text-sm font-medium text-ink mb-3">
                {cleanDisplayText(q.question)}
              </p>

              {q.type === 'multiple-choice' && q.options && (
                <div role="radiogroup" aria-labelledby={qTitleId} className="grid sm:grid-cols-2 gap-2">
                  {q.options.map((opt, oIdx) => {
                    const isChosen = answers[q.id] === opt;
                    return (
                      <button
                        key={oIdx}
                        type="button"
                        role="radio"
                        aria-checked={isChosen}
                        onClick={() => onAnswer(q.id, opt, idx)}
                        className={cn(
                          'flex items-center gap-3 w-full text-left rounded-control border p-3 text-sm transition-[border-color,background-color] duration-150',
                          isChosen
                            ? 'border-accent bg-accent-soft'
                            : 'border-line hover:border-line-strong'
                        )}
                      >
                        <span
                          className={cn(
                            'h-6 w-6 rounded-full text-xs font-medium grid place-items-center shrink-0',
                            isChosen ? 'bg-accent text-on-accent' : 'bg-subtle text-ink-2'
                          )}
                        >
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span className="text-ink">{cleanDisplayText(opt)}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === 'true-false' && (
                <div role="radiogroup" aria-labelledby={qTitleId} className="grid sm:grid-cols-2 gap-2">
                  {['True', 'False'].map((tf) => {
                    const isChosen = answers[q.id] === tf;
                    return (
                      <button
                        key={tf}
                        type="button"
                        role="radio"
                        aria-checked={isChosen}
                        onClick={() => onAnswer(q.id, tf, idx)}
                        className={cn(
                          'flex items-center gap-3 w-full text-left rounded-control border p-3 text-sm transition-[border-color,background-color] duration-150',
                          isChosen
                            ? 'border-accent bg-accent-soft'
                            : 'border-line hover:border-line-strong'
                        )}
                      >
                        <span
                          className={cn(
                            'h-6 w-6 rounded-full text-xs font-medium grid place-items-center shrink-0',
                            isChosen ? 'bg-accent text-on-accent' : 'bg-subtle text-ink-2'
                          )}
                        >
                          {tf[0]}
                        </span>
                        <span className="text-ink">{tf}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === 'identification' && (
                <Input
                  aria-label={`Answer for question ${idx + 1}`}
                  placeholder="Type your answer here"
                  value={answers[q.id] || ''}
                  onChange={(e) => onAnswer(q.id, e.target.value, idx)}
                />
              )}
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button size="lg" onClick={onSubmit}>
          Submit exam
        </Button>
      </div>

      {/* Unanswered confirm */}
      <Modal
        open={confirmSubmit}
        onClose={onKeepAnswering}
        title={`Submit with ${unansweredCount} unanswered?`}
        description="Unanswered questions count as incorrect."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={onKeepAnswering}>
              Keep answering
            </Button>
            <Button onClick={onConfirmSubmit}>Submit anyway</Button>
          </>
        }
      >
        <div />
      </Modal>
    </div>
  );
};
