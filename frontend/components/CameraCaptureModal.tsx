'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Camera,
  X,
  RefreshCw,
  AlertCircle,
  Play,
  Square,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { analyzeImage } from '../lib/api';
import { AnalysisResponse, AccessibilityProfile, Detection } from '../lib/types';
import { soundEngine } from '../lib/soundEffects';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (file: File) => void;
  profile?: AccessibilityProfile;
  confidenceThreshold?: number;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onPhotoCaptured,
  profile = 'general_mobility',
  confidenceThreshold = 0.30,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const liveLoopRef = useRef<NodeJS.Timeout | null>(null);
  const isAnalyzingFrameRef = useRef<boolean>(false);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // Live Detection Stream State
  const [isLiveDetecting, setIsLiveDetecting] = useState<boolean>(false);
  const [liveDetections, setLiveDetections] = useState<Detection[]>([]);
  const [liveScore, setLiveScore] = useState<number | null>(null);
  const [liveClassification, setLiveClassification] = useState<string | null>(null);
  const [liveSummary, setLiveSummary] = useState<string | null>(null);
  const [liveFps, setLiveFps] = useState<number>(0);
  const [frameCount, setFrameCount] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) {
      stopLiveDetection();
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopLiveDetection();
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setCameraError(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : err.message || 'Unable to connect to camera device.'
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture single still frame
  const handleCaptureStill = () => {
    if (!videoRef.current) return;

    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const file = new File([blob], `wayfind-live-${timestamp}.jpg`, {
              type: 'image/jpeg',
            });
            stopLiveDetection();
            stopCamera();
            onPhotoCaptured(file);
            onClose();
          }
          setIsCapturing(false);
        },
        'image/jpeg',
        0.92
      );
    } else {
      setIsCapturing(false);
    }
  };

  // Continuous Live AI Detection Loop
  const analyzeCurrentFrame = useCallback(async () => {
    if (!videoRef.current || isAnalyzingFrameRef.current) return;
    const video = videoRef.current;
    if (video.readyState < 2) return; // HAVE_CURRENT_DATA

    isAnalyzingFrameRef.current = true;
    const frameStartTime = performance.now();

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(video, 0, 0, 640, 480);
        const blob = await new Promise<Blob | null>((res) =>
          canvas.toBlob(res, 'image/jpeg', 0.82)
        );

        if (blob) {
          const frameFile = new File([blob], 'live-frame.jpg', { type: 'image/jpeg' });
          const result: AnalysisResponse = await analyzeImage(
            frameFile,
            confidenceThreshold,
            profile,
            false
          );

          setLiveDetections(result.detections || []);
          setLiveScore(result.accessibility_score);
          setLiveClassification(result.classification);
          setLiveSummary(result.summary);
          setFrameCount((prev) => prev + 1);

          const frameElapsed = performance.now() - frameStartTime;
          setLiveFps(Math.round(1000 / Math.max(frameElapsed, 1)));

          // Subtle audio cue for low scores in live stream
          if (result.accessibility_score < 40) {
            try {
              soundEngine.playCautionChime();
            } catch (_) {}
          }
        }
      }
    } catch (err) {
      console.debug('Live frame detection skipped:', err);
    } finally {
      isAnalyzingFrameRef.current = false;
    }
  }, [confidenceThreshold, profile]);

  const startLiveDetection = () => {
    setIsLiveDetecting(true);
    // Poll every 950ms for smooth continuous live detection without overloading CPU
    liveLoopRef.current = setInterval(() => {
      analyzeCurrentFrame();
    }, 950);
  };

  const stopLiveDetection = () => {
    setIsLiveDetecting(false);
    if (liveLoopRef.current) {
      clearInterval(liveLoopRef.current);
      liveLoopRef.current = null;
    }
    setLiveDetections([]);
    setLiveScore(null);
    setLiveClassification(null);
    setLiveSummary(null);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-xl border ${
              isLiveDetecting
                ? 'bg-rose-950/80 border-rose-800/80 text-rose-400 animate-pulse'
                : 'bg-cyan-950/80 border-cyan-800/60 text-cyan-400'
            }`}>
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Live Spatial Perception Feed
                </h3>
                {isLiveDetecting && (
                  <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                    <span>LIVE DETECTING</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Continuous real-time barrier & corridor analysis stream
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopLiveDetection();
              onClose();
            }}
            aria-label="Close camera modal"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Viewfinder Area */}
        <div className="p-4 sm:p-5 flex flex-col items-center justify-center bg-slate-950 relative min-h-[360px]">
          {cameraError ? (
            <div className="p-6 text-center space-y-3 max-w-sm">
              <div className="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-xs text-rose-300 font-medium leading-relaxed">
                {cameraError}
              </p>
              <button
                onClick={startCamera}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white font-medium transition"
              >
                Retry Camera
              </button>
            </div>
          ) : (
            <div className="relative w-full h-[320px] sm:h-[360px] rounded-2xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Reticle Overlay */}
              <div className="absolute inset-4 pointer-events-none border border-cyan-500/30 rounded-xl flex items-center justify-center">
                <div className="w-24 h-24 border-t-2 border-b-2 border-cyan-400/50 rounded-full animate-pulse" />
              </div>

              {/* Live Overlay: Bounding Boxes from YOLOv8n */}
              {isLiveDetecting && liveDetections.map((det, i) => {
                const [x1, y1, x2, y2] = det.bbox;
                const leftPct = (x1 / 640) * 100;
                const topPct = (y1 / 480) * 100;
                const widthPct = ((x2 - x1) / 640) * 100;
                const heightPct = ((y2 - y1) / 480) * 100;
                const isBarrier = det.category === 'stair_hazard' || det.category === 'obstacle';

                return (
                  <div
                    key={i}
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                      width: `${widthPct}%`,
                      height: `${heightPct}%`,
                    }}
                    className={`absolute pointer-events-none border-2 transition-all duration-300 rounded-md ${
                      isBarrier
                        ? 'border-rose-400 bg-rose-500/10'
                        : 'border-cyan-400 bg-cyan-500/10'
                    }`}
                  >
                    <span
                      className={`absolute -top-5 left-0 px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase rounded ${
                        isBarrier ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      }`}
                    >
                      {det.class_name} ({Math.round(det.confidence * 100)}%)
                    </span>
                  </div>
                );
              })}

              {/* Top Stream Status Badge */}
              <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-800 text-[11px] font-mono flex items-center space-x-2 text-slate-300 shadow-md">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {isLiveDetecting
                    ? `Live YOLO: ${liveDetections.length} Detected • ${liveFps} FPS`
                    : 'Viewfinder Ready'}
                </span>
              </div>

              {/* Live Score HUD Pill */}
              {isLiveDetecting && liveScore !== null && (
                <div className="absolute top-3 right-3 bg-slate-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-800 shadow-xl flex items-center space-x-2.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Score:</span>
                  <span className={`text-base font-extrabold ${
                    liveScore >= 70 ? 'text-emerald-400' : liveScore >= 40 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {liveScore}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">/ 100</span>
                </div>
              )}

              {/* Bottom Live Insights Banner */}
              {isLiveDetecting && liveSummary && (
                <div className="absolute bottom-3 inset-x-3 bg-slate-950/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between shadow-xl">
                  <div className="truncate text-[11px] max-w-[85%]">
                    <strong className="text-cyan-300 mr-1.5">Live Assessment:</strong>
                    {liveSummary}
                  </div>
                  <span className="text-[9px] font-mono text-slate-500">
                    frame #{frameCount}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={toggleFacingMode}
              disabled={!stream || !!cameraError}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Flip Lens</span>
            </button>

            {/* Toggle Continuous Live Detection */}
            <button
              type="button"
              onClick={isLiveDetecting ? stopLiveDetection : startLiveDetection}
              disabled={!stream || !!cameraError}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition shadow-sm ${
                isLiveDetecting
                  ? 'bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-300'
                  : 'bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300'
              }`}
            >
              {isLiveDetecting ? (
                <>
                  <Square className="w-3.5 h-3.5 text-rose-400 fill-current" />
                  <span>Stop Live Detect</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                  <span>Start Live Detect</span>
                </>
              )}
            </button>
          </div>

          {/* Snap Still & Full Audit */}
          <button
            type="button"
            onClick={handleCaptureStill}
            disabled={!stream || !!cameraError || isCapturing}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center space-x-2 shadow-lg shadow-cyan-500/25 transition disabled:opacity-50 ring-1 ring-cyan-400/50"
          >
            <Camera className="w-4 h-4 text-slate-950" />
            <span>{isCapturing ? 'Capturing...' : 'Snap & Full Audit'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
