import { readFileSync } from 'node:fs';
import { runCheatsheetPipeline } from '../src/lib/cheatsheet-pipeline/src/index.ts';

function runFixture(name: string, path: string) {
  console.log(`\n===== ${name} =====`);
  const content = readFileSync(path, 'utf-8');
  const result = runCheatsheetPipeline(content, name);

  console.log(`Detected type: ${result.detectedType}`);
  console.log(`Blocks: ${result.blocks.length} -> cleaned: ${result.cleanedBlocks.length}`);
  console.log(`Clean log: ${JSON.stringify(result.cleanLog)}`);
  console.log(`Chunks: ${result.chunks.length}`);
  console.log(`Key terms: ${JSON.stringify(result.keyTerms, null, 2)}`);
  console.log('\n--- Sections ---');
  for (const [heading, text] of Object.entries(result.sections)) {
    console.log(`\n### ${heading}`);
    console.log(text);
  }
  return result;
}

const fixtures = [
  ['Travelers Dilemma', 'tests/fixtures/travelers_dilemma.md'],
  ['Short Notes', 'tests/fixtures/notes.md'],
  ['Slide Style', 'tests/fixtures/slide_style.md'],
  ['Problem Set', 'tests/fixtures/problem_set.md'],
];

for (const [name, path] of fixtures) {
  runFixture(name, path);
}
