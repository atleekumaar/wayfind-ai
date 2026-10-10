import React from 'react';
import { X, Play, RotateCcw, AlertTriangle, ShieldCheck, HelpCircle, Layers, ZoomIn } from 'lucide-react';
import { AnalysisResponse, AccessibilityProfile } from '../lib/types';
import { TrackedObject } from '../lib/temporalTracker';

interface EvidenceReplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  frozenFrameUrl: string | null;
  analysis: AnalysisResponse | null;
  tracks: TrackedObject[];
  profile: AccessibilityProfile;
  onContinueLive: () => void;
}

export const EvidenceReplayModal: React.FC<EvidenceReplayModalProps> = ({
  isOpen,
  onClose,
  frozenFrameUrl,
  analysis,
  tracks,
  profile,
  onContinueLive,
}) => {
  if (!isOpen || !frozenFrameUrl) return null;

  const isInconclusive = analysis?.assessment_status === 'INCONCLUSIVE';
  const factors = analysis?.score_breakdown?.detailed_factors || [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="freeze-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
              <ZoomIn className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 id="freeze-title" className="text-sm font-bold uppercase tracking-wider text-white">
                  Evidence Replay & Spatial Audit
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                  Frozen Sample Frame
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Transparent factor traceability, spatial relations, and non-certification disclosures
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                onContinueLive();
              }}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center space-x-1.5 transition shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume Live</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close evidence replay"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-200">
          {/* Side-by-side: Frozen Capture and Detected Traceability */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
            {/* Left: Frozen Visual Capture with Overlay */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Sampled Frame Capture
                </span>
                <span className="text-[10px] font-mono text-cyan-400">
                  {tracks.length} Entities Localized
                </span>
              </div>
              <div className="h-56 w-full rounded-xl overflow-hidden bg-black/80 flex items-center justify-center relative border border-slate-800/80">
                <img
                  src={analysis?.annotated_image || frozenFrameUrl}
                  alt="Frozen camera sample"
                  className="max-h-56 w-full object-contain"
                />
              </div>
              <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                <span>Scope: Monocular Camera View</span>
                <span>Active Profile: {profile.replace(/_/g, ' ')}</span>
              </div>
            </div>

            {/* Right: Score Evaluation & Semantic Status */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Assessment Verdict
                </span>
                {isInconclusive ? (
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/80 space-y-1">
                    <div className="flex items-center space-x-1.5 text-amber-300 font-bold text-xs uppercase">
                      <HelpCircle className="w-4 h-4" />
                      <span>Inconclusive Assessment</span>
                    </div>
                    <p className="text-[11px] text-amber-200/90 leading-relaxed">
                      Zero objects detected in this specific frame. Absence of detected obstacles is NOT proof of accessibility.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-baseline space-x-3">
                    <span className="text-3xl font-extrabold text-white">
                      {analysis?.accessibility_score ?? 'N/A'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">/ 100</span>
                    <span className="text-xs font-bold uppercase text-cyan-300 px-2.5 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                      {analysis?.classification?.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-[11px] text-slate-400 leading-relaxed">
                <strong className="text-slate-200 block">Assessment Rationale:</strong>
                <p>{analysis?.summary || 'No summary available for this frame.'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[10px] text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300 block">Non-Certification Notice:</span>
                <p>
                  This evaluation is algorithmic and limited to the visible camera perspective. It does not certify ADA/regulatory compliance or replace on-site human inspection.
                </p>
              </div>
            </div>
          </div>

          {/* Traceable Rule Factor Ledger */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
              <span>Grounded Score Adjustments & Factor Traceability</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                {factors.length} Rules Logged
              </span>
            </h4>

            {factors.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 italic text-[11px]">
                No barrier deductions or rewards applied to baseline score for this frame.
              </div>
            ) : (
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                      <th className="py-2.5 px-3">Rule Factor</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Corridor Spatial Relation</th>
                      <th className="py-2.5 px-3 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                    {factors.map((f, i) => (
                      <tr key={i} className="hover:bg-slate-800/20">
                        <td className="py-2.5 px-3 font-sans text-slate-200">
                          <div>{f.factor}</div>
                          {f.detection_id && (
                            <span className="text-[9px] font-mono text-cyan-400">
                              Linked Track: {f.detection_id}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{f.category}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                            {f.spatial_relevance || 'inferred_corridor'}
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
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <span className="text-[11px] font-mono text-slate-500">
            Audit ID: {analysis?.analysis_id ?? 'N/A'}
          </span>
          <button
            onClick={() => {
              onClose();
              onContinueLive();
            }}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition text-xs"
          >
            Close & Resume Live Feed
          </button>
        </div>
      </div>
    </div>
  );
};
