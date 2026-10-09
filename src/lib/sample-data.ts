import { Course, Exam, Cheatsheet, Task } from '../types';

export const SAMPLE_COURSES: Course[] = [
  {
    id: 'course-1',
    code: 'MATH 101',
    title: 'Mathematics',
    units: 3,
    instructor: 'Prof. J. Davies',
    room: 'Room 101',
    days: ['Mon', 'Wed'],
    startTime: '08:00',
    endTime: '09:30',
    color: '#3B82F6', // Blue
    description: 'Calculus, linear algebra, limits, derivatives and integral applications.',
  },
  {
    id: 'course-2',
    code: 'PHYS 201',
    title: 'Physics',
    units: 4,
    instructor: 'Dr. H. Chen',
    room: 'Room 110',
    days: ['Tue', 'Fri'],
    startTime: '10:30',
    endTime: '12:00',
    color: '#06B6D4', // Cyan
    description: 'Classical mechanics, thermodynamics, wave optics and electromagnetism.',
  },
  {
    id: 'course-3',
    code: 'ENG 105',
    title: 'English Literature',
    units: 3,
    instructor: 'Prof. S. Bennett',
    room: 'Room 204',
    days: ['Mon', 'Wed'],
    startTime: '13:00',
    endTime: '14:30',
    color: '#F59E0B', // Amber
    description: 'Literary criticism, classic prose, comparative drama and creative analysis.',
  },
  {
    id: 'course-4',
    code: 'HIST 120',
    title: 'World History',
    units: 3,
    instructor: 'Dr. A. Martinez',
    room: 'Room 301',
    days: ['Tue', 'Thu'],
    startTime: '13:00',
    endTime: '14:30',
    color: '#8B5CF6', // Purple
    description: 'Modern civilizations, globalization, diplomatic revolutions and political philosophy.',
  },
  {
    id: 'course-5',
    code: 'BIO 110',
    title: 'Biology',
    units: 4,
    instructor: 'Dr. E. Thorne',
    room: 'Lab 1',
    days: ['Thu'],
    startTime: '08:00',
    endTime: '10:00',
    color: '#10B981', // Emerald green
    description: 'Cellular genetics, molecular biochemistry, ecology and laboratory diagnostics.',
  },
  {
    id: 'course-6',
    code: 'CHEM 102',
    title: 'Chemistry',
    units: 4,
    instructor: 'Prof. R. Vance',
    room: 'Lab 2',
    days: ['Wed', 'Fri'],
    startTime: '13:00',
    endTime: '14:30',
    color: '#EC4899', // Pink
    description: 'Organic chemistry, titration stoichiometry, equilibrium thermodynamics and spectral analysis.',
  },
];

export const SAMPLE_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Finish calculus problem set',
    courseId: 'course-1',
    courseName: 'Mathematics',
    dueDate: '2026-10-12',
    priority: 'High',
    category: 'Assignment',
    completed: false,
    notes: 'Integration by parts and trigonometric substitution problems #1-15.',
  },
  {
    id: 'task-2',
    title: 'Read chapter 5 & take notes',
    courseId: 'course-4',
    courseName: 'World History',
    dueDate: '2026-10-10',
    priority: 'Medium',
    category: 'Reading',
    completed: false,
    notes: 'The Industrial Revolution and urbanization impacts in 19th century Europe.',
  },
  {
    id: 'task-3',
    title: 'Prepare lab report',
    courseId: 'course-5',
    courseName: 'Biology',
    dueDate: '2026-10-12',
    priority: 'High',
    category: 'Assignment',
    completed: false,
    notes: 'Enzyme kinetics experiment data table, rate charts and conclusion.',
  },
  {
    id: 'task-4',
    title: 'Study for physics quiz',
    courseId: 'course-2',
    courseName: 'Physics',
    dueDate: '2026-10-12',
    priority: 'Medium',
    category: 'Exam Prep',
    completed: false,
    notes: 'Conservation of momentum, rotational inertia and torque calculations.',
  },
  {
    id: 'task-5',
    title: 'Review lecture notes',
    courseId: 'course-4',
    courseName: 'World History',
    dueDate: '2026-10-14',
    priority: 'Low',
    category: 'Reading',
    completed: false,
    notes: 'Enlightenment thinkers and the social contract theory summary.',
  },
];

export const SAMPLE_EXAMS: Exam[] = [
  {
    id: 'exam-1',
    courseId: 'course-2',
    courseName: 'Physics',
    title: 'Physics Mechanics & Kinematics Quiz',
    topic: 'Newtonian Laws, Kinetic Energy & Work',
    difficulty: 'Medium',
    timeLimitMinutes: 15,
    questionTypes: ['Multiple Choice', 'True/False', 'Identification'],
    createdAt: '2026-10-08T10:00:00.000Z',
    questions: [
      {
        id: 'q-1',
        question: 'What is the SI unit of Work and Kinetic Energy?',
        type: 'multiple-choice',
        options: ['Newton (N)', 'Joule (J)', 'Watt (W)', 'Pascal (Pa)'],
        correctAnswer: 'Joule (J)',
        explanation: 'Work is defined as force multiplied by displacement (1 N * 1 m = 1 Joule).',
        points: 2,
      },
      {
        id: 'q-2',
        question: 'In an isolated system, total mechanical energy is always conserved when only conservative forces act.',
        type: 'true-false',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'When non-conservative forces such as friction or air resistance do zero work, mechanical energy E = K + U remains constant.',
        points: 2,
      },
      {
        id: 'q-3',
        question: 'Identify the physical law stating that every action has an equal and opposite reaction.',
        type: 'identification',
        correctAnswer: "Newton's Third Law",
        explanation: "Newton's Third Law of Motion dictates that for any action force between two bodies, there is an equal magnitude reaction in the opposite direction.",
        points: 2,
      },
    ],
  },
];

export const SAMPLE_CHEATSHEETS: Cheatsheet[] = [
  {
    id: 'cs-1',
    courseId: 'course-1',
    courseName: 'Mathematics',
    title: 'Calculus Derivatives & Integrals Quick Sheet',
    topic: 'Differential Calculus & Trigonometric Formulas',
    summary: 'High-yield calculus rules synthesized by the local AI engine.',
    sections: [
      {
        heading: 'Fundamental Derivative Rules',
        bulletPoints: [
          'Power Rule: d/dx(x^n) = n * x^(n-1)',
          "Product Rule: (uv)' = u'v + uv'",
          "Quotient Rule: (u/v)' = (u'v - uv') / v^2",
          "Chain Rule: d/dx[f(g(x))] = f'(g(x)) * g'(x)",
        ],
        codeOrFormula: 'Trig Derivatives:\nd/dx(sin x) = cos x\nd/dx(cos x) = -sin x\nd/dx(tan x) = sec^2 x\nd/dx(ln x) = 1/x',
      },
      {
        heading: 'Common Integrals',
        bulletPoints: [
          'int(x^n dx) = (x^(n+1))/(n+1) + C (for n != -1)',
          'int(1/x dx) = ln|x| + C',
          'int(e^x dx) = e^x + C',
          'Integration by Parts: int(u dv) = uv - int(v du)',
        ],
        codeOrFormula: "Fundamental Theorem of Calculus:\nint_a^b f(x) dx = F(b) - F(a) where F'(x) = f(x)",
      },
    ],
    keyTerms: [
      { term: 'Limit', definition: 'The value that a function approaches as the input approaches some value.' },
      { term: 'Derivative', definition: 'The instantaneous rate of change of a function with respect to its variable.' },
      { term: 'Definite Integral', definition: 'The net signed area of the region in the xy-plane bounded by the graph of f.' },
    ],
    mnemonics: [
      'L-I-A-T-E: For Integration by Parts substitution order (Logarithmic, Inverse trig, Algebraic, Trigonometric, Exponential)',
    ],
    createdAt: '2026-10-12T08:00:00.000Z',
  },
];

export const SAMPLE_COR_TEXT = `OFFICIAL CERTIFICATE OF REGISTRATION (COR)
Student Name: Alex Morgan
Student No.: 2026-09418
Program: Bachelor of Science
SCHEDULE:
MATH 101 | Mathematics | 3.0 | Mon, Wed | 08:00 AM - 09:30 AM | Room 101 | Prof. J. Davies
PHYS 201 | Physics | 4.0 | Tue, Fri | 10:30 AM - 12:00 PM | Room 110 | Dr. H. Chen
ENG 105 | English Literature | 3.0 | Mon, Wed | 01:00 PM - 02:30 PM | Room 204 | Prof. S. Bennett
HIST 120 | World History | 3.0 | Tue, Thu | 01:00 PM - 02:30 PM | Room 301 | Dr. A. Martinez
BIO 110 | Biology | 4.0 | Thu | 08:00 AM - 10:00 AM | Lab 1 | Dr. E. Thorne
CHEM 102 | Chemistry | 4.0 | Wed, Fri | 01:00 PM - 02:30 PM | Lab 2 | Prof. R. Vance`;
