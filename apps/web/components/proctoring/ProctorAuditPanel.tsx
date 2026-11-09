'use client';

import { ShieldCheck, ShieldAlert, Clock, CheckCircle2, Mic, Video, Maximize2, UserCheck, UserX } from 'lucide-react';
import { ProctorViolation } from '../../lib/questions/types';
import { CandidateTelemetry } from '../../lib/exam/useExamSession';

interface ProctorAuditPanelProps {
  trustScore: number;
  violations: ProctorViolation[];
  telemetry?: CandidateTelemetry;
  onClearViolations?: () => void;
  onSendAnnouncement?: (text: string) => void;
}

export default function ProctorAuditPanel({
  trustScore,
  violations,
  telemetry,
  onClearViolations,
  onSendAnnouncement,
}: ProctorAuditPanelProps) {
  const getViolationBadge = (type: ProctorViolation['type']) => {
    switch (type) {
      case 'TAB_SWITCH':
        return <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-mono">Tab Switch</span>;
      case 'FULLSCREEN_EXIT':
        return <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[10px] font-mono">Fullscreen Exit</span>;
      case 'CLIPBOARD_PASTE':
        return <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-mono">Paste Flag</span>;
      case 'DEVTOOLS_ATTEMPT':
        return <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500 border border-purple-500/20 text-[10px] font-mono">DevTools</span>;
      case 'FACE_ABSENT':
        return <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-mono">Face Absent</span>;
      case 'HIGH_AUDIO_NOISE':
        return <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500 border border-orange-500/20 text-[10px] font-mono">Audio Spike</span>;
      case 'CELLPHONE_DETECTED':
        return <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-mono font-medium">Cell Phone</span>;
      case 'MULTIPLE_FACES':
        return <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-mono font-medium">Multiple Persons</span>;
      case 'UNAUTHORIZED_MATERIAL':
        return <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-mono">Notes / Paper</span>;
      case 'HEADPHONES_DETECTED':
        return <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-mono">Headphones</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-mono">Warning</span>;
    }
  };

  return (
    <div className="space-y-4 p-4 text-xs">
      {/* Integrity Summary Card */}
      <div className="p-3.5 rounded-xl border border-border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              trustScore >= 80
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                : trustScore >= 50
                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
            }`}
          >
            {trustScore >= 80 ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <ShieldAlert className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground text-xs">Session Integrity</h3>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-medium ${
                  trustScore >= 80
                    ? 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20'
                    : trustScore >= 50
                    ? 'text-amber-500 bg-amber-500/10 border border-amber-500/20'
                    : 'text-rose-500 bg-rose-500/10 border border-rose-500/20'
                }`}
              >
                {trustScore >= 80 ? 'HIGH' : trustScore >= 50 ? 'MEDIUM' : 'FLAGGED'}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Synced with proctoring engine over WebSocket channel.
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">
            {trustScore}<span className="text-muted-foreground text-xs font-normal">/100</span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            {violations.length} incidents logged
          </div>
        </div>
      </div>

      {/* Live Candidate Telemetry Card (Examiner Feed) */}
      {telemetry && (
        <div className="p-3 rounded-xl border border-border bg-muted/40 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-medium text-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Live Candidate Telemetry
            </span>
            <span className="text-muted-foreground font-mono text-[10px]">
              Last ping: Just now
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="p-2 rounded bg-card border border-border flex items-center justify-between">
              <span className="text-muted-foreground">Camera:</span>
              <span className={telemetry.isCameraActive ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}>
                {telemetry.isCameraActive ? 'Active' : 'Off'}
              </span>
            </div>

            <div className="p-2 rounded bg-card border border-border flex items-center justify-between">
              <span className="text-muted-foreground">Face:</span>
              <span className={telemetry.faceDetected ? 'text-emerald-500 font-medium' : 'text-rose-500 font-medium'}>
                {telemetry.faceDetected ? 'Verified' : 'Absent'}
              </span>
            </div>

            <div className="p-2 rounded bg-card border border-border flex items-center justify-between">
              <span className="text-muted-foreground">Audio:</span>
              <span className="font-mono tabular-nums text-foreground">
                {telemetry.audioLevel}%
              </span>
            </div>

            <div className="p-2 rounded bg-card border border-border flex items-center justify-between">
              <span className="text-muted-foreground">Fullscreen:</span>
              <span className={telemetry.isFullscreen ? 'text-emerald-500 font-medium' : 'text-amber-500 font-medium'}>
                {telemetry.isFullscreen ? 'Locked' : 'Exited'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Rules Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
        <div className="p-2.5 rounded-lg border border-border bg-card flex items-start gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
          <div>
            <span className="font-medium text-foreground">Fullscreen Lock</span>
            <p className="text-muted-foreground text-[10px]">Exiting fullscreen alerts examiner.</p>
          </div>
        </div>

        <div className="p-2.5 rounded-lg border border-border bg-card flex items-start gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
          <div>
            <span className="font-medium text-foreground">Tab Switch Tracking</span>
            <p className="text-muted-foreground text-[10px]">Leaving assessment tab is logged.</p>
          </div>
        </div>

        <div className="p-2.5 rounded-lg border border-border bg-card flex items-start gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
          <div>
            <span className="font-medium text-foreground">Clipboard Protection</span>
            <p className="text-muted-foreground text-[10px]">External bulk code paste is flagged.</p>
          </div>
        </div>

        <div className="p-2.5 rounded-lg border border-border bg-card flex items-start gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
          <div>
            <span className="font-medium text-foreground">Audio & Presence</span>
            <p className="text-muted-foreground text-[10px]">Voice disturbance & absence verified.</p>
          </div>
        </div>
      </div>

      {/* Audit Log Timeline */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-foreground text-xs flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            Audit Incident Timeline
          </h4>
          {violations.length > 0 && onClearViolations && (
            <button
              onClick={onClearViolations}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Reset Log
            </button>
          )}
        </div>

        {violations.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-border rounded-lg text-muted-foreground text-[11px]">
            <ShieldCheck className="w-6 h-6 mx-auto mb-1.5 text-emerald-500/50" />
            No integrity violations detected. Assessment session is clean.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {violations.map((v) => (
              <div
                key={v.id}
                className="p-2.5 rounded-lg border border-border bg-card flex items-start justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {getViolationBadge(v.type)}
                    <span className="text-muted-foreground text-[10px] font-mono tabular-nums">{v.timeString}</span>
                  </div>
                  <p className="text-foreground text-[11px] truncate">{v.details}</p>
                </div>
                <div className="text-rose-500 font-mono font-semibold shrink-0 text-xs tabular-nums">
                  -{v.penalty} pts
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
