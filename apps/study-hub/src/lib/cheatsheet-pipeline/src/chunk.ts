import { Block } from './parse';

export interface Chunk { id: string; heading?: string; paragraphs: Block[]; wordCount: number; blockCount: number; }

export function chunk(blocks: Block[]): Chunk[] {
  const out: Chunk[] = [];
  let cur: Block[] = [];
  let wordAcc = 0;
  let heading = '';
  for (const b of blocks) {
    if (b.type === 'heading') {
      if (cur.length) { out.push({ id: `c-${out.length}`, heading, paragraphs: cur, wordCount: wordAcc, blockCount: cur.length }); cur = []; wordAcc = 0; }
      heading = b.text;
    } else {
      cur.push(b);
      wordAcc += b.text.split(/\s+/).filter(Boolean).length;
      // Split on heading boundaries or if paragraph grows too large (never split mid-paragraph)
      if (wordAcc >= 800 && b.type === 'paragraph' && cur.length > 1) {
        out.push({ id: `c-${out.length}`, heading, paragraphs: cur, wordCount: wordAcc, blockCount: cur.length });
        cur = []; wordAcc = 0;
      }
    }
  }
  if (cur.length) out.push({ id: `c-${out.length}`, heading, paragraphs: cur, wordCount: wordAcc, blockCount: cur.length });
  return out;
}
