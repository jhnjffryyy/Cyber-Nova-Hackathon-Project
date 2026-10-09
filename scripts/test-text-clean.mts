import assert from 'node:assert/strict';
import { cleanDisplayText } from '../src/lib/text-clean.ts';

let passed = 0;
function ok(name: string, cond: boolean, extra?: unknown) {
  assert(cond, `${name} :: ${JSON.stringify(extra)}`);
  passed++;
  console.log(`ok - ${name}`);
}

// Orphan equals removed
ok('leading = removed', cleanDisplayText('= Photosynthesis') === 'Photosynthesis', cleanDisplayText('= Photosynthesis'));
ok('trailing = removed', cleanDisplayText('Photosynthesis =') === 'Photosynthesis', cleanDisplayText('Photosynthesis ='));
ok('colon-equals removed', cleanDisplayText('Term: = definition') === 'Term: definition', cleanDisplayText('Term: = definition'));
ok('equals-colon removed', cleanDisplayText('Term =: definition') === 'Term: definition', cleanDisplayText('Term =: definition'));
ok('multi equals removed', cleanDisplayText('=== Header ===') === 'Header', cleanDisplayText('=== Header ==='));

// Decorative arrows at line start removed
ok('arrow => removed', cleanDisplayText('=> Step one') === 'Step one', cleanDisplayText('=> Step one'));
ok('arrow -> removed', cleanDisplayText('-> Step one') === 'Step one', cleanDisplayText('-> Step one'));
ok('unicode arrow removed', cleanDisplayText('→ Step one') === 'Step one', cleanDisplayText('→ Step one'));

// Meaningful equations kept
ok('equation kept', cleanDisplayText('payoff = y') === 'payoff = y', cleanDisplayText('payoff = y'));
ok('numeric equation kept', cleanDisplayText('x = 5') === 'x = 5', cleanDisplayText('x = 5'));

// Existing behavior preserved
ok('bullets stripped', cleanDisplayText('• First point') === 'First point', cleanDisplayText('• First point'));
ok('heading stripped', cleanDisplayText('## Overview') === 'Overview', cleanDisplayText('## Overview'));
ok('numbering stripped', cleanDisplayText('1. Step one') === 'Step one', cleanDisplayText('1. Step one'));
ok('bold markers removed', cleanDisplayText('**Key term** is important') === 'Key term is important', cleanDisplayText('**Key term** is important'));
ok('empty safe', cleanDisplayText('') === '' && cleanDisplayText(undefined) === '', '');

console.log(`\n${passed} text-clean assertions passed`);
