'use client';

import { ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ProctorViolationModalProps {
  message: string | null;
  trustScore: number;
  onDismiss: () => void;
  onReEnterFullscreen?: () => void;
}

export default function ProctorViolationModal({
  message,
  trustScore,
  onDismiss,
  onReEnterFullscreen,
}: ProctorViolationModalProps) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-card border border-rose-500/30 rounded-xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Proctoring Warning
            </h3>
            <p className="text-xs text-rose-500 font-medium">Session event flagged</p>
          </div>
        </div>

        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs space-y-1.5">
          <p className="font-medium text-rose-400">{message}</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            This activity was logged with an exact timestamp and synced with the active assessment examiner.
          </p>
        </div>

        <div className="flex items-center justify-between text-xs bg-muted/60 p-2.5 rounded-lg border border-border">
          <span className="text-muted-foreground">Current Trust Score:</span>
          <span
            className={`font-mono tabular-nums font-bold px-2 py-0.5 rounded text-xs ${
              trustScore >= 75
                ? 'text-emerald-500 bg-emerald-500/10'
                : trustScore >= 50
                ? 'text-amber-500 bg-amber-500/10'
                : 'text-rose-500 bg-rose-500/10'
            }`}
          >
            {trustScore}%
          </span>
        </div>

        <div className="flex items-center gap-2 pt-1">
          {onReEnterFullscreen && (
            <button
              onClick={() => {
                onReEnterFullscreen();
                onDismiss();
              }}
              className="flex-1 py-2 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Re-enter Fullscreen
            </button>
          )}

          <button
            onClick={onDismiss}
            className="flex-1 py-2 px-3 rounded-lg bg-secondary hover:bg-muted text-foreground border border-border font-medium text-xs transition-colors"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}
