'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Sliders, AlertCircle, Sparkles } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (file: File) => void;
  confidenceThreshold: number;
  onConfidenceChange: (val: number) => void;
  isAnalyzing: boolean;
  selectedFile: File | null;
  onAnalyze: () => void;
  onReset: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelected,
  confidenceThreshold,
  onConfidenceChange,
  isAnalyzing,
  selectedFile,
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

    onImageSelected(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndHandleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndHandleFile(e.target.files[0]);
    }
  };

  // Demo presets generator for fast evaluation
  const handleLoadDemo = async (scenario: 'stairs' | 'clear' | 'obstacles') => {
    try {
      // Create a deterministic SVG-rendered canvas blob for demo evaluation
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (scenario === 'stairs') {
        // Render building entrance with steps
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 640, 480);
        // Steps
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = i % 2 === 0 ? '#475569' : '#334155';
          ctx.fillRect(100 + i * 20, 260 + i * 30, 440 - i * 40, 30);
        }
        // Doorway
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(260, 100, 120, 160);
      } else if (scenario === 'obstacles') {
        // Pathway with obstacles
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, 0, 640, 480);
        // Sidewalk path
        ctx.fillStyle = '#64748b';
        ctx.fillRect(150, 0, 340, 480);
        // Obstacles (boxes/benches)
        ctx.fillStyle = '#b45309';
        ctx.fillRect(200, 200, 80, 80);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(320, 260, 100, 60);
      } else {
        // Clear ramp/pathway
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = '#059669';
        ctx.fillRect(180, 50, 280, 430);
      }

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `demo_${scenario}.jpg`, { type: 'image/jpeg' });
          onImageSelected(file);
        }
      }, 'image/jpeg');
    } catch (e) {
      console.error('Failed to create demo blob', e);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs uppercase font-bold tracking-widest text-slate-400">
          Visual Capture Input
        </h3>
        
        {/* Quick Demo Previews */}
        <div className="flex items-center space-x-1.5 text-xs">
          <span className="text-slate-500 hidden sm:inline text-[11px]">Quick Tests:</span>
          <button
            onClick={() => handleLoadDemo('stairs')}
            disabled={isAnalyzing}
            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition"
          >
            Stairs
          </button>
          <button
            onClick={() => handleLoadDemo('obstacles')}
            disabled={isAnalyzing}
            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition"
          >
            Obstacles
          </button>
          <button
            onClick={() => handleLoadDemo('clear')}
            disabled={isAnalyzing}
            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition"
          >
            Clear Path
          </button>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-cyan-400 bg-cyan-950/20'
            : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400 shadow-inner">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-200">
              {selectedFile ? selectedFile.name : 'Drop street, entrance, or pathway photo here'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports JPEG, PNG, WebP (up to 10MB)
            </p>
          </div>
        </div>
      </div>

      {validationError && (
        <div className="mt-3 p-3 rounded-lg bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Inference controls & Action Button */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
        {/* Confidence threshold slider */}
        <div className="w-full sm:w-auto flex items-center space-x-3 text-xs text-slate-400">
          <Sliders className="w-4 h-4 text-slate-500" />
          <span>Detection Sensitivity:</span>
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

        {/* Buttons */}
        <div className="w-full sm:w-auto flex items-center space-x-3 justify-end">
          {selectedFile && (
            <button
              onClick={onReset}
              disabled={isAnalyzing}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-300 font-medium transition"
            >
              Clear
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
                <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                <span>Analyzing Environment...</span>
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
