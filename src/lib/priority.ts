import { Task } from '../types';

export const PRIORITY_LABELS: Record<Task['priority'], string> = {
  High: 'Urgent',
  Medium: 'Important',
  Low: 'Low Priority',
};
