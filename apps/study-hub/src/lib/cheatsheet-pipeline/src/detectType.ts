import { Chunk } from './chunk';

// Type section mappings
const TYPE_SECTIONS: Record<string, string[]> = {
  lecture_notes: ['Overview', 'Key Terms', 'Main Points', 'Key Facts or Lists', 'Quick Q&A'],
  slides_or_script: ['Overview', 'Key Terms', 'Slide Points', 'Quick Q&A'],
  technical_spec: ['Overview', 'Key Terms', 'Requirements / Specs', 'Quick Q&A'],
  problem_set: ['Overview', 'Key Terms', 'Problem Patterns', 'Quick Q&A'],
  reading_or_article: ['Overview', 'Key Terms', 'Main Arguments', 'Key Facts or Lists', 'Quick Q&A'],
};

const DEFAULT_SECTIONS = ['Overview', 'Key Terms', 'Main Points', 'Key Facts or Lists', 'Quick Q&A'];

export function detectType(chunks: Chunk[]): { type: string; confidence: number; sectionList: string[] } {
  const first = chunks[0]?.paragraphs.map(p => p.text).join('\n') || '';
  const text = first.slice(0, 500).toLowerCase();
  
  const hasFormulas = /[=+\-*/^><]/.test(text) && /\bfunction\b|\bdef\b|\bformula\b|\bequation\b/i.test(text);
  const hasSteps = /step\s*\d+|procedure|algorithm|method\b/i.test(text);
  const hasSlides = /slide|presentation|speaker|outline|bullet\s+points/i.test(text);
  const hasQuestions = /\?|\bbegin\{\question\}|question\s+\d+/i.test(text);
  
  if (hasFormulas || hasSteps) {
    return { type: 'technical_spec', confidence: 0.8, sectionList: [...TYPE_SECTIONS.technical_spec] };
  }
  if (hasSlides) {
    return { type: 'slides_or_script', confidence: 0.75, sectionList: [...TYPE_SECTIONS.slides_or_script] };
  }
  if (hasQuestions) {
    return { type: 'problem_set', confidence: 0.7, sectionList: [...TYPE_SECTIONS.problem_set] };
  }
  
  return { type: 'lecture_notes', confidence: 0.5, sectionList: [...DEFAULT_SECTIONS] };
}
