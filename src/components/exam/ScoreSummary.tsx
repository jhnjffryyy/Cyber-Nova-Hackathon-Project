import React, { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { scoreTone } from '../../lib/score';
import { formatDuration } from '../../lib/format';
import { feedbackFor } from '../../lib/exam-generator';
import { ProgressBar } from '../ui';

interface ScoreSummaryProps {
  percentage: number;
  score: number;
  maxScore: number;
  correctCount: number;
  total: number;
  timeSpentSeconds?: number;
  byType?: Record<string, { correct: number; total: number }>;
}

const TONE_VAR = {
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
} as const;

const R = 55;
const CIRC = 2 * Math.PI * R;

export const ScoreSummary: React.FC<ScoreSummaryProps> = ({
  percentage,
  score,
  maxScore,
  correctCount,
  total,
  timeSpentSeconds,
  byType,
}) => {
  const reduced = useReducedMotion();
  const target = CIRC * (1 - Math.min(100, Math.max(0, percentage)) / 100);
  const [offset, setOffset] = useState(reduced ? target : CIRC);

  useEffect(() => {
    if (reduced) {
      setOffset(target);
      return;
    }
    const t = requestAnimationFrame(() => setOffset(target));
    return () => cancelAnimationFrame(t);
  }, [target, reduced]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-center gap-5">
        <svg width="120" height="120" viewBox="0 0 120 120" className="shrink-0" role="img" aria-label={`Score ${percentage}%`}>
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="var(--subtle)"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke={TONE_VAR[scoreTone(percentage)]}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
            transform="rotate(-90 60 60)"
            style={{
              transition: reduced ? 'none' : 'stroke-dashoffset 600ms cubic-bezier(0.23,1,0.32,1)',
            }}
          />
          <text
            x="60"
            y="60"
            textAnchor="middle"
            dominantBaseline="central"
            className="font-display"
            style={{ fill: 'var(--ink)', fontSize: 30, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
          >
            {percentage}%
          </text>
        </svg>
        <div className="text-center sm:text-left space-y-1">
          <div className="text-sm text-ink">
            <span className="font-semibold">{score} / {maxScore}</span> points
          </div>
          <div className="text-sm text-ink">
            <span className="font-semibold">{correctCount}</span> of {total} correct
          </div>
          {timeSpentSeconds !== undefined && timeSpentSeconds > 0 && (
            <div className="text-[13px] text-ink-3 tabular-nums">
              Time {formatDuration(timeSpentSeconds)}
            </div>
          )}
          <p className="text-sm text-ink-2 pt-1">{feedbackFor(percentage)}</p>
        </div>
      </div>

      {byType && Object.keys(byType).length > 0 && (
        <div className="space-y-2.5">
          {Object.entries(byType).map(([label, v]) => (
            <div key={label}>
              <div className="flex items-center justify-between text-[13px] mb-1">
                <span className="text-ink-2">{label}</span>
                <span className="text-ink-3 tabular-nums">
                  {v.correct}/{v.total}
                </span>
              </div>
              <ProgressBar
                value={v.total > 0 ? v.correct / v.total : 0}
                tone={scoreTone(v.total > 0 ? (v.correct / v.total) * 100 : 0)}
                label={label}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
