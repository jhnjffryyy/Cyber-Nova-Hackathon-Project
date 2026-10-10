import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Exam, ExamAttempt } from '../../types';
import { Button, Card } from '../ui';
import { ScoreSummary } from './ScoreSummary';
import { QuestionReview, ReviewItem } from './QuestionReview';

interface ExamResultsProps {
  attempt: ExamAttempt;
  exam: Exam;
  items: ReviewItem[];
  byType: Record<string, { correct: number; total: number }>;
  onRetake: () => void;
  onNewExam: () => void;
}

export const ExamResults: React.FC<ExamResultsProps> = ({
  attempt,
  exam,
  items,
  byType,
  onRetake,
  onNewExam,
}) => (
  <Card padding="lg" className="space-y-6">
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <div>
        <div className="text-xs font-medium text-accent-ink">{exam.courseName}</div>
        <h2 className="font-display text-xl font-semibold text-ink">{attempt.examTitle}</h2>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" icon={RotateCcw} onClick={onRetake}>
          Retake
        </Button>
        <Button onClick={onNewExam}>New exam</Button>
      </div>
    </div>

    <ScoreSummary
      percentage={attempt.percentage}
      score={attempt.score}
      maxScore={attempt.maxScore}
      correctCount={items.filter((i) => i.correct).length}
      total={items.length}
      timeSpentSeconds={attempt.timeSpentSeconds}
      byType={byType}
    />

    <div className="border-t border-line pt-5">
      <QuestionReview items={items} />
    </div>
  </Card>
);
