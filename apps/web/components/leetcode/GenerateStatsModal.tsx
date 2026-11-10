'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
} from 'lucide-react';
import LeetCodeProfileCard, { LeetCodeCardData } from './LeetCodeProfileCard';

function LeetCodeBrandIcon({ className = 'size-5' }: { className?: string }) {
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
    const clean = handle.trim();
    if (!clean) return;

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

      setSuccessMsg(`Successfully added ${previewData.username} to LeetCode Showcase!`);
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 14 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg p-6 sm:p-7 rounded-3xl bg-card border border-border shadow-2xl space-y-5 relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="size-8 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center justify-center">
                <LeetCodeBrandIcon className="size-4" />
              </span>
              <div>
                <h3 className="text-base font-bold text-foreground">Generate LeetCode Card</h3>
                <p className="text-xs text-muted-foreground">Preview your stats and add to the Hall of Fame.</p>
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
              className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
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
                placeholder="Enter LeetCode username (e.g. tourist)"
                autoFocus
                required
                className="flex-1 px-4 py-2.5 rounded-xl bg-background border border-border font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 shadow-inner"
              />
              <button
                type="submit"
                disabled={loading || !handle.trim()}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 shrink-0 cursor-pointer active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Fetching...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 font-mono">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Card Preview */}
          {previewData && (
            <div className="space-y-4 pt-2">
              <div className="text-xs font-mono font-semibold uppercase text-muted-foreground">
                Card Preview
              </div>
              <LeetCodeProfileCard data={previewData} />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleAddToShowcase}
                  disabled={adding}
                  className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md disabled:opacity-50"
                >
                  {adding ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Adding to Showcase...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="size-3.5" />
                      <span>Pin to LeetCode Showcase</span>
                      <ArrowRight className="size-3.5" />
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
