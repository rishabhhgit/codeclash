'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords,
  User,
  Shield,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { SpotlightCard } from '../../../components/ui/SpotlightCard';

function LeetCodeBrandIcon({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [method, setMethod] = useState<'leetcode' | 'standard'>('leetcode');
  const [handle, setHandle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (method !== 'leetcode' || handle.trim().length < 3) {
      setPreviewAvatar(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/auth/leetcode/preview/${encodeURIComponent(handle.trim())}`);
        const data = await res.json();
        if (data.success && data.data?.avatar) {
          setPreviewAvatar(data.data.avatar);
        } else {
          setPreviewAvatar(null);
        }
      } catch {
        setPreviewAvatar(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [handle, method]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) return;

    setLoading(true);
    setError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const endpoint = method === 'leetcode' ? `${apiUrl}/api/auth/leetcode` : `${apiUrl}/api/auth/login`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: handle.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Sign in failed');
      }

      if (data.data?.token) {
        localStorage.setItem('token', data.data.token);
      }
      if (data.data?.user?.username) {
        localStorage.setItem('battle_username', data.data.user.username);
        localStorage.setItem('codeclash_handle', data.data.user.handle || data.data.user.username);
      }
      if (method === 'leetcode') {
        localStorage.setItem('codeclash_leetcode_handle', handle.trim());
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Sign in failed');
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
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-4 py-12 relative overflow-hidden bg-background">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md relative z-10"
      >
        <SpotlightCard className="p-6 sm:p-8 space-y-6 rounded-3xl border-border/80 shadow-2xl bg-card/90 backdrop-blur-xl">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-mono text-primary font-semibold mb-2">
              <Swords className="size-3" />
              <span>Battleground Sign In</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Sign In to CodeClash</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Enter your LeetCode handle or standard credentials to enter the arena.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-secondary/60 rounded-xl border border-border/60">
            <button
              type="button"
              onClick={() => {
                setMethod('leetcode');
                setError('');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                method === 'leetcode'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LeetCodeBrandIcon className="size-3.5 text-amber-500" />
              <span>LeetCode</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMethod('standard');
                setError('');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                method === 'standard'
                  ? 'bg-primary/15 text-primary border border-primary/30 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <User className="size-3.5" />
              <span>Standard</span>
            </button>
          </div>

          {error && (
            <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="handle" className="block text-xs font-bold font-mono uppercase text-muted-foreground">
                {method === 'leetcode' ? 'LeetCode Handle' : 'Username or Handle'}
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  {previewAvatar ? (
                    <img src={previewAvatar} alt="Avatar" className="size-4 rounded-full object-cover" />
                  ) : method === 'leetcode' ? (
                    <LeetCodeBrandIcon className="size-4 text-amber-500" />
                  ) : (
                    <User className="size-4" />
                  )}
                </div>
                <input
                  id="handle"
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  required
                  minLength={2}
                  maxLength={30}
                  className="w-full pl-9 pr-3 py-2.5 border border-border rounded-xl bg-background text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-colors font-mono shadow-inner"
                  placeholder={method === 'leetcode' ? 'neal_wu' : 'alex_dev'}
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading || !handle.trim()}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-3 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${
                method === 'leetcode'
                  ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20'
                  : 'btn-radiant-primary text-primary-foreground'
              } disabled:opacity-50 cursor-pointer`}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>Sign In with {method === 'leetcode' ? 'LeetCode' : 'CodeClash'}</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </motion.button>
          </form>

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-border/80" />
            <span className="absolute px-2.5 bg-card text-[11px] text-muted-foreground font-mono">or</span>
          </div>

          <button
            onClick={handleGuestLogin}
            type="button"
            className="w-full py-2.5 px-4 bg-secondary/80 hover:bg-secondary text-foreground text-xs font-semibold rounded-xl border border-border/80 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Shield className="size-3.5 text-muted-foreground" />
            <span>Continue as Guest</span>
          </button>

          <p className="text-center text-xs text-muted-foreground pt-1">
            New challenger?{' '}
            <Link
              href="/auth/register"
              className="text-foreground font-semibold hover:underline"
            >
              Sign up with your LeetCode handle →
            </Link>
          </p>
        </SpotlightCard>
      </motion.div>
    </div>
  );
}
