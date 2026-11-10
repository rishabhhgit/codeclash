'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  User,
  KeyRound,
} from 'lucide-react';

function LeetCodeBrandIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z" />
    </svg>
  );
}

interface ChallengeData {
  handle: string;
  verificationCode: string;
  profileSettingsUrl: string;
  publicProfileUrl: string;
  currentAboutMe?: string;
  instructions?: string;
}

export interface LeetCodeVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
  initialHandle?: string;
  onSuccess?: (user: any, token: string) => void;
  onSyncComplete?: (user: any) => void;
}

export default function LeetCodeVerifyModal({
  isOpen,
  onClose,
  currentUser,
  initialHandle = '',
  onSuccess,
  onSyncComplete,
}: LeetCodeVerifyModalProps) {
  const isInitiallyVerified = Boolean(
    currentUser?.leetcodeUsername && currentUser?.leetcodeVerified
  );

  const [step, setStep] = useState<'stats' | 'input' | 'challenge' | 'success'>(
    isInitiallyVerified ? 'stats' : 'input'
  );
  const [handleInput, setHandleInput] = useState(initialHandle || currentUser?.leetcodeUsername || '');
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [loadingChallenge, setLoadingChallenge] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [syncingStats, setSyncingStats] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [bioNotice, setBioNotice] = useState<string | null>(null);
  const [successUser, setSuccessUser] = useState<any>(null);

  useEffect(() => {
    if (initialHandle) {
      setHandleInput(initialHandle);
    }
  }, [initialHandle]);

  useEffect(() => {
    if (isOpen && initialHandle?.trim() && !isInitiallyVerified && step === 'input') {
      handleRequestChallenge();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Request a challenge code for the given handle
  const handleRequestChallenge = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let clean = handleInput.trim();
    if (!clean) return;

    if (clean.includes('/u/')) {
      const match = clean.match(/\/u\/([^/?#]+)/);
      if (match) clean = match[1];
    }
    clean = clean.replace(/^@/, '');

    setLoadingChallenge(true);
    setErrorMessage('');
    setBioNotice(null);

    try {
      const res = await fetch(`${apiUrl}/api/auth/leetcode/challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: clean }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate verification challenge');
      }

      setChallengeData(data.data);
      setStep('challenge');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not verify LeetCode account existence');
    } finally {
      setLoadingChallenge(false);
    }
  };

  // Authenticate ownership by verifying that the code exists in live profile bio
  const handleVerifyOwnership = async () => {
    if (!challengeData?.handle) return;

    setVerifying(true);
    setErrorMessage('');
    setBioNotice(null);

    try {
      const res = await fetch(`${apiUrl}/api/auth/leetcode/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: challengeData.handle }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.currentAboutMe !== undefined) {
          setBioNotice(data.currentAboutMe || '(empty bio)');
        }
        throw new Error(data.error || 'Verification failed. Token not found in bio.');
      }

      if (data.data?.token) {
        localStorage.setItem('token', data.data.token);
      }
      if (data.data?.user) {
        setSuccessUser(data.data.user);
        localStorage.setItem('battle_username', data.data.user.username);
        localStorage.setItem('codeclash_handle', data.data.user.handle || data.data.user.username);
        localStorage.setItem('codeclash_leetcode_handle', challengeData.handle);
        if (onSuccess) {
          onSuccess(data.data.user, data.data.token);
        }
      }

      setStep('success');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  // Sync solve stats for an already-verified user
  const handleSyncCurrentStats = async () => {
    const token = localStorage.getItem('token') || '';
    setSyncingStats(true);
    setErrorMessage('');

    try {
      const res = await fetch(`${apiUrl}/api/auth/leetcode/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to refresh solve metrics');
      }

      if (data.data?.user && onSyncComplete) {
        onSyncComplete(data.data.user);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to sync stats');
    } finally {
      setSyncingStats(false);
    }
  };

  const handleCopyCode = () => {
    if (!challengeData?.verificationCode) return;
    navigator.clipboard.writeText(challengeData.verificationCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleModalClose = () => {
    setErrorMessage('');
    setBioNotice(null);
    onClose();
  };

  // Stats calculation for verified view
  const easySolved = currentUser?.leetcodeEasySolved || 0;
  const medSolved = currentUser?.leetcodeMediumSolved || 0;
  const hardSolved = currentUser?.leetcodeHardSolved || 0;
  const totalSolved = currentUser?.leetcodeTotalSolved || 0;
  const totalTarget = 4110;
  const easyPct = Math.min(100, (easySolved / totalTarget) * 100);
  const medPct = Math.min(100, (medSolved / totalTarget) * 100);
  const hardPct = Math.min(100, (hardSolved / totalTarget) * 100);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.98, opacity: 0, y: 6 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.98, opacity: 0, y: 6 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-lg p-5 sm:p-6 rounded-xl bg-card border border-border shadow-2xl space-y-4 relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="size-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <LeetCodeBrandIcon className="size-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">LeetCode profile sync</h3>
              <p className="text-xs text-muted-foreground">Challenge-response bio verification</p>
            </div>
          </div>

          <button
            onClick={handleModalClose}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-medium">{errorMessage}</div>
              {bioNotice !== null && (
                <div className="text-[11px] text-rose-300/80 font-mono">
                  Current bio on LeetCode: &ldquo;{bioNotice}&rdquo;
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 1: Already Verified & Stats */}
        {step === 'stats' && currentUser?.leetcodeUsername && (
          <div className="space-y-4 pt-1">
            {/* Connected Account Card */}
            <div className="p-3.5 rounded-lg bg-background border border-border flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-lg bg-secondary border border-border overflow-hidden shrink-0 flex items-center justify-center">
                  {currentUser.leetcodeAvatar || currentUser.avatar ? (
                    <img
                      src={currentUser.leetcodeAvatar || currentUser.avatar}
                      alt={currentUser.leetcodeUsername}
                      className="size-full object-cover"
                    />
                  ) : (
                    <User className="size-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground truncate">
                    @{currentUser.leetcodeUsername}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    <span>Verified account owner</span>
                  </div>
                </div>
              </div>

              <a
                href={`https://leetcode.com/u/${currentUser.leetcodeUsername}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title="Open LeetCode profile"
              >
                <ExternalLink className="size-3.5" />
              </a>
            </div>

            {/* Solved Distribution Stats */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-muted-foreground">Questions solved</span>
                <span className="text-foreground font-semibold tabular-nums">
                  {totalSolved} / {totalTarget}
                </span>
              </div>

              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                <div style={{ width: `${easyPct}%` }} className="bg-emerald-500 h-full" />
                <div style={{ width: `${medPct}%` }} className="bg-amber-500 h-full" />
                <div style={{ width: `${hardPct}%` }} className="bg-rose-500 h-full" />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono text-xs">
                <div className="p-2 rounded-lg bg-background border border-border space-y-0.5">
                  <div className="text-[10px] text-emerald-500 font-medium">Easy</div>
                  <div className="text-foreground font-semibold tabular-nums">{easySolved}</div>
                </div>
                <div className="p-2 rounded-lg bg-background border border-border space-y-0.5">
                  <div className="text-[10px] text-amber-500 font-medium">Medium</div>
                  <div className="text-foreground font-semibold tabular-nums">{medSolved}</div>
                </div>
                <div className="p-2 rounded-lg bg-background border border-border space-y-0.5">
                  <div className="text-[10px] text-rose-500 font-medium">Hard</div>
                  <div className="text-foreground font-semibold tabular-nums">{hardSolved}</div>
                </div>
              </div>
            </div>

            {/* Sync Actions */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-border/70">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  setStep('input');
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
              >
                Change handle
              </button>

              <button
                type="button"
                onClick={handleSyncCurrentStats}
                disabled={syncingStats}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-40"
              >
                <RefreshCw className={`size-3.5 ${syncingStats ? 'animate-spin' : ''}`} />
                <span>{syncingStats ? 'Syncing...' : 'Sync now'}</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: Step 1 - Enter LeetCode Handle */}
        {step === 'input' && (
          <form onSubmit={handleRequestChallenge} className="space-y-4 pt-1">
            <div className="p-3 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground space-y-1">
              <div className="font-medium text-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-amber-500" />
                <span>Authoritative ownership check</span>
              </div>
              <p>
                To prevent impersonation, you will be given a unique verification string to add to your
                LeetCode profile &ldquo;About Me&rdquo; section before logging in.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-muted-foreground block">
                LeetCode username or profile link
              </label>
              <input
                type="text"
                value={handleInput}
                onChange={(e) => setHandleInput(e.target.value)}
                required
                autoFocus
                placeholder="e.g. rishabhh-dev or leetcode.com/u/rishabhh-dev"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/70">
              {currentUser?.leetcodeUsername && (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage('');
                    setStep('stats');
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={loadingChallenge || !handleInput.trim()}
                className="ml-auto px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-40"
              >
                {loadingChallenge ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    <span>Checking LeetCode...</span>
                  </>
                ) : (
                  <>
                    <span>Generate verification code</span>
                    <ArrowRight className="size-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* VIEW 3: Step 2 - Add Token to About Me & Verify */}
        {step === 'challenge' && challengeData && (
          <div className="space-y-4 pt-1">
            {/* Target Account Pill */}
            <div className="p-3 rounded-lg bg-background border border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-6 rounded-md bg-secondary border border-border flex items-center justify-center text-xs font-mono font-semibold">
                  @
                </span>
                <span className="text-xs font-semibold text-foreground font-mono">
                  {challengeData.handle}
                </span>
              </div>
              <span className="text-[11px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Pending bio check
              </span>
            </div>

            {/* Verification Code Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-muted-foreground block">
                1. Copy this verification code
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-2.5 rounded-lg bg-background border border-border font-mono text-xs text-foreground font-semibold select-all break-all tracking-wide">
                  {challengeData.verificationCode}
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3 py-2.5 rounded-lg bg-secondary hover:bg-muted border border-border text-foreground text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0"
                >
                  {copiedCode ? (
                    <>
                      <Check className="size-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5 text-muted-foreground" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Instruction Steps */}
            <div className="space-y-2 p-3 rounded-lg bg-secondary/40 border border-border text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="font-mono text-foreground font-semibold">2.</span>
                <div className="space-y-1">
                  <span>Paste this string into your LeetCode profile <strong>About Me</strong> section.</span>
                  <div>
                    <a
                      href={challengeData.profileSettingsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-[11px]"
                    >
                      <span>Open LeetCode Profile Settings</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1 border-t border-border/50">
                <span className="font-mono text-foreground font-semibold">3.</span>
                <span>Click <strong>Save</strong> on LeetCode, then click <strong>Verify &amp; Log In</strong> below.</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-border/70">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  setBioNotice(null);
                  setStep('input');
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleVerifyOwnership}
                disabled={verifying}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-40"
              >
                {verifying ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    <span>Verifying bio...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="size-3.5" />
                    <span>Verify Ownership &amp; Log In</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* VIEW 4: Step 3 - Success */}
        {step === 'success' && (
          <div className="py-6 text-center space-y-3">
            <div className="size-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center">
              <CheckCircle2 className="size-6" />
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">Ownership verified!</h4>
              <p className="text-xs text-muted-foreground">
                Successfully authenticated as{' '}
                <strong className="text-foreground font-mono">
                  @{successUser?.leetcodeUsername || challengeData?.handle}
                </strong>
                . Your account is logged in and solve stats are synchronized.
              </p>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={handleModalClose}
                className="w-full py-2 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
