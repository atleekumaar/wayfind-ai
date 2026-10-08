'use client';

import React, { useState } from 'react';
import {
  AccessibilityClassification,
  AssessmentConfidence,
  ScoreBreakdown,
  AccessibilityProfile,
} from '../lib/types';
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Zap,
  Globe2,
  Calculator,
  UserCheck,
  TrendingDown,
  TrendingUp,
  FileCheck2,
} from 'lucide-react';
import { ScoreAuditModal } from './ScoreAuditModal';
import { AuditReportModal } from './AuditReportModal';

interface ScoreCardProps {
  score: number;
  classification: AccessibilityClassification;
  confidence: AssessmentConfidence;
  visionConfidence?: number | null;
  profile: AccessibilityProfile;
  scope: string;
  breakdown?: ScoreBreakdown;
  processingTimeMs: number;
  inferenceTimeMs?: number | null;
  analysis?: any;
  originalImageUrl?: string | null;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  score,
  classification,
  confidence,
  visionConfidence,
  profile,
  scope,
  breakdown,
  processingTimeMs,
  inferenceTimeMs,
  analysis,
  originalImageUrl,
}) => {
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);

  const profileDisplay: Record<AccessibilityProfile, { label: string; badge: string }> = {
    general_mobility: { label: 'General Mobility', badge: 'bg-slate-800 text-slate-200 border-slate-700' },
    wheelchair: { label: 'Wheelchair Mode', badge: 'bg-blue-950/80 text-blue-300 border-blue-700/80' },
    walker: { label: 'Walker / Cane', badge: 'bg-teal-950/80 text-teal-300 border-teal-700/80' },
    stroller: { label: 'Stroller / Cart', badge: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/80' },
    low_vision: { label: 'Low Vision Mode', badge: 'bg-purple-950/80 text-purple-300 border-purple-700/80' },
  };

  const getTheme = () => {
    if (score >= 90) {
      return {
        badgeBg: 'bg-emerald-950/80 border-emerald-700 text-emerald-300',
        ringColor: 'stroke-emerald-400',
        textColor: 'text-emerald-400',
        label: 'Fully Accessible',
        icon: CheckCircle2,
      };
    } else if (score >= 70) {
      return {
        badgeBg: 'bg-cyan-950/80 border-cyan-700 text-cyan-300',
        ringColor: 'stroke-cyan-400',
        textColor: 'text-cyan-400',
        label: 'Mostly Accessible',
        icon: ShieldCheck,
      };
    } else if (score >= 40) {
      return {
        badgeBg: 'bg-amber-950/80 border-amber-700 text-amber-300',
        ringColor: 'stroke-amber-400',
        textColor: 'text-amber-400',
        label: 'Partially Accessible',
        icon: AlertTriangle,
      };
    } else {
      return {
        badgeBg: 'bg-rose-950/80 border-rose-700 text-rose-300',
        ringColor: 'stroke-rose-400',
        textColor: 'text-rose-400',
        label: 'Limited Accessibility',
        icon: AlertOctagon,
      };
    }
  };

  const getConfidenceBadge = () => {
    if (confidence === 'HIGH') {
      return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
    } else if (confidence === 'MEDIUM') {
      return 'bg-amber-950/80 text-amber-300 border-amber-800';
    } else {
      return 'bg-rose-950/80 text-rose-300 border-rose-800';
    }
  };

  const theme = getTheme();
  const Icon = theme.icon;

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="w-full h-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between space-y-4">
      {/* Decorative gradient glow */}
      <div className="absolute -top-16 -right-16 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3.5">
        <div className="flex items-center space-x-2">
          <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-300">
            Accessibility Assessment
          </h3>
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${profileDisplay[profile].badge}`}>
            {profileDisplay[profile].label}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="flex items-center space-x-1 text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>{inferenceTimeMs ? `${inferenceTimeMs}ms ML` : `${processingTimeMs}ms`}</span>
          </span>
        </div>
      </div>

      {/* Score and Circular Radial Meter Section */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 py-1">
        {/* Radial Meter */}
        <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
            <circle
              cx="70"
              cy="70"
              r={radius}
              stroke="currentColor"
              strokeWidth="10"
              className="text-slate-800"
              fill="transparent"
            />
            <circle
              cx="70"
              cy="70"
              r={radius}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`${theme.ringColor} transition-all duration-1000 ease-out`}
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {score}
            </span>
            <span className="text-[10px] font-medium text-slate-400">/ 100</span>
          </div>
        </div>

        {/* Classification, Dual Confidence & Action */}
        <div className="flex-1 min-w-0 text-center sm:text-left space-y-2.5">
          <div className="inline-flex items-center">
            <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${theme.badgeBg}`}>
              <Icon className="w-3.5 h-3.5" />
              <span>{theme.label}</span>
            </span>
          </div>

          {/* Dual Confidence Badges */}
          <div className="flex flex-wrap items-center gap-1.5 justify-center sm:justify-start">
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getConfidenceBadge()}`}>
              {confidence} Confidence
            </span>

            {visionConfidence !== undefined && visionConfidence !== null && (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800 font-mono">
                Vision: {Math.round(visionConfidence * 100)}%
              </span>
            )}

            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 flex items-center space-x-1 font-mono">
              <Globe2 className="w-2.5 h-2.5 text-cyan-400" />
              <span>{scope.replace(/_/g, ' ')}</span>
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Deterministic evaluation against physical corridor barriers and mobility criteria.
          </p>

          {/* Action Buttons: "Why this score?" and "Audit Certificate" */}
          <div className="pt-0.5 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAuditOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-700 text-xs font-semibold text-cyan-300 transition-colors shadow-sm"
            >
              <Calculator className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Calculation Audit</span>
            </button>

            {analysis && (
              <button
                onClick={() => setIsCertificateOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-700/80 hover:border-emerald-500 text-xs font-bold text-emerald-300 transition-colors shadow-sm"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Compliance Certificate (PDF)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Applied Factors / Deductions Footer */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Applied Factor Adjustments:
            </span>
            <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800">
              ADA §405 • ISO 21542
            </span>
          </div>
          {breakdown && (
            <span className="text-[10px] font-mono text-cyan-400">
              Base 100 {score - 100 >= 0 ? `+${score - 100}` : score - 100} = {score}
            </span>
          )}
        </div>

        {breakdown && breakdown.factors.length > 0 ? (
          <ul className="space-y-1.5 text-xs max-h-[76px] overflow-y-auto">
            {breakdown.factors.map((factor, idx) => (
              <li key={idx} className="flex items-center space-x-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    factor.startsWith('+') ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
                <span className="font-mono text-slate-300 break-words">{factor}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-500 italic">No barrier adjustments applied to baseline score.</p>
        )}
      </div>

      {/* Audit Modal */}
      {breakdown && (
        <ScoreAuditModal
          isOpen={isAuditOpen}
          onClose={() => setIsAuditOpen(false)}
          score={score}
          breakdown={breakdown}
          profile={profile}
        />
      )}

      {/* Official Compliance Certificate Modal */}
      {analysis && (
        <AuditReportModal
          isOpen={isCertificateOpen}
          onClose={() => setIsCertificateOpen(false)}
          analysis={analysis}
          activeProfile={profile}
          imageUrl={originalImageUrl}
        />
      )}
    </div>
  );
};
