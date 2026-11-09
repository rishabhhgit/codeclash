'use client';

import { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  UserCheck,
  UserX,
  Smartphone,
  Users,
  FileText,
  Headphones,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { ProctorViolation } from '../../lib/questions/types';
import { DetectedObject, BoundingBox, IllicitObjectType } from '../../lib/proctoring/illicitObjectDetector';

interface ProctorWidgetProps {
  trustScore: number;
  violations: ProctorViolation[];
  isFullscreen: boolean;
  isCameraActive: boolean;
  isMicActive: boolean;
  faceDetected: boolean;
  faceBbox?: BoundingBox | null;
  candidateCentering?: string;
  detectedObjects?: DetectedObject[];
  aiModelStatus?: 'loading' | 'ready' | 'fallback';
  audioLevel: number;
  videoRef: React.RefObject<HTMLVideoElement>;
  onEnterFullscreen: () => void;
  onExitFullscreen: () => void;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onReconnectCamera?: () => void;
  onToggleFace?: () => void;
  onTriggerIllicit?: (type: IllicitObjectType) => void;
  onClearIllicit?: () => void;
  onSetSensitivity?: (level: 'normal' | 'high') => void;
}

export default function ProctorWidget({
  trustScore,
  violations,
  isFullscreen,
  isCameraActive,
  isMicActive,
  faceDetected,
  faceBbox,
  candidateCentering = 'centered',
  detectedObjects = [],
  aiModelStatus = 'ready',
  audioLevel,
  videoRef,
  onEnterFullscreen,
  onExitFullscreen,
  onStartCamera,
  onStopCamera,
  onReconnectCamera,
  onToggleFace,
  onTriggerIllicit,
  onClearIllicit,
  onSetSensitivity,
}: ProctorWidgetProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showTestControls, setShowTestControls] = useState(false);

  const getScoreColor = () => {
    if (trustScore >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (trustScore >= 50) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  const hasIllicitObjects = detectedObjects.length > 0;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-2xl overflow-hidden transition-all duration-150">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-muted/60 border-b border-border text-xs">
        <div className="flex items-center gap-2">
          {trustScore >= 70 && !hasIllicitObjects ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
          )}
          <span className="font-bold text-foreground text-xs">AI Proctor & Vision</span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className={`px-2 py-0.5 rounded border text-[11px] font-mono tabular-nums font-bold ${getScoreColor()}`}>
            {trustScore}% Trust
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
            title={collapsed ? 'Expand Monitor' : 'Minimize Monitor'}
          >
            {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      {!collapsed && (
        <div className="p-3 space-y-2.5">
          {/* Webcam Preview with Real-Time Computer Vision HUD */}
          <div className="relative aspect-video w-full rounded-xl bg-black border border-border overflow-hidden flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover transform -scale-x-100 ${
                isCameraActive ? 'block' : 'hidden'
              }`}
            />

            {/* Live SVG Bounding Boxes Overlay */}
            {isCameraActive && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                {/* Candidate Verified Face Bounding Box */}
                {faceDetected && faceBbox && (
                  <g>
                    <rect
                      x={`${faceBbox.x * 100}%`}
                      y={`${faceBbox.y * 100}%`}
                      width={`${faceBbox.width * 100}%`}
                      height={`${faceBbox.height * 100}%`}
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                      fill="none"
                      rx="4"
                    />
                    <rect
                      x={`${faceBbox.x * 100}%`}
                      y={`${Math.max(0, faceBbox.y * 100 - 6)}%`}
                      width="42%"
                      height="6%"
                      fill="#10b981"
                      rx="2"
                    />
                    <text
                      x={`${faceBbox.x * 100 + 1}%`}
                      y={`${Math.max(4, faceBbox.y * 100 - 1.5)}%`}
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      Face: Verified
                    </text>
                  </g>
                )}

                {/* Illicit Objects Bounding Boxes (Cellphones, Multiple Faces, Notes) */}
                {detectedObjects.map((obj) => (
                  <g key={obj.id} className="animate-pulse">
                    <rect
                      x={`${obj.bbox.x * 100}%`}
                      y={`${obj.bbox.y * 100}%`}
                      width={`${obj.bbox.width * 100}%`}
                      height={`${obj.bbox.height * 100}%`}
                      stroke="#f43f5e"
                      strokeWidth="2.5"
                      fill="rgba(244,63,94,0.18)"
                      rx="6"
                    />
                    <rect
                      x={`${obj.bbox.x * 100}%`}
                      y={`${Math.max(0, obj.bbox.y * 100 - 8)}%`}
                      width="60%"
                      height="8%"
                      fill="#f43f5e"
                      rx="3"
                    />
                    <text
                      x={`${obj.bbox.x * 100 + 2}%`}
                      y={`${Math.max(6, obj.bbox.y * 100 - 2)}%`}
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="700"
                      fontFamily="sans-serif"
                    >
                      {obj.label}
                    </text>
                  </g>
                ))}
              </svg>
            )}

            {/* Camera Standby View */}
            {!isCameraActive && (
              <div className="text-center p-4 space-y-2">
                <VideoOff className="w-7 h-7 mx-auto text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground font-medium">Camera Standby / Inactive</p>
                <button
                  onClick={onReconnectCamera || onStartCamera}
                  className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-bold transition-all shadow-md"
                >
                  Start Live Camera
                </button>
              </div>
            )}

            {/* Live Camera Badges */}
            {isCameraActive && (
              <>
                <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] z-20 border border-border/40">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      aiModelStatus === 'ready'
                        ? 'bg-emerald-500 animate-pulse'
                        : aiModelStatus === 'loading'
                        ? 'bg-amber-400 animate-ping'
                        : 'bg-blue-400'
                    }`}
                  />
                  <span className="text-emerald-400 font-mono font-bold">
                    {aiModelStatus === 'ready'
                      ? 'AI VISION (COCO-SSD)'
                      : aiModelStatus === 'loading'
                      ? 'LOADING AI...'
                      : 'AI HEURISTIC'}
                  </span>
                </div>

                {hasIllicitObjects && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-rose-600/90 text-white font-bold text-[9px] px-2 py-0.5 rounded-md shadow-md animate-bounce z-20">
                    <AlertTriangle className="w-3 h-3" />
                    <span>ILLICIT OBJECT</span>
                  </div>
                )}

                <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] text-muted-foreground z-20">
                  <span>Centering:</span>
                  <span className={candidateCentering === 'centered' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                    {candidateCentering}
                  </span>
                </div>

                <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] z-20">
                  {faceDetected ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <UserCheck className="w-3 h-3" /> Candidate OK
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-rose-400 font-bold animate-pulse">
                      <UserX className="w-3 h-3" /> Face Absent
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Quick Hardware Controls */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {/* Fullscreen status */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border">
              <span className="text-muted-foreground">Fullscreen:</span>
              <button
                onClick={isFullscreen ? onExitFullscreen : onEnterFullscreen}
                className={`flex items-center gap-1 font-semibold ${
                  isFullscreen ? 'text-emerald-500' : 'text-amber-500 hover:underline'
                }`}
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-3 h-3" /> Locked
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3 h-3" /> Enter
                  </>
                )}
              </button>
            </div>

            {/* Mic audio meter */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border">
              <span className="text-muted-foreground">Audio:</span>
              <div className="flex items-center gap-1.5">
                {isMicActive ? (
                  <Mic className="w-3 h-3 text-emerald-500" />
                ) : (
                  <MicOff className="w-3 h-3 text-muted-foreground" />
                )}
                <div className="w-10 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-100 ${
                      audioLevel > 70 ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, audioLevel)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Violations Alert Callout */}
          {violations.length > 0 && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] space-y-1">
              <div className="flex items-center justify-between font-bold text-rose-400">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{violations.length} Integrity Violation(s)</span>
                </span>
                <span className="font-mono text-[10px] text-rose-300">-{violations[0].penalty} pts</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight truncate">
                {violations[0].details}
              </p>
            </div>
          )}

          {/* Restart Camera Button if Needed */}
          {isCameraActive && (
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={onReconnectCamera || onStartCamera}
                className="text-[10px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 hover:underline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restart Camera Stream</span>
              </button>

              <button
                onClick={() => setShowTestControls(!showTestControls)}
                className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline"
              >
                <Sparkles className="w-3 h-3" />
                <span>{showTestControls ? 'Hide Test Suite' : 'AI Proctor Test Suite'}</span>
              </button>
            </div>
          )}

          {/* ================= INTERACTIVE ILLICIT OBJECT SIMULATION & TEST SUITE ================= */}
          {showTestControls && (
            <div className="p-2.5 rounded-xl bg-card border border-border text-[11px] space-y-2 animate-in fade-in">
              <div className="font-bold text-foreground flex items-center justify-between">
                <span>AI Vision & Illicit Simulator</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSetSensitivity?.('high')}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-muted hover:bg-muted text-muted-foreground hover:text-foreground font-semibold"
                    title="Increases detection sensitivity to catch subtle items"
                  >
                    High Sensitivity
                  </button>
                  {hasIllicitObjects && (
                    <button
                      onClick={onClearIllicit}
                      className="text-[10px] text-rose-400 hover:underline font-bold"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Wave items in front of webcam, or trigger test detection bounding boxes:
              </p>
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  onClick={() => onTriggerIllicit?.('cellphone')}
                  className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-medium text-[10px] flex items-center gap-1.5"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Cell Phone</span>
                </button>
                <button
                  onClick={() => onTriggerIllicit?.('multiple_faces')}
                  className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-medium text-[10px] flex items-center gap-1.5"
                >
                  <Users className="w-3 h-3" />
                  <span>Multi Person</span>
                </button>
                <button
                  onClick={() => onTriggerIllicit?.('unauthorized_material')}
                  className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-medium text-[10px] flex items-center gap-1.5"
                >
                  <FileText className="w-3 h-3" />
                  <span>Cheat Notes</span>
                </button>
                <button
                  onClick={() => onTriggerIllicit?.('headphones')}
                  className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-medium text-[10px] flex items-center gap-1.5"
                >
                  <Headphones className="w-3 h-3" />
                  <span>Headphones</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
