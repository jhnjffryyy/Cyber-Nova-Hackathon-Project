import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  clampQuestionCount,
  generateExamFromNotes,
  gradeExam,
  isAnswerCorrect,
  feedbackFor,
  buildAttemptReview,
} from '../src/lib/exam-generator.ts';
import { Exam, ExamAttempt, Question } from '../src/types/index.ts';

let passed = 0;
function ok(name: string, cond: boolean, extra?: unknown) {
  assert(cond, `${name} :: ${JSON.stringify(extra)}`);
  passed++;
  console.log(`ok - ${name}`);
}

// Deterministic seeded random
function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);

// clampQuestionCount
ok('clamp 0->1', clampQuestionCount(0) === 1);
ok('clamp 51->50', clampQuestionCount(51) === 50);
ok('clamp 25.7->26', clampQuestionCount(25.7) === 26);
ok('clamp NaN->10', clampQuestionCount(NaN) === 10);

const richNotes = `
Photosynthesis is the process by which plants convert sunlight into chemical energy.
Mitosis: the division of a cell nucleus into two identical daughter nuclei.
Osmosis refers to the movement of water across a semipermeable membrane.
Gravity - the force that attracts objects with mass toward each other.
The mitochondria is the organelle responsible for producing ATP in cells.
Evaporation means the transition of a liquid into a gas at its surface.
Friction: the resistance force between two surfaces in contact.
Velocity is defined as the rate of change of position over time.
An ecosystem is a community of organisms interacting with their environment.
The nucleus is the central part of an atom containing protons and neutrons.
Diffusion means the spreading of particles from high to low concentration.
Inertia: the tendency of an object to resist changes in motion.
A catalyst is a substance that speeds up a chemical reaction without being consumed.
Photosynthesis occurs mainly in the chloroplasts of plant cells.
Water boils at 100 degrees Celsius under standard atmospheric pressure.
The cell membrane controls what enters and leaves the cell.
`;

{
  const res = generateExamFromNotes({
    courseName: 'Biology', questionCount: 10,
    questionTypes: ['Multiple Choice', 'True/False', 'Identification'],
    notes: richNotes, random: rand,
  });
  ok('rich count 10', res.generated === 10 && res.exam.questions.length === 10, res.generated);
  const texts = res.exam.questions.map((q) => q.question.toLowerCase());
  ok('no dup questions', new Set(texts).size === texts.length);
  for (const q of res.exam.questions) {
    if (q.type === 'multiple-choice') {
      ok('mc 4 options', (q.options || []).length === 4, q.options);
      ok('mc unique', new Set((q.options || []).map((o) => o.toLowerCase())).size === 4, q.options);
      ok('mc has answer', (q.options || []).includes(q.correctAnswer), q.correctAnswer);
    }
    if (q.type === 'true-false') {
      ok('tf answer', q.correctAnswer === 'True' || q.correctAnswer === 'False', q.correctAnswer);
    }
    if (q.type === 'identification') {
      ok('id answer', q.correctAnswer.trim().length > 0);
    }
    const blob = [q.question, q.explanation, ...(q.options || [])].join(' ');
    ok('no markdown junk', !/==|##|\*\*|Systematic verification|Arbitrary Value/.test(blob), blob);
  }
  const tfAnswers = res.exam.questions.filter((q) => q.type === 'true-false').map((q) => q.correctAnswer);
  if (tfAnswers.length >= 4) {
    ok('tf mix', tfAnswers.includes('True') && tfAnswers.includes('False'), tfAnswers);
  }
  const allTypes = new Set(res.exam.questions.map((q) => q.type));
  ok('all types present', allTypes.size === 3, [...allTypes]);
}

// Small notes: fewer than requested -> warning, no dupes
{
  const small = readFileSync('tests/fixtures/notes.md', 'utf-8');
  const res = generateExamFromNotes({
    courseName: 'CS', questionCount: 50,
    questionTypes: ['Multiple Choice', 'True/False', 'Identification'],
    notes: small, random: rand,
  });
  ok('small < 50', res.generated < 50 && res.generated >= 0, res.generated);
  ok('small warning', !!res.warning, res.warning);
  const texts = res.exam.questions.map((q) => q.question.toLowerCase());
  ok('small no dup', new Set(texts).size === texts.length);
}

// Quality checks on notes.md at a realistic count
{
  const small = readFileSync('tests/fixtures/notes.md', 'utf-8');
  const res = generateExamFromNotes({
    courseName: 'CS', questionCount: 12,
    questionTypes: ['Multiple Choice', 'True/False', 'Identification'],
    notes: small, random: mulberry32(7),
  });
  const JUNK = ['involves', 'study', 'theoretical', 'practical'];
  for (const q of res.exam.questions) {
    ok('q not colon-ended', !q.question.trim().endsWith(':'), q.question);
    for (const opt of q.options || []) {
      ok('no junk option', !JUNK.includes(opt.trim().toLowerCase()), opt);
    }
  }
  // No two questions share the same answer AND the same source sentence
  // (the quoted material in the explanation identifies the source).
  const seen = new Set<string>();
  let dupPair = false;
  for (const q of res.exam.questions) {
    const src = (q.explanation || '').toLowerCase().replace(/\s+/g, ' ');
    const k = `${q.correctAnswer.toLowerCase()}|${src}`;
    if (seen.has(k)) dupPair = true;
    seen.add(k);
  }
  ok('no same answer+source', !dupPair, res.exam.questions.map((q) => [q.type, q.correctAnswer]));
}

// Fixture file 2
{
  const notes = readFileSync('tests/fixtures/travelers_dilemma.md', 'utf-8');
  const res = generateExamFromNotes({
    courseName: 'Game Theory', questionCount: 10,
    questionTypes: ['Multiple Choice', 'True/False', 'Identification'],
    notes, random: rand,
  });
  ok('td generates', res.generated > 0, res.generated);
}

// Empty notes -> 0 + warning
{
  const res = generateExamFromNotes({
    courseName: 'Empty', questionCount: 10,
    questionTypes: ['Multiple Choice', 'True/False', 'Identification'],
    notes: '', random: rand,
  });
  ok('empty 0', res.generated === 0 && !!res.warning, res.warning);
}

// Single selected type -> all that type
{
  const res = generateExamFromNotes({
    courseName: 'Biology', questionCount: 6,
    questionTypes: ['True/False'], notes: richNotes, random: rand,
  });
  ok('single type', res.exam.questions.every((q) => q.type === 'true-false'), res.exam.questions.map((q) => q.type));
}

// Grading
{
  const res = generateExamFromNotes({
    courseName: 'Biology', questionCount: 10,
    questionTypes: ['Multiple Choice', 'True/False', 'Identification'],
    notes: richNotes, random: rand,
  });
  const exam = res.exam;
  const allCorrect: Record<string, string> = {};
  for (const q of exam.questions) allCorrect[q.id] = q.correctAnswer;
  ok('all correct 100', gradeExam(exam, allCorrect).percentage === 100);
  ok('all blank 0', gradeExam(exam, {}).percentage === 0);

  const idQ: Question = {
    id: 'x', question: 'Which term is described as: process using sunlight?',
    type: 'identification', correctAnswer: 'Photosynthesis', explanation: '', points: 1,
  };
  ok('article prefix', isAnswerCorrect(idQ, 'the photosynthesis'));
  ok('typo long term', isAnswerCorrect(idQ, 'Photosynthesi'));
  ok('one letter wrong', !isAnswerCorrect(idQ, 'a'));
  ok('empty wrong', !isAnswerCorrect(idQ, ''));
  ok('undefined wrong', !isAnswerCorrect(idQ, undefined));

  const mcQ: Question = {
    id: 'y', question: 'Pick one', type: 'multiple-choice',
    options: ['A', 'B', 'C', 'D'], correctAnswer: 'B', explanation: '', points: 1,
  };
  ok('mc wrong', !isAnswerCorrect(mcQ, 'A'));
  ok('mc right', isAnswerCorrect(mcQ, 'b'));
}

// feedbackFor bands
ok('fb 90', feedbackFor(95).startsWith('Excellent work'));
ok('fb 75', feedbackFor(80).startsWith('Good job'));
ok('fb 50', feedbackFor(60).startsWith('Keep practicing'));
ok('fb low', feedbackFor(20).startsWith('Review the material'));

// buildAttemptReview
{
  const snapQ: Question = {
    id: 'sq1', question: 'Snapshot q?', type: 'true-false',
    correctAnswer: 'True', explanation: '', points: 2,
  };
  const examQ: Question = {
    id: 'eq1', question: 'Exam q?', type: 'true-false',
    correctAnswer: 'True', explanation: '', points: 1,
  };
  const exam: Exam = {
    id: 'ex1', courseName: 'Biology', title: 'Bio Quiz', topic: 'Bio',
    difficulty: 'Medium', timeLimitMinutes: 30, questionTypes: ['true-false'],
    questions: [examQ], createdAt: '2026-10-10T00:00:00Z',
  };
  const baseAttempt: ExamAttempt = {
    id: 'a1', examId: 'ex1', examTitle: 'Bio Quiz', courseName: 'Biology',
    score: 99, maxScore: 100, percentage: 99,
    userAnswers: { sq1: 'True', eq1: 'False' },
    completedAt: '2026-10-10T12:00:00Z', timeSpentSeconds: 0,
  };

  // Snapshot questions preferred over the exam in `exams`
  const r1 = buildAttemptReview({ ...baseAttempt, questions: [snapQ] }, [exam]);
  ok('review snapshot used', r1.questions[0].id === 'sq1' && r1.available, r1.questions);
  ok('review snapshot correct', r1.perQuestion[0].correct === true && r1.perQuestion.length === 1, r1.perQuestion);
  // Stored score returned unchanged even when it differs from recompute
  ok('review stored score', r1.score === 99 && r1.maxScore === 100 && r1.percentage === 99, r1);

  // Fallback to the exam when no snapshot
  const r2 = buildAttemptReview(baseAttempt, [exam]);
  ok('review fallback exam', r2.questions[0].id === 'eq1' && r2.available, r2.questions);
  ok('review fallback correctness', r2.perQuestion[0].correct === false, r2.perQuestion);

  // Neither snapshot nor exam -> unavailable
  const r3 = buildAttemptReview(baseAttempt, []);
  ok('review unavailable', r3.available === false && r3.questions.length === 0, r3);
  ok('review unavailable score kept', r3.score === 99 && r3.percentage === 99, r3);
}

console.log(`\n${passed} exam assertions passed`);
