import { parse } from './parse';
import { clean } from './clean';
import { chunk } from './chunk';
import { detectType } from './detectType';
import { generateSection } from './generateSection';
import { validate } from './validate';

export { parse, clean, chunk, detectType, generateSection, validate };

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface PipelineResult {
  blocks: any[];
  cleanedBlocks: any[];
  cleanLog: any;
  chunks: any[];
  detectedType: string;
  sections: Record<string, string>;
  keyTerms: { term: string; definition: string }[];
  sourceText: string;
}

/**
 * Main pipeline orchestrator - runs all 6 steps
 */
export function runCheatsheetPipeline(fileContent: string, fileName?: string): PipelineResult {
  // Step 1: Parse into blocks
  const blocks: any[] = parse(fileContent, fileName);
  
  // Step 2: Clean blocks
  const { blocks: cleanedBlocks, log: cleanLog } = clean(blocks);
  
  // Step 3: Chunk into sections
  const chunks: any[] = chunk(cleanedBlocks);
  
  // Step 4: Detect type
  const { type: detectedType, sectionList } = detectType(chunks);
  
  // Step 5: Generate sections (simplified - no LLM)
  const sections: Record<string, string> = {};
  const sourceText = chunks.map((c: any) => c.paragraphs.map((p: any) => p.text).join('\n')).join('\n\n');
  
  // Section-aware generation: each section pulls from different content,
  // sharing a dedup set so no sentence repeats across sections
  const usedSentences = new Set<string>();
  
  for (const sectionName of sectionList) {
    if (sectionName.toLowerCase().includes('key terms')) continue; // handle separately
    sections[sectionName] = generateSection(sectionName, chunks, sourceText, usedSentences);
  }
  
  // Extract key terms from source text (defined terms, acronyms, named entities)
  const keyTerms: { term: string; definition: string }[] = [];
  const lines = fileContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const fullText = fileContent;
  
  // Reject terms that are clearly not real terms
  const isJunkTerm = (term: string): boolean => {
    const t = term.trim();
    if (t.length < 2 || t.length > 40) return true;
    // Single lowercase words are usually not terms
    if (/^[a-z]+$/.test(t)) return true;
    // Sentence fragments starting with verbs or conjunctions
    if (/^(which|what|why|how|when|where|who|the|a|an|and|or|of|to|in|for|with|on|at|by|from|this|that|these|those|it|its|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|can|could|should|shall|may|might|must|not|no|yes|if|then|than|so|such|both|each|either|neither|only|just|also|too|very|much|many|most|some|any|all|few|several|other|another|one|two|three|four|five|six|seven|eight|nine|ten|both|claim|each|player|given|suppose|let|say|under|over|above|below|following|above|below)$/i.test(t)
    ) return true;
    // Terms with verbs inside are sentence fragments
    if (/\b(is|are|was|were|has|have|had|does|do|gives|receives|claims|means|refers|defines|states|shows|results|leads|produces|occurs|uses|yields|beats|gains|deviates|undercuts|wins|loses|pays|rewards|penalizes)\b/i.test(t)) return true;
    // Terms ending in punctuation are fragments
    if (/[.!?]$/.test(t)) return true;
    // Section labels like "Examples", "Method 1", "Problem 2", "Introduction"
    if (/^(examples?|introduction|conclusion|summary|overview|method\s*\d+|problem\s*\d+|problem\s+set|section\s*\d+|chapter\s*\d+|part\s*\d+|step\s*\d+|input|output|expected|given|note|notes?|definition|definitions?|key\s+terms?|references?|appendix|figure|table|slide|lecture|week\s*\d+)$/i.test(t)) return true;
    // Terms that are mostly lowercase with 3+ words are usually sentence fragments
    const words = t.split(/\s+/).filter(Boolean);
    if (words.length >= 3 && !/^[A-Z]/.test(t)) return true;
    return false;
  };
  
  const seenTerms = new Set<string>();
  const addTerm = (term: string, definition: string) => {
    const t = term.trim();
    if (isJunkTerm(t)) return;
    const key = t.toLowerCase();
    if (seenTerms.has(key)) return;
    seenTerms.add(key);
    // If no explicit definition, pull the sentence containing the term
    let def = definition.trim();
    if (!def) {
      const sentenceMatch = fullText.match(new RegExp(`[^.!?]*\\b${escapeRegExp(t)}\\b[^.!?]*[.!?]?`));
      if (sentenceMatch) {
        def = sentenceMatch[0].trim().slice(0, 200);
      }
    }
    keyTerms.push({ term: t, definition: def.slice(0, 200) });
  };

  for (const line of lines) {
    // Look for "Term: definition" patterns — term must be a short noun phrase
    if (line.includes(':') && !line.startsWith('http') && !line.includes('//')) {
      const parts = line.split(':');
      const term = parts[0].replace(/^[-*#\s\d.]+/, '').trim();
      const definition = parts.slice(1).join(':').trim();
      const termWords = term.split(/\s+/).filter(Boolean);
      // Term must be 1-3 words, capitalized or an acronym, with a real definition
      if (
        termWords.length >= 1 && termWords.length <= 3 &&
        definition.length > 8 &&
        !isJunkTerm(term)
      ) {
        addTerm(term, definition);
      }
    }
    
    // Look for "Term is defined as / refers to / means" patterns.
    // Term must be a capitalized proper noun (no /i flag on the capital check).
    const definitionMatch = line.match(/\b([A-Z][a-zA-Z]{2,30}(?:\s+[A-Z][a-zA-Z]{2,30})?)\s+(?:is defined as|refers to|means|is the)\s+([^.]+)/);
    if (definitionMatch) {
      addTerm(definitionMatch[1], definitionMatch[2]);
    }
  }

  // Named-entity extraction: recurring capitalized bigrams (e.g. "Nash equilibrium")
  // that appear 2+ times in the text are likely real concepts.
  // This is NOT word frequency — it targets proper-noun phrases only.
  const phraseCounts = new Map<string, number>();
  const bigramRegex = /\b([A-Z][a-zA-Z]+)\s+([a-z][a-zA-Z]+)\b/g;
  let m: RegExpExecArray | null;
  while ((m = bigramRegex.exec(fullText)) !== null) {
    const phrase = `${m[1]} ${m[2]}`;
    // Skip sentence-initial words (first word after a period/newline)
    const before = fullText.slice(Math.max(0, m.index - 2), m.index);
    if (/[.!?]\s*$/.test(before)) continue;
    if (isJunkTerm(phrase)) continue;
    phraseCounts.set(phrase, (phraseCounts.get(phrase) || 0) + 1);
  }
  for (const [phrase, count] of phraseCounts.entries()) {
    if (count >= 2 && keyTerms.length < 12) {
      addTerm(phrase, '');
    }
  }

  // Acronym extraction: ALL-CAPS tokens (2+ letters) that appear 2+ times
  const acronymCounts = new Map<string, number>();
  const acronymRegex = /\b([A-Z]{2,8})\b/g;
  while ((m = acronymRegex.exec(fullText)) !== null) {
    const acro = m[1];
    if (/^(IS|CS|IT|MATH|ENG|GE|ACC|BUS|PSY|SOC|PHY|CHE|BIO)$/.test(acro)) continue;
    acronymCounts.set(acro, (acronymCounts.get(acro) || 0) + 1);
  }
  for (const [acro, count] of acronymCounts.entries()) {
    if (count >= 2 && keyTerms.length < 12) {
      addTerm(acro, '');
    }
  }
  
  // Step 6: Validate
  const output = { sections, keyTerms, dropped: [] };
  const validation = validate(output, sourceText);
  
  return {
    blocks,
    cleanedBlocks,
    cleanLog,
    chunks,
    detectedType,
    sections: validation.output.sections,
    keyTerms: validation.output.keyTerms,
    sourceText,
  };
}
