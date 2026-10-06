'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../components/Header';
import { ImageUploader } from '../components/ImageUploader';
import { ScoreCard } from '../components/ScoreCard';
import { VisualComparison } from '../components/VisualComparison';
import { EvidenceSection } from '../components/EvidenceSection';
import { RiskList } from '../components/RiskList';
import { RecommendationList } from '../components/RecommendationList';
import { DetectionTags } from '../components/DetectionTags';
import { TechnicalDetailsModal } from '../components/TechnicalDetailsModal';
import { checkBackendHealth, analyzeImage } from '../lib/api';
import { AnalysisResponse, DemoScene } from '../lib/types';
import { DEMO_SCENES } from '../lib/demoScenes';
import {
  AlertCircle,
  RefreshCw,
  Layers,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Eye,
  Sliders,
  PlayCircle,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';

export default function Home() {
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeDemo, setActiveDemo] = useState<DemoScene | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.30);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<number>(1);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploaderRef = useRef<HTMLDivElement>(null);

  // Periodic health probe
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

  const handleImageSelected = (file: File, isDemo = false, demoInfo?: DemoScene) => {
    setSelectedFile(file);
    setActiveDemo(isDemo && demoInfo ? demoInfo : null);
    setError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setAnalysisResult(null);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setActiveDemo(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setAnalysisResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setAnalysisStep(1);
    setError(null);

    // Realistic state transitions through analysis steps
    const timer1 = setTimeout(() => setAnalysisStep(2), 250);
    const timer2 = setTimeout(() => setAnalysisStep(3), 500);
    const timer3 = setTimeout(() => setAnalysisStep(4), 850);

    try {
      const result = await analyzeImage(selectedFile, confidenceThreshold);
      setAnalysisResult(result);
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
    handleImageSelected(file, true, firstDemo);
    uploaderRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
            Analyze the visible physical environment, identify structural barriers, and receive evidence-based wayfinding intelligence before you arrive.
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
            <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">IMAGE</span>
            <span>→</span>
            <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-cyan-400">VISION</span>
            <span>→</span>
            <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-emerald-400">EVIDENCE</span>
            <span>→</span>
            <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-amber-400">RULES ENGINE</span>
            <span>→</span>
            <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-blue-400">AI EXPLANATION</span>
          </div>
        </div>

        {/* Upload & Controls */}
        <section ref={uploaderRef} className="max-w-4xl mx-auto">
          <ImageUploader
            onImageSelected={handleImageSelected}
            confidenceThreshold={confidenceThreshold}
            onConfidenceChange={setConfidenceThreshold}
            isAnalyzing={isAnalyzing}
            analysisStep={analysisStep}
            selectedFile={selectedFile}
            activeDemo={activeDemo}
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
        {analysisResult && previewUrl && (
          <section className="space-y-6 animate-in fade-in duration-500">
            {/* Top Insight & Wayfinding Summary Banner */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                      Executive Spatial Assessment
                    </h2>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800">
                      Scope: Visible Area Only
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
                    {analysisResult.summary}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right text-[11px] text-slate-400 font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                ID: {analysisResult.analysis_id}
              </div>
            </div>

            {/* Main Grid: Left Visuals & Evidence, Right Intelligence & Score */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Visual Perception & Grounded Evidence (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <VisualComparison
                  originalImageUrl={previewUrl}
                  annotatedImageUrl={analysisResult.annotated_image}
                  detections={analysisResult.detections}
                />
                <DetectionTags detections={analysisResult.detections} />
                <EvidenceSection
                  evidence={analysisResult.evidence}
                  uncertainties={analysisResult.uncertainties}
                />
              </div>

              {/* Right Column: Score, Risks, Recommendations (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <ScoreCard
                  score={analysisResult.accessibility_score}
                  classification={analysisResult.classification}
                  confidence={analysisResult.assessment_confidence}
                  scope={analysisResult.assessment_scope}
                  breakdown={analysisResult.score_breakdown}
                  processingTimeMs={analysisResult.processing_time_ms}
                  inferenceTimeMs={analysisResult.inference_time_ms}
                />
                <RiskList risks={analysisResult.risks} />
                <RecommendationList recommendations={analysisResult.recommendations} />
              </div>
            </div>

            {/* Technical Details Inspection Panel for Hackathon Judges */}
            <div className="pt-2">
              <TechnicalDetailsModal analysis={analysisResult} />
            </div>
          </section>
        )}
      </main>

      {/* Accessible Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 py-8 mt-16 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 WAYFIND AI — Visual Intelligence for Accessible Places</p>
          <p className="text-[11px] font-mono text-slate-400">
            Pipeline: YOLOv8n Object Vision → Structured Evidence → Deterministic Rules → OpenCV Visuals
          </p>
        </div>
      </footer>
    </div>
  );
}
