// Cleans extracted/OCR text for display: strips markdown noise, heading and
// bullet markers, list numbering, and runs of repeated punctuation.
export function cleanDisplayText(input: string | undefined | null): string {
  if (!input) return '';
  let s = String(input);

  // Remove runs of 2+ of these characters (e.g. "===", "---", "***", "|||")
  s = s.replace(/[=\-_*~#•·|>]{2,}/g, ' ');
  // Remove markdown bold markers
  s = s.replace(/\*\*/g, '').replace(/__/g, '');
  // Decorative arrows at line start
  s = s.replace(/^\s*(?:=>|->|→|⇒)\s*/, '');
  // Orphan "=" tokens: no operand on one side ("= x", "x =", ": =", "= :")
  s = s.replace(/\s*[:=]\s*[:=]\s*/g, ': ').replace(/^=+\s+/, '').replace(/\s+=+$/, '');
  // Strip leading heading/bullet/quote markers
  s = s.replace(/^[\s#>*•·\-–—]+/, '');
  // Strip leading list numbering like "1." "12)" "a." "b)"
  s = s.replace(/^\s*(?:\d{1,3}|[a-zA-Z])[.)]\s+/, '');
  // Collapse whitespace
  s = s.replace(/\s+/g, ' ').trim();

  // Keep only if a letter or digit survives
  if (!/[A-Za-z0-9]/.test(s)) return '';
  return s;
}
