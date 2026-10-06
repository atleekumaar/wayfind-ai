'use client';

import React, { useState } from 'react';
import { Eye, Layers, Tag, CheckCircle2 } from 'lucide-react';
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

  const getTagColor = (category: string) => {
    switch (category) {
      case 'stair_hazard':
        return 'bg-rose-950/60 border-rose-800 text-rose-300';
      case 'obstacle':
        return 'bg-amber-950/60 border-amber-800 text-amber-300';
      case 'vehicle':
        return 'bg-orange-950/60 border-orange-800 text-orange-300';
      case 'accessible_feature':
        return 'bg-emerald-950/60 border-emerald-800 text-emerald-300';
      default:
        return 'bg-slate-800/80 border-slate-700 text-slate-300';
    }
  };

  return (
    <div className="w-full h-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
      {/* Top Bar with Title and Toggles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 shrink-0">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs uppercase font-extrabold tracking-widest text-white">
              Spatial Scene Perception
            </h3>
            <p className="text-[11px] text-slate-400">
              YOLOv8n object detection & corridor localization
            </p>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium self-end sm:self-center shrink-0">
          <button
            onClick={() => setActiveTab('annotated')}
            className={`px-3 py-1 rounded-lg transition-all ${
              activeTab === 'annotated'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Vision AI
          </button>
          <button
            onClick={() => setActiveTab('original')}
            className={`px-3 py-1 rounded-lg transition-all ${
              activeTab === 'original'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Original
          </button>
          <button
            onClick={() => setActiveTab('split')}
            className={`px-3 py-1 rounded-lg transition-all hidden sm:block ${
              activeTab === 'split'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Side-by-Side
          </button>
        </div>
      </div>

      {/* Main Image View Area - Controlled height so both cards match perfectly */}
      <div className="h-[280px] w-full flex items-center justify-center bg-slate-950/90 rounded-xl overflow-hidden border border-slate-800 p-2 relative">
        {activeTab === 'split' ? (
          <div className="grid grid-cols-2 gap-2.5 w-full h-full">
            <div className="flex flex-col items-center justify-center relative bg-slate-900/40 rounded-lg overflow-hidden border border-slate-800/80 p-1 h-full">
              <span className="absolute top-2 left-2 z-10 bg-slate-950/90 backdrop-blur-sm text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5 rounded border border-slate-800">
                Original Input
              </span>
              <img
                src={originalImageUrl}
                alt="Original environment"
                className="max-h-[250px] w-full object-contain rounded"
              />
            </div>
            <div className="flex flex-col items-center justify-center relative bg-slate-900/40 rounded-lg overflow-hidden border border-slate-800/80 p-1 h-full">
              <span className="absolute top-2 left-2 z-10 bg-cyan-950/95 backdrop-blur-sm text-[10px] uppercase font-bold text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
                Vision Overlay
              </span>
              <img
                src={annotatedImageUrl || originalImageUrl}
                alt="Annotated detection output"
                className="max-h-[250px] w-full object-contain rounded"
              />
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={activeTab === 'annotated' ? annotatedImageUrl || originalImageUrl : originalImageUrl}
              alt="Scene preview"
              className="max-h-[265px] max-w-full object-contain rounded-lg shadow-lg"
            />
            <div className="absolute top-2.5 left-2.5 bg-slate-950/90 backdrop-blur-md px-2 py-0.5 rounded-md border border-slate-800 text-[10px] font-medium text-slate-300">
              {activeTab === 'annotated' ? 'YOLOv8 Detection Overlay' : 'Raw RGB Capture'}
            </div>
          </div>
        )}
      </div>

      {/* Integrated Entities & Tags Footer */}
      <div className="space-y-2.5 pt-1 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center space-x-1.5 font-medium">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Identified Entities: <strong className="text-white font-mono">{detections.length}</strong></span>
          </span>
          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
            OpenCV High-Contrast Localization
          </span>
        </div>

        {detections.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 max-h-[72px] overflow-y-auto">
            {detections.map((det, index) => (
              <div
                key={index}
                className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg border text-xs font-medium ${getTagColor(
                  det.category
                )}`}
              >
                <span className="capitalize">{det.class_name.replace(/_/g, ' ')}</span>
                <span className="text-[10px] font-mono opacity-80">
                  {Math.round(det.confidence * 100)}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No specific objects localized in camera frame.</p>
        )}
      </div>
    </div>
  );
};
