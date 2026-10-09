import { Block } from './parse';

export interface CleanLog { removed: number; reasons: { reason: string; count: number }[]; }

// Detect title/author header junk: short lines that are just names, course codes,
// or title fragments with no real content
function isHeaderJunk(text: string): boolean {
  const t = text.trim();
  if (t.length < 10) return true;
  // Lines that are just names / course codes / titles with no real content
  if (/^[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*){1,4}$/.test(t)) return true;
  if (/^(?:IS|CS|IT|MATH|ENG|GE|ACC|BUS|PSY|SOC|PHY|CHE|BIO)\s*\d{3}/i.test(t)) return true;
  // Lines with "Name: ____" or "Name:" followed by a name
  if (/^name\s*:/i.test(t) && t.length < 40) return true;
  // Title/author header: contains a course code AND a comma-separated name list
  if (/\b(?:IS|CS|IT|MATH|ENG|GE|ACC|BUS|PSY|SOC|PHY|CHE|BIO)\s*\d{3}/i.test(t) && /,/.test(t)) return true;
  // Lines that are just a comma-separated list of names (author lines)
  if (/^[A-Z][a-zA-Z]+(?:,\s*[A-Z][a-zA-Z]+)+$/.test(t) && t.length < 80) return true;
  return false;
}

export function clean(blocks: Block[]): { blocks: Block[]; log: CleanLog } {
  const removalCounts = new Map<string, number>();
  const addReason = (reason: string) => {
    removalCounts.set(reason, (removalCounts.get(reason) || 0) + 1);
  };

  // Track text that appears multiple times (headers/footers)
  const textCounts = new Map<string, number>();
  for (const b of blocks) {
    const t = b.text.toLowerCase().replace(/\s+/g, ' ').trim();
    if (t.length > 0) textCounts.set(t, (textCounts.get(t) || 0) + 1);
  }

  // Identify repeated text (headers/footers appearing on 3+ pages)
  const repeatedText = new Set<string>();
  for (const [text, count] of textCounts.entries()) {
    if (count >= 3 && text.length < 50) repeatedText.add(text);
  }

  const seen = new Set<string>();
  const out: Block[] = [];
  for (const b of blocks) {
    const t = b.text.toLowerCase().replace(/\s+/g, ' ').trim();

    // Remove page numbers like "Page 1", "Page 2", etc.
    if (/^page\s*\d+$/i.test(t) || /^\d+\s*$/.test(t)) {
      addReason('page-number');
      continue;
    }

    // Remove header/footer repetitions
    if (repeatedText.has(t)) {
      addReason('header/footer');
      continue;
    }

    // Remove fill-in fragments
    if (t.includes('____') || (t.includes('name:') && t.length < 20)) {
      addReason('fill-in');
      continue;
    }

    // Remove title/author header blocks (short lines with names, course codes, etc.)
    if (isHeaderJunk(t)) {
      addReason('header-junk');
      continue;
    }

    // Remove stray short table cells (<4 words) not headings
    if (b.type === 'table_cell' && t.split(/\s+/).filter(Boolean).length < 4) {
      addReason('short-cell');
      continue;
    }

    // Exact and near-duplicate removal
    const key = t;
    if (seen.has(key)) {
      addReason('duplicate');
      continue;
    }
    seen.add(key);
    out.push(b);
  }

  return {
    blocks: out,
    log: { removed: blocks.length - out.length, reasons: Array.from(removalCounts.entries()).map(([reason, count]) => ({ reason, count })) },
  };
}
