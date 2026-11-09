import { LiveBattleState } from '../socket';
import { getQuestionBySlug } from '../../../web/lib/questions/data';
import { runCppNative, runPythonNative } from '../../../web/lib/execution/nativeRunner';
import { runCode, ExecutionSummary } from '../../../web/lib/execution/runner';

export interface SubmissionEvaluationResult {
  accepted: boolean;
  verdict: string;
  passedCases: number;
  totalCases: number;
  runtimeMs: number;
  memoryMb: number;
  submittedAt: number;
  isLate: boolean;
  isWinner: boolean;
  isDraw: boolean;
  error?: string;
}

/**
 * Authoritative Server-Side Submission Judge
 * - NEVER trusts client-supplied verdicts or passed counts.
 * - Enforces strict server wall-clock deadline.
 * - Compiles and executes code against all visible AND hidden benchmark test cases.
 * - Protects against simultaneous submission race conditions with atomic checks.
 */
export async function evaluateBattleSubmission(
  battle: LiveBattleState,
  playerId: string,
  username: string,
  code: string,
  language: string
): Promise<SubmissionEvaluationResult> {
  const submittedAt = Date.now();

  // 1. Guard: Check active status
  if (battle.status !== 'active') {
    return {
      accepted: false,
      verdict: battle.status === 'completed' ? 'Match Already Concluded' : 'Match Not Active',
      passedCases: 0,
      totalCases: 0,
      runtimeMs: 0,
      memoryMb: 0,
      submittedAt,
      isLate: false,
      isWinner: false,
      isDraw: false,
      error: `Cannot submit: match status is '${battle.status}'`,
    };
  }

  // 2. Guard: Authoritative match deadline
  if (battle.endTime && submittedAt > battle.endTime) {
    return {
      accepted: false,
      verdict: 'Time Limit Exceeded (Submission Late)',
      passedCases: 0,
      totalCases: 0,
      runtimeMs: 0,
      memoryMb: 0,
      submittedAt,
      isLate: true,
      isWinner: false,
      isDraw: false,
      error: 'Submission arrived after match deadline',
    };
  }

  // 3. Load question and full test case suite (including hidden stress cases)
  const question = getQuestionBySlug(battle.questionSlug) || getQuestionBySlug('two-sum');
  if (!question) {
    throw new Error(`Authoritative question '${battle.questionSlug}' not found`);
  }

  const fullSuite = [...question.testCases, ...(question.hiddenTestCases || [])];
  const lang = (language || 'cpp').toLowerCase();

  // 4. Server-Side Execution in Sandboxed Environment
  let summary: ExecutionSummary;
  try {
    if (lang === 'cpp') {
      summary = await runCppNative(code, question, fullSuite);
    } else if (lang === 'python') {
      summary = await runPythonNative(code, question, fullSuite);
    } else {
      summary = await runCode(code, lang, question, fullSuite);
    }
  } catch (execErr: any) {
    summary = {
      verdict: 'Runtime Error',
      totalCases: fullSuite.length,
      passedCases: 0,
      totalRuntimeMs: 0,
      memoryMb: 0,
      globalError: execErr.message || 'Execution error during evaluation',
      results: [],
    };
  }

  const isAccepted = summary.verdict === 'Accepted' && summary.passedCases === summary.totalCases;

  // 5. Update player state in battle
  if (battle.players[playerId]) {
    battle.players[playerId].code = code;
    battle.players[playerId].language = language;
    battle.players[playerId].passedCases = summary.passedCases;
    battle.players[playerId].totalCases = summary.totalCases;
    battle.players[playerId].lastActive = submittedAt;
  }

  // 6. Winner Determination & Race Condition Resolution
  let isWinner = false;
  let isDraw = false;

  if (isAccepted && battle.status === 'active') {
    // Atomic check: Ensure battle wasn't completed in a parallel tick
    const alreadyWon = Object.values(battle.players).some((p) => p.isWinner);

    if (!alreadyWon) {
      battle.status = 'completed';
      battle.winner = username;
      battle.players[playerId].isWinner = true;
      isWinner = true;
    }
  }

  return {
    accepted: isAccepted,
    verdict: summary.verdict,
    passedCases: summary.passedCases,
    totalCases: summary.totalCases,
    runtimeMs: summary.totalRuntimeMs,
    memoryMb: summary.memoryMb,
    submittedAt,
    isLate: false,
    isWinner,
    isDraw,
  };
}
