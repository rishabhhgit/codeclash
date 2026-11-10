'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords,
  Trophy,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  User,
  Shield,
  Loader2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { SpotlightCard } from '../../../components/ui/SpotlightCard';

function LeetCodeBrandIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z" />
    </svg>
  );
}

interface LeetCodePreviewData {
  exists: boolean;
  username: string;
  realName?: string;
  avatar?: string;
  ranking?: number;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  contestRating?: number;
  globalRanking?: number;
  topPercentage?: number;
  error?: string;
}

export default function RegisterPage() {
  const router = useRouter();

  const [authMethod, setAuthMethod] = useState<'leetcode' | 'custom'>('leetcode');
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState<LeetCodePreviewData | null>(null);

  // Debounced auto-preview when typing LeetCode handle
  useEffect(() => {
    if (authMethod !== 'leetcode') return;
    const clean = handle.trim();
    if (clean.length < 3) {
      setPreviewData(null);
      return;
    }

    const timer = setTimeout(async () => {
      setVerifying(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/auth/leetcode/preview/${encodeURIComponent(clean)}`);
        const json = await res.json();
        if (json.success && json.data) {
          setPreviewData(json.data);
        } else {
          setPreviewData(null);
        }
      } catch {
        setPreviewData(null);
      } finally {
        setVerifying(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [handle, authMethod]);

  const handleLeetCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) return;

    setLoading(true);
    setError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/auth/leetcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: handle.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to sign up with LeetCode handle');
      }

      if (data.data?.token) {
        localStorage.setItem('token', data.data.token);
      }
      if (data.data?.user?.username) {
        localStorage.setItem('battle_username', data.data.user.username);
        localStorage.setItem('codeclash_handle', data.data.user.handle || data.data.user.username);
      }
      localStorage.setItem('codeclash_leetcode_handle', handle.trim());

      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Failed to connect account');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) return;

    setLoading(true);
    setError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: handle.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Registration failed');
      }

      if (data.data?.token) {
        localStorage.setItem('token', data.data.token);
      }
      if (data.data?.user?.username) {
        localStorage.setItem('battle_username', data.data.user.username);
        localStorage.setItem('codeclash_handle', data.data.user.handle || data.data.user.username);
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: 'Guest' }),
      });
      const data = await res.json();
      if (data.success && data.data?.token) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('battle_username', 'Guest');
        router.push('/dashboard');
        return;
      }
    } catch {}

    localStorage.setItem('token', 'guest-token-' + Date.now());
    localStorage.setItem('battle_username', 'Guest');
    router.push('/dashboard');
  };

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] flex items-center justify-center py-10 sm:py-16 px-4 sm:px-6 relative overflow-hidden bg-background">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 size-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-lg space-y-6 relative z-10"
      >
        {/* Header Branding */}
        <div className="text-center space-y-2.5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-card border border-border shadow-sm group active:scale-[0.96] transition-transform"
          >
            <span className="size-7 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center justify-center">
              <LeetCodeBrandIcon className="size-4" />
            </span>
            <span className="text-xs font-mono font-bold tracking-tight text-foreground">
              CodeClash ID Sync
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground text-balance">
            Create Your Battle Profile
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto text-pretty">
            Connect your LeetCode handle to sync your solved statistics, contest rating, and rank.
          </p>
        </div>

        <SpotlightCard className="p-6 sm:p-8 space-y-6 rounded-3xl border-border/80 shadow-2xl bg-card/90 backdrop-blur-xl">
          {/* Auth Method Selector */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-secondary/60 rounded-2xl border border-border/60">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('leetcode');
                setError('');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                authMethod === 'leetcode'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LeetCodeBrandIcon className="size-3.5 text-amber-500" />
              <span>LeetCode Handle</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold">
                Sync
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMethod('custom');
                setError('');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                authMethod === 'custom'
                  ? 'bg-primary/15 text-primary border border-primary/30 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <User className="size-3.5" />
              <span>Custom Username</span>
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-start gap-2"
            >
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Form container */}
          {authMethod === 'leetcode' ? (
            <form onSubmit={handleLeetCodeSubmit} className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="lc-handle" className="text-xs font-bold font-mono uppercase text-muted-foreground">
                    LeetCode Username
                  </label>
                  <span className="text-[11px] font-mono text-amber-400/90 font-medium">
                    Verified live with LeetCode API
                  </span>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <LeetCodeBrandIcon className="size-4 text-amber-500" />
                  </div>
                  <input
                    id="lc-handle"
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    required
                    autoFocus
                    placeholder="e.g. neal_wu, tourist, or your handle"
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-border bg-background text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 transition-all shadow-inner"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {verifying ? (
                      <Loader2 className="size-4 animate-spin text-amber-400" />
                    ) : previewData?.exists ? (
                      <CheckCircle2 className="size-4 text-emerald-400" />
                    ) : null}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Enter your public username from{' '}
                  <span className="font-mono text-foreground">leetcode.com/username</span>. We automatically import your solve tally and rating.
                </p>
              </div>

              {/* Live Preview Card */}
              <AnimatePresence>
                {previewData && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, scale: 0.98 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {previewData.exists ? (
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="size-11 rounded-full bg-secondary overflow-hidden border border-amber-500/40 flex items-center justify-center font-bold text-amber-400">
                              {previewData.avatar ? (
                                <img
                                  src={previewData.avatar}
                                  alt={previewData.username}
                                  className="size-full object-cover"
                                />
                              ) : (
                                previewData.username.substring(0, 2).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                <span>{previewData.username}</span>
                                {previewData.realName && (
                                  <span className="text-xs text-muted-foreground font-normal">
                                    ({previewData.realName})
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="size-3" />
                                <span>Verified LeetCode Profile</span>
                              </div>
                            </div>
                          </div>

                          {previewData.contestRating ? (
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-mono block text-muted-foreground font-semibold">
                                Contest Elo
                              </span>
                              <span className="text-sm font-mono font-black text-amber-400">
                                {previewData.contestRating}
                              </span>
                            </div>
                          ) : null}
                        </div>

                        {/* Solved Pills */}
                        <div className="grid grid-cols-4 gap-2 pt-1 text-center font-mono">
                          <div className="p-2 rounded-xl bg-background/60 border border-border/60">
                            <div className="text-[10px] text-muted-foreground uppercase">Total</div>
                            <div className="text-xs font-bold text-foreground">{previewData.totalSolved}</div>
                          </div>
                          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <div className="text-[10px] text-emerald-400 uppercase">Easy</div>
                            <div className="text-xs font-bold text-emerald-400">{previewData.easySolved}</div>
                          </div>
                          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <div className="text-[10px] text-amber-400 uppercase">Med</div>
                            <div className="text-xs font-bold text-amber-400">{previewData.mediumSolved}</div>
                          </div>
                          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                            <div className="text-[10px] text-rose-400 uppercase">Hard</div>
                            <div className="text-xs font-bold text-rose-400">{previewData.hardSolved}</div>
                          </div>
                        </div>

                        {previewData.globalRanking && (
                          <div className="text-[11px] font-mono text-muted-foreground text-center">
                            Global Ranking: <span className="font-bold text-foreground">#{previewData.globalRanking.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border/80 text-xs text-muted-foreground space-y-1">
                        <div className="font-semibold text-foreground">Handle not indexed on LeetCode</div>
                        <div>
                          No public profile found for &quot;{handle}&quot;. You can still register with this name, and connect your LeetCode stats later!
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={loading || !handle.trim()}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Syncing LeetCode Profile...</span>
                  </>
                ) : (
                  <>
                    <LeetCodeBrandIcon className="size-4 text-stone-950" />
                    <span>Sign Up with LeetCode</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </motion.button>
            </form>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="custom-handle" className="text-xs font-bold font-mono uppercase text-muted-foreground">
                  Choose Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                    <User className="size-4" />
                  </div>
                  <input
                    id="custom-handle"
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    required
                    minLength={3}
                    maxLength={24}
                    pattern="^[a-zA-Z0-9_\-\.]+$"
                    autoFocus
                    placeholder="e.g. dev_ninja"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all shadow-inner"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  3-24 alphanumeric characters, underscores, or hyphens.
                </p>
              </div>

              <motion.button
                type="submit"
                disabled={loading || !handle.trim()}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="btn-radiant-primary w-full py-3.5 rounded-2xl text-primary-foreground font-bold text-sm tracking-wide shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <Swords className="size-4" />
                    <span>Create CodeClash Account</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </motion.button>
            </form>
          )}

          {/* Divider */}
          <div className="relative flex items-center justify-center pt-2">
            <div className="w-full border-t border-border/80" />
            <span className="absolute px-3 bg-card text-[11px] text-muted-foreground font-mono">
              Sparring Options
            </span>
          </div>

          {/* Guest fallback button */}
          <button
            type="button"
            onClick={handleGuestLogin}
            className="w-full py-3 rounded-2xl bg-secondary/80 hover:bg-secondary border border-border/80 text-xs font-semibold text-foreground transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Shield className="size-3.5 text-muted-foreground" />
            <span>Continue as Guest (No Stats Saved)</span>
          </button>

          {/* Sign In link */}
          <p className="text-center text-xs text-muted-foreground pt-1">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="text-foreground font-semibold hover:underline transition-colors"
            >
              Sign In to CodeClash
            </Link>
          </p>
        </SpotlightCard>

        {/* Value Prop Badges */}
        <div className="grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground pt-2 font-mono">
          <div className="p-3 rounded-2xl bg-card/60 border border-border/60">
            <span className="block text-foreground font-bold font-sans">3,600+</span>
            <span>Problems</span>
          </div>
          <div className="p-3 rounded-2xl bg-card/60 border border-border/60">
            <span className="block text-foreground font-bold font-sans">1v1 Realtime</span>
            <span>Synchronized</span>
          </div>
          <div className="p-3 rounded-2xl bg-card/60 border border-border/60">
            <span className="block text-foreground font-bold font-sans">Proctoring</span>
            <span>AI Verified</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
