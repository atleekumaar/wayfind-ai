'use client';

import React, { useState } from 'react';
import { Eye, Layers, Maximize2, ShieldAlert } from 'lucide-react';
import { Detection } from '../lib/types';

interface VisualComparisonProps {
  originalImageUrl: string;
  annotatedImageUrl?: string | null;
  detections: Detection[];
}

export const VisualComparison: React.FC<VisualComparisonProps> = ({
  originalImageUrl,
  annotatedImageUrl,
  detections,
}) => {
  const [activeTab, setActiveTab] = useState<'annotated' | 'original' | 'split'>('annotated');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs uppercase font-bold tracking-widest text-slate-400">
            Spatial Scene Perception
          </h3>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('annotated')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'annotated'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Vision AI
          </button>
          <button
            onClick={() => setActiveTab('original')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'original'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Original
          </button>
          <button
            onClick={() => setActiveTab('split')}
            className={`px-3 py-1 rounded-md transition-all hidden sm:block ${
              activeTab === 'split'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Side-by-Side
          </button>
        </div>
      </div>

      {/* Main Image View Area */}
      <div className="flex-1 min-h-[360px] flex items-center justify-center bg-slate-950/80 rounded-xl overflow-hidden border border-slate-800/80 p-2 relative group">
        {activeTab === 'split' ? (
          <div className="grid grid-cols-2 gap-3 w-full h-full min-h-[340px]">
            <div className="flex flex-col items-center justify-center relative bg-slate-900/50 rounded-lg overflow-hidden border border-slate-800">
              <span className="absolute top-2 left-2 z-10 bg-slate-950/80 backdrop-blur-sm text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                Original Input
              </span>
              <img
                src={originalImageUrl}
                alt="Original environment"
                className="max-h-[340px] w-full object-contain rounded-md"
              />
            </div>
            <div className="flex flex-col items-center justify-center relative bg-slate-900/50 rounded-lg overflow-hidden border border-slate-800">
              <span className="absolute top-2 left-2 z-10 bg-cyan-950/90 backdrop-blur-sm text-[10px] uppercase font-bold text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
                AI Vision Detection
              </span>
              <img
                src={annotatedImageUrl || originalImageUrl}
                alt="Annotated detection output"
                className="max-h-[340px] w-full object-contain rounded-md"
              />
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center min-h-[340px]">
            <img
              src={activeTab === 'annotated' ? annotatedImageUrl || originalImageUrl : originalImageUrl}
              alt="Scene preview"
              className="max-h-[420px] max-w-full object-contain rounded-lg shadow-md"
            />
            <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-800 text-[11px] font-medium text-slate-300">
              {activeTab === 'annotated' ? 'YOLOv8 Detection Overlay' : 'Raw RGB Capture'}
            </div>
          </div>
        )}
      </div>

      {/* Detections Summary Count */}
      <div className="mt-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 pt-3">
        <span className="flex items-center space-x-1.5">
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span>Total Entities Identified: <strong className="text-white">{detections.length}</strong></span>
        </span>
        <span className="text-[11px] text-slate-500">
          OpenCV High-Contrast Bounding Box Generation
        </span>
      </div>
    </div>
  );
};
