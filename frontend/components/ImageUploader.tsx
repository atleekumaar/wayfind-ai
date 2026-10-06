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
  Layers,
  X,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { DEMO_SCENES } from '../lib/demoScenes';
import { DemoScene, AccessibilityProfile } from '../lib/types';

interface ImageUploaderProps {
  onFilesSelected: (files: File[], isDemo?: boolean, demoInfo?: DemoScene) => void;
  confidenceThreshold: number;
  onConfidenceChange: (val: number) => void;
  isAnalyzing: boolean;
  analysisStep: number;
  selectedFiles: File[];
  activeDemo: DemoScene | null;
  selectedProfile: AccessibilityProfile;
  onProfileChange: (profile: AccessibilityProfile) => void;
  onAnalyze: () => void;
  onReset: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onFilesSelected,
  confidenceThreshold,
  onConfidenceChange,
  isAnalyzing,
  analysisStep,
  selectedFiles,
  activeDemo,
  selectedProfile,
  onProfileChange,
  onAnalyze,
  onReset,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const profiles: { id: AccessibilityProfile; label: string; desc: string }[] = [
    { id: 'general_mobility', label: 'General', desc: 'Standard pedestrian corridor analysis' },
    { id: 'wheelchair', label: 'Wheelchair', desc: 'High sensitivity to steps & narrow widths' },
    { id: 'walker', label: 'Walker / Cane', desc: 'Sensitivity to ground obstacles & trip hazards' },
    { id: 'stroller', label: 'Stroller', desc: 'Smooth rolling clearance requirements' },
    { id: 'low_vision', label: 'Low Vision', desc: 'High penalty on ground-level obstructions' },
  ];

  const validateAndHandleFiles = (newFiles: FileList | File[]) => {
    setValidationError(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const validFiles: File[] = [];

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      if (!validTypes.includes(file.type)) {
        setValidationError('Please upload valid images (JPEG, PNG, or WebP).');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setValidationError('Each image must be smaller than 10MB.');
        return;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Support up to 3 views
    const combined = [...selectedFiles, ...validFiles].slice(0, 3);
    onFilesSelected(combined, false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndHandleFiles(e.dataTransfer.files);
    }
  };

  const handleDemoSelect = async (scene: DemoScene) => {
    setValidationError(null);
    const file = await scene.generateBlob();
    onFilesSelected([file], true, scene);
  };

  const removeFile = (index: number) => {
    const updated = selectedFiles.filter((_, i) => i !== index);
    if (updated.length === 0) {
      onReset();
    } else {
      onFilesSelected(updated, false);
    }
  };

  const steps = [
    'Analyzing image visual features',
    'Extracting spatial corridor geometry',
    'Applying profile constraint matrices',
    'Synthesizing grounded recommendations',
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
            Upload 1 to 3 street camera angles or evaluate curated benchmark scenarios
          </p>
        </div>

        {/* Demo Scenarios */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-500 mr-1 hidden md:inline">
            Curated Demos:
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

      {/* Mobility Profile Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Select Accessibility Profile:</span>
          </label>
          <span className="text-[10px] text-slate-500 font-mono">
            Adjusts barrier penalties according to assistive equipment needs
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {profiles.map((p) => {
            const isActive = selectedProfile === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onProfileChange(p.id)}
                disabled={isAnalyzing}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  isActive
                    ? 'bg-cyan-950/70 border-cyan-600 text-cyan-200 shadow-sm ring-1 ring-cyan-500/30'
                    : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-xs font-bold leading-tight">{p.label}</div>
                <div className="text-[10px] text-slate-500 mt-1 line-clamp-1 leading-snug">{p.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Demo Scene Disclosure Banner */}
      {activeDemo && (
        <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/60 text-xs flex flex-col sm:flex-row items-start justify-between gap-3">
          <div className="flex items-start space-x-3">
            <PlayCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white">{activeDemo.title}</span>
                <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  Curated Demo Scene — Synthetic Benchmark
                </span>
              </div>
              <p className="text-slate-300 text-[11px] mt-0.5">{activeDemo.description}</p>
              {activeDemo.whyItMatters && (
                <p className="text-[11px] text-cyan-300/90 mt-1 italic">
                  <strong>Why this matters:</strong> {activeDemo.whyItMatters}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Real Photo Upload Disclosure */}
      {!activeDemo && selectedFiles.length > 0 && (
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] flex items-center justify-between text-slate-400">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <strong className="text-slate-200">User Real-World Photography</strong> ({selectedFiles.length} {selectedFiles.length === 1 ? 'view' : 'views'} selected)
          </span>
          <span className="font-mono text-[10px] text-cyan-400">
            {selectedFiles.length > 1 ? 'Multi-View Aggregation Mode' : 'Single Perspective Mode'}
          </span>
        </div>
      )}

      {/* Upload Drop Zone */}
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
        className={`border-2 border-dashed rounded-xl p-7 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-cyan-400 bg-cyan-950/20'
            : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              validateAndHandleFiles(e.target.files);
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
              {selectedFiles.length > 0
                ? `${selectedFiles.length} image(s) selected — click or drop to add more (up to 3)`
                : 'Drop street, entrance, or sidewalk photo(s)'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports 1 to 3 multi-view angles (JPEG, PNG, WebP up to 10MB each)
            </p>
          </div>
        </div>
      </div>

      {/* Uploaded File Chips */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {selectedFiles.map((f, idx) => (
            <div
              key={idx}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 shadow-sm"
            >
              <span className="font-mono text-[10px] text-cyan-400">View {idx + 1}:</span>
              <span className="truncate max-w-[150px]">{f.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(idx);
                }}
                disabled={isAnalyzing}
                className="text-slate-500 hover:text-rose-400 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {selectedFiles.length < 3 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="px-2.5 py-1 rounded-lg border border-dashed border-slate-700 text-slate-400 hover:text-white text-xs"
            >
              + Add Angle
            </button>
          )}
        </div>
      )}

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
          {selectedFiles.length > 0 && (
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
            disabled={selectedFiles.length === 0 || isAnalyzing}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg transition-all ${
              selectedFiles.length === 0 || isAnalyzing
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
                <span>
                  {selectedFiles.length > 1
                    ? `Analyze Multi-View (${selectedFiles.length} Angles)`
                    : 'Analyze Environment'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
