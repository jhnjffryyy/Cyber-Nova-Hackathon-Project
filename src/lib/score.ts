export function scoreTone(pct: number): 'success' | 'warning' | 'danger' {
  if (pct >= 80) return 'success';
  if (pct >= 60) return 'warning';
  return 'danger';
}
