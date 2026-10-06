'use client';

import React from 'react';
import { CheckCircle2, HelpCircle, Info, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Evidence } from '../lib/types';

interface EvidenceSectionProps {
  evidence: Evidence[];
  uncertainties: string[];
}

export const EvidenceSection: React.FC<EvidenceSectionProps> = ({
  evidence,
  uncertainties,
}) => {
  const detectedItems = evidence.filter((e) => e.status === 'detected');
  const inferredItems = evidence.filter((e) => e.status === 'inferred');
  const unknownItems = evidence.filter((e) => e.status === 'unknown');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <h3 className="text-xs uppercase font-extrabold tracking-widest text-white">
              Verified Knowledge vs. Unknown Reality Panel
            </h3>
            <p className="text-[11px] text-slate-400">
              Responsible AI distinction between visual observations and unverified structural elements
            </p>
          </div>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-800/80 shrink-0">
          Responsible ML Model
        </span>
      </div>

      {/* Tri-column Knowledge Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. WHAT WAYFIND KNOWS (Confirmed Detected Evidence) */}
        <div className="bg-slate-950/70 border border-emerald-900/40 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center space-x-2 mb-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>What WAYFIND Knows ({detectedItems.length})</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Positively detected native visual features localized in the camera view.
            </p>

            {detectedItems.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-900/40 rounded-lg">
                No specific physical barriers detected in visual field.
              </p>
            ) : (
              <ul className="space-y-2">
                {detectedItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-xs text-emerald-200"
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span className="capitalize">✓ {item.feature.replace(/_/g, ' ')}</span>
                      {item.confidence && (
                        <span className="text-[10px] font-mono text-emerald-400">
                          {Math.round(item.confidence * 100)}% conf
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-slate-400 mt-1">{item.description}</p>
                    )}
                    <span className="text-[9px] uppercase font-mono text-emerald-500/80 block mt-1">
                      Source: {item.source}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 2. SPATIAL & CONTEXTUAL INFERENCES */}
        <div className="bg-slate-950/70 border border-cyan-900/40 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center space-x-2 mb-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
              <Info className="w-4 h-4 shrink-0" />
              <span>Inferred Context ({inferredItems.length})</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Corridor geometry and navigation headroom deduced from scene context.
            </p>

            {inferredItems.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-900/40 rounded-lg">
                Standard central corridor heuristics applied.
              </p>
            ) : (
              <ul className="space-y-2">
                {inferredItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-800/40 text-xs text-cyan-200"
                  >
                    <div className="font-semibold capitalize">ℹ {item.feature.replace(/_/g, ' ')}</div>
                    {item.description && (
                      <p className="text-[11px] text-slate-400 mt-1">{item.description}</p>
                    )}
                    <span className="text-[9px] uppercase font-mono text-cyan-500/80 block mt-1">
                      Source: {item.source}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 3. WHAT WAYFIND CANNOT VERIFY (Zero-Penalty Unknowns) */}
        <div className="bg-slate-950/70 border border-amber-900/40 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center space-x-2 mb-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>What WAYFIND Cannot Verify ({unknownItems.length})</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Unobservable architectural elements. <strong className="text-amber-300">0 penalty applied</strong>.
            </p>

            <ul className="space-y-2">
              {unknownItems.map((item, idx) => (
                <li
                  key={idx}
                  className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200"
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="capitalize">? {item.feature.replace(/_/g, ' ')}</span>
                    <span className="text-[9px] uppercase font-mono text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800/50">
                      0 pts
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-[11px] text-slate-400 mt-1">{item.description}</p>
                  )}
                  <span className="text-[9px] uppercase font-mono text-amber-500/80 block mt-1">
                    Status: Unverified (Requires Multi-View or Onsite Sensor)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Philosophical Responsible AI Quote & Uncertainty Banner */}
      <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1.5">
            <span className="font-bold text-amber-300 block uppercase tracking-wider text-[11px]">
              Core Responsible AI Principle:
            </span>
            <blockquote className="italic text-slate-300 text-[11px] border-l-2 border-amber-500/60 pl-3 py-0.5">
              &ldquo;Absence of evidence is not evidence of absence. WAYFIND explicitly refuses to penalize places for unobserved accessibility features.&rdquo;
            </blockquote>
            {uncertainties.length > 0 && (
              <ul className="list-disc pl-4 space-y-0.5 text-slate-400 text-[11px] pt-1">
                {uncertainties.map((u, i) => (
                  <li key={i}>{u}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
