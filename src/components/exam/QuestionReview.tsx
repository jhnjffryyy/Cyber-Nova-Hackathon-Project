import React, { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Question } from '../../types';
import { cleanDisplayText } from '../../lib/text-clean';
import { cn } from '../../lib/cn';
import { Badge, SegmentedControl } from '../ui';

export interface ReviewItem {
  question: Question;
  userAnswer: string;
  correct: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  'multiple-choice': 'Multiple choice',
  'true-false': 'True or false',
  identification: 'Identification',
};

interface QuestionReviewProps {
  items: ReviewItem[];
}

export const QuestionReview: React.FC<QuestionReviewProps> = ({ items }) => {
  const [filter, setFilter] = useState<'all' | 'incorrect' | 'correct'>('all');
  const incorrect = items.filter((i) => !i.correct).length;
  const correct = items.length - incorrect;
  const shown = items.filter((i) =>
    filter === 'all' ? true : filter === 'correct' ? i.correct : !i.correct
  );

  return (
    <div className="space-y-3">
      <SegmentedControl
        ariaLabel="Filter questions"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'All', count: items.length },
          { value: 'incorrect', label: 'Incorrect', count: incorrect },
          { value: 'correct', label: 'Correct', count: correct },
        ]}
      />
      <div className="space-y-3">
        {shown.map(({ question: q, userAnswer, correct: isCorrect }) => {
          const qNum = items.findIndex((i) => i.question.id === q.id) + 1;
          return (
          <div key={q.id} className="rounded-control border border-line p-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-ink-3">Question {qNum}</span>
              <Badge tone="neutral">{TYPE_LABELS[q.type] || q.type}</Badge>
              {isCorrect ? (
                <Badge tone="success">
                  <CheckCircle2 className="w-3 h-3" aria-hidden /> Correct
                </Badge>
              ) : (
                <Badge tone="danger">
                  <XCircle className="w-3 h-3" aria-hidden /> Incorrect
                </Badge>
              )}
            </div>
            <p className="text-sm font-medium text-ink">{cleanDisplayText(q.question)}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div
                className={cn(
                  'rounded-control p-3 text-sm',
                  isCorrect
                    ? 'bg-success-soft text-success-ink'
                    : 'bg-danger-soft text-danger-ink'
                )}
              >
                <div className="text-xs font-medium mb-1">Your answer</div>
                {userAnswer ? (
                  cleanDisplayText(userAnswer)
                ) : (
                  <span className="italic">No answer</span>
                )}
              </div>
              <div className="rounded-control p-3 text-sm bg-subtle text-ink">
                <div className="text-xs font-medium mb-1">Correct answer</div>
                {cleanDisplayText(q.correctAnswer)}
              </div>
            </div>
            {q.explanation && (
              <div>
                <div className="text-xs font-medium text-ink-2 mb-1">Explanation</div>
                <p className="text-[13px] text-ink-2">{cleanDisplayText(q.explanation)}</p>
              </div>
            )}
          </div>
          );
        })}
      </div>
    </div>
  );
};
