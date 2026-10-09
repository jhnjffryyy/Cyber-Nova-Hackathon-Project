import { Chunk } from './chunk';

export interface SectionConfig {
  sectionName: string;
  prompt: string;
}

export function buildPromptForSection(sectionName: string, chunkText: string): string {
  return `Use ONLY the text below. No outside facts. No generic advice. Each bullet max 15 words. Use exact terms from the text. If nothing relevant, return an empty string.

Section: ${sectionName}

Text:
${chunkText.slice(0, 1500)}`;
}

// Split text into sentences, keeping them whole
function toSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// Condense a sentence to max 15 words, cutting at a natural boundary when possible
function condense(sentence: string, maxWords = 15): string {
  const words = sentence.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return sentence;
  // Try to cut at a natural boundary (comma, semicolon, or conjunction) before the limit
  const limited = words.slice(0, maxWords).join(' ');
  const naturalCut = limited.match(/^(.+?)[,;]\s*$/);
  if (naturalCut) return naturalCut[1];
  const conjunctionCut = limited.match(/^(.+?)\s+(?:and|but|which|that|so|because|while|whereas)\s*$/i);
  if (conjunctionCut) return conjunctionCut[1];
  return limited + '...';
}

// Skip label-only lines like "Method 1: Best-Response Reasoning" or "Examples:"
function isLabelLine(text: string): boolean {
  const m = text.match(/^(method|problem|example|section|part|step|chapter|week|slide|input|output|expected|given|note|key|definition)\s*\d*\s*:\s*(.*)$/i);
  if (!m) return false;
  const rest = m[2].trim();
  if (!rest) return true;
  // A label is just a short title with no verb
  const restWords = rest.split(/\s+/).filter(Boolean);
  return restWords.length < 6 && !/\b(is|are|was|were|has|have|gives|receives|claims|means|yields|pays|rewards|penalizes|uses|shows|states|defines)\b/i.test(rest);
}

// Check if a sentence is a near-copy of source (20+ consecutive words)
function isLongCopy(sentence: string, sourceText: string): boolean {
  const words = sentence.split(/\s+/).filter(Boolean);
  if (words.length < 20) return false;
  // Check if the first 20 words appear consecutively in source
  const probe = words.slice(0, 20).join(' ');
  return sourceText.includes(probe);
}

// Remove title/author header junk (short lines with names, course codes, etc.)
function isHeaderJunk(text: string): boolean {
  const t = text.trim();
  if (t.length < 10) return true;
  // Lines that are just names / course codes / titles with no real content
  if (/^[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*){1,4}$/.test(t)) return true;
  if (/^(?:IS|CS|IT|MATH|ENG|GE|ACC|BUS|PSY|SOC|PHY|CHE|BIO)\s*\d{3}/i.test(t)) return true;
  return false;
}

export function generateSection(
  sectionName: string,
  chunks: Chunk[],
  sourceText: string,
  usedSentences?: Set<string>
): string {
  // Gather all text from chunks
  const allText = chunks.map(c => c.paragraphs.map(p => p.text).join('\n')).join('\n\n');
  const used = usedSentences || new Set<string>();

  // Skip Formulas/Steps sections if no formulas exist
  if (sectionName.toLowerCase().includes('formula') || sectionName.toLowerCase().includes('step')) {
    const hasFormula = /[=+\-*/^><]/.test(allText) && /\bformula\b|\bequation\b|\bfunction\b|\bdef\b|\b=\b/i.test(allText);
    const hasStep = /step\s*\d+|procedure|algorithm|method\b/i.test(allText);
    if (!hasFormula && !hasStep) return '';
  }

  const sentences = toSentences(allText);
  const bullets: string[] = [];

  // Section-specific sentence selection
  const select = (s: string): boolean => {
    const lower = s.toLowerCase();
    const name = sectionName.toLowerCase();

    // Overview: prefer the first sentences (introductory content)
    if (name.includes('overview')) {
      return sentences.indexOf(s) < 4;
    }
    // Key Facts or Lists: prefer sentences with numbers, lists, or concrete facts
    if (name.includes('key facts') || name.includes('lists')) {
      return /\d|list|example|e\.g\.|such as|consists of|includes|comprises/i.test(s);
    }
    // Quick Q&A: prefer question-like or "what/why/how" sentences
    if (name.includes('quick q') || name.includes('q&a')) {
      return /what|why|how|when|which|who|because|since|therefore|thus/i.test(s);
    }
    // Problem Types: prefer problem/example content
    if (name.includes('problem')) {
      return /problem|example|case|scenario|given|suppose|if\b/i.test(s);
    }
    // Requirements / Specs: prefer requirement-like lines
    if (name.includes('requirement') || name.includes('spec')) {
      return /must|shall|should|required|specif|feature|support/i.test(s);
    }
    // Slide Points: prefer short bullet-like lines
    if (name.includes('slide')) {
      return s.split(/\s+/).length <= 20;
    }
    // Default (Main Points, etc.): prefer sentences with verbs and substance
    return /\b(is|are|was|were|has|have|will|can|must|should|means|defines|states|shows|results|leads|produces|occurs|uses)\b/i.test(s);
  };

  for (const sentence of sentences) {
    if (bullets.length >= 6) break;
    if (sentence.length < 15) continue;
    if (isHeaderJunk(sentence)) continue;
    if (isLabelLine(sentence)) continue;
    if (isLongCopy(sentence, sourceText)) continue;

    // Skip generic/fake terms
    if (/core concept from|pertaining to|systematic|verification|foundational|extracted directly/i.test(sentence.toLowerCase())) {
      continue;
    }

    // Section-specific selection
    if (!select(sentence)) continue;

    const limited = condense(sentence);
    // Strip leading label prefixes like "Examples:" or "Method 1:" from the bullet
    const cleaned = limited.replace(/^(?:examples?|method\s*\d+|problem\s*\d+|note|key\s+points?|definition)\s*:\s*/i, '');
    const key = cleaned.toLowerCase();
    if (used.has(key)) continue;
    used.add(key);
    bullets.push(cleaned);
  }

  if (bullets.length === 0) return '';
  return bullets.map(b => `- ${b}`).join('\n');
}
