'use client';

import React from 'react';
import { X, Calculator, ShieldCheck, CheckCircle2, AlertTriangle, Info, HelpCircle } from 'lucide-react';
import { ScoreBreakdown, ScoreBreakdownFactor, AccessibilityProfile } from '../lib/types';

interface ScoreAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  breakdown: ScoreBreakdown;
  profile: AccessibilityProfile;
}

export const ScoreAuditModal: React.FC<ScoreAuditModalProps> = ({
  isOpen,
  onClose,
  score,
  breakdown,
  profile,
}) => {
  if (!isOpen) return null;

  const profileLabels: Record<AccessibilityProfile, string> = {
    general_mobility: 'General Mobility',
    wheelchair: 'Manual & Power Wheelchair',
    walker: 'Walker / Cane / Crutches',
    stroller: 'Stroller / Cart',
    low_vision: 'Low Vision / Sensory',
  };

  const detailed = breakdown.detailed_factors || [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 id="audit-title" className="text-sm font-bold text-white uppercase tracking-wider">
                Why This Score? — Transparent Audit
              </h3>
              <p className="text-[11px] text-slate-400">
                Deterministic calculation breakdown for Profile: <span className="text-cyan-300 font-semibold">{profileLabels[profile]}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close calculation audit modal"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Top Score Equation */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-center sm:text-left">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Baseline Starting Score</span>
              <span className="text-2xl font-bold text-white">100.0</span>
            </div>
            <div className="text-xl text-slate-600 hidden sm:block">− / +</div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Net Spatial Adjustments</span>
              <span className={`text-2xl font-bold ${score < 100 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {score - 100 > 0 ? `+${score - 100}` : score - 100}
              </span>
            </div>
            <div className="text-xl text-slate-600 hidden sm:block">=</div>
            <div className="p-3 rounded-lg bg-cyan-950/50 border border-cyan-800/60">
              <span className="text-[10px] uppercase font-bold text-cyan-400 block">Final Clamped Score</span>
              <span className="text-2xl font-extrabold text-cyan-200">{score} / 100</span>
            </div>
          </div>

          {/* Factor Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <span>Observable Factors Evaluated</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                {detailed.length} applied
              </span>
            </h4>

            {detailed.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Zero negative physical barriers detected in the pedestrian corridor. Baseline 100 preserved.</span>
              </div>
            ) : (
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                      <th className="py-2.5 px-3">Factor / Rule</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {detailed.map((f, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-200 font-sans block">{f.factor}</span>
                          <span className="text-[10px] text-slate-500 font-mono">Source: {f.source}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                            {f.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] font-sans ${f.status === 'detected' ? 'text-emerald-400' : 'text-cyan-400'}`}>
                            {f.status}
                          </span>
                        </td>
                        <td className={`py-2.5 px-3 text-right font-bold ${
                          f.points < 0 ? 'text-rose-400' : f.points > 0 ? 'text-emerald-400' : 'text-slate-500'
                        }`}>
                          {f.points > 0 ? `+${f.points}` : f.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Zero Penalty for Unknown / Unobserved Principles */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Responsible AI Non-Penalty Guarantee</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Unlike simplistic heuristics, WAYFIND AI does <strong className="text-white">not</strong> deduct points for missing accessibility infrastructure (e.g. ramps or tactile paving) that cannot be confirmed from a single 2D camera angle. Unobserved features are explicitly logged as <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">unknown</code> with exactly <strong className="text-white">0 points penalty</strong>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500">
            Formulation: deterministic clamp(100 − Σ penalties + Σ boosts, 0, 100)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition text-xs"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
