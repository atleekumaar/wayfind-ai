'use client';

import React, { useState } from 'react';
import { Cpu, ChevronDown, ChevronUp, Terminal, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { AnalysisResponse } from '../lib/types';

interface TechnicalDetailsModalProps {
  analysis: AnalysisResponse;
}

export const TechnicalDetailsModal: React.FC<TechnicalDetailsModalProps> = ({ analysis }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-800/50 text-cyan-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Technical Audit & Judge Inspection Panel
            </h4>
            <p className="text-[11px] text-slate-400">
              Inspect model architecture, inference latency, and evidence extraction pipeline
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-[10px] font-mono uppercase bg-slate-950 px-2 py-1 rounded border border-slate-800 text-cyan-400 hidden sm:inline">
            YOLOv8n • {analysis.processing_time_ms}ms
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="px-6 pb-6 pt-2 border-t border-slate-800/80 space-y-4 animate-in fade-in duration-300">
          {/* Key Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">CV Model</span>
              <span className="font-mono text-cyan-400 font-semibold">Ultralytics YOLOv8n</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Inference Hardware</span>
              <span className="font-mono text-white font-semibold">CPU (Sub-200ms)</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Detections Evaluated</span>
              <span className="font-mono text-emerald-400 font-semibold">{analysis.detections.length} objects</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Pipeline Latency</span>
              <span className="font-mono text-white font-semibold">{analysis.processing_time_ms} ms</span>
            </div>
          </div>

          {/* Mathematical Formulation Explainer */}
          <div className="bg-slate-950/90 rounded-xl p-4 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-2">
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              <Terminal className="w-3.5 h-3.5" />
              <span>Deterministic Rule Formulation:</span>
            </div>
            <p className="text-slate-400 leading-relaxed font-sans">
              Score = clamp(100 - Σ(Barriers) + Σ(Confirmed_Accessible_Features), 0, 100).
              Negative penalties are strictly gated by positive detection bounding boxes (Stairs = -25, Obstacles = -10, Vehicles = -15).
              Absence of detection for unobserved features (e.g. ramp) receives 0 penalty.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
