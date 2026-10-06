'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { ImageUploader } from '../components/ImageUploader';
import { ScoreCard } from '../components/ScoreCard';
import { VisualComparison } from '../components/VisualComparison';
import { RiskList } from '../components/RiskList';
import { RecommendationList } from '../components/RecommendationList';
import { DetectionTags } from '../components/DetectionTags';
import { checkBackendHealth, analyzeImage } from '../lib/api';
import { AnalysisResponse } from '../lib/types';
import { AlertCircle, RefreshCw, Layers, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export default function Home() {
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.30);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check health on mount
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

  const handleImageSelected = (file: File) => {
    setSelectedFile(file);
    setError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    // Reset previous analysis
    setAnalysisResult(null);
  };

  const handleReset = () => {
    setSelectedFile(null);
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
    setError(null);

    try {
      const result = await analyzeImage(selectedFile, confidenceThreshold);
      setAnalysisResult(result);
    } catch (err: any) {
      setError(
        err.message || 'Failed to analyze environment. Please verify the backend service is running.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0d14] text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      <Header backendConnected={backendConnected} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-3 pt-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 text-xs font-semibold tracking-wide shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Spatial Accessibility Assessment</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Understand Accessibility <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent">
              Before You Arrive.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Transform ordinary street photos and building entrance imagery into machine-readable accessibility intelligence.
            Evaluated with real-time computer vision and a transparent rules engine.
          </p>
        </div>

        {/* Upload & Controls */}
        <section className="max-w-3xl mx-auto">
          <ImageUploader
            onImageSelected={handleImageSelected}
            confidenceThreshold={confidenceThreshold}
            onConfidenceChange={setConfidenceThreshold}
            isAnalyzing={isAnalyzing}
            selectedFile={selectedFile}
            onAnalyze={handleAnalyze}
            onReset={handleReset}
          />
        </section>

        {/* Error Alert */}
        {error && (
          <div className="max-w-3xl mx-auto p-4 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center justify-between shadow-lg">
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
            {/* Top Summary Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Executive Spatial Insight
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    {analysisResult.summary}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right text-[11px] text-slate-400 font-mono bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
                Analysis ID: {analysisResult.analysis_id.slice(0, 8)}...
              </div>
            </div>

            {/* Main Grid: Left Visuals, Right Intelligence */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Visual Perception (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <VisualComparison
                  originalImageUrl={previewUrl}
                  annotatedImageUrl={analysisResult.annotated_image}
                  detections={analysisResult.detections}
                />
                <DetectionTags detections={analysisResult.detections} />
              </div>

              {/* Right Column: Score & Wayfinding Logic (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <ScoreCard
                  score={analysisResult.accessibility_score}
                  classification={analysisResult.classification}
                  breakdown={analysisResult.score_breakdown}
                  processingTimeMs={analysisResult.processing_time_ms}
                />
                <RiskList risks={analysisResult.risks} />
                <RecommendationList recommendations={analysisResult.recommendations} />
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 WAYFIND AI — Visual Intelligence for Accessible Places</p>
          <p className="text-[11px] font-mono text-slate-400">
            Pipeline: YOLOv8 Computer Vision → Deterministic Rules Engine → OpenCV Annotations
          </p>
        </div>
      </footer>
    </div>
  );
}
