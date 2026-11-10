'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Shield,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  Send,
  RotateCcw,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Radio,
  Bell,
  Terminal,
  FileCode,
  Sparkles,
  BookOpen,
  X,
} from 'lucide-react';

import { getQuestionBySlug, getAllQuestions } from '../../../lib/questions/data';
import { LeetCodeQuestion, TestCase } from '../../../lib/questions/types';
import { runCode, ExecutionSummary } from '../../../lib/execution/runner';
import { useProctoring } from '../../../lib/proctoring/useProctoring';
import { useExamSession } from '../../../lib/exam/useExamSession';
import { useTheme } from '../../../lib/theme/ThemeContext';
import ProctorWidget from '../../../components/proctoring/ProctorWidget';
import ProctorViolationModal from '../../../components/proctoring/ProctorViolationModal';
import ProctorAuditPanel from '../../../components/proctoring/ProctorAuditPanel';
import RoundClock from '../../../components/battle/RoundClock';

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-card text-muted-foreground text-xs font-mono">
      Loading Synchronized Code Editor...
    </div>
  ),
});

type LeftTab = 'description' | 'editorial' | 'proctoring';
type ConsoleTab = 'testcases' | 'result';
type ViewRole = 'candidate' | 'examiner';

export default function SynchronizedExamPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = (params.sessionId as string) || 'demo-sync-session';
  const { theme } = useTheme();

  const [role, setRole] = useState<ViewRole>('candidate');
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [activeLeftTab, setActiveLeftTab] = useState<LeftTab>('description');
  const [activeConsoleTab, setActiveConsoleTab] = useState<ConsoleTab>('testcases');
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState<number>(0);
  const [language, setLanguage] = useState<'python' | 'cpp' | 'java'>('cpp');
  const [code, setCode] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [execResult, setExecResult] = useState<ExecutionSummary | null>(null);
  const [customTestCases, setCustomTestCases] = useState<TestCase[]>([]);
  const [fontSize, setFontSize] = useState<number>(13);

  // Synchronized Multi-Question Exam State Hook
  const {
    session,
    remainingSeconds,
    isConnected,
    participantsCount,
    announcement,
    candidateTelemetry,
    syncCodeDraft,
    syncViolation,
    setCurrentQuestionIndex,
    updateQuestionStatus,
    syncTelemetry,
    sendAnnouncement,
  } = useExamSession(sessionId, 'Candidate', role);

  const activeQuestionItem = session.questions[session.currentQuestionIndex] || session.questions[0];
  const question = useMemo(() => {
    return getQuestionBySlug(activeQuestionItem.slug) || getAllQuestions()[0];
  }, [activeQuestionItem.slug]);

  // Anti-Cheating Proctoring Hook
  const {
    trustScore,
    violations,
    isFullscreen,
    isCameraActive,
    isMicActive,
    faceDetected,
    activeWarning,
    audioLevel,
    videoRef,
    detectedObjects,
    faceBbox,
    candidateCentering,
    aiModelStatus,
    setAiSensitivity,
    triggerSimulatedIllicit,
    clearSimulatedIllicit,
    enterFullscreen,
    exitFullscreen,
    startCameraAndMic,
    stopCameraAndMic,
    dismissWarning,
    resetViolations,
    toggleFaceDetection,
  } = useProctoring({
    enabled: role === 'candidate' && hasStarted,
    strictMode: hasStarted,
    onViolation: (v) => {
      syncViolation(v);
    },
    onTelemetry: (t) => {
      syncTelemetry(t);
    },
    examSessionId: sessionId,
  });

  // Sync user's default language preference from settings (defaults to 'cpp')
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('codeclash_default_language') as 'cpp' | 'python' | 'java';
      if (savedLang && ['cpp', 'python', 'java'].includes(savedLang)) {
        setLanguage(savedLang);
      }
    }
  }, []);

  // Load question starter code or cached draft
  useEffect(() => {
    if (!question) return;

    // Check if synced session has a code draft for this question
    const syncedDraft = session.codeDrafts[question.slug];
    const isStaleDraft = !syncedDraft?.code || syncedDraft.code.includes(`void ${question.functionName}`) || syncedDraft.code.includes('*args');
    if (syncedDraft && !isStaleDraft) {
      setCode(syncedDraft.code);
      if (syncedDraft.language) setLanguage(syncedDraft.language as any);
    } else {
      const starter = question.starterCodes[language] || question.starterCodes.cpp || question.starterCodes.python;
      setCode(starter);
    }

    setCustomTestCases(question.testCases.map((tc, idx) => ({ ...tc, id: `tc-${idx}` })));
    setExecResult(null);
    setActiveTestCaseIndex(0);
  }, [question.slug, session.currentQuestionIndex]);

  // Start proctoring cameras upon candidate activation
  useEffect(() => {
    if (role === 'candidate' && hasStarted) {
      startCameraAndMic();
    } else {
      stopCameraAndMic();
    }
  }, [role, hasStarted]);

  // Sync code draft to session as candidate types
  const handleCodeChange = (newCode: string | undefined) => {
    const val = newCode || '';
    setCode(val);
    syncCodeDraft(question.slug, val, language);
    updateQuestionStatus(question.slug, 'drafting');
  };

  // Run Code against visible test cases
  const handleRunCode = async () => {
    if (!question || isRunning) return;
    setIsRunning(true);
    setActiveConsoleTab('result');

    try {
      const summary = await runCode(
        code,
        language,
        question,
        customTestCases
      );
      setExecResult(summary);
    } catch (err: any) {
      console.error('Run failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  // Submit code for grading
  const handleSubmitCode = async () => {
    if (!question || isSubmitting) return;
    setIsSubmitting(true);
    setActiveConsoleTab('result');

    try {
      const allCases = [...question.testCases, ...(question.hiddenTestCases || [])];
      const summary = await runCode(
        code,
        language,
        question,
        allCases
      );
      setExecResult(summary);

      if (summary.verdict === 'Accepted') {
        updateQuestionStatus(question.slug, 'passed');
      }
    } catch (err: any) {
      console.error('Submit failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] bg-background text-foreground overflow-hidden">
      {/* Real-time Examiner Announcement Banner */}
      {announcement && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-amber-500 motion-enter">
          <div className="flex items-center gap-2">
            <Bell className="size-3.5 shrink-0" />
            <span className="font-semibold">Examiner Notice:</span>
            <span>{announcement.text}</span>
          </div>
          <span className="font-mono text-[10px] opacity-75">Live broadcast</span>
        </div>
      )}

      {/* Synchronized Header Deck */}
      <header className="h-12 border-b border-border bg-card/60 px-4 flex items-center justify-between shrink-0 text-xs">
        {/* Left: Session identity & role */}
        <div className="flex items-center gap-3">
          <Link
            href="/problems"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            ← Exit
          </Link>

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center gap-2">
            <span className="w-8 h-6 rounded bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-mono font-bold text-[10px]">
              MPA
            </span>
            <div>
              <span className="font-bold text-foreground truncate max-w-[200px] sm:max-w-xs block">
                {session.title || 'Timed Practice Assessment'}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                Session: {sessionId}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Authoritative Timer & Live Sync Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Synchronized Countdown Clock */}
          <RoundClock
            remainingSeconds={remainingSeconds}
            totalSeconds={(session.durationMinutes || 45) * 60}
            isActive={session.status === 'active' || hasStarted}
            label="Assessment Clock"
          />

          {/* Sync Status Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 border border-border text-[11px] text-muted-foreground">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span className="font-mono tabular-nums">
              {isConnected ? `${participantsCount} Live` : 'Connecting'}
            </span>
          </div>

          {/* Trust Score Badge */}
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] font-mono tabular-nums font-semibold ${
              trustScore >= 80
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
            }`}
          >
            <Shield className="w-3 h-3" />
            <span>{trustScore}% Trust</span>
          </div>
        </div>

        {/* Right: View Role Toggle & Submit Assessment */}
        <div className="flex items-center gap-2">
          {/* Role Toggle: Candidate vs Examiner */}
          <div className="flex items-center bg-muted p-0.5 rounded-lg border border-border text-xs">
            <button
              onClick={() => setRole('candidate')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                role === 'candidate'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Candidate
            </button>
            <button
              onClick={() => setRole('examiner')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                role === 'examiner'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Eye className="w-3 h-3" />
              Examiner
            </button>
          </div>

          <button
            onClick={() => {
              if (confirm('Are you sure you want to finalize and submit your Practice Assessment?')) {
                alert('Practice Assessment submitted successfully! All drafts and integrity audits are synced.');
                router.push('/problems');
              }
            }}
            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors"
          >
            Submit Assessment
          </button>
        </div>
      </header>

      {/* Synchronized Question Tabs Deck */}
      <div className="h-10 bg-muted/30 border-b border-border px-4 flex items-center justify-between shrink-0 text-xs overflow-x-auto">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground font-medium mr-1">Questions:</span>
          {session.questions.map((q, idx) => {
            const isCurrent = idx === session.currentQuestionIndex;
            return (
              <button
                key={q.slug}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                  isCurrent
                    ? 'bg-card border-border text-foreground font-semibold shadow-sm'
                    : 'bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <span>
                  Q{idx + 1}: {q.title}
                </span>

                {q.status === 'passed' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : q.status === 'drafting' ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 font-mono text-muted-foreground text-xs">
          <button
            disabled={session.currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex(session.currentQuestionIndex - 1)}
            className="p-1 rounded hover:bg-muted disabled:opacity-30 text-foreground"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="tabular-nums">
            {session.currentQuestionIndex + 1} / {session.questions.length}
          </span>
          <button
            disabled={session.currentQuestionIndex === session.questions.length - 1}
            onClick={() => setCurrentQuestionIndex(session.currentQuestionIndex + 1)}
            className="p-1 rounded hover:bg-muted disabled:opacity-30 text-foreground"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Area: Candidate View OR Examiner Monitor View */}
      {role === 'examiner' ? (
        /* ================= EXAMINER LIVE MONITOR VIEW ================= */
        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Radio className="w-4 h-4 text-rose-500" />
                Examiner Assessment Monitor
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time synchronized candidate code stream, proctoring telemetry, and session broadcast.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const msg = prompt('Enter announcement message to broadcast to candidate:');
                  if (msg) {
                    sendAnnouncement(msg, 'warning');
                    alert(`Broadcasted: "${msg}"`);
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-muted text-foreground border border-border text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Bell className="w-3.5 h-3.5 text-amber-500" />
                Broadcast Announcement
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
              <span className="text-[11px] text-muted-foreground font-medium">Candidate</span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">{session.candidateName}</span>
                <span
                  className={`text-[11px] px-2 py-0.2 rounded font-mono font-medium ${
                    trustScore >= 80 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                  }`}
                >
                  {trustScore}% Trust
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Active: Q{session.currentQuestionIndex + 1} ({question.title})
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
              <span className="text-[11px] text-muted-foreground font-medium">Solved Questions</span>
              <div className="text-sm font-bold text-foreground font-mono tabular-nums">
                {session.questions.filter((q) => q.status === 'passed').length} / {session.questions.length} Solved
              </div>
              <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{
                    width: `${(session.questions.filter((q) => q.status === 'passed').length / session.questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
              <span className="text-[11px] text-muted-foreground font-medium">Integrity Flags</span>
              <div className="text-sm font-bold text-rose-500 font-mono tabular-nums">
                {violations.length} Incidents
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {violations[0] ? `Latest: ${violations[0].details}` : 'No violations logged'}
              </p>
            </div>
          </div>

          {/* Synchronized Live Code Mirror */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileCode className="w-3.5 h-3.5 text-primary" />
                <span className="font-semibold text-foreground">
                  Live Code Mirror: {question.title} ({language})
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">Synced Live</span>
            </div>
            <div className="h-64">
              <Editor
                height="100%"
                theme={theme === 'dark' ? 'vs-dark' : 'vs'}
                language={language}
                value={code}
                options={{
                  readOnly: true,
                  fontSize: 13,
                  minimap: { enabled: false },
                  automaticLayout: true,
                }}
              />
            </div>
          </div>

          {/* Incident Audit Log */}
          <ProctorAuditPanel
            trustScore={trustScore}
            violations={violations}
            telemetry={candidateTelemetry}
            onClearViolations={resetViolations}
          />
        </div>
      ) : (
        /* ================= CANDIDATE SPLIT WORKSPACE ================= */
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
          {/* Left Split: Question Statement & Tabs */}
          <div className="flex flex-col border-r border-border bg-card/40 overflow-hidden">
            <div className="flex items-center gap-1 px-3 border-b border-border bg-muted/40 shrink-0 text-xs">
              <button
                onClick={() => setActiveLeftTab('description')}
                className={`flex items-center gap-1.5 px-3 py-2 font-medium border-b-2 transition-colors ${
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
                className={`flex items-center gap-1.5 px-3 py-2 font-medium border-b-2 transition-colors ${
                  activeLeftTab === 'editorial'
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Hints & Walkthrough
              </button>

              <button
                onClick={() => setActiveLeftTab('proctoring')}
                className={`flex items-center gap-1.5 px-3 py-2 font-medium border-b-2 transition-colors ${
                  activeLeftTab === 'proctoring'
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                Audit Log
                {violations.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    {violations.length}
                  </span>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {activeLeftTab === 'description' && (
                <div className="space-y-5">
                  <div>
                    <h1 className="text-lg font-bold text-foreground">
                      Q{session.currentQuestionIndex + 1}. {question.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                      <span className="px-2 py-0.5 rounded font-medium border text-emerald-500 bg-emerald-500/10 border-emerald-500/20">
                        {question.difficulty}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                        {question.category}
                      </span>
                      <span className="text-muted-foreground font-mono">
                        Acceptance: {question.acceptanceRate}
                      </span>
                    </div>
                  </div>

                  <div className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {question.description}
                    </ReactMarkdown>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-foreground">Examples</h3>
                    {question.examples.map((ex, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-border bg-card space-y-1.5 text-xs font-mono"
                      >
                        <div className="font-sans font-medium text-muted-foreground text-[11px]">
                          Example {idx + 1}
                        </div>
                        <div className="space-y-0.5">
                          <div>
                            <span className="text-muted-foreground font-sans">Input: </span>
                            <span className="text-foreground">{ex.input}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground font-sans">Output: </span>
                            <span className="text-emerald-500">{ex.expectedOutput}</span>
                          </div>
                          {ex.explanation && (
                            <div className="pt-1 text-muted-foreground font-sans text-xs border-t border-border mt-1">
                              <span className="font-medium text-foreground">Explanation: </span>
                              {ex.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-xs font-semibold text-foreground">Constraints</h3>
                    <ul className="list-disc list-inside space-y-1 text-xs font-mono text-muted-foreground">
                      {question.constraints.map((c, i) => (
                        <li key={i}>
                          <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">{c}</code>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeLeftTab === 'editorial' && (
                <div className="space-y-3 text-xs">
                  <h3 className="text-sm font-bold text-foreground">{question.editorial.approach}</h3>
                  <p className="text-muted-foreground leading-relaxed">{question.editorial.intuition}</p>
                  <div className="p-3 rounded-lg bg-muted border border-border font-mono space-y-1">
                    <div>Time Complexity: {question.editorial.timeComplexity}</div>
                    <div>Space Complexity: {question.editorial.spaceComplexity}</div>
                  </div>
                </div>
              )}

              {activeLeftTab === 'proctoring' && (
                <ProctorAuditPanel
                  trustScore={trustScore}
                  violations={violations}
                  onClearViolations={resetViolations}
                />
              )}
            </div>
          </div>

          {/* Right Split: Monaco Editor & Execution Console */}
          <div className="flex flex-col h-full bg-card overflow-hidden">
            {/* Editor Action Header */}
            <div className="h-10 px-3 border-b border-border bg-muted/40 flex items-center justify-between shrink-0 text-xs">
              <div className="flex items-center gap-2">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="text-xs bg-card border border-border text-foreground font-medium px-2 py-1 rounded focus:outline-none"
                >
                  <option value="cpp">C++</option>
                  <option value="python">Python 3</option>
                  <option value="java">Java</option>
                </select>

                <button
                  onClick={() => {
                    const starter = question.starterCodes[language] || question.starterCodes.python;
                    setCode(starter);
                    syncCodeDraft(question.slug, starter, language);
                  }}
                  className="p-1 rounded bg-card hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors"
                  title="Reset code"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunCode}
                  disabled={isRunning || isSubmitting}
                  className="flex items-center gap-1 px-3 py-1 rounded-md bg-secondary hover:bg-muted text-foreground text-xs font-medium border border-border transition-colors disabled:opacity-50"
                >
                  <Play className={`w-3 h-3 text-emerald-500 ${isRunning ? 'animate-spin' : ''}`} />
                  <span>{isRunning ? 'Running...' : 'Run Cases'}</span>
                </button>

                <button
                  onClick={handleSubmitCode}
                  disabled={isRunning || isSubmitting}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  <span>{isSubmitting ? 'Evaluating...' : 'Submit'}</span>
                </button>
              </div>
            </div>

            {/* Monaco Editor Container */}
            <div className="flex-1 min-h-[220px] w-full overflow-hidden">
              <Editor
                height="100%"
                theme={theme === 'dark' ? 'vs-dark' : 'vs'}
                language={language}
                value={code}
                onChange={handleCodeChange}
                options={{
                  fontSize,
                  minimap: { enabled: false },
                  lineNumbers: 'on',
                  automaticLayout: true,
                  tabSize: 4,
                  wordWrap: 'on',
                }}
              />
            </div>

            {/* Bottom Testcase & Execution Console */}
            <div className="border-t border-border bg-card flex flex-col shrink-0">
              <div className="h-8 px-3 border-b border-border bg-muted/40 flex items-center gap-2 text-xs">
                <button
                  onClick={() => setActiveConsoleTab('testcases')}
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium ${
                    activeConsoleTab === 'testcases' ? 'bg-card text-foreground font-semibold shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  <Terminal className="w-3 h-3" /> Testcases
                </button>
                <button
                  onClick={() => setActiveConsoleTab('result')}
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium ${
                    activeConsoleTab === 'result' ? 'bg-card text-foreground font-semibold shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Result
                </button>
              </div>

              <div className="h-44 overflow-y-auto p-3 text-xs font-mono">
                {activeConsoleTab === 'testcases' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      {customTestCases.map((tc, idx) => (
                        <div
                          key={idx}
                          onClick={() => setActiveTestCaseIndex(idx)}
                          className={`px-2.5 py-0.5 rounded text-xs cursor-pointer border ${
                            activeTestCaseIndex === idx
                              ? 'bg-card border-border text-foreground font-semibold'
                              : 'bg-muted/40 border-transparent text-muted-foreground'
                          }`}
                        >
                          Case {idx + 1}
                        </div>
                      ))}
                    </div>
                    {customTestCases[activeTestCaseIndex] && (
                      <textarea
                        rows={3}
                        value={customTestCases[activeTestCaseIndex].input}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomTestCases((prev) =>
                            prev.map((c, i) => (i === activeTestCaseIndex ? { ...c, input: val } : c))
                          );
                        }}
                        className="w-full p-2 rounded bg-muted/60 border border-border text-foreground font-mono text-xs focus:outline-none"
                      />
                    )}
                  </div>
                )}

                {activeConsoleTab === 'result' && (
                  <div>
                    {!execResult ? (
                      <div className="text-muted-foreground text-center py-6 font-sans text-xs">
                        Run test cases or submit solution to view output.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {execResult.verdict === 'Accepted' ? (
                            <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
                            </span>
                          ) : execResult.verdict === 'Time Limit Exceeded' ? (
                            <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> Time Limit Exceeded
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-rose-500 flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> {execResult.verdict}
                            </span>
                          )}
                          <span className="text-[11px] text-muted-foreground font-sans">
                            ({execResult.passedCases}/{execResult.totalCases} passed) • {execResult.totalRuntimeMs} ms
                          </span>
                        </div>

                        {execResult.totalCases > 10 && execResult.verdict === 'Accepted' ? (
                          <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-xs font-mono space-y-1">
                            <div className="text-emerald-400 font-bold font-sans">Assessment Test Suite Verified</div>
                            <div className="text-muted-foreground text-[11px]">
                              All {execResult.totalCases} test cases (visible cases + hidden stress/scale cases) passed within time constraints.
                            </div>
                          </div>
                        ) : execResult.firstFailed ? (
                          <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/10 text-xs font-mono space-y-1">
                            <div className="text-rose-400 font-bold font-sans">Failed on Case #{execResult.firstFailed.index}</div>
                            <div className="text-muted-foreground">Input: {execResult.firstFailed.input}</div>
                            <div className="text-rose-400">Actual: {execResult.firstFailed.actual}</div>
                            <div className="text-emerald-400">Expected: {execResult.firstFailed.expected}</div>
                          </div>
                        ) : null}

                        {execResult.results.slice(0, 4).map((res) => (
                          <div
                            key={res.index}
                            className={`p-2 rounded border text-xs ${
                              res.passed ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'
                            }`}
                          >
                            <div className="flex justify-between font-sans font-medium text-[11px] mb-1">
                              <span>Case {res.index}</span>
                              <span className={res.passed ? 'text-emerald-500' : 'text-rose-500'}>
                                {res.passed ? 'PASS' : 'FAIL'}
                              </span>
                            </div>
                            <div>Input: {res.input}</div>
                            <div>Output: {res.actual}</div>
                            <div>Expected: {res.expected}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Candidate Proctoring Monitor */}
      {role === 'candidate' && hasStarted && (
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
          onReconnectCamera={startCameraAndMic}
          onToggleFace={toggleFaceDetection}
          onTriggerIllicit={triggerSimulatedIllicit}
          onClearIllicit={clearSimulatedIllicit}
          onSetSensitivity={setAiSensitivity}
        />
      )}

      {/* Candidate Launchpad Pre-flight Check Screen */}
      {role === 'candidate' && !hasStarted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md p-4 overflow-y-auto motion-enter">
          <div className="w-full max-w-xl bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 card-elevated">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-mono font-bold text-base shrink-0">
                  <Shield className="size-6" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">
                    Timed Practice Assessment
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Integrity Verified • Data Structures & Algorithms
                  </p>
                </div>
              </div>

              <button
                onClick={() => router.push('/problems')}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Close and return to problem list"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-muted/50 border border-border">
                <span className="text-[11px] text-muted-foreground block font-medium">Questions</span>
                <span className="text-sm font-semibold text-foreground mt-0.5 block tabular-nums">{session.questions.length} Problems</span>
              </div>
              <div className="p-3 rounded-xl bg-muted/50 border border-border">
                <span className="text-[11px] text-muted-foreground block font-medium">Time Limit</span>
                <span className="text-sm font-semibold text-foreground mt-0.5 block tabular-nums">45 Minutes</span>
              </div>
              <div className="p-3 rounded-xl bg-muted/50 border border-border">
                <span className="text-[11px] text-muted-foreground block font-medium">Default Runtime</span>
                <span className="text-sm font-semibold text-foreground mt-0.5 block">C++ 17</span>
              </div>
              <div className="p-3 rounded-xl bg-muted/50 border border-border">
                <span className="text-[11px] text-muted-foreground block font-medium">Proctoring</span>
                <span className="text-sm font-semibold text-emerald-500 mt-0.5 block">Strict Fullscreen</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2 text-xs text-muted-foreground">
              <h2 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Assessment Integrity Guidelines
              </h2>
              <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
                <li>Your browser will enter <strong>Full-Screen Mode</strong> upon starting. Exiting full screen pauses the test.</li>
                <li>Tab switching, window unfocusing, and devtools access are actively recorded.</li>
                <li>Webcam & audio monitoring maintain your candidate trust score.</li>
                <li>Code drafts and test submissions synchronize in real-time with the assessment server.</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={() => router.push('/problems')}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border font-medium text-xs transition-colors"
              >
                Cancel & Close
              </button>

              <button
                onClick={async () => {
                  resetViolations();
                  await enterFullscreen();
                  await startCameraAndMic();
                  setHasStarted(true);
                }}
                className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                Start Practice Assessment
              </button>

              <button
                onClick={() => setRole('examiner')}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-secondary hover:bg-muted text-foreground border border-border font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Eye className="w-4 h-4" />
                Examiner View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Enforcement Overlay */}
      {role === 'candidate' && hasStarted && !isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-md p-4 motion-enter">
          <div className="w-full max-w-md bg-card border border-amber-500/40 rounded-2xl p-6 shadow-2xl text-center space-y-4 card-elevated">
            <div className="size-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 mx-auto flex items-center justify-center">
              <ShieldAlert className="size-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Full-Screen Mode Required</h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Practice Assessment guidelines require active full-screen mode. Please return to full screen to continue solving.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  stopCameraAndMic();
                  router.push('/problems');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs border border-border transition-colors"
              >
                Exit Assessment
              </button>
              <button
                onClick={async () => {
                  await enterFullscreen();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Maximize2 className="w-4 h-4" />
                Resume Full-Screen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Violation Modal */}
      {role === 'candidate' && hasStarted && (
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
