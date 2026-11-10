'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import LeetCodeProfileCard, { LeetCodeCardData } from './LeetCodeProfileCard';

function LeetCodeBrandIcon({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z" />
    </svg>
  );
}

export default function GenerateStatsModal({
  isOpen,
  onClose,
  onAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdded?: (profile: LeetCodeCardData) => void;
}) {
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState<LeetCodeCardData | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    let clean = handle.trim();
    if (!clean) return;

    if (clean.includes('/u/')) {
      const match = clean.match(/\/u\/([^/?#]+)/);
      if (match) clean = match[1];
    }
    clean = clean.replace(/^@/, '');

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/leetcode/profile/${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'LeetCode handle not found');
      }

      setPreviewData(data.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to generate profile stats');
      setPreviewData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToShowcase = async () => {
    if (!previewData) return;

    setAdding(true);
    setError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/leetcode/showcase/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: previewData.username }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add profile to showcase');
      }

      setSuccessMsg(`Pinned @${previewData.username} to Hall of Fame`);
      if (onAdded) {
        onAdded(previewData);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to add to showcase');
    } finally {
      setAdding(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 8 }}
          transition={{ duration: 0.18 }}
          className="w-full max-w-lg p-5 sm:p-6 rounded-xl bg-card border border-border shadow-xl space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="size-8 rounded-lg bg-secondary border border-border text-foreground flex items-center justify-center">
                <LeetCodeBrandIcon className="size-4 text-amber-500" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Pin LeetCode profile</h3>
                <p className="text-xs text-muted-foreground">Preview stats and pin to the Hall of Fame</p>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                setPreviewData(null);
                setHandle('');
                setError('');
                setSuccessMsg('');
              }}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleGenerate} className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="LeetCode username (e.g. rishabhh-dev)"
                autoFocus
                required
                className="flex-1 px-3 py-2 rounded-lg bg-background border border-border font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !handle.trim()}
                className="px-3.5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-40 shrink-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Fetching...</span>
                  </>
                ) : (
                  <span>Inspect</span>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 font-mono">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Card Preview */}
          {previewData && (
            <div className="space-y-3 pt-2">
              <div className="text-xs font-mono text-muted-foreground">
                Profile preview
              </div>
              <LeetCodeProfileCard data={previewData} />

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAddToShowcase}
                  disabled={adding}
                  className="w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-40"
                >
                  {adding ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Pinning to Hall of Fame...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="size-3.5" />
                      <span>Pin to Hall of Fame</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
