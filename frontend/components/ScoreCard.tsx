'use client';

import React from 'react';
import {
  AccessibilityClassification,
  AssessmentConfidence,
  ScoreBreakdown,
} from '../lib/types';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Timer,
  Zap,
  Globe2,
} from 'lucide-react';

interface ScoreCardProps {
  score: number;
  classification: AccessibilityClassification;
  confidence: AssessmentConfidence;
  scope: string;
  breakdown?: ScoreBreakdown;
  processingTimeMs: number;
  inferenceTimeMs?: number | null;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  score,
  classification,
  confidence,
  scope,
  breakdown,
  processingTimeMs,
  inferenceTimeMs,
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

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-6">
      {/* Decorative gradient glow */}
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-400">
          Accessibility Assessment
        </h3>
        <div className="flex items-center space-x-2 text-xs">
          <span className="flex items-center space-x-1 text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>{inferenceTimeMs ? `${inferenceTimeMs}ms ML` : `${processingTimeMs}ms`}</span>
          </span>
        </div>
      </div>

      {/* Score and Circular Radial Meter */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
        <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              className="text-slate-800"
              fill="transparent"
            />
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

        {/* Classification, Confidence & Scope */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="inline-flex items-center space-x-2">
            <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${theme.badgeBg}`}>
              <Icon className="w-4 h-4" />
              <span>{theme.label}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
              Confidence: {confidence}
            </span>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 flex items-center space-x-1">
              <Globe2 className="w-2.5 h-2.5 text-cyan-400" />
              <span>{scope.replace(/_/g, ' ')}</span>
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed pt-1">
            Deterministic evaluation against physical step barriers, pathway width clearance, and observable infrastructure.
          </p>
        </div>
      </div>

      {/* Transparent Scoring Factors */}
      {breakdown && breakdown.factors.length > 0 && (
        <div className="pt-3 border-t border-slate-800">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2">
            Evidence-Engine Factor Breakdown:
          </span>
          <ul className="space-y-1.5 text-xs">
            {breakdown.factors.map((factor, idx) => (
              <li key={idx} className="flex items-center space-x-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    factor.startsWith('+') ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
                <span className="font-mono text-slate-300">{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
