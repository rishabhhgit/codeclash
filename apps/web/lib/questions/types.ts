export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface TestCase {
  id?: string;
  input: string;
  expectedOutput: string;
  explanation?: string;
}

export interface StarterCodes {
  python: string;
  cpp: string;
  java: string;
  javascript?: string;
  typescript?: string;
}

export interface LeetCodeQuestion {
  id: string;
  number: number;
  slug: string;
  title: string;
  difficulty: Difficulty;
  category: string;
  topics: string[];
  acceptanceRate: string;
  likes: number;
  dislikes: number;
  description: string;
  examples: TestCase[];
  constraints: string[];
  hints: string[];
  starterCodes: StarterCodes;
  functionName: string;
  paramNames: string[];
  testCases: TestCase[];
  hiddenTestCases?: TestCase[];
  editorial: {
    approach: string;
    intuition: string;
    timeComplexity: string;
    spaceComplexity: string;
    pythonSolution: string;
    javascriptSolution?: string;
    cppSolution?: string;
    javaSolution?: string;
    walkthrough: string;
  };
  core150?: boolean;
  mastery250?: boolean;
  neetcode150?: boolean;
  neetcode250?: boolean;
  blind75?: boolean;
  videoUrl?: string;
  ncLink?: string;
}

export interface SubmissionRecord {
  id: string;
  questionSlug: string;
  code: string;
  language: string;
  verdict: 'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Compile Error' | 'Time Limit Exceeded';
  runtimeMs: number;
  memoryMb: number;
  passedCount: number;
  totalCount: number;
  createdAt: string;
  failedCase?: {
    input: string;
    expected: string;
    actual: string;
  };
}

export interface ProctorViolation {
  id: string;
  type:
    | 'TAB_SWITCH'
    | 'FULLSCREEN_EXIT'
    | 'CLIPBOARD_PASTE'
    | 'DEVTOOLS_ATTEMPT'
    | 'FACE_ABSENT'
    | 'HIGH_AUDIO_NOISE'
    | 'WINDOW_BLUR'
    | 'CELLPHONE_DETECTED'
    | 'MULTIPLE_FACES'
    | 'UNAUTHORIZED_MATERIAL'
    | 'HEADPHONES_DETECTED';
  timestamp: number;
  timeString: string;
  penalty: number;
  details: string;
}

export interface ExamSessionState {
  sessionId: string;
  title: string;
  durationMinutes: number;
  startTime: number;
  endTime: number;
  status: 'waiting' | 'active' | 'completed';
  questions: {
    slug: string;
    title: string;
    difficulty: Difficulty;
    status: 'unvisited' | 'drafting' | 'passed' | 'flagged';
  }[];
  currentQuestionIndex: number;
  candidateName: string;
  trustScore: number;
  violations: ProctorViolation[];
  codeDrafts: Record<string, { code: string; language: string; updatedAt: number }>;
}

