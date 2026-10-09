import { Exam, ExamAttempt, Question, QuestionType } from '../types';
import { cleanDisplayText } from './text-clean';

export const QUESTION_COUNT_PRESETS = [10, 20, 30, 40, 50];

export function clampQuestionCount(n: number): number {
  if (typeof n !== 'number' || isNaN(n)) return 10;
  return Math.min(50, Math.max(1, Math.round(n)));
}

export interface ExamGenOptions {
  courseName: string;
  questionCount: number;
  questionTypes: string[];
  notes: string;
  random?: () => number;
}

export interface ExamGenResult {
  exam: Exam;
  requested: number;
  generated: number;
  warning?: string;
}

const STOPWORDS = new Set(
  ('a,an,the,and,or,but,if,then,else,when,while,for,to,of,in,on,at,by,with,about,into,over,after,' +
    'under,between,from,as,is,are,was,were,be,been,being,have,has,had,do,does,did,will,would,shall,' +
    'should,can,could,may,might,must,not,no,yes,it,its,this,that,these,those,they,them,their,he,she,' +
    'we,you,i,there,here,what,which,who,whom,how,why,where,so,such,than,too,very,just,only,also,each,' +
    'every,all,any,both,few,more,most,other,some,own,same,per,via,etc,one,two,first,second,new,used,' +
    'using,use,many,much,may,also').split(',')
);

const BAD_TERM_STARTERS = new Set([
  'it', 'this', 'that', 'these', 'those', 'they', 'there', 'he', 'she', 'we', 'you', 'i',
]);

interface Definition {
  term: string;
  def: string;
  sentIdx: number;
}

interface PoolTerm {
  term: string;
  freq: number;
  cap: boolean;
  isDef: boolean;
}

// Common verbs/adjectives that make meaningless distractors.
const JUNK_TERMS = new Set(
  'involves,includes,uses,provides,allows,requires,makes,gives,takes,study,theoretical,practical,various,different,important,general,common,specific,many,several'.split(',')
);

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

function wordCount(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

function splitSentences(notes: string): string[] {
  const cleanedLines = notes
    .split('\n')
    .map((l) => cleanDisplayText(l))
    .filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of cleanedLines) {
    for (const part of line.split(/(?<=[.!?])\s+/)) {
      const s = part.trim();
      if (!s || s.endsWith('?') || s.endsWith(':')) continue;
      const wc = wordCount(s);
      if (wc < 6 || wc > 40) continue;
      // Lines without terminal punctuation only qualify if they are long enough
      if (!/[.!?]$/.test(s) && wc < 8) continue;
      const key = normalize(s);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(s);
    }
  }
  return out;
}

function extractDefinitions(sentences: string[]): Definition[] {
  const defs: Definition[] = [];
  const seenTerms = new Set<string>();
  const isAreRe =
    /^(.+?)\s+(?:is defined as|is called|refers to|means|is|are)\s+(.+)$/i;
  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    let m = s.match(/^([A-Za-z][A-Za-z0-9 .,'()/-]{0,58}?)\s*[:–-]\s+(.+)$/);
    if (!m) m = s.match(isAreRe);
    if (!m) continue;
    const bare = m[1].trim().replace(/[.,;:]+$/, '').replace(/^(?:the|a|an)\s+/i, '');
    const term = bare.charAt(0).toUpperCase() + bare.slice(1);
    const def = m[2].trim().replace(/[.,;:]+$/, '');
    const termWords = wordCount(term);
    if (termWords < 1 || termWords > 6) continue;
    if (!/^[A-Za-z]/.test(term)) continue;
    if (BAD_TERM_STARTERS.has(term.split(/\s+/)[0].toLowerCase())) continue;
    if (wordCount(def) < 4) continue;
    const key = normalize(term);
    if (seenTerms.has(key)) continue;
    seenTerms.add(key);
    defs.push({ term, def, sentIdx: i });
  }
  return defs;
}

function buildTermPool(sentences: string[], defs: Definition[]): PoolTerm[] {
  const freq = new Map<string, PoolTerm>();
  const bump = (term: string, w: number, cap: boolean, isDef = false) => {
    const raw = term.trim();
    if (!raw || raw.length < 3) return;
    const key = normalize(raw);
    const prev = freq.get(key);
    if (prev) {
      prev.freq += w;
      if (isDef) prev.isDef = true;
      if (cap && !prev.cap) prev.term = raw;
      prev.cap = prev.cap || cap;
    } else {
      freq.set(key, { term: raw, freq: w, cap, isDef });
    }
  };

  for (const d of defs) bump(d.term, 3, /^[A-Z]/.test(d.term), true);

  for (const s of sentences) {
    // Repeated capitalized multi-word phrases
    const capRe = /\b([A-Z][a-zA-Z0-9]*(?:\s+[A-Z][a-zA-Z0-9]*){0,2})\b/g;
    let m;
    while ((m = capRe.exec(s))) {
      const phrase = m[1];
      if (BAD_TERM_STARTERS.has(phrase.split(/\s+/)[0].toLowerCase())) continue;
      if (JUNK_TERMS.has(phrase.toLowerCase())) continue;
      if (wordCount(phrase) <= 3) bump(phrase, 1, true);
    }
    // Frequent content words
    for (const w of s.split(/\s+/)) {
      const clean = w.replace(/[^A-Za-z]/g, '');
      const low = clean.toLowerCase();
      if (clean.length >= 5 && !STOPWORDS.has(low) && !JUNK_TERMS.has(low) && !low.endsWith('ly')) {
        bump(low, 1, false);
      }
    }
  }

  return Array.from(freq.values())
    .filter((t) => t.isDef || wordCount(t.term) > 1 || t.freq >= 2)
    .sort((a, b) => b.freq - a.freq);
}

// Distractors should look like the answer: similar word count and matching
// capitalized-phrase vs lowercase-word form.
function sameShape(answer: string, candidate: PoolTerm): boolean {
  return (
    candidate.cap === /^[A-Z]/.test(answer) &&
    Math.abs(wordCount(candidate.term) - wordCount(answer)) <= 1
  );
}

function findKeyTerm(sentence: string, pool: PoolTerm[], defs: Definition[]): string | undefined {
  const norm = normalize(sentence);
  // Prefer definition terms literally present in the sentence
  for (const d of defs) {
    if (norm.includes(normalize(d.term))) return d.term;
  }
  for (const t of pool) {
    if (wordCount(t.term) <= 3 && norm.includes(normalize(t.term))) return t.term;
  }
  // Fallback: longest content word
  const words = sentence
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z]/g, ''))
    .filter(
      (w) =>
        w.length >= 5 &&
        !STOPWORDS.has(w.toLowerCase()) &&
        !JUNK_TERMS.has(w.toLowerCase()) &&
        !w.toLowerCase().endsWith('ly')
    )
    .sort((a, b) => b.length - a.length);
  return words[0];
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceTerm(sentence: string, term: string, replacement: string): string {
  return sentence.replace(new RegExp(escapeRegExp(term), 'i'), replacement);
}

function trimWords(s: string, maxWords: number): string {
  const words = s.split(/\s+/);
  if (words.length <= maxWords) return s;
  return words.slice(0, maxWords).join(' ').replace(/[.,;:]+$/, '') + '...';
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mapType(t: string): QuestionType | null {
  const n = t.toLowerCase();
  if (n.includes('multiple')) return 'multiple-choice';
  if (n.includes('true')) return 'true-false';
  if (n.includes('ident')) return 'identification';
  return null;
}

export function generateExamFromNotes(o: ExamGenOptions): ExamGenResult {
  const rand = o.random || Math.random;
  const requested = clampQuestionCount(o.questionCount);
  const types = o.questionTypes.map(mapType).filter((t): t is QuestionType => t !== null);
  const selectedTypes: QuestionType[] = types.length
    ? types
    : ['multiple-choice', 'true-false', 'identification'];

  const sentences = splitSentences(o.notes || '');
  const definitions = extractDefinitions(sentences);
  const pool = buildTermPool(sentences, definitions);

  const defBySentence = new Map<number, number>();
  definitions.forEach((d, i) => defBySentence.set(d.sentIdx, i));

  const usedSentences = new Set<number>();
  const usedDefs = new Set<number>();
  const usedQuestionText = new Set<string>();
  const usedAnswers = new Set<string>();
  const questions: Question[] = [];
  let qIdx = 0;

  const mkId = () => `q-${Date.now()}-${qIdx++}`;

  // Using a source marks its linked definition/sentence used too
  const markSentenceUsed = (i: number) => {
    usedSentences.add(i);
    const di = defBySentence.get(i);
    if (di !== undefined) usedDefs.add(di);
  };
  const markDefUsed = (i: number) => {
    usedDefs.add(i);
    usedSentences.add(definitions[i].sentIdx);
  };

  const tryAdd = (q: Question | null): boolean => {
    if (!q) return false;
    const key = normalize(q.question);
    if (usedQuestionText.has(key)) return false;
    usedQuestionText.add(key);
    if (q.type !== 'true-false') usedAnswers.add(normalize(q.correctAnswer));
    questions.push(q);
    return true;
  };

  const answerTaken = (answer: string, allowReuse: boolean) =>
    !allowReuse && usedAnswers.has(normalize(answer));

  const makeIdentification = (allowReuse: boolean): Question | null => {
    // Prefer unused definitions
    for (let i = 0; i < definitions.length; i++) {
      if (usedDefs.has(i)) continue;
      const d = definitions[i];
      if (answerTaken(d.term, allowReuse)) continue;
      markDefUsed(i);
      return {
        id: mkId(),
        question: `Which term is described as: ${d.def}?`,
        type: 'identification',
        correctAnswer: d.term,
        explanation: `Your material defines ${d.term} as: ${d.def}.`,
        points: 1,
      };
    }
    // Cloze from a sentence
    for (let i = 0; i < sentences.length; i++) {
      if (usedSentences.has(i)) continue;
      const s = sentences[i];
      const term = findKeyTerm(s, pool, definitions);
      if (!term || !normalize(s).includes(normalize(term))) continue;
      if (answerTaken(term, allowReuse)) continue;
      markSentenceUsed(i);
      return {
        id: mkId(),
        question: `Fill in the blank: ${replaceTerm(s, term, '_____')}`,
        type: 'identification',
        correctAnswer: term,
        explanation: `The material states: "${s}".`,
        points: 1,
      };
    }
    return null;
  };

  const makeMultipleChoice = (allowReuse: boolean): Question | null => {
    // Definition-based MC
    for (let i = 0; i < definitions.length; i++) {
      if (usedDefs.has(i)) continue;
      const d = definitions[i];
      const answer = trimWords(d.def, 20);
      if (answerTaken(answer, allowReuse)) continue;
      const distractors = shuffle(
        definitions.filter((x, j) => j !== i && normalize(x.def) !== normalize(d.def)),
        rand
      ).map((x) => trimWords(x.def, 20));
      const unique: string[] = [];
      const seenOpt = new Set([normalize(answer)]);
      for (const dd of distractors) {
        const k = normalize(dd);
        if (seenOpt.has(k)) continue;
        seenOpt.add(k);
        unique.push(dd);
        if (unique.length === 3) break;
      }
      if (unique.length < 3) continue;
      markDefUsed(i);
      return {
        id: mkId(),
        question: `Which of the following best describes ${d.term}?`,
        type: 'multiple-choice',
        options: shuffle([answer, ...unique], rand),
        correctAnswer: answer,
        explanation: `Your material defines ${d.term} as: ${d.def}.`,
        points: 1,
      };
    }
    // Cloze MC
    for (let i = 0; i < sentences.length; i++) {
      if (usedSentences.has(i)) continue;
      const s = sentences[i];
      const term = findKeyTerm(s, pool, definitions);
      if (!term || !normalize(s).includes(normalize(term))) continue;
      if (answerTaken(term, allowReuse)) continue;
      const normS = normalize(s);
      const distractors = shuffle(
        pool.filter(
          (t) =>
            normalize(t.term) !== normalize(term) &&
            !normS.includes(normalize(t.term)) &&
            wordCount(t.term) <= 3 &&
            sameShape(term, t)
        ),
        rand
      );
      const unique: string[] = [];
      const seenOpt = new Set([normalize(term)]);
      for (const dd of distractors) {
        const k = normalize(dd.term);
        if (seenOpt.has(k)) continue;
        seenOpt.add(k);
        unique.push(dd.term);
        if (unique.length === 3) break;
      }
      if (unique.length < 3) continue;
      markSentenceUsed(i);
      return {
        id: mkId(),
        question: `Fill in the blank: ${replaceTerm(s, term, '_____')}`,
        type: 'multiple-choice',
        options: shuffle([term, ...unique], rand),
        correctAnswer: term,
        explanation: `The material states: "${s}".`,
        points: 1,
      };
    }
    return null;
  };

  const tfFlip = { current: false };
  const makeTrueFalse = (): Question | null => {
    for (let i = 0; i < sentences.length; i++) {
      if (usedSentences.has(i)) continue;
      const s = sentences[i];
      const wantFalse = tfFlip.current;
      tfFlip.current = !tfFlip.current;
      if (wantFalse) {
        const normS = normalize(s);
        // Prefer falsifying a definition on this sentence with another term's definition
        const defIdx = defBySentence.get(i);
        if (defIdx !== undefined) {
          const d = definitions[defIdx];
          const other = shuffle(
            definitions.filter((x, j) => j !== defIdx && normalize(x.def) !== normalize(d.def)),
            rand
          )[0];
          if (other) {
            markSentenceUsed(i);
            return {
              id: mkId(),
              question: `True or False: ${d.term} is ${other.def}.`,
              type: 'true-false',
              options: ['True', 'False'],
              correctAnswer: 'False',
              explanation: `False. The material states: "${s}".`,
              points: 1,
            };
          }
        }
        // Otherwise swap the key term for a same-shape pool term
        const term = findKeyTerm(s, pool, definitions);
        const replacement =
          term &&
          pool.find(
            (t) =>
              normalize(t.term) !== normalize(term) &&
              !normS.includes(normalize(t.term)) &&
              wordCount(t.term) <= 3 &&
              sameShape(term, t)
          );
        if (term && replacement && normS.includes(normalize(term))) {
          let rep = replacement.term;
          // Preserve sentence-start capitalization
          if (s.toLowerCase().indexOf(term.toLowerCase()) === 0) {
            rep = rep.charAt(0).toUpperCase() + rep.slice(1);
          }
          const altered = replaceTerm(s, term, rep);
          if (normalize(altered) !== normS) {
            markSentenceUsed(i);
            return {
              id: mkId(),
              question: `True or False: ${altered}`,
              type: 'true-false',
              options: ['True', 'False'],
              correctAnswer: 'False',
              explanation: `False. The material states: "${s}".`,
              points: 1,
            };
          }
        }
        // Could not falsify this sentence; fall through to a True statement
      }
      markSentenceUsed(i);
      return {
        id: mkId(),
        question: `True or False: ${s}`,
        type: 'true-false',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: `True. The material states: "${s}".`,
        points: 1,
      };
    }
    return null;
  };

  const builders: Record<QuestionType, (allowReuse: boolean) => Question | null> = {
    'multiple-choice': makeMultipleChoice,
    'true-false': () => makeTrueFalse(),
    identification: makeIdentification,
  };

  // Round-robin across selected types; remaining types fill when one runs out.
  // First pass avoids reusing correct answers; if a full pass yields nothing,
  // a second pass allows reused answers (still never reusing a source).
  const order = selectedTypes;
  let allowReuse = false;
  while (questions.length < requested) {
    let produced = 0;
    for (const t of order) {
      if (questions.length >= requested) break;
      if (tryAdd(builders[t](allowReuse))) produced++;
    }
    if (produced === 0) {
      if (allowReuse) break;
      allowReuse = true;
    }
  }

  const generated = questions.length;
  let warning: string | undefined;
  if (generated === 0) {
    warning = 'Not enough content to build questions. Add a few complete sentences or definitions.';
  } else if (generated < requested) {
    warning = `Your material supports ${generated} unique questions, so ${generated} were generated instead of ${requested}. Add more content for a longer exam.`;
  }

  const exam: Exam = {
    id: `exam-${Date.now()}`,
    courseName: o.courseName,
    title: `${o.courseName} Exam Simulation`,
    topic: o.courseName,
    difficulty: 'Medium',
    timeLimitMinutes: Math.max(5, Math.ceil(generated * 1.5)),
    questionTypes: o.questionTypes,
    questions,
    createdAt: new Date().toISOString(),
  };

  return { exam, requested, generated, warning };
}

function normalizeIdent(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(a|an|the)\s+/, '');
}

function normalizeExact(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[n];
}

export function isAnswerCorrect(q: Question, answer: string | undefined): boolean {
  if (answer === undefined || !answer.trim()) return false;
  if (q.type === 'identification') {
    const user = normalizeIdent(answer);
    const correct = normalizeIdent(q.correctAnswer || '');
    if (!user || !correct) return false;
    if (user === correct) return true;
    const threshold = correct.length >= 10 ? 2 : correct.length >= 5 ? 1 : 0;
    return threshold > 0 && levenshtein(user, correct) <= threshold;
  }
  return normalizeExact(answer) === normalizeExact(q.correctAnswer || '');
}

export function gradeExam(
  exam: Exam,
  answers: Record<string, string>
): {
  score: number;
  maxScore: number;
  percentage: number;
  correctCount: number;
  results: { questionId: string; correct: boolean; userAnswer: string }[];
  byType: Record<string, { correct: number; total: number }>;
} {
  let score = 0;
  let maxScore = 0;
  let correctCount = 0;
  const results: { questionId: string; correct: boolean; userAnswer: string }[] = [];
  const byType: Record<string, { correct: number; total: number }> = {};

  for (const q of exam.questions) {
    const pts = q.points || 1;
    maxScore += pts;
    const userAnswer = answers[q.id] || '';
    const correct = isAnswerCorrect(q, userAnswer);
    if (correct) {
      score += pts;
      correctCount++;
    }
    results.push({ questionId: q.id, correct, userAnswer });
    const label =
      q.type === 'multiple-choice'
        ? 'Multiple choice'
        : q.type === 'true-false'
          ? 'True or false'
          : 'Identification';
    if (!byType[label]) byType[label] = { correct: 0, total: 0 };
    byType[label].total++;
    if (correct) byType[label].correct++;
  }

  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  return { score, maxScore, percentage, correctCount, results, byType };
}

// Read-only review of a stored attempt. Uses the attempt's own question
// snapshot, falling back to the exam in `exams`; stored score is returned as-is.
export function buildAttemptReview(
  attempt: ExamAttempt,
  exams: Exam[]
): {
  questions: Question[];
  perQuestion: { question: Question; userAnswer: string; correct: boolean }[];
  score: number;
  maxScore: number;
  percentage: number;
  available: boolean;
} {
  const questions =
    attempt.questions && attempt.questions.length
      ? attempt.questions
      : exams.find((e) => e.id === attempt.examId)?.questions || [];
  const available = questions.length > 0;
  const perQuestion = questions.map((question) => {
    const userAnswer = attempt.userAnswers[question.id] || '';
    return { question, userAnswer, correct: isAnswerCorrect(question, userAnswer) };
  });
  return {
    questions,
    perQuestion,
    score: attempt.score,
    maxScore: attempt.maxScore,
    percentage: attempt.percentage,
    available,
  };
}

export function feedbackFor(percentage: number): string {
  if (percentage >= 90) return 'Excellent work. You have mastered this material.';
  if (percentage >= 75) return 'Good job. A little more review and you will have it down.';
  if (percentage >= 50) return 'Keep practicing. You are getting there.';
  return 'Review the material and try again. Focus on the questions you missed.';
}
