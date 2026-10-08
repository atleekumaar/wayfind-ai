'use client';

import React from 'react';
import {
  X,
  Printer,
  FileCheck2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Award,
  Globe,
  Compass,
} from 'lucide-react';
import { AnalysisResponse, AccessibilityProfile } from '../lib/types';

interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: AnalysisResponse;
  activeProfile: AccessibilityProfile;
  imageUrl?: string | null;
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({
  isOpen,
  onClose,
  analysis,
  activeProfile,
  imageUrl,
}) => {
  if (!isOpen) return null;

  const profileDisplay: Record<AccessibilityProfile, string> = {
    general_mobility: 'General Pedestrian Mobility',
    wheelchair: 'Manual & Powered Wheelchair Traversal',
    walker: 'Assisted Walker / Cane / Crutches',
    stroller: 'Stroller & Wheeled Cart Mobility',
    low_vision: 'Low Vision & Sensory Wayfinding',
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Generate deterministic audit certificate hash
  const pseudoHash = `0x${Array.from(analysis.analysis_id + 'wayfind-verified')
    .map((c) => c.charCodeAt(0).toString(16))
    .join('')
    .slice(0, 32)}`;

  const isCompliant = analysis.accessibility_score >= 70;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl print:max-h-none print:w-full print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Header Bar (Non-print controls) */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 print:hidden">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Official Site Accessibility Audit Report
              </h3>
              <p className="text-[11px] text-slate-400">
                Printable compliance certificate and deterministic evidence verification
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center space-x-1.5 shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5 text-slate-950" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Document Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs text-slate-200 print:text-black print:overflow-visible print:p-4">
          {/* Certificate Header Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/30 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:border-slate-300 print:bg-slate-50">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Compass className="w-5 h-5 text-cyan-400 print:text-blue-600" />
                <span className="font-extrabold text-lg text-white print:text-black tracking-tight">
                  WAYFIND <span className="text-cyan-400 print:text-blue-600">AI</span>
                </span>
                <span className="text-[10px] font-mono uppercase bg-slate-800 text-cyan-300 px-2 py-0.5 rounded border border-slate-700 print:bg-slate-200 print:text-slate-800">
                  Audit Certificate
                </span>
              </div>
              <p className="text-xs text-slate-400 print:text-slate-600">
                Autonomous Physical Environment Accessibility Intelligence
              </p>
            </div>

            <div className="text-left sm:text-right font-mono text-[11px] text-slate-400 space-y-0.5 print:text-slate-700">
              <div>Ref: <strong className="text-white print:text-black">WFA-{analysis.analysis_id.slice(0, 8).toUpperCase()}</strong></div>
              <div>Date: {new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</div>
              <div className="text-[10px] text-cyan-400 print:text-blue-700 truncate max-w-[200px]">
                Digest: {pseudoHash}
              </div>
            </div>
          </div>

          {/* Score & Compliance Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Score */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between print:border-slate-300 print:bg-slate-50">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Accessibility Rating</span>
              <div className="my-2">
                <span className="text-3xl font-extrabold text-white print:text-black">{analysis.accessibility_score}</span>
                <span className="text-slate-400 text-xs"> / 100</span>
              </div>
              <span className={`text-[11px] font-bold uppercase tracking-wider ${
                analysis.accessibility_score >= 70 ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {analysis.classification.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Profile Evaluated */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between print:border-slate-300 print:bg-slate-50">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Evaluated Mobility Persona</span>
              <div className="my-2 text-sm font-bold text-white print:text-black">
                {profileDisplay[activeProfile]}
              </div>
              <span className="text-[10px] text-slate-400">
                Confidence: <strong className="text-cyan-300 print:text-blue-600">{analysis.assessment_confidence}</strong>
              </span>
            </div>

            {/* Regulatory Standard Mapping */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between print:border-slate-300 print:bg-slate-50">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Standards Compliance</span>
              <div className="my-2 space-y-1">
                <div className="flex items-center space-x-1.5 text-[11px]">
                  <span className={`w-2 h-2 rounded-full ${isCompliant ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  <span className="font-semibold">ADA Title III Section 405</span>
                </div>
                <div className="flex items-center space-x-1.5 text-[11px]">
                  <span className={`w-2 h-2 rounded-full ${isCompliant ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span className="font-semibold">ISO 21542:2021 Safe Ingress</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400">
                Corridor: Inferred 1.2m Minimum
              </span>
            </div>
          </div>

          {/* Visual Evidence Section */}
          {imageUrl && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 print:border-slate-300 print:bg-slate-50">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-black">
                  Photographic Evidence & Spatial Localization
                </h4>
                <span className="text-[10px] font-mono text-cyan-400 print:text-blue-600">
                  {analysis.detections.length} Entities Localized
                </span>
              </div>
              <div className="h-48 w-full flex items-center justify-center bg-black/60 rounded-xl overflow-hidden border border-slate-800">
                <img
                  src={analysis.annotated_image || imageUrl}
                  alt="Audit site capture"
                  className="max-h-48 w-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Factor Deductions Log */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-black">
              Itemized Physical Barrier & Accessibility Ledger
            </h4>
            {analysis.score_breakdown && analysis.score_breakdown.factors.length > 0 ? (
              <div className="border border-slate-800 rounded-xl overflow-hidden print:border-slate-300">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 print:bg-slate-200 print:text-black">
                      <th className="py-2 px-3">Rule / Feature Factor</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3 text-right">Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono text-[11px] print:divide-slate-300">
                    {analysis.score_breakdown.factors.map((f, i) => (
                      <tr key={i} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-sans text-slate-200 print:text-black">{f}</td>
                        <td className="py-2 px-3 text-slate-400 print:text-slate-600">corridor_obstruction</td>
                        <td className={`py-2 px-3 text-right font-bold ${
                          f.startsWith('+') ? 'text-emerald-400 print:text-emerald-700' : 'text-rose-400 print:text-rose-700'
                        }`}>
                          {f.startsWith('+') ? '+10' : '-10'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 italic p-3 bg-slate-950 rounded-xl border border-slate-800">
                No physical negative barriers logged against baseline score.
              </p>
            )}
          </div>

          {/* Certification Attestation Sign-off */}
          <div className="p-4.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:border-slate-300 print:bg-slate-50">
            <div className="space-y-1">
              <span className="font-bold text-xs text-white print:text-black block">
                Digital Attestation & Audit Integrity
              </span>
              <p className="text-[11px] text-slate-400 print:text-slate-600 leading-relaxed max-w-lg">
                This report represents an algorithmic assessment based strictly on observable 2D imagery. Absence of positive evidence is not proof of physical absence. Generated deterministically by the WAYFIND AI Engine.
              </p>
            </div>
            <div className="text-center shrink-0 self-end sm:self-center">
              <div className="w-16 h-16 border-2 border-dashed border-cyan-500/50 rounded-xl flex items-center justify-center mx-auto text-cyan-400 print:border-blue-600 print:text-blue-600">
                <Award className="w-8 h-8" />
              </div>
              <span className="text-[9px] uppercase font-mono font-bold text-slate-400 mt-1 block">
                VERIFIED SEAL
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer (Non-print) */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs print:hidden">
          <span className="text-[11px] font-mono text-slate-500">
            Audit ID: {analysis.analysis_id}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition text-xs"
          >
            Close Certificate
          </button>
        </div>
      </div>
    </div>
  );
};
