'use client';

import React from 'react';
import { CheckCircle2, HelpCircle, Info, ShieldCheck, AlertCircle } from 'lucide-react';
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
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Verified Knowledge vs. Unknown Reality Panel
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Responsible AI separation between observable visual detections and unverified structural elements
            </p>
          </div>
        </div>
        <span className="text-[11px] uppercase font-bold tracking-wider text-cyan-300 bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-800/80 shrink-0 self-start sm:self-center">
          Responsible ML Model
        </span>
      </div>

      {/* Tri-column Knowledge Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. WHAT WAYFIND KNOWS (Confirmed Detected Evidence) */}
        <div className="bg-slate-950/70 border border-emerald-900/40 rounded-xl p-4.5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>What WAYFIND Knows</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                {detectedItems.length} verified
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Positively detected native visual features localized in the camera view.
            </p>

            {detectedItems.length === 0 ? (
              <div className="p-3.5 bg-slate-900/40 border border-slate-800/60 rounded-xl text-xs text-slate-400 italic">
                No physical barrier objects detected in the immediate field of view.
              </div>
            ) : (
              <ul className="space-y-2.5">
                {detectedItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-xs text-emerald-200 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-emerald-300 capitalize truncate">
                        ✓ {item.feature.replace(/_/g, ' ')}
                      </span>
                      {item.confidence && (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/60 shrink-0">
                          {Math.round(item.confidence * 100)}% conf
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-slate-300 leading-relaxed break-words">
                        {item.description}
                      </p>
                    )}
                    <div className="text-[10px] font-mono text-emerald-500/80 pt-0.5">
                      Source: {item.source}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 2. SPATIAL & CONTEXTUAL INFERENCES */}
        <div className="bg-slate-950/70 border border-cyan-900/40 rounded-xl p-4.5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                <Info className="w-4 h-4 shrink-0" />
                <span>Inferred Context</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                {inferredItems.length} cues
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Corridor geometry and navigation clearance deduced from scene context.
            </p>

            {inferredItems.length === 0 ? (
              <div className="p-3.5 bg-slate-900/40 border border-slate-800/60 rounded-xl text-xs text-slate-400 italic">
                Standard central pedestrian corridor heuristics active.
              </div>
            ) : (
              <ul className="space-y-2.5">
                {inferredItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-xs text-cyan-200 space-y-1.5"
                  >
                    <div className="font-semibold text-cyan-300 capitalize truncate">
                      ℹ {item.feature.replace(/_/g, ' ')}
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-slate-300 leading-relaxed break-words">
                        {item.description}
                      </p>
                    )}
                    <div className="text-[10px] font-mono text-cyan-500/80 pt-0.5">
                      Source: {item.source}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 3. WHAT WAYFIND CANNOT VERIFY (Zero-Penalty Unknowns) */}
        <div className="bg-slate-950/70 border border-amber-900/40 rounded-xl p-4.5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span>Cannot Verify</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60">
                {unknownItems.length} unknown
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Unobservable architectural elements. <strong className="text-amber-300">0 penalty applied</strong>.
            </p>

            <ul className="space-y-2.5">
              {unknownItems.map((item, idx) => (
                <li
                  key={idx}
                  className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-amber-300 capitalize truncate">
                      ? {item.feature.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800/50 shrink-0">
                      0 pts deduction
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-[11px] text-slate-300 leading-relaxed break-words">
                      {item.description}
                    </p>
                  )}
                  <div className="text-[10px] font-mono text-amber-400/80 pt-0.5">
                    Status: Unverified from 2D angle
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Philosophical Responsible AI Quote & Uncertainty Banner */}
      <div className="p-4.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-2 flex-1">
            <span className="font-bold text-amber-300 block uppercase tracking-wider text-[11px]">
              Core Responsible AI Principle:
            </span>
            <blockquote className="italic text-slate-200 text-xs border-l-2 border-amber-500/60 pl-3 py-1 leading-relaxed">
              &ldquo;Absence of evidence is not evidence of absence. WAYFIND explicitly refuses to penalize places for unobserved accessibility features.&rdquo;
            </blockquote>
            {uncertainties.length > 0 && (
              <div className="pt-1">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Active Scene Limitations:
                </span>
                <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs leading-relaxed">
                  {uncertainties.map((u, i) => (
                    <li key={i}>{u}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
