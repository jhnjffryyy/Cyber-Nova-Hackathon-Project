import React, { useEffect } from 'react';
import { History } from 'lucide-react';
import { ExamAttempt } from '../types';
import { PageHeader, EmptyState } from './ui';

interface HistoryViewProps {
  attempts: ExamAttempt[];
  historyAttemptId?: string | null;
  onHistoryAttemptHandled?: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  historyAttemptId,
  onHistoryAttemptHandled,
}) => {
  // Consume a pending focus request so it doesn't fire on a later visit.
  useEffect(() => {
    if (historyAttemptId) onHistoryAttemptHandled?.();
  }, [historyAttemptId, onHistoryAttemptHandled]);

  return (
    <div>
      <PageHeader title="History" />
      <EmptyState
        icon={History}
        title="History is coming in a later step"
      />
    </div>
  );
};
