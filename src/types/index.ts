export interface Course {
  id: string;
  code: string;
  title: string;
  units: number;
  instructor?: string;
  room?: string;
  days: string[]; // e.g. ['Mon', 'Wed', 'Fri']
  date?: string; // 'YYYY-MM-DD' for one-time events; weekly courses have no date
  startDate?: string; // 'YYYY-MM-DD' inclusive bound for weekly recurrences
  endDate?: string; // 'YYYY-MM-DD' inclusive bound for weekly recurrences
  startTime: string; // '08:00'
  endTime: string; // '09:30'
  color: string;
  description?: string;
}

export type QuestionType = 'multiple-choice' | 'true-false' | 'identification';

export interface Question {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[]; // for multiple-choice
  correctAnswer: string;
  explanation: string;
  points: number;
}

export interface Exam {
  id: string;
  courseId?: string;
  courseName: string;
  title: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeLimitMinutes: number;
  questionTypes: string[];
  questions: Question[];
  createdAt: string;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  examTitle: string;
  courseName: string;
  score: number;
  maxScore: number;
  percentage: number;
  userAnswers: Record<string, string>;
  completedAt: string;
  timeSpentSeconds: number;
  questions?: Question[]; // snapshot of the exam at submit time
  examSnapshot?: { title: string; courseName: string };
}

export interface CheatsheetSection {
  heading: string;
  bulletPoints: string[];
  codeOrFormula?: string;
}

export interface KeyTerm {
  term: string;
  definition: string;
}

export interface Cheatsheet {
  id: string;
  courseId?: string;
  courseName: string;
  title: string;
  topic: string;
  summary: string;
  sections: CheatsheetSection[];
  keyTerms: KeyTerm[];
  mnemonics: string[];
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  courseId?: string;
  courseName?: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High';
  category: string;
  completed: boolean;
  notes?: string;
}

export type LLMMode = 'webllm' | 'local_gguf' | 'embedded';

export interface ModelProgress {
  status: 'idle' | 'checking' | 'downloading' | 'loading' | 'ready' | 'generating' | 'error';
  progressPercentage: number;
  text: string;
  error?: string;
}

export interface HardwareInfo {
  hasWebGPU: boolean;
  adapterName?: string;
  estimatedVRAM?: string;
  deviceType?: string;
}
