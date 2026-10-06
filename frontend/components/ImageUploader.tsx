'use client';

import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  Sliders,
  AlertCircle,
  Sparkles,
  PlayCircle,
  CheckCircle2,
  Loader2,
  FileText,
} from 'lucide-react';
import { DEMO_SCENES } from '../lib/demoScenes';
import { DemoScene } from '../lib/types';

interface ImageUploaderProps {
  onImageSelected: (file: File, isDemo?: boolean, demoInfo?: DemoScene) => void;
  confidenceThreshold: number;
  onConfidenceChange: (val: number) => void;
  isAnalyzing: boolean;
  analysisStep: number; // 1 to 4
  selectedFile: File | null;
  activeDemo: DemoScene | null;
  onAnalyze: () => void;
  onReset: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelected,
  confidenceThreshold,
  onConfidenceChange,
  isAnalyzing,
  analysisStep,
  selectedFile,
  activeDemo,
  onAnalyze,
  onReset,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateAndHandleFile = (file: File) => {
    setValidationError(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!validTypes.includes(file.type)) {
      setValidationError('Please upload a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setValidationError('Image exceeds 10MB limit. Please select a smaller file.');
      return;
    }

    onImageSelected(file, false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndHandleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDemoSelect = async (scene: DemoScene) => {
    setValidationError(null);
    const file = await scene.generateBlob();
    onImageSelected(file, true, scene);
  };

  const steps = [
    'Analyzing image visual features',
    'Extracting observable evidence',
    'Evaluating accessibility rule constraints',
    'Generating actionable recommendations',
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header & Demo Scenes */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-400">
            Capture or Select Environment
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Upload raw street photography or evaluate curated global test scenarios
          </p>
        </div>

        {/* Demo Scenarios */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-500 mr-1 hidden md:inline">
            Explore Demo:
          </span>
          {DEMO_SCENES.map((scene) => (
            <button
              key={scene.id}
              onClick={() => handleDemoSelect(scene)}
              disabled={isAnalyzing}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                activeDemo?.id === scene.id
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-700 shadow-sm'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              {scene.id === 'scene-stairs' ? '1. Stairs' : scene.id === 'scene-mixed' ? '2. Mixed' : '3. Clear'}
            </button>
          ))}
        </div>
      </div>

      {/* Active Demo Banner */}
      {activeDemo && (
        <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/60 text-xs flex items-start space-x-3">
          <PlayCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white">{activeDemo.title}</span>
              <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-900/80 text-cyan-200 border border-cyan-700">
                Demo Scene
              </span>
            </div>
            <p className="text-slate-300 text-[11px] mt-0.5">{activeDemo.description}</p>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
        }}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-cyan-400 bg-cyan-950/20'
            : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              validateAndHandleFile(e.target.files[0]);
            }
          }}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 shadow-inner">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">
              {selectedFile ? selectedFile.name : 'Drop photo of street, entrance, or sidewalk'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports JPEG, PNG, WebP (up to 10MB)
            </p>
          </div>
        </div>
      </div>

      {validationError && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Multi-step Loading Animation (when analyzing) */}
      {isAnalyzing && (
        <div className="p-4 rounded-xl bg-slate-950 border border-cyan-900/50 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-cyan-400">
            <span className="flex items-center space-x-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing Physical Environment...</span>
            </span>
            <span className="font-mono">Step {analysisStep} of 4</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {steps.map((stepText, idx) => {
              const stepNum = idx + 1;
              const isPast = analysisStep > stepNum;
              const isCurrent = analysisStep === stepNum;
              return (
                <div
                  key={idx}
                  className={`p-2 rounded-lg border text-[10px] font-medium transition-all ${
                    isPast
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                      : isCurrent
                      ? 'bg-cyan-950/60 border-cyan-700 text-cyan-300 animate-pulse'
                      : 'bg-slate-900/40 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="font-bold flex items-center space-x-1">
                    {isPast ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : null}
                    <span>Step {stepNum}</span>
                  </div>
                  <p className="truncate mt-0.5">{stepText}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="w-full sm:w-auto flex items-center space-x-3 text-xs text-slate-400">
          <Sliders className="w-4 h-4 text-slate-500" />
          <span>Model Sensitivity:</span>
          <input
            type="range"
            min="0.10"
            max="0.80"
            step="0.05"
            value={confidenceThreshold}
            onChange={(e) => onConfidenceChange(parseFloat(e.target.value))}
            className="w-28 accent-cyan-400 cursor-pointer"
          />
          <span className="font-mono text-cyan-400 text-xs w-8 text-right">
            {Math.round(confidenceThreshold * 100)}%
          </span>
        </div>

        <div className="w-full sm:w-auto flex items-center space-x-3 justify-end">
          {selectedFile && (
            <button
              onClick={onReset}
              disabled={isAnalyzing}
              className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-xs text-slate-300 font-medium transition"
            >
              Reset
            </button>
          )}

          <button
            onClick={onAnalyze}
            disabled={!selectedFile || isAnalyzing}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg transition-all ${
              !selectedFile || isAnalyzing
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/25 ring-1 ring-cyan-400/50'
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Analyze Environment</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
