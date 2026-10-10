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
  Pause,
  Mic,
  Volume2,
  Navigation,
  Compass,
  Eye,
  Sliders,
} from 'lucide-react';
import { analyzeImage } from '../lib/api';
import { AnalysisResponse, AccessibilityProfile, Detection } from '../lib/types';
import { soundEngine } from '../lib/soundEffects';
import { LightweightTemporalTracker, TrackedObject, TrackingEvent } from '../lib/temporalTracker';
import { SpatialIntelligenceHUD } from './SpatialIntelligenceHUD';
import { EvidenceReplayModal } from './EvidenceReplayModal';

interface WayfindLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured?: (file: File) => void;
  profile?: AccessibilityProfile;
  confidenceThreshold?: number;
}

export const WayfindLiveModal: React.FC<WayfindLiveModalProps> = ({
  isOpen,
  onClose,
  onPhotoCaptured,
  profile = 'general_mobility',
  confidenceThreshold = 0.30,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const liveLoopRef = useRef<NodeJS.Timeout | null>(null);
  const isAnalyzingFrameRef = useRef<boolean>(false);
  const trackerRef = useRef<LightweightTemporalTracker>(new LightweightTemporalTracker(3));
  const activeStreamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const cameraRequestIdRef = useRef<number>(0);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Live Perception State
  const [isLiveRunning, setIsLiveRunning] = useState<boolean>(true);
  const [trackedObjects, setTrackedObjects] = useState<TrackedObject[]>([]);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResponse | null>(null);
  const [measuredFps, setMeasuredFps] = useState<number>(0);
  const [measuredLatencyMs, setMeasuredLatencyMs] = useState<number>(0);
  const [frameCount, setFrameCount] = useState<number>(0);
  const [cameraState, setCameraState] = useState<'initializing' | 'active' | 'paused' | 'error'>('initializing');

  // HUD & Feature Toggles
  const [showCorridor, setShowCorridor] = useState<boolean>(true);
  const [showTrails, setShowTrails] = useState<boolean>(true);
  const [activeProfile, setActiveProfile] = useState<AccessibilityProfile>(profile);

  // Freeze Frame & Evidence Replay State
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [frozenFrameDataUrl, setFrozenFrameDataUrl] = useState<string | null>(null);
  const [frozenAnalysis, setFrozenAnalysis] = useState<AnalysisResponse | null>(null);
  const [frozenTracks, setFrozenTracks] = useState<TrackedObject[]>([]);
  const [isReplayModalOpen, setIsReplayModalOpen] = useState<boolean>(false);

  // Voice Query State
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState<boolean>(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  useEffect(() => {
    setActiveProfile(profile);
  }, [profile]);

  // Robust Camera Lifecycle Management with stable refs
  useEffect(() => {
    isMountedRef.current = true;

    if (!isOpen) {
      stopLiveLoop();
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      isMountedRef.current = false;
      stopLiveLoop();
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const stopCamera = () => {
    // 1. Invalidate any in-flight camera request
    cameraRequestIdRef.current++;

    // 2. Stop all tracks from the stable ref
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_) {}
      });
      activeStreamRef.current = null;
    }

    // 3. Detach stream from video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStream(null);
    setCameraState('paused');
  };

  const startCamera = async () => {
    setCameraError(null);
    setCameraState('initializing');
    stopCamera();

    const currentRequestId = ++cameraRequestIdRef.current;

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

      // If component unmounted or another camera request superseded this one, immediately discard
      if (!isMountedRef.current || !isOpen || currentRequestId !== cameraRequestIdRef.current) {
        mediaStream.getTracks().forEach((track) => track.stop());
        return;
      }

      activeStreamRef.current = mediaStream;
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        if (isMountedRef.current && currentRequestId === cameraRequestIdRef.current) {
          setCameraState('active');
          startLiveLoop();
        }
      }
    } catch (err: any) {
      if (!isMountedRef.current || currentRequestId !== cameraRequestIdRef.current) return;
      console.warn('Camera access error:', err);
      setCameraState('error');
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please enable camera permissions in your browser.'
          : err.message || 'Unable to connect to camera device.'
      );
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Sampled Frame Processing Loop (Bounded Throttle: 950ms)
  const processSampledFrame = useCallback(async () => {
    if (!videoRef.current || isAnalyzingFrameRef.current || isFrozen) return;
    const video = videoRef.current;
    if (video.readyState < 2) return;

    isAnalyzingFrameRef.current = true;
    const startMs = performance.now();

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(video, 0, 0, 640, 480);
        const blob = await new Promise<Blob | null>((res) =>
          canvas.toBlob(res, 'image/jpeg', 0.80)
        );

        if (blob) {
          const frameFile = new File([blob], 'wayfind-live-frame.jpg', { type: 'image/jpeg' });
          const result: AnalysisResponse = await analyzeImage(
            frameFile,
            confidenceThreshold,
            activeProfile,
            false
          );

          const elapsedMs = Math.round(performance.now() - startMs);
          setMeasuredLatencyMs(elapsedMs);
          setMeasuredFps(Math.round(1000 / Math.max(elapsedMs, 1)));
          setFrameCount((prev) => prev + 1);

          // Update Temporal Tracker
          const updatedTracks = trackerRef.current.update(result.detections || [], 640, 480);
          setTrackedObjects(updatedTracks);
          setTrackingEvents(trackerRef.current.getEvents());
          setCurrentAnalysis(result);

          // Assistive sound cue if severe barrier enters corridor
          const hasInsideBarrier = updatedTracks.some(
            (t) => (t.category === 'stair_hazard' || t.category === 'obstacle') && t.corridorRelation === 'INSIDE'
          );
          if (hasInsideBarrier && result.accessibility_score < 40) {
            try {
              soundEngine.playCautionChime();
            } catch (_) {}
          }
        }
      }
    } catch (err) {
      console.debug('Sampled frame skipped or backend busy:', err);
    } finally {
      isAnalyzingFrameRef.current = false;
    }
  }, [confidenceThreshold, activeProfile, isFrozen]);

  const startLiveLoop = () => {
    setIsLiveRunning(true);
    if (!liveLoopRef.current) {
      // 950ms sampled frame interval prevents client/server overload
      liveLoopRef.current = setInterval(() => {
        processSampledFrame();
      }, 950);
    }
  };

  const stopLiveLoop = () => {
    setIsLiveRunning(false);
    if (liveLoopRef.current) {
      clearInterval(liveLoopRef.current);
      liveLoopRef.current = null;
    }
  };

  // Feature 4: Freeze Frame & Evidence Replay
  const handleFreezeFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
      setFrozenFrameDataUrl(dataUrl);
      setFrozenAnalysis(currentAnalysis ? JSON.parse(JSON.stringify(currentAnalysis)) : null);
      setFrozenTracks([...trackedObjects]);
      setIsFrozen(true);
      stopLiveLoop();
      setIsReplayModalOpen(true);
    }
  };

  const handleResumeLive = () => {
    setIsFrozen(false);
    setIsReplayModalOpen(false);
    setFrozenFrameDataUrl(null);
    setFrozenAnalysis(null);
    setFrozenTracks([]);
    startLiveLoop();
  };

  // Feature 5: Native Browser Voice Query ("What do you see?")
  const handleVoiceQuery = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setVoiceNotice('Browser speech synthesis is not supported on this device.');
      setTimeout(() => setVoiceNotice(null), 3000);
      return;
    }

    window.speechSynthesis.cancel();

    let spokenText = '';
    const insideTracks = trackedObjects.filter((t) => t.corridorRelation === 'INSIDE');

    if (currentAnalysis?.assessment_status === 'INCONCLUSIVE' || trackedObjects.length === 0) {
      spokenText = 'Visual assessment is inconclusive. Zero obstacles or pathway features are currently localized in camera view. Absence of detections is not proof of accessibility.';
    } else if (insideTracks.length > 0) {
      const names = Array.from(new Set(insideTracks.map((t) => t.className))).join(', ');
      spokenText = `Caution. ${insideTracks.length} entity detected inside the estimated navigation corridor: ${names}. Accessibility score is ${currentAnalysis?.accessibility_score ?? 'unknown'}.`;
    } else {
      spokenText = `No supported barriers detected in the estimated walking corridor. ${trackedObjects.length} peripheral objects visible. Please verify surface grade and steps on-site.`;
    }

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsVoiceSpeaking(true);
    utterance.onend = () => setIsVoiceSpeaking(false);
    utterance.onerror = () => setIsVoiceSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setVoiceNotice(spokenText);
    setTimeout(() => setVoiceNotice(null), 5500);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="live-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[96vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md shadow-cyan-500/20">
              <Camera className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 id="live-heading" className="text-sm font-extrabold uppercase tracking-wider text-white">
                  WAYFIND <span className="text-cyan-400">LIVE</span>
                </h3>
                <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span>Real-Time Scene Intelligence</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Spatial corridor reasoning, temporal entity tracking, and evidence-linked telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Measured Latency Telemetry */}
            {measuredLatencyMs > 0 && (
              <div className="hidden sm:flex items-center space-x-1.5 text-[10px] font-mono px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400">
                <Zap className="w-3 h-3 text-cyan-400" />
                <span>{measuredLatencyMs}ms / {measuredFps} FPS</span>
              </div>
            )}

            <button
              onClick={() => {
                stopLiveLoop();
                stopCamera();
                onClose();
              }}
              aria-label="Close WAYFIND Live"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Viewport & Overlays */}
        <div className="relative w-full h-[360px] sm:h-[420px] bg-black overflow-hidden flex items-center justify-center">
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
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white font-semibold transition"
              >
                Retry Camera
              </button>
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Feature 2: Spatial Intelligence HUD */}
              <SpatialIntelligenceHUD
                tracks={trackedObjects}
                videoWidth={videoRef.current?.videoWidth || 640}
                videoHeight={videoRef.current?.videoHeight || 480}
                showCorridor={showCorridor}
                showTrails={showTrails}
              />

              {/* Top Left Live State Badge */}
              <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 pointer-events-none">
                <span className="bg-slate-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-cyan-300 flex items-center space-x-1.5 shadow-md">
                  <Activity className="w-3 h-3 text-cyan-400" />
                  <span>{trackedObjects.length} Tracked</span>
                </span>

                <span className="bg-slate-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-300 shadow-md">
                  Frame #{frameCount}
                </span>
              </div>

              {/* Top Right Score Badge */}
              {currentAnalysis && (
                <div className="absolute top-3 right-3 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 shadow-xl flex items-center space-x-2 pointer-events-none">
                  {currentAnalysis.assessment_status === 'INCONCLUSIVE' ? (
                    <span className="text-[10px] uppercase font-bold text-amber-300">
                      INCONCLUSIVE
                    </span>
                  ) : (
                    <>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Score:</span>
                      <span className={`text-base font-extrabold ${
                        currentAnalysis.accessibility_score >= 70
                          ? 'text-emerald-400'
                          : currentAnalysis.accessibility_score >= 40
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}>
                        {currentAnalysis.accessibility_score}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">/ 100</span>
                    </>
                  )}
                </div>
              )}

              {/* Bottom Notification or Speech Transcript */}
              {voiceNotice && (
                <div className="absolute top-14 inset-x-4 bg-cyan-950/90 border border-cyan-700/80 backdrop-blur-md p-2.5 rounded-xl text-xs text-cyan-200 flex items-center space-x-2 shadow-2xl animate-in slide-in-from-top-2">
                  <Volume2 className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
                  <span className="leading-snug">{voiceNotice}</span>
                </div>
              )}

              {/* Bottom Recent Tracking Event Ticker */}
              {trackingEvents.length > 0 && (
                <div className="absolute bottom-10 left-3 max-w-[70%] hidden sm:block pointer-events-none">
                  <div className="bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-300 truncate shadow-md">
                    <strong className="text-cyan-400 mr-1.5">Tracking Event:</strong>
                    {trackingEvents[trackingEvents.length - 1].description}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Interactive Controls Bar */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: HUD toggles */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCorridor(!showCorridor)}
              className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition ${
                showCorridor
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              Corridor AR: {showCorridor ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={() => setShowTrails(!showTrails)}
              className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition ${
                showTrails
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
            >
              Motion Trails: {showTrails ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={toggleFacingMode}
              disabled={!stream}
              aria-label="Flip camera lens"
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right: Actions (Freeze Frame, Voice Query, Snap Still) */}
          <div className="flex items-center space-x-2">
            {/* Feature 5: Voice Query */}
            <button
              onClick={handleVoiceQuery}
              disabled={!stream || isVoiceSpeaking}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-800/80 text-[11px] font-bold flex items-center space-x-1.5 transition"
            >
              <Mic className="w-3.5 h-3.5 text-cyan-400" />
              <span>Voice Query</span>
            </button>

            {/* Feature 4: Freeze Frame & Evidence Replay */}
            <button
              onClick={handleFreezeFrame}
              disabled={!stream}
              className="px-3.5 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-700 text-amber-300 text-[11px] font-bold flex items-center space-x-1.5 transition shadow-sm"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Freeze Frame Audit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feature 4: Evidence Replay Modal */}
      <EvidenceReplayModal
        isOpen={isReplayModalOpen}
        onClose={() => setIsReplayModalOpen(false)}
        frozenFrameUrl={frozenFrameDataUrl}
        analysis={frozenAnalysis}
        tracks={frozenTracks}
        profile={activeProfile}
        onContinueLive={handleResumeLive}
      />
    </div>
  );
};
