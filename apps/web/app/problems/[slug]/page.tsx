'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Play,
  Send,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Shield,
  ShieldAlert,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Code2,
  BookOpen,
  History,
  FileCode,
  Terminal,
  Plus,
  Trash2,
  Copy,
  Check,
  Settings2,
  ChevronDown,
  ChevronUp,
  AlignLeft,
  ThumbsUp,
  ThumbsDown,
  Star,
  Share2,
  Swords,
  Shuffle,
  Timer as TimerIcon,
  Pause,
  Lightbulb,
  MessageSquare,
  Users,
  Flame,
  Zap,
  ArrowRight,
  ExternalLink,
  Hash,
  Link2,
} from 'lucide-react';

import {
  getQuestionBySlug,
  getAllQuestions,
  LIST_OF_QUESTIONS,
} from '../../../lib/questions/data';
import {
  LeetCodeQuestion,
  TestCase,
  SubmissionRecord,
} from '../../../lib/questions/types';
import { runCode, ExecutionSummary } from '../../../lib/execution/runner';
import { useProctoring } from '../../../lib/proctoring/useProctoring';
import { useTheme } from '../../../lib/theme/ThemeContext';
import ProctorAuditPanel from '../../../components/proctoring/ProctorAuditPanel';
import ProctorWidget from '../../../components/proctoring/ProctorWidget';
import ProctorViolationModal from '../../../components/proctoring/ProctorViolationModal';

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-card text-muted-foreground font-mono text-xs">
      Loading Code Editor...
    </div>
  ),
});

type LeftTab = 'description' | 'editorial' | 'solutions' | 'submissions' | 'battle' | 'proctoring';
type ConsoleTab = 'testcase' | 'result';
type LanguageKey = 'cpp' | 'python' | 'java';

const LANGUAGES: { key: LanguageKey; label: string; monacoLang: string; ext: string }[] = [
  { key: 'cpp', label: 'C++', monacoLang: 'cpp', ext: 'cpp' },
  { key: 'python', label: 'Python 3', monacoLang: 'python', ext: 'py' },
  { key: 'java', label: 'Java', monacoLang: 'java', ext: 'java' },
];

export default function ProblemWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const rawSlug = (params.slug as string) || 'concatenation-of-array';
  const cleanSlug = rawSlug.replace(/\/question$/, '');

  const allQuestions = useMemo(() => getAllQuestions(), []);
  const question = useMemo(() => {
    return getQuestionBySlug(cleanSlug) || LIST_OF_QUESTIONS[0];
  }, [cleanSlug, allQuestions]);

  // Editor State (Defaults to C++)
  const [language, setLanguage] = useState<LanguageKey>('cpp');
  const [code, setCode] = useState<string>('');
  const [fontSize, setFontSize] = useState<number>(14);
  const [tabSize, setTabSize] = useState<number>(4);
  const [isEditorFullscreen, setIsEditorFullscreen] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedEditorialCode, setCopiedEditorialCode] = useState<string | null>(null);
  const [editorialLangTab, setEditorialLangTab] = useState<LanguageKey>('cpp');
  const [solutionsLangTab, setSolutionsLangTab] = useState<LanguageKey>('cpp');
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);

  // Likes & Favorites State (Interactive LeetCode feel)
  const [likesCount, setLikesCount] = useState<number>(question.likes || 1240);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [hasDisliked, setHasDisliked] = useState<boolean>(false);
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [expandedHints, setExpandedHints] = useState<Record<number, boolean>>({});

  // Battle / Friend Practice Modal State
  const [isBattleModalOpen, setIsBattleModalOpen] = useState<boolean>(false);
  const [copiedInviteLink, setCopiedInviteLink] = useState<boolean>(false);
  const [copiedRoomCode, setCopiedRoomCode] = useState<boolean>(false);
  const [activeDuelCode] = useState(() => 'DUEL-' + Math.random().toString(36).substring(2, 7).toUpperCase());

  // LeetCode Submission Result Modal State
  const [showSubmissionModal, setShowSubmissionModal] = useState<boolean>(false);
  const [submissionSummary, setSubmissionSummary] = useState<ExecutionSummary | null>(null);

  // LeetCode Contest / Practice Stopwatch Timer State
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  const [isTimerVisible, setIsTimerVisible] = useState<boolean>(true);

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return hours > 0
      ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(minutes)}:${pad(seconds)}`;
  };

  // Layout & Resizable Splitter State
  const [splitRatio, setSplitRatio] = useState<number>(46);
  const [consoleHeight, setConsoleHeight] = useState<number>(270);
  const [isConsoleOpen, setIsConsoleOpen] = useState<boolean>(true);
  const isDraggingHorizontal = useRef<boolean>(false);
  const isDraggingVertical = useRef<boolean>(false);

  // Tabs & Execution State
  const [activeLeftTab, setActiveLeftTab] = useState<LeftTab>('description');
  const [activeConsoleTab, setActiveConsoleTab] = useState<ConsoleTab>('testcase');
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState<number>(0);
  const [activeResultCaseIndex, setActiveResultCaseIndex] = useState<number>(0);
  const [customTestCases, setCustomTestCases] = useState<TestCase[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [execResult, setExecResult] = useState<ExecutionSummary | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);

  // Mode: Practice vs Proctored Exam
  const [isExamMode, setIsExamMode] = useState<boolean>(false);

  // Anti-Cheat Proctoring Hook
  const {
    trustScore,
    violations,
    isFullscreen,
    isCameraActive,
    isMicActive,
    faceDetected,
    faceBbox,
    candidateCentering,
    detectedObjects,
    aiModelStatus,
    audioLevel,
    videoRef,
    activeWarning,
    startCameraAndMic,
    stopCameraAndMic,
    reconnectCamera,
    enterFullscreen,
    exitFullscreen,
    resetViolations,
    dismissWarning,
    toggleFaceDetection,
    triggerSimulatedIllicit,
    clearSimulatedIllicit,
    setAiSensitivity,
  } = useProctoring({
    enabled: isExamMode,
    strictMode: isExamMode,
  });

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  // Configure Monaco Theme
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    monaco.editor.defineTheme('leetcode-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '569cd6', fontStyle: 'bold' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
        { token: 'function', foreground: 'dcdcaa' },
        { token: 'type', foreground: '4ec9b0' },
      ],
      colors: {
        'editor.background': '#18181b',
        'editor.foreground': '#f4f4f5',
        'editorLineNumber.foreground': '#71717a',
        'editorLineNumber.activeForeground': '#e4e4e7',
        'editorCursor.foreground': '#e4e4e7',
        'editor.lineHighlightBackground': '#27272a40',
        'editorGutter.background': '#18181b',
        'editor.selectionBackground': '#264f78',
        'editorBracketMatch.background': '#3f3f46',
        'editorBracketMatch.border': '#60a5fa',
      },
    });

    monaco.editor.setTheme('leetcode-dark');
  };

  // Sync Default Language from localStorage on Mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('codeclash_default_language') as LanguageKey;
      if (stored && (stored === 'cpp' || stored === 'python' || stored === 'java')) {
        setLanguage(stored);
        setEditorialLangTab(stored);
        setSolutionsLangTab(stored);
      }
    }
  }, []);

  // Sync Code and Test Cases when Question or Language Changes
  useEffect(() => {
    if (!question) return;

    let saved = '';
    if (typeof window !== 'undefined') {
      saved = localStorage.getItem(`clash_code_${question.slug}_${language}`) || '';
    }

    const isStaleDraft =
      saved &&
      (saved.includes('vector<int> twoSum') && question.slug !== 'two-sum' ||
       saved.includes('maxSubArray') && question.slug !== 'maximum-subarray' ||
       saved.includes('containsDuplicate') && question.slug !== 'contains-duplicate' ||
       saved.includes('isAnagram') && question.slug !== 'valid-anagram');

    if (!isStaleDraft && saved) {
      setCode(saved);
    } else {
      const starter = question.starterCodes[language] || question.starterCodes.cpp || question.starterCodes.python || '';
      setCode(starter);
    }

    setCustomTestCases(question.testCases.map((tc, idx) => ({ ...tc, id: `tc-${idx + 1}` })));
    setExecResult(null);
    setActiveTestCaseIndex(0);
    setLikesCount(question.likes || 1240);
    setHasLiked(false);
    setHasDisliked(false);

    // Load past submissions
    if (typeof window !== 'undefined') {
      const subKey = `subs_${question.slug}`;
      const savedSubs = localStorage.getItem(subKey);
      if (savedSubs) {
        try {
          setSubmissions(JSON.parse(savedSubs));
        } catch {}
      } else {
        setSubmissions([]);
      }
    }
  }, [question.slug, language]);

  // Auto-save code
  const handleCodeChange = (newCode: string | undefined) => {
    const val = newCode || '';
    setCode(val);
    if (typeof window !== 'undefined' && question) {
      localStorage.setItem(`clash_code_${question.slug}_${language}`, val);
    }
  };

  // Reset to starter template
  const handleResetCode = () => {
    if (!question) return;
    if (confirm('Reset code to the original starter template? Your edits will be replaced.')) {
      const starter = question.starterCodes[language] || question.starterCodes.cpp || question.starterCodes.python || '';
      setCode(starter);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`clash_code_${question.slug}_${language}`, starter);
      }
    }
  };

  // Copy code to clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  // Format code
  const handleFormatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  // Load solution into editor
  const handleLoadSolutionIntoEditor = (solCode: string, lang: LanguageKey) => {
    setLanguage(lang);
    setCode(solCode);
    if (typeof window !== 'undefined' && question) {
      localStorage.setItem(`clash_code_${question.slug}_${lang}`, solCode);
    }
  };

  // Execute code via server native runner (clang++ / python3) with client fallback
  const executeCode = async (casesToRun: TestCase[], isSubmit: boolean): Promise<ExecutionSummary> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const resp = await fetch('/api/questions/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: question.slug,
          code,
          language,
          isSubmit,
          customTestCases: casesToRun,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const json = await resp.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (e) {
      console.warn('API execution unavailable or timed out, using fallback runner:', e);
    }
    // Client-side fallback runner with algorithm correctness verification
    return await runCode(code, language, question, casesToRun);
  };

  // Run Code
  const handleRunCode = async () => {
    if (!question || isRunning || isSubmitting) return;
    setIsRunning(true);
    setIsConsoleOpen(true);
    setActiveConsoleTab('result');

    try {
      const summary = await executeCode(customTestCases, false);
      setExecResult(summary);
      setActiveResultCaseIndex(0);
    } catch (err: any) {
      console.error('Run failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  // Submit Code
  const handleSubmitCode = async () => {
    if (!question || isSubmitting || isRunning) return;
    setIsSubmitting(true);
    setIsConsoleOpen(true);
    setActiveConsoleTab('result');

    try {
      const fullSuite = [...question.testCases, ...(question.hiddenTestCases || [])];
      const summary = await executeCode(fullSuite, true);
      setExecResult(summary);
      setActiveResultCaseIndex(0);
      setSubmissionSummary(summary);
      setShowSubmissionModal(true);

      const record: SubmissionRecord = {
        id: 'sub-' + Date.now(),
        questionSlug: question.slug,
        code,
        language,
        verdict: summary.verdict,
        runtimeMs: summary.totalRuntimeMs,
        memoryMb: summary.memoryMb,
        passedCount: summary.passedCases,
        totalCount: summary.totalCases,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const updated = [record, ...submissions];
      setSubmissions(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`subs_${question.slug}`, JSON.stringify(updated));
      }
    } catch (err: any) {
      console.error('Submission execution failed:', err);
      const errSummary: ExecutionSummary = {
        verdict: 'Runtime Error',
        totalCases: question.testCases.length,
        passedCases: 0,
        totalRuntimeMs: 0,
        memoryMb: 0,
        results: [{
          index: 1,
          input: question.testCases[0]?.input || '',
          expected: question.testCases[0]?.expectedOutput || '',
          actual: err.message || 'Execution error',
          passed: false,
          runtimeMs: 0,
          stdout: [],
          error: err.message || 'Failed to complete execution',
        }],
        firstFailed: {
          index: 1,
          input: question.testCases[0]?.input || '',
          expected: question.testCases[0]?.expectedOutput || '',
          actual: err.message || 'Execution error',
          passed: false,
          runtimeMs: 0,
          stdout: [],
          error: err.message || 'Failed to complete execution',
        },
      };
      setExecResult(errSummary);
      setSubmissionSummary(errSummary);
      setShowSubmissionModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcuts (Cmd/Ctrl + ' for Run, Cmd/Ctrl + Enter for Submit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "'") {
        e.preventDefault();
        handleRunCode();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmitCode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, language, question, customTestCases]);

  // Resizable Panes Handlers
  const handleMouseDownHorizontal = (e: React.MouseEvent) => {
    isDraggingHorizontal.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingHorizontal.current) return;
      const newRatio = (moveEvent.clientX / window.innerWidth) * 100;
      if (newRatio >= 25 && newRatio <= 75) {
        setSplitRatio(newRatio);
      }
    };

    const handleMouseUp = () => {
      isDraggingHorizontal.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseDownVertical = (e: React.MouseEvent) => {
    isDraggingVertical.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingVertical.current) return;
      const newH = window.innerHeight - moveEvent.clientY;
      if (newH >= 120 && newH <= 600) {
        setConsoleHeight(newH);
      }
    };

    const handleMouseUp = () => {
      isDraggingVertical.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const currentIndex = allQuestions.findIndex((q) => q.slug === question.slug);
  const prevQuestion = currentIndex > 0 ? allQuestions[currentIndex - 1] : null;
  const nextQuestion = currentIndex < allQuestions.length - 1 ? allQuestions[currentIndex + 1] : null;

  const pickRandomProblem = () => {
    const randomIndex = Math.floor(Math.random() * allQuestions.length);
    const randomQ = allQuestions[randomIndex];
    if (randomQ) router.push(`/problems/${randomQ.slug}/question`);
  };

  const handleCopyInviteLink = async () => {
    try {
      const url = typeof window !== 'undefined' ? `${window.location.origin}/battle/${activeDuelCode}?slug=${question.slug}` : '';
      await navigator.clipboard.writeText(url);
      setCopiedInviteLink(true);
      setTimeout(() => setCopiedInviteLink(false), 2500);
    } catch {}
  };

  const handleCopyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(activeDuelCode);
      setCopiedRoomCode(true);
      setTimeout(() => setCopiedRoomCode(false), 2500);
    } catch {}
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-background text-foreground overflow-hidden font-sans select-none">
      {/* ================= LEETCODE WORKSPACE TOP NAVBAR ================= */}
      <header className="h-12 border-b border-border bg-card px-3 sm:px-4 flex items-center justify-between shrink-0 gap-2 z-30">
        {/* Left: Problem List, Prev/Next, Shuffle */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/problems"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Problem List</span>
          </Link>

          <div className="h-4 w-px bg-border" />

          {/* Steppers */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => prevQuestion && router.push(`/problems/${prevQuestion.slug}/question`)}
              disabled={!prevQuestion}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              title="Previous Problem"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => nextQuestion && router.push(`/problems/${nextQuestion.slug}/question`)}
              disabled={!nextQuestion}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              title="Next Problem"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={pickRandomProblem}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Pick Random Problem"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-border hidden md:block" />

          {/* Quick Problem Dropdown */}
          <select
            value={question.slug}
            onChange={(e) => router.push(`/problems/${e.target.value}/question`)}
            className="hidden md:block text-xs bg-muted border border-border text-foreground font-semibold px-2.5 py-1.5 rounded-md focus:outline-none focus:ring-1 focus:ring-primary max-w-[200px] lg:max-w-[260px] truncate"
          >
            <optgroup label="Core Problem List">
              {LIST_OF_QUESTIONS.map((q) => (
                <option key={q.slug} value={q.slug}>
                  {q.number}. {q.title} ({q.difficulty})
                </option>
              ))}
            </optgroup>
            <optgroup label="Complete Catalog (3,600+)">
              {allQuestions.slice(LIST_OF_QUESTIONS.length, LIST_OF_QUESTIONS.length + 100).map((q) => (
                <option key={q.slug} value={q.slug}>
                  {q.number}. {q.title} ({q.difficulty})
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Center: Run, Submit & Battleground Challenge Actions */}
        <div className="flex items-center gap-2">
          {/* Run Button */}
          <button
            onClick={handleRunCode}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold border border-border transition-colors disabled:opacity-50"
            title="Run Code (Ctrl + ')"
          >
            <Play className={`w-3.5 h-3.5 text-emerald-400 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Running' : 'Run'}</span>
            <span className="hidden xl:inline text-[10px] text-muted-foreground font-mono">⌘'</span>
          </button>

          {/* Submit Button (LeetCode Green) */}
          <button
            onClick={handleSubmitCode}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-950 disabled:opacity-50"
            title="Submit Solution (Ctrl + Enter)"
          >
            {isSubmitting ? (
              <RotateCcw className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>{isSubmitting ? 'Evaluating Suite...' : 'Submit'}</span>
            <span className="hidden xl:inline text-[10px] text-emerald-100 font-mono">⌘↵</span>
          </button>

          {/* Battle a Friend Button (Battleground Multi-player Core) */}
          <button
            onClick={() => setIsBattleModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium transition-colors"
            title="Practice with Friends in Real-Time 1v1 Battleground"
          >
            <Swords className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Battle a Friend</span>
            <span className="sm:hidden">1v1</span>
          </button>
        </div>

        {/* Right: Stopwatch, Proctoring, Settings, Fullscreen */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* LeetCode Contest / Practice Timer */}
          {isTimerVisible && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted border border-border text-xs font-mono text-muted-foreground">
              <TimerIcon className="w-3 h-3 text-amber-400" />
              <span className="font-semibold text-foreground">{formatTimer(timerSeconds)}</span>
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="p-0.5 hover:text-foreground text-muted-foreground ml-0.5"
                title={isTimerRunning ? 'Pause Timer' : 'Resume Timer'}
              >
                {isTimerRunning ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
              </button>
              <button
                onClick={() => setTimerSeconds(0)}
                className="p-0.5 hover:text-foreground text-muted-foreground"
                title="Reset Timer"
              >
                <RotateCcw className="w-2.5 h-2.5" />
              </button>
            </div>
          )}

          {/* Proctoring Exam Toggle */}
          <button
            onClick={async () => {
              const nextState = !isExamMode;
              setIsExamMode(nextState);
              if (nextState) {
                resetViolations();
                await enterFullscreen();
                await startCameraAndMic();
              } else {
                stopCameraAndMic();
              }
            }}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border ${
              isExamMode
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                : 'bg-muted text-muted-foreground hover:text-foreground border-border'
            }`}
            title="Toggle Anti-Cheat Proctored Mode"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{isExamMode ? `${trustScore}% Trust` : 'Proctoring'}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              } else {
                document.exitFullscreen().catch(() => {});
              }
            }}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ================= RESIZABLE WORKSPACE ================= */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT PANE: Description / Editorial / Solutions / Submissions / Battleground */}
        <div
          style={{ width: `${splitRatio}%` }}
          className="flex flex-col bg-background border-r border-border overflow-hidden shrink-0 select-text"
        >
          {/* Left Tab Bar (LeetCode Tabs) */}
          <div className="h-10 px-2 sm:px-3 border-b border-border bg-card flex items-center gap-1 shrink-0 overflow-x-auto">
            <button
              onClick={() => setActiveLeftTab('description')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeLeftTab === 'description'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Description
            </button>

            <button
              onClick={() => setActiveLeftTab('editorial')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeLeftTab === 'editorial'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              Editorial
            </button>

            <button
              onClick={() => setActiveLeftTab('solutions')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeLeftTab === 'solutions'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              Solutions
            </button>

            <button
              onClick={() => setActiveLeftTab('submissions')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeLeftTab === 'submissions'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Submissions ({submissions.length})
            </button>

            <button
              onClick={() => setActiveLeftTab('battle')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeLeftTab === 'battle'
                  ? 'border-orange-500 text-orange-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Swords className="w-3.5 h-3.5 text-orange-400" />
              1v1 Arena
            </button>

            {isExamMode && (
              <button
                onClick={() => setActiveLeftTab('proctoring')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeLeftTab === 'proctoring'
                    ? 'border-rose-500 text-rose-400'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                Audit
              </button>
            )}
          </div>

          {/* Left Pane Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* TAB 1: DESCRIPTION */}
            {activeLeftTab === 'description' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {question.number}. {question.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                    {/* LeetCode Difficulty Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold border ${
                        question.difficulty === 'Easy'
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                          : question.difficulty === 'Medium'
                          ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                          : 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                      }`}
                    >
                      {question.difficulty}
                    </span>

                    <span className="px-2.5 py-0.5 rounded-full bg-muted border border-border text-muted-foreground font-medium">
                      {question.category || 'Algorithms'}
                    </span>

                    <span className="text-muted-foreground">
                      Acceptance: <span className="text-foreground font-semibold">{question.acceptanceRate || '65.4%'}</span>
                    </span>
                  </div>

                  {/* LeetCode Interactive Action Bar (Likes, Dislikes, Star, Share) */}
                  <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
                    <button
                      onClick={() => {
                        if (!hasLiked) {
                          setLikesCount((prev) => prev + 1);
                          setHasLiked(true);
                          setHasDisliked(false);
                        }
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                        hasLiked ? 'text-primary bg-primary/10 font-bold' : 'hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{likesCount}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (!hasDisliked) {
                          setHasDisliked(true);
                          setHasLiked(false);
                        }
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                        hasDisliked ? 'text-rose-400 bg-rose-500/10 font-bold' : 'hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setIsFavorited(!isFavorited)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                        isFavorited ? 'text-amber-400 bg-amber-500/10 font-bold' : 'hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${isFavorited ? 'fill-amber-400' : ''}`} />
                      <span>{isFavorited ? 'Favorited' : 'Favorite'}</span>
                    </button>

                    <button
                      onClick={handleCopyInviteLink}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{copiedInviteLink ? 'Link Copied!' : 'Share'}</span>
                    </button>
                  </div>
                </div>

                {/* ================= BATTLEGROUND: PRACTICE WITH FRIENDS CALLOUT BANNER ================= */}
                <div className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        Battleground
                      </span>
                      <h4 className="text-xs font-semibold text-foreground">Practice with Friends in Real-Time</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Race a friend on this exact problem with synchronized test cases and live editor view.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsBattleModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span>Duel a Friend</span>
                  </button>
                </div>

                {/* Problem Description Content */}
                <div className="text-sm text-foreground/90 leading-relaxed space-y-4">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {question.description}
                  </ReactMarkdown>
                </div>

                {/* Formatted Examples (LeetCode Cards) */}
                <div className="space-y-4 pt-2">
                  {question.examples.map((ex, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-border bg-card p-4 space-y-2 text-xs font-mono"
                    >
                      <div className="text-foreground font-sans font-bold text-xs">
                        Example {idx + 1}:
                      </div>
                      <div className="space-y-1 text-muted-foreground">
                        <div>
                          <span className="text-foreground font-semibold">Input: </span>
                          <span className="text-foreground/90">{ex.input}</span>
                        </div>
                        <div>
                          <span className="text-foreground font-semibold">Output: </span>
                          <span className="text-emerald-400 font-semibold">{ex.expectedOutput}</span>
                        </div>
                        {ex.explanation && (
                          <div className="pt-1 font-sans text-xs text-muted-foreground leading-relaxed">
                            <span className="text-foreground font-semibold">Explanation: </span>
                            {ex.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Constraints */}
                {question.constraints && question.constraints.length > 0 && (
                  <div className="space-y-2.5 pt-2">
                    <h3 className="text-xs font-semibold text-foreground">Constraints:</h3>
                    <ul className="list-disc list-inside space-y-1.5 text-xs font-mono text-muted-foreground">
                      {question.constraints.map((c, i) => (
                        <li key={i}>
                          <code className="px-1.5 py-0.5 rounded bg-muted text-foreground border border-border">
                            {c}
                          </code>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Hints (Expandable Accordion like LeetCode) */}
                {question.hints && question.hints.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h3 className="text-xs font-semibold text-foreground">Hints:</h3>
                    <div className="space-y-2">
                      {question.hints.map((hint, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-border bg-card overflow-hidden text-xs"
                        >
                          <button
                            onClick={() =>
                              setExpandedHints((prev) => ({ ...prev, [idx]: !prev[idx] }))
                            }
                            className="w-full px-3 py-2 flex items-center justify-between text-muted-foreground hover:text-foreground font-medium transition-colors"
                          >
                            <span>Hint {idx + 1}</span>
                            {expandedHints[idx] ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                          {expandedHints[idx] && (
                            <div className="px-3 pb-3 text-foreground/90 leading-relaxed border-t border-border pt-2 bg-background">
                              {hint}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Topic Tags */}
                {question.topics && question.topics.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h3 className="text-xs font-semibold text-foreground">Related Topics:</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {question.topics.map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-1 rounded-md bg-muted border border-border text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: DETAILED EDITORIAL (LEETCODE / OAHELPER GRADE) */}
            {activeLeftTab === 'editorial' && (
              <div className="space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Official Editorial & Invariant Walkthrough</span>
                  </div>
                  <h2 className="text-xl font-bold text-foreground">
                    {question.editorial.approach}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Complete algorithmic intuition, 5-step numbered walkthrough, complexity proof, and multi-language code.
                  </p>
                </div>

                {/* Intuition Section */}
                <div className="p-4 sm:p-5 rounded-xl border border-border bg-card space-y-3 text-xs leading-relaxed">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    Problem Intuition & Invariant
                  </h3>
                  <div className="text-foreground/90 space-y-3 whitespace-pre-line leading-relaxed">
                    {question.editorial.intuition}
                  </div>
                </div>

                {/* 5-Step Detailed Algorithmic Walkthrough */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    5-Step Algorithmic Walkthrough
                  </h3>
                  <div className="p-4 sm:p-5 rounded-xl border border-border bg-card text-xs space-y-2 whitespace-pre-line text-foreground/90 leading-relaxed font-sans">
                    {question.editorial.walkthrough}
                  </div>
                </div>

                {/* Complexity Analysis Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-4 rounded-xl border border-border bg-card space-y-1">
                    <span className="text-muted-foreground font-medium text-[11px]">
                      Time Complexity
                    </span>
                    <div className="font-mono text-emerald-400 font-semibold text-sm">
                      {question.editorial.timeComplexity.split(' - ')[0] || 'O(n)'}
                    </div>
                    <p className="text-muted-foreground text-[11px] pt-1 leading-normal">
                      {question.editorial.timeComplexity.split(' - ')[1] || 'Optimal linear sweep avoiding redundant recomputation.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-border bg-card space-y-1">
                    <span className="text-muted-foreground font-medium text-[11px]">
                      Space Complexity
                    </span>
                    <div className="font-mono text-emerald-400 font-semibold text-sm">
                      {question.editorial.spaceComplexity.split(' - ')[0] || 'O(1)'}
                    </div>
                    <p className="text-muted-foreground text-[11px] pt-1 leading-normal">
                      {question.editorial.spaceComplexity.split(' - ')[1] || 'Constant auxiliary memory outside output allocations.'}
                    </p>
                  </div>
                </div>

                {/* Multi-Language Solutions (C++, Python 3, Java) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-foreground">Multi-Language Implementations:</h3>

                    {/* Language Selector Pills */}
                    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg border border-border text-xs">
                      {(['cpp', 'python', 'java'] as LanguageKey[]).map((langKey) => (
                        <button
                          key={langKey}
                          onClick={() => setEditorialLangTab(langKey)}
                          className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                            editorialLangTab === langKey
                              ? 'bg-card text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {langKey === 'cpp' ? 'C++' : langKey === 'python' ? 'Python 3' : 'Java'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Code Box for Selected Language */}
                  {(() => {
                    const sol =
                      (editorialLangTab === 'cpp'
                        ? question.editorial.cppSolution
                        : editorialLangTab === 'python'
                        ? question.editorial.pythonSolution
                        : question.editorial.javaSolution) || '';

                    return (
                      <div className="rounded-xl border border-border bg-[#18181b] overflow-hidden">
                        <div className="px-3 py-2 border-b border-border bg-card flex items-center justify-between text-xs">
                          <span className="font-mono font-semibold text-muted-foreground">
                            Solution.{editorialLangTab === 'cpp' ? 'cpp' : editorialLangTab === 'python' ? 'py' : 'java'}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(sol);
                                setCopiedEditorialCode(editorialLangTab);
                                setTimeout(() => setCopiedEditorialCode(null), 2000);
                              }}
                              className="flex items-center gap-1 text-muted-foreground hover:text-foreground font-semibold transition-colors"
                            >
                              {copiedEditorialCode === editorialLangTab ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleLoadSolutionIntoEditor(sol, editorialLangTab)}
                              className="px-2.5 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 font-semibold transition-colors flex items-center gap-1"
                            >
                              <Code2 className="w-3.5 h-3.5" />
                              <span>Load into Editor</span>
                            </button>
                          </div>
                        </div>

                        <pre className="p-4 text-xs font-mono text-foreground/95 overflow-x-auto leading-relaxed">
                          {sol}
                        </pre>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* TAB 3: SOLUTIONS BROWSER */}
            {activeLeftTab === 'solutions' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-foreground">Community & Official Solutions</h2>
                    <p className="text-xs text-muted-foreground">
                      Explore verified multi-language approaches rated by performance.
                    </p>
                  </div>

                  <div className="flex items-center gap-1 p-1 bg-muted rounded-lg border border-border text-xs">
                    {(['cpp', 'python', 'java'] as LanguageKey[]).map((langKey) => (
                      <button
                        key={langKey}
                        onClick={() => setSolutionsLangTab(langKey)}
                        className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                          solutionsLangTab === langKey
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {langKey === 'cpp' ? 'C++' : langKey === 'python' ? 'Python 3' : 'Java'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Optimal
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        {question.editorial.approach}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        const sol =
                          (solutionsLangTab === 'cpp'
                            ? question.editorial.cppSolution
                            : solutionsLangTab === 'python'
                            ? question.editorial.pythonSolution
                            : question.editorial.javaSolution) || '';
                        handleLoadSolutionIntoEditor(sol, solutionsLangTab);
                      }}
                      className="px-2.5 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      Load into Editor
                    </button>
                  </div>

                  <pre className="p-3.5 rounded-lg bg-[#18181b] border border-border font-mono text-xs text-foreground/90 overflow-x-auto">
                    {solutionsLangTab === 'cpp'
                      ? question.editorial.cppSolution
                      : solutionsLangTab === 'python'
                      ? question.editorial.pythonSolution
                      : question.editorial.javaSolution}
                  </pre>
                </div>
              </div>
            )}

            {/* TAB 4: SUBMISSIONS HISTORY */}
            {activeLeftTab === 'submissions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">Submissions History</h3>
                  <span className="text-xs text-muted-foreground">{submissions.length} Total Submissions</span>
                </div>

                {submissions.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-border rounded-xl text-muted-foreground text-xs space-y-2">
                    <p>No submissions yet for this problem.</p>
                    <p className="text-[11px] text-muted-foreground/80">Click "Submit" to evaluate your solution against all benchmark test cases.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {submissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {sub.verdict === 'Accepted' ? (
                              <span className="flex items-center gap-1 font-bold text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
                              </span>
                            ) : sub.verdict === 'Time Limit Exceeded' ? (
                              <span className="flex items-center gap-1 font-bold text-amber-400">
                                <Clock className="w-3.5 h-3.5" /> Time Limit Exceeded
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 font-bold text-rose-400">
                                <XCircle className="w-3.5 h-3.5" /> {sub.verdict}
                              </span>
                            )}
                            <span className="text-muted-foreground">•</span>
                            <span className="font-mono text-muted-foreground uppercase">{sub.language}</span>
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {sub.passedCount} / {sub.totalCount} cases passed
                          </div>
                        </div>

                        <div className="text-right font-mono text-[11px] text-muted-foreground">
                          <div>{sub.runtimeMs} ms</div>
                          <div className="text-[10px] text-muted-foreground">{sub.createdAt}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: 1V1 ARENA / BATTLEGROUND */}
            {activeLeftTab === 'battle' && (
              <div className="space-y-5">
                <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center text-foreground">
                      <Swords className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Multiplayer Coding Battleground</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Challenge your friends to a 1v1 battle or practice DSA together in real time.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      onClick={() => router.push(`/battle/create?slug=${question.slug}`)}
                      className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors"
                    >
                      <Swords className="w-4 h-4" />
                      Create 1v1 Arena Room on this Problem
                    </button>

                    <button
                      onClick={handleCopyInviteLink}
                      className="w-full py-2 rounded-lg bg-secondary hover:bg-muted text-foreground border border-border font-medium text-xs flex items-center justify-center gap-2 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedInviteLink ? 'Invitation Link Copied!' : 'Copy Direct Duel Link for Friends'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <Zap className="w-4 h-4 text-amber-400" />
                      Timed Race Duel
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      First to pass all benchmark test cases wins the battle and climbs the global rankings.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <Users className="w-4 h-4 text-blue-400" />
                      Co-Op Practice
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      Share the problem with a study group or peer to discuss algorithms and solve side-by-side.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: PROCTORING AUDIT */}
            {activeLeftTab === 'proctoring' && (
              <ProctorAuditPanel
                trustScore={trustScore}
                violations={violations}
                onClearViolations={resetViolations}
              />
            )}
          </div>
        </div>

        {/* ================= DRAGGABLE HORIZONTAL SPLITTER ================= */}
        <div
          onMouseDown={handleMouseDownHorizontal}
          className="w-1.5 hover:w-2 bg-border hover:bg-primary transition-all cursor-col-resize flex items-center justify-center relative group z-20"
          title="Drag to resize pane width"
        >
          <div className="w-1 h-8 bg-muted-foreground/40 rounded-full group-hover:bg-foreground" />
        </div>

        {/* ================= RIGHT PANE: MONACO CODE EDITOR & CONSOLE ================= */}
        <div className="flex-1 flex flex-col bg-card overflow-hidden">
          {/* Editor Header Bar (LeetCode Style) */}
          <div className="h-10 px-3 border-b border-border bg-card flex items-center justify-between shrink-0 text-xs">
            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(e) => {
                  const val = e.target.value as LanguageKey;
                  setLanguage(val);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('codeclash_default_language', val);
                  }
                }}
                className="text-xs bg-muted border border-border text-foreground font-semibold px-2.5 py-1 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.key} value={l.key}>
                    {l.label}
                  </option>
                ))}
              </select>

              <span className="text-muted-foreground text-xs font-mono hidden md:inline">
                Solution.{language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : 'java'}
              </span>
            </div>

            {/* Quick Action Icons (Format, Reset, Copy, Settings) */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleFormatCode}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Format Code"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleResetCode}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Reset Code to Default Template"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleCopyCode}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                title="Copy Code"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Editor Settings"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                </button>

                {showSettingsMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-card border border-border shadow-2xl p-3 z-50 space-y-3 text-xs">
                    <div className="font-bold text-foreground">Editor Preferences</div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground">Font Size: {fontSize}px</label>
                      <input
                        type="range"
                        min="12"
                        max="20"
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full accent-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground">Tab Size: {tabSize} spaces</label>
                      <select
                        value={tabSize}
                        onChange={(e) => setTabSize(Number(e.target.value))}
                        className="w-full bg-muted border border-border text-foreground rounded p-1 text-xs"
                      >
                        <option value={2}>2 spaces</option>
                        <option value={4}>4 spaces</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 relative overflow-hidden bg-[#18181b]">
            <Editor
              height="100%"
              language={language === 'cpp' ? 'cpp' : language === 'python' ? 'python' : 'java'}
              value={code}
              theme="leetcode-dark"
              onChange={handleCodeChange}
              onMount={handleEditorDidMount}
              options={{
                fontSize,
                tabSize,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontFamily: "var(--font-mono), 'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace",
                lineHeight: 22,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                smoothScrolling: true,
                bracketPairColorization: { enabled: true },
                guides: { bracketPairs: true, indentation: true },
                roundedSelection: true,
                automaticLayout: true,
                wordWrap: 'on',
                formatOnPaste: true,
                suggestOnTriggerCharacters: true,
              }}
            />
          </div>

          {/* ================= DRAGGABLE VERTICAL SPLITTER ================= */}
          <div
            onMouseDown={handleMouseDownVertical}
            className="h-1.5 hover:h-2 bg-border hover:bg-primary transition-all cursor-row-resize flex items-center justify-center relative group z-20"
            title="Drag to resize console"
          >
            <div className="h-1 w-12 bg-muted-foreground/40 rounded-full group-hover:bg-foreground" />
          </div>

          {/* ================= BOTTOM CONSOLE (LEETCODE TESTCASE & RESULT TABS) ================= */}
          <div
            style={{ height: isConsoleOpen ? `${consoleHeight}px` : '36px' }}
            className="bg-background border-t border-border flex flex-col shrink-0 transition-all duration-150 overflow-hidden"
          >
            {/* Console Header Tabs */}
            <div className="h-9 px-3 border-b border-border bg-card flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsConsoleOpen(true);
                    setActiveConsoleTab('testcase');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded font-semibold text-xs transition-colors ${
                    activeConsoleTab === 'testcase' && isConsoleOpen
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                  Testcase
                </button>

                <button
                  onClick={() => {
                    setIsConsoleOpen(true);
                    setActiveConsoleTab('result');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded font-semibold text-xs transition-colors ${
                    activeConsoleTab === 'result' && isConsoleOpen
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      execResult?.verdict === 'Accepted'
                        ? 'text-emerald-400'
                        : execResult
                        ? 'text-rose-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                  Test Result
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleRunCode}
                  disabled={isRunning || isSubmitting}
                  className="px-2.5 py-1 rounded bg-muted hover:bg-muted/80 text-foreground font-semibold text-[11px] border border-border flex items-center gap-1 transition-colors disabled:opacity-50"
                  title="Run Code"
                >
                  <Play className={`w-3 h-3 text-emerald-400 ${isRunning ? 'animate-spin' : ''}`} />
                  <span>{isRunning ? 'Running' : 'Run'}</span>
                </button>
                <button
                  onClick={handleSubmitCode}
                  disabled={isRunning || isSubmitting}
                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 transition-all disabled:opacity-50"
                  title="Submit Solution"
                >
                  {isSubmitting ? (
                    <RotateCcw className="w-3 h-3 animate-spin text-white" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                  <span>{isSubmitting ? 'Evaluating...' : 'Submit'}</span>
                </button>

                <div className="h-3.5 w-px bg-border mx-1" />

                <button
                  onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                  className="text-muted-foreground hover:text-foreground text-xs p-1"
                  title={isConsoleOpen ? 'Minimize Console' : 'Expand Console'}
                >
                  {isConsoleOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Console Content */}
            {isConsoleOpen && (
              <div className="flex-1 overflow-y-auto p-4 text-xs font-mono bg-background">
                {/* SUBTAB: TESTCASE (EDITABLE LIKE LEETCODE) */}
                {activeConsoleTab === 'testcase' && (
                  <div className="space-y-3">
                    {/* Case Chips */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {customTestCases.map((tc, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border transition-colors ${
                            activeTestCaseIndex === idx
                              ? 'bg-muted border-border text-foreground font-bold'
                              : 'bg-card border-border text-muted-foreground hover:text-foreground'
                          }`}
                          onClick={() => setActiveTestCaseIndex(idx)}
                        >
                          <span>Case {idx + 1}</span>
                          {customTestCases.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const next = customTestCases.filter((_, i) => i !== idx);
                                setCustomTestCases(next);
                                setActiveTestCaseIndex(Math.max(0, idx - 1));
                              }}
                              className="text-muted-foreground hover:text-rose-400 p-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}

                      <button
                        onClick={() => {
                          const newCase: TestCase = {
                            id: `tc-${customTestCases.length + 1}`,
                            input: question.testCases[0]?.input || '[]',
                            expectedOutput: question.testCases[0]?.expectedOutput || '[]',
                          };
                          setCustomTestCases([...customTestCases, newCase]);
                          setActiveTestCaseIndex(customTestCases.length);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-muted border border-dashed border-border text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Add Case
                      </button>
                    </div>

                    {/* Active Case Parameter Input */}
                    {customTestCases[activeTestCaseIndex] && (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-muted-foreground font-sans text-[11px] font-semibold">
                            {question.paramNames.join(', ')} =
                          </label>
                          <textarea
                            rows={3}
                            value={customTestCases[activeTestCaseIndex].input}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomTestCases((prev) =>
                                prev.map((c, i) => (i === activeTestCaseIndex ? { ...c, input: val } : c))
                              );
                            }}
                            className="w-full p-3 rounded-lg bg-card border border-border text-foreground font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                          />
                        </div>

                        {customTestCases[activeTestCaseIndex].explanation && (
                          <div className="text-[11px] text-muted-foreground font-sans">
                            <span className="font-semibold text-foreground">Target Outcome: </span>
                            {customTestCases[activeTestCaseIndex].explanation}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* SUBTAB: TEST RESULT (LEETCODE STYLE ACCEPTS / DIFF) */}
                {activeConsoleTab === 'result' && (
                  <div>
                    {!execResult ? (
                      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground font-sans text-xs">
                        <Play className="w-6 h-6 mb-2 text-muted-foreground/40" />
                        <p>Click "Run" to test your code against visible cases, or "Submit" to evaluate all hidden stress cases.</p>
                      </div>
                    ) : (
                      <div className="space-y-4 font-sans">
                        {/* Status Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                          <div className="flex items-center gap-2">
                            {execResult.verdict === 'Accepted' ? (
                              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-base">
                                <CheckCircle2 className="w-5 h-5" />
                                <span>Accepted</span>
                              </div>
                            ) : execResult.verdict === 'Time Limit Exceeded' ? (
                              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-base">
                                <Clock className="w-5 h-5" />
                                <span>Time Limit Exceeded</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-rose-400 font-bold text-base">
                                <XCircle className="w-5 h-5" />
                                <span>{execResult.verdict}</span>
                              </div>
                            )}

                            <span className="text-xs text-muted-foreground font-mono">
                              ({execResult.passedCases} / {execResult.totalCases} cases passed)
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                            <div>
                              Runtime:{' '}
                              <span className="text-foreground font-semibold">{execResult.totalRuntimeMs} ms</span>
                            </div>
                            <div>
                              Memory:{' '}
                              <span className="text-foreground font-semibold">{execResult.memoryMb} MB</span>
                            </div>
                          </div>
                        </div>

                        {/* Error Message if Present */}
                        {execResult.firstFailed?.error && (
                          <div className="p-3.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                            {execResult.firstFailed.error}
                          </div>
                        )}

                        {/* LeetCode Case Selectors & Active Case Inspection */}
                        {execResult.results.length > 0 && (
                          <div className="space-y-3 pt-1">
                            {/* Horizontal Case Tabs */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                              {execResult.results.map((r, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setActiveResultCaseIndex(idx)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                    activeResultCaseIndex === idx
                                      ? 'bg-muted border-foreground/40 text-foreground shadow-sm'
                                      : 'bg-card border-border text-muted-foreground hover:text-foreground'
                                  }`}
                                >
                                  <span className={`w-2 h-2 rounded-full ${r.passed ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                  <span>Case {r.index}</span>
                                </button>
                              ))}
                            </div>

                            {/* Active Case Inspector */}
                            {execResult.results[activeResultCaseIndex] && (
                              <div className="p-3.5 rounded-xl border border-border bg-card/60 space-y-3 font-mono text-xs">
                                <div>
                                  <div className="flex items-center justify-between font-sans mb-1">
                                    <span className="text-muted-foreground text-[11px] font-semibold">Input:</span>
                                    <span className="text-[10px] text-muted-foreground">{execResult.results[activeResultCaseIndex].runtimeMs} ms</span>
                                  </div>
                                  <pre className="p-2.5 rounded-lg bg-background border border-border text-foreground overflow-x-auto whitespace-pre-wrap">
                                    {execResult.results[activeResultCaseIndex].input}
                                  </pre>
                                </div>

                                <div>
                                  <span className="text-muted-foreground font-sans text-[11px] font-semibold">Output:</span>
                                  <pre className={`mt-1 p-2.5 rounded-lg border overflow-x-auto whitespace-pre-wrap ${
                                    execResult.results[activeResultCaseIndex].passed
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400 font-bold'
                                  }`}>
                                    {execResult.results[activeResultCaseIndex].actual || 'No output'}
                                  </pre>
                                </div>

                                <div>
                                  <span className="text-muted-foreground font-sans text-[11px] font-semibold">Expected:</span>
                                  <pre className="mt-1 p-2.5 rounded-lg bg-background border border-border text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                                    {execResult.results[activeResultCaseIndex].expected}
                                  </pre>
                                </div>

                                {execResult.results[activeResultCaseIndex].stdout.length > 0 && (
                                  <div>
                                    <span className="text-muted-foreground font-sans text-[11px] font-semibold">Stdout:</span>
                                    <pre className="mt-1 p-2 rounded-lg bg-background border border-border text-muted-foreground text-[11px] overflow-x-auto whitespace-pre-wrap">
                                      {execResult.results[activeResultCaseIndex].stdout.join('\n')}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= BATTLEGROUND: FRIEND PRACTICE & 1V1 DUEL MODAL ================= */}
      {isBattleModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 motion-enter">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 card-elevated">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
                  <Swords className="size-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground text-balance">Practice With Friends / 1v1 Arena</h3>
                  <p className="text-xs text-muted-foreground text-pretty">CodeClash Live Multiplayer Arena</p>
                </div>
              </div>

              <button
                onClick={() => setIsBattleModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors duration-150 active:scale-95"
                aria-label="Close duel modal"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 space-y-1.5">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-orange-400" />
                  Synchronized 1v1 Battle on: {question.title}
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Both participants receive the exact same testsuite and starter template. The first coder to pass all visible and hidden stress testcases triggers an authoritative victory!
                </p>
              </div>

              {/* Option 1: Unique Room Code */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-primary" />
                    Option 1: Unique Room Code
                  </span>
                  <span className="text-[11px] text-muted-foreground">Join via Arena / Lobby</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 rounded-lg bg-background border border-border font-mono font-bold text-sm tracking-wider text-foreground select-all">
                    {activeDuelCode}
                  </div>
                  <button
                    onClick={handleCopyRoomCode}
                    className="px-4 py-2 rounded-lg bg-secondary hover:bg-muted text-foreground font-semibold text-xs border border-border flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    {copiedRoomCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                    <span>{copiedRoomCode ? 'Code Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
              </div>

              {/* Option 2: Direct Duel Challenge Link */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-primary" />
                    Option 2: Direct Challenge Link
                  </span>
                  <span className="text-[11px] text-muted-foreground">Instant 1-click room entry</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={
                      typeof window !== 'undefined'
                        ? `${window.location.origin}/battle/${activeDuelCode}?slug=${question.slug}`
                        : ''
                    }
                    className="flex-1 p-2 rounded-lg bg-background border border-border text-foreground font-mono text-xs focus:outline-none select-all"
                  />
                  <button
                    onClick={handleCopyInviteLink}
                    className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    {copiedInviteLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copiedInviteLink ? 'Link Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-normal px-1">
                Share either the <strong>unique code</strong> or the <strong>direct link</strong> with your challenger. As soon as they join, this duel starts in real time.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={() => setIsBattleModalOpen(false)}
                className="px-4 py-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsBattleModalOpen(false);
                  router.push(`/battle/${activeDuelCode}?slug=${question.slug}`);
                }}
                className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Launch Duel Room Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= LEETCODE SUBMISSION RESULT MODAL ================= */}
      {showSubmissionModal && submissionSummary && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 motion-enter">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 card-elevated">
            {/* Header with Verdict */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                {submissionSummary.verdict === 'Accepted' ? (
                  <div className="p-2.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="size-7" />
                  </div>
                ) : submissionSummary.verdict === 'Time Limit Exceeded' ? (
                  <div className="p-2.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <Clock className="size-7" />
                  </div>
                ) : (
                  <div className="p-2.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    <XCircle className="size-7" />
                  </div>
                )}
                <div>
                  <h3
                    className={`text-2xl font-black tracking-tight ${
                      submissionSummary.verdict === 'Accepted'
                        ? 'text-emerald-400'
                        : submissionSummary.verdict === 'Time Limit Exceeded'
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {submissionSummary.verdict}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {submissionSummary.passedCases} / {submissionSummary.totalCases} test cases passed
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSubmissionModal(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground text-sm font-bold transition-colors"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Performance Metrics Cards */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-muted/60 border border-border">
                <div className="text-[11px] font-medium text-muted-foreground">Runtime</div>
                <div className="text-base font-semibold font-mono text-foreground mt-0.5">
                  {submissionSummary.totalRuntimeMs} ms
                </div>
                <div className="text-[10px] text-emerald-400 mt-0.5">
                  {submissionSummary.verdict === 'Accepted' ? 'Faster than 89.2%' : 'N/A'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-muted/60 border border-border">
                <div className="text-[11px] font-medium text-muted-foreground">Memory</div>
                <div className="text-base font-semibold font-mono text-foreground mt-0.5">
                  {submissionSummary.memoryMb} MB
                </div>
                <div className="text-[10px] text-emerald-400 mt-0.5">
                  {submissionSummary.verdict === 'Accepted' ? 'Less than 74.8%' : 'N/A'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-muted/60 border border-border">
                <div className="text-[11px] font-medium text-muted-foreground">Language</div>
                <div className="text-base font-semibold font-mono text-foreground mt-0.5 uppercase">
                  {language}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Compiler v17
                </div>
              </div>
            </div>

            {/* Failing Testcase Details (If not Accepted) */}
            {submissionSummary.verdict !== 'Accepted' && submissionSummary.firstFailed && (
              <div className="space-y-2 p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 text-xs max-h-56 overflow-y-auto">
                <div className="font-bold text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Failed on Test Case #{submissionSummary.firstFailed.index}</span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div>
                    <span className="text-muted-foreground font-semibold">Input:</span>
                    <pre className="mt-0.5 p-2 rounded-lg bg-background border border-border font-mono text-[11px] overflow-x-auto text-foreground whitespace-pre-wrap">
                      {submissionSummary.firstFailed.input}
                    </pre>
                  </div>

                  <div>
                    <span className="text-muted-foreground font-semibold">Expected:</span>
                    <pre className="mt-0.5 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 font-mono text-[11px] text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                      {submissionSummary.firstFailed.expected}
                    </pre>
                  </div>

                  <div>
                    <span className="text-muted-foreground font-semibold">Your Output:</span>
                    <pre className="mt-0.5 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 font-mono text-[11px] text-rose-400 overflow-x-auto whitespace-pre-wrap">
                      {submissionSummary.firstFailed.actual || 'No output'}
                    </pre>
                  </div>

                  {submissionSummary.firstFailed.error && (
                    <div>
                      <span className="text-rose-400 font-semibold">Compiler / Runtime Log:</span>
                      <pre className="mt-0.5 p-2 rounded-lg bg-background border border-rose-500/30 font-mono text-[10px] text-rose-300 overflow-x-auto whitespace-pre-wrap">
                        {submissionSummary.firstFailed.error}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
              <button
                onClick={() => {
                  setShowSubmissionModal(false);
                  setIsBattleModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Battle a Friend</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowSubmissionModal(false);
                    setIsConsoleOpen(true);
                    setActiveConsoleTab('result');
                  }}
                  className="px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold border border-border transition-colors"
                >
                  View in Console
                </button>
                <button
                  onClick={() => setShowSubmissionModal(false)}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Candidate Proctoring Monitor */}
      {isExamMode && (
        <ProctorWidget
          trustScore={trustScore}
          violations={violations}
          isFullscreen={isFullscreen}
          isCameraActive={isCameraActive}
          isMicActive={isMicActive}
          faceDetected={faceDetected}
          faceBbox={faceBbox}
          candidateCentering={candidateCentering}
          detectedObjects={detectedObjects}
          aiModelStatus={aiModelStatus}
          audioLevel={audioLevel}
          videoRef={videoRef}
          onEnterFullscreen={enterFullscreen}
          onExitFullscreen={exitFullscreen}
          onStartCamera={startCameraAndMic}
          onStopCamera={stopCameraAndMic}
          onReconnectCamera={reconnectCamera}
          onToggleFace={toggleFaceDetection}
          onTriggerIllicit={triggerSimulatedIllicit}
          onClearIllicit={clearSimulatedIllicit}
          onSetSensitivity={setAiSensitivity}
        />
      )}

      {/* Proctoring Violation Modal */}
      {isExamMode && activeWarning && (
        <ProctorViolationModal
          message={activeWarning}
          trustScore={trustScore}
          onDismiss={dismissWarning}
          onReEnterFullscreen={enterFullscreen}
        />
      )}
    </div>
  );
}
