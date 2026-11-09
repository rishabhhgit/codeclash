'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [handle, setHandle] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Sign in failed');
      }

      localStorage.setItem('token', data.data.token);
      if (data.data.user?.username) {
        localStorage.setItem('battle_username', data.data.user.username);
      }
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: 'Guest' }),
      });
      const data = await res.json();
      if (data.success && data.data?.token) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('battle_username', 'Guest');
        window.location.href = '/dashboard';
        return;
      }
    } catch {}
    localStorage.setItem('token', 'guest-token-' + Date.now());
    localStorage.setItem('battle_username', 'Guest');
    window.location.href = '/dashboard';
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-4">
      <div className="w-full max-w-sm p-6 space-y-5 rounded-xl border border-border bg-card shadow-sm">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Sign in</h1>
          <p className="text-xs text-muted-foreground mt-1">Connect your account or continue as guest.</p>
        </div>

        <button
          onClick={handleGuestLogin}
          type="button"
          className="w-full py-2 px-4 bg-foreground hover:opacity-90 text-background text-xs sm:text-sm font-medium rounded-lg transition-opacity"
        >
          Continue as Guest
        </button>

        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-border" />
          <span className="absolute px-2 bg-card text-[11px] text-muted-foreground font-mono">or</span>
        </div>

        {error && (
          <div className="p-2.5 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="handle" className="block text-xs font-medium text-foreground mb-1">
              Username or handle
            </label>
            <input
              id="handle"
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              required
              minLength={3}
              maxLength={24}
              pattern="^[a-zA-Z0-9_\-\.]+$"
              className="w-full px-3 py-1.5 border border-border rounded-md bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors font-mono"
              placeholder="alex_dev"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-muted hover:bg-muted/80 text-foreground border border-border text-xs sm:text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign in to CodeClash'}
          </button>
        </form>

        <p className="text-center text-[11px] text-muted-foreground pt-1">
          Don't have an account?{' '}
          <Link
            href="/auth/register"
            className="text-foreground hover:underline"
          >
            Register on CodeClash
          </Link>
        </p>
      </div>
    </div>
  );
}
