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
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <h3 className="text-xs uppercase font-extrabold tracking-widest text-white">
            Evidence-Based Reality Verification
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
          Responsible ML Model
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. CONFIRMED DETECTED EVIDENCE */}
        <div className="bg-slate-950/60 border border-emerald-900/40 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center space-x-2 mb-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Positively Detected ({detectedItems.length})</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Features with positive computer vision localization in the visual field.
            </p>

            {detectedItems.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No specific positive barriers detected.</p>
            ) : (
              <ul className="space-y-2">
                {detectedItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-xs text-emerald-200"
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span>✓ {item.feature}</span>
                      {item.confidence && (
                        <span className="text-[10px] font-mono text-emerald-400">
                          {Math.round(item.confidence * 100)}%
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-[11px] text-slate-400 mt-1">{item.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 2. INFERRED CONTEXTUAL CUES */}
        <div className="bg-slate-950/60 border border-cyan-900/40 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center space-x-2 mb-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
              <Info className="w-4 h-4 shrink-0" />
              <span>Inferred Context ({inferredItems.length})</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Spatial conclusions inferred via rules engine from observable surroundings.
            </p>

            {inferredItems.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No specific pathway inference applied.</p>
            ) : (
              <ul className="space-y-2">
                {inferredItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-800/40 text-xs text-cyan-200"
                  >
                    <div className="font-semibold">ℹ {item.feature}</div>
                    {item.description && (
                      <p className="text-[11px] text-slate-400 mt-1">{item.description}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* 3. EXPLICIT DOMAIN UNKNOWNS */}
        <div className="bg-slate-950/60 border border-amber-900/40 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center space-x-2 mb-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>Uncertain / Unknown ({unknownItems.length})</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Features not verifiable from this 2D perspective (Absence of evidence ≠ Evidence of absence).
            </p>

            <ul className="space-y-2">
              {unknownItems.map((item, idx) => (
                <li
                  key={idx}
                  className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200"
                >
                  <div className="font-semibold">? {item.feature}</div>
                  {item.description && (
                    <p className="text-[11px] text-slate-400 mt-1">{item.description}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Explicit Uncertainty Statements */}
      {uncertainties.length > 0 && (
        <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800/80 flex items-start space-x-3">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 space-y-1">
            <span className="font-bold text-amber-300 block uppercase tracking-wider text-[10px]">
              Responsible AI Transparency Statement:
            </span>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-400 text-[11px]">
              {uncertainties.map((u, i) => (
                <li key={i}>{u}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
