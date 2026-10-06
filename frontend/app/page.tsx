'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../components/Header';
import { ImageUploader } from '../components/ImageUploader';
import { ScoreCard } from '../components/ScoreCard';
import { VisualComparison } from '../components/VisualComparison';
import { EvidenceSection } from '../components/EvidenceSection';
import { RiskList } from '../components/RiskList';
import { RecommendationList } from '../components/RecommendationList';
import { TechnicalDetailsModal } from '../components/TechnicalDetailsModal';
import { VoiceSummaryButton } from '../components/VoiceSummaryButton';
import { checkBackendHealth, analyzeImage, analyzeMultiView } from '../lib/api';
import { AnalysisResponse, DemoScene, AccessibilityProfile } from '../lib/types';
import { DEMO_SCENES } from '../lib/demoScenes';
import {
  AlertCircle,
  RefreshCw,
  Layers,
  ShieldCheck,
  Sparkles,
  PlayCircle,
} from 'lucide-react';

export default function Home() {
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<AccessibilityProfile>('general_mobility');
  const [activeDemo, setActiveDemo] = useState<DemoScene | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState<number>(0);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.30);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<number>(1);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploaderRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Periodic health check
  useEffect(() => {
    let mounted = true;
    const verifyHealth = async () => {
      const isHealthy = await checkBackendHealth();
      if (mounted) setBackendConnected(isHealthy);
    };
    verifyHealth();
    const interval = setInterval(verifyHealth, 12000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleFilesSelected = (files: File[], isDemo = false, demoInfo?: DemoScene) => {
    setSelectedFiles(files);
    setActiveDemo(isDemo && demoInfo ? demoInfo : null);
    setError(null);
    setAnalysisResult(null);

    // Clean up previous URLs
    previewUrls.forEach((url) => URL.revokeObjectURL(url));

    const newUrls = files.map((f) => URL.createObjectURL(f));
    setPreviewUrls(newUrls);
    setActivePreviewIndex(0);
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setActiveDemo(null);
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    setActivePreviewIndex(0);
    setAnalysisResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) return;

    setIsAnalyzing(true);
    setAnalysisStep(1);
    setError(null);

    const timer1 = setTimeout(() => setAnalysisStep(2), 250);
    const timer2 = setTimeout(() => setAnalysisStep(3), 500);
    const timer3 = setTimeout(() => setAnalysisStep(4), 850);

    try {
      let result: AnalysisResponse;
      if (selectedFiles.length > 1) {
        const multiRes = await analyzeMultiView(selectedFiles, confidenceThreshold, selectedProfile);
        const primary = multiRes.individual_analyses[0] || ({} as any);
        result = {
          success: multiRes.success,
          analysis_id: multiRes.analysis_id,
          accessibility_score: multiRes.accessibility_score,
          classification: multiRes.classification,
          assessment_confidence: multiRes.assessment_confidence,
          vision_confidence: multiRes.vision_confidence,
          assessment_scope: 'multi_view_aggregated',
          profile: multiRes.profile,
          image_source_label: 'USER_IMAGE',
          viewpoints_analyzed: multiRes.viewpoints_count,
          detections: primary.detections || [],
          spatial_assessments: primary.spatial_assessments || [],
          evidence: multiRes.fused_evidence,
          risks: multiRes.fused_risks,
          recommendations: multiRes.fused_recommendations,
          uncertainties: multiRes.fused_uncertainties,
          summary: multiRes.summary,
          speech_summary: multiRes.speech_summary,
          processing_time_ms: multiRes.total_processing_time_ms,
          inference_time_ms: primary.inference_time_ms,
          score_breakdown: primary.score_breakdown,
          annotated_image: primary.annotated_image,
        };
      } else {
        result = await analyzeImage(selectedFiles[0], confidenceThreshold, selectedProfile);
      }
      setAnalysisResult(result);

      // Smooth scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      setError(
        err.message || 'Failed to analyze environment. Please verify the backend service is running.'
      );
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setIsAnalyzing(false);
    }
  };

  const handleExploreDemoClick = async () => {
    const firstDemo = DEMO_SCENES[0];
    const file = await firstDemo.generateBlob();
    handleFilesSelected([file], true, firstDemo);
    uploaderRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const activePreviewUrl = previewUrls[activePreviewIndex] || null;

  // Average vision confidence calculation across detections
  const visionConfidenceAvg =
    analysisResult && analysisResult.detections.length > 0
      ? analysisResult.detections.reduce((acc, d) => acc + d.confidence, 0) /
        analysisResult.detections.length
      : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0d14] text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      <Header backendConnected={backendConnected} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-10">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4 pt-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800/60 text-cyan-400 text-xs font-semibold tracking-wide shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Spatial Accessibility Intelligence</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Visual Intelligence for <br />
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent">
              Accessible Places.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Analyze physical pedestrian environments, detect walkway corridor barriers, and evaluate mobility clearance across wheelchair, walker, and stroller profiles.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => uploaderRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition-all"
            >
              Analyze an Environment
            </button>
            <button
              onClick={handleExploreDemoClick}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider border border-slate-800 transition-all flex items-center space-x-1.5"
            >
              <PlayCircle className="w-4 h-4 text-cyan-400" />
              <span>Explore Demo Scenes</span>
            </button>
          </div>

          {/* Visual Architecture Flow Pill */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400 font-mono">
            <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">IMAGE(S)</span>
            <span>→</span>
            <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-cyan-400">YOLOv8n</span>
            <span>→</span>
            <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-emerald-400">SPATIAL CORRIDOR</span>
            <span>→</span>
            <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-amber-400">PROFILE RULES</span>
            <span>→</span>
            <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-blue-400">EVIDENCE AUDIT</span>
          </div>
        </div>

        {/* Upload & Controls */}
        <section ref={uploaderRef} className="max-w-4xl mx-auto">
          <ImageUploader
            onFilesSelected={handleFilesSelected}
            confidenceThreshold={confidenceThreshold}
            onConfidenceChange={setConfidenceThreshold}
            isAnalyzing={isAnalyzing}
            analysisStep={analysisStep}
            selectedFiles={selectedFiles}
            activeDemo={activeDemo}
            selectedProfile={selectedProfile}
            onProfileChange={setSelectedProfile}
            onAnalyze={handleAnalyze}
            onReset={handleReset}
          />
        </section>

        {/* Error Alert */}
        {error && (
          <div className="max-w-4xl mx-auto p-4 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={handleAnalyze}
              className="px-3 py-1.5 rounded-lg bg-rose-900/80 hover:bg-rose-800 text-white font-medium flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Results Dashboard */}
        {analysisResult && activePreviewUrl && (
          <section ref={resultsRef} className="space-y-8 animate-in fade-in duration-500 pt-2">
            {/* Top Insight & Wayfinding Summary Banner with Audio Narration */}
            <div className="w-full p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="flex items-start space-x-4 min-w-0 flex-1">
                <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                      Executive Spatial Assessment
                    </h2>
                    <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800">
                      Scope: {analysisResult.assessment_scope.replace(/_/g, ' ')}
                    </span>
                    {selectedFiles.length > 1 && (
                      <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                        Multi-View ({selectedFiles.length} Angles)
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed break-words">
                    {analysisResult.summary}
                  </p>
                </div>
              </div>

              {/* Action area: Spoken Assessment Audio & ID badge */}
              <div className="shrink-0 flex items-center space-x-3 self-end md:self-center">
                <VoiceSummaryButton
                  speechText={analysisResult.speech_summary || analysisResult.summary}
                />
                <div className="text-right text-[11px] text-slate-400 font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 hidden sm:block">
                  ID: {analysisResult.analysis_id.slice(0, 8)}
                </div>
              </div>
            </div>

            {/* Multi-View Angle Selector Tabs (if multiple images were analyzed) */}
            {previewUrls.length > 1 && (
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center space-x-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Switch Camera Perspective:</span>
                </span>
                <div className="flex items-center space-x-2">
                  {previewUrls.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActivePreviewIndex(i)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition ${
                        activePreviewIndex === i
                          ? 'bg-cyan-950 border border-cyan-600 text-cyan-300 shadow-sm'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Angle {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Row 1: Visual Perception (left) + Accessibility Scorecard (right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Visual Scene Perception (7 cols) */}
              <div className="lg:col-span-7 h-full">
                <VisualComparison
                  originalImageUrl={activePreviewUrl}
                  annotatedImageUrl={analysisResult.annotated_image}
                  detections={analysisResult.detections}
                />
              </div>

              {/* Right Column: Scorecard with Breakdown (5 cols) */}
              <div className="lg:col-span-5 h-full">
                <ScoreCard
                  score={analysisResult.accessibility_score}
                  classification={analysisResult.classification}
                  confidence={analysisResult.assessment_confidence}
                  visionConfidence={visionConfidenceAvg}
                  profile={selectedProfile}
                  scope={analysisResult.assessment_scope}
                  breakdown={analysisResult.score_breakdown}
                  processingTimeMs={analysisResult.processing_time_ms}
                  inferenceTimeMs={analysisResult.inference_time_ms}
                />
              </div>
            </div>

            {/* Row 2: Barriers & Recommendations (Equal 2 columns across 12 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <RiskList risks={analysisResult.risks} />
              <RecommendationList recommendations={analysisResult.recommendations} />
            </div>

            {/* Row 3: Verified Knowledge vs Unknown Reality Panel (Full Width 12 cols) */}
            <div className="w-full">
              <EvidenceSection
                evidence={analysisResult.evidence}
                uncertainties={analysisResult.uncertainties}
              />
            </div>

            {/* Row 4: Technical Details Inspection Panel for Hackathon Judges (Full Width 12 cols) */}
            <div className="w-full">
              <TechnicalDetailsModal
                analysis={analysisResult}
                activeProfile={selectedProfile}
              />
            </div>
          </section>
        )}
      </main>

      {/* Accessible Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-8 mt-16 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 WAYFIND AI — Visual Intelligence for Accessible Places</p>
          <p className="text-[11px] font-mono text-slate-400">
            Pipeline: YOLOv8n Vision → Spatial Corridor Reasoning → Profile Matrices → Grounded Audit
          </p>
        </div>
      </footer>
    </div>
  );
}
