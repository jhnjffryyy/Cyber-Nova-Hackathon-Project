export interface Output { sections: Record<string, string>; keyTerms: { term: string; definition: string }[]; dropped: string[]; }

export interface ValidationResult {
  ok: boolean;
  output: Output;
  regenerated: string[];
  sourceText: string;
}

export function validate(output: Output, sourceText: string): ValidationResult {
  const dropped: string[] = [];
  const regenerated: string[] = [];
  
  // Validate sections
  for (const [k, v] of Object.entries(output.sections)) {
    if (!v || v.trim().length === 0) {
      dropped.push(k);
      delete output.sections[k];
      continue;
    }
    
    // Check for placeholder phrases
    if (/core concept from|pertaining to|systematic verification|extracted directly/i.test(v.toLowerCase())) {
      dropped.push(k);
      regenerated.push(k);
      continue;
    }
    
    // Check for bullets copying 20+ consecutive source words
    const lines = v.split('\n').filter(l => l.startsWith('-'));
    const hasLongCopy = lines.some(line => {
      const text = line.replace(/^-\s*/, '');
      const words = text.split(/\s+/).filter(Boolean);
      return words.length >= 20 && sourceText.includes(text.slice(0, 200));
    });
    
    if (hasLongCopy) {
      regenerated.push(k);
    }
    
    // Check for generic/empty content
    if (lines.length === 0 && v.length < 30) {
      dropped.push(k);
      delete output.sections[k];
    }
  }
  
  // Validate key terms exist verbatim in source
  const validTerms: { term: string; definition: string }[] = [];
  for (const kt of output.keyTerms || []) {
    const term = kt.term.trim();
    if (term.length > 2 && sourceText.includes(term)) {
      validTerms.push(kt);
    }
  }
  output.keyTerms = validTerms;
  
  return {
    ok: dropped.length === 0 || regenerated.length > 0,
    output,
    regenerated,
    sourceText,
  };
}
