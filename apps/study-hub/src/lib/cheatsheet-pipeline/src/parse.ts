export type Block = { type: 'heading' | 'paragraph' | 'bullet' | 'table_cell'; text: string; page?: number };

export function parse(fileContent: string, fileName?: string): Block[] {
  const blocks: Block[] = [];
  const lines = fileContent.split(/\r?\n/);
  let current: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (line === '') {
      if (current.length) { blocks.push({ type: 'paragraph', text: current.join('\n') }); current = []; }
      continue;
    }
    if (line.startsWith('#') || /^[A-Z][A-Z\s\-]{2,20}$/.test(line.trim())) {
      if (current.length) { blocks.push({ type: 'paragraph', text: current.join('\n') }); current = []; }
      blocks.push({ type: 'heading', text: line.replace(/^#+\s*/, '').trim() });
      continue;
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (current.length) { blocks.push({ type: 'paragraph', text: current.join('\n') }); current = []; }
      blocks.push({ type: 'bullet', text: line.replace(/^[-*]\s*/, '').trim() });
      continue;
    }
    current.push(line);
  }
  if (current.length) blocks.push({ type: 'paragraph', text: current.join('\n') });
  return blocks;
}
