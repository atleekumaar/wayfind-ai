'use client';

import React from 'react';
import { AccessibilityClassification, ScoreBreakdown } from '../lib/types';
import { ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle2, Timer } from 'lucide-react';

interface ScoreCardProps {
  score: number;
  classification: AccessibilityClassification;
  breakdown?: ScoreBreakdown;
  processingTimeMs: number;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  score,
  classification,
  breakdown,
  processingTimeMs,
}) => {
  const getTheme = () => {
    if (score >= 90) {
      return {
        badgeBg: 'bg-emerald-950/80 border-emerald-800/80 text-emerald-300',
        ringColor: 'stroke-emerald-400',
        textColor: 'text-emerald-400',
        label: 'Fully Accessible',
        icon: CheckCircle2,
      };
    } else if (score >= 70) {
      return {
        badgeBg: 'bg-cyan-950/80 border-cyan-800/80 text-cyan-300',
        ringColor: 'stroke-cyan-400',
        textColor: 'text-cyan-400',
        label: 'Mostly Accessible',
        icon: ShieldCheck,
      };
    } else if (score >= 40) {
      return {
        badgeBg: 'bg-amber-950/80 border-amber-800/80 text-amber-300',
        ringColor: 'stroke-amber-400',
        textColor: 'text-amber-400',
        label: 'Partially Accessible',
        icon: AlertTriangle,
      };
    } else {
      return {
        badgeBg: 'bg-rose-950/80 border-rose-800/80 text-rose-300',
        ringColor: 'stroke-rose-400',
        textColor: 'text-rose-400',
        label: 'Limited Accessibility',
        icon: AlertOctagon,
      };
    }
  };

  const theme = getTheme();
  const Icon = theme.icon;

  // SVG circular gauge calculation
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs uppercase font-bold tracking-widest text-slate-400">
          Accessibility Assessment
        </h3>
        <div className="flex items-center space-x-1.5 text-xs text-slate-400">
          <Timer className="w-3.5 h-3.5 text-slate-500" />
          <span>{processingTimeMs} ms</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 py-2">
        {/* Circular Progress Gauge */}
        <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            {/* Background ring */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              className="text-slate-800"
              fill="transparent"
            />
            {/* Value ring */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`${theme.ringColor} transition-all duration-1000 ease-out`}
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-extrabold text-white tracking-tight">
              {score}
            </span>
            <span className="text-[11px] font-medium text-slate-400">/ 100</span>
          </div>
        </div>

        {/* Classification & Summary */}
        <div className="flex-1 text-center sm:text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border mb-3 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm shadow-sm"
               style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
            <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full border ${theme.badgeBg}`}>
              <Icon className="w-3.5 h-3.5" />
              <span>{theme.label}</span>
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Deterministic scoring evaluated against structural step hazards, navigable pathway clearance, and mobility requirements.
          </p>

          {/* Transparent Scoring Breakdown */}
          {breakdown && breakdown.factors.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-800/80">
              <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider block mb-2">
                Scoring Rule Factors:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {breakdown.factors.map((factor, idx) => (
                  <li key={idx} className="flex items-center space-x-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${factor.startsWith('+') ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    <span className="font-mono text-slate-300">{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
