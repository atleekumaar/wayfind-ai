import React from 'react';
import { TrackedObject } from '../lib/temporalTracker';
import { ShieldAlert, CheckCircle2, HelpCircle } from 'lucide-react';

interface SpatialIntelligenceHUDProps {
  tracks: TrackedObject[];
  videoWidth: number;
  videoHeight: number;
  showCorridor: boolean;
  showTrails: boolean;
}

export const SpatialIntelligenceHUD: React.FC<SpatialIntelligenceHUDProps> = ({
  tracks,
  videoWidth,
  videoHeight,
  showCorridor,
  showTrails,
}) => {
  const imgW = videoWidth || 640;
  const imgH = videoHeight || 480;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* 1. Perspective Inferred Navigation Corridor (AR Carpet) */}
      {showCorridor && (
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="corridorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.28" />
            </linearGradient>
            <linearGradient id="corridorLineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Perspective Corridor Polygon */}
          <polygon
            points="35,46 65,46 82,98 18,98"
            fill="url(#corridorGrad)"
            stroke="url(#corridorLineGrad)"
            strokeWidth="0.8"
            strokeDasharray="3 1.5"
          />

          {/* Inferred Center Walking Guide Line */}
          <line
            x1="50"
            y1="46"
            x2="50"
            y2="98"
            stroke="#10b981"
            strokeWidth="1.2"
            strokeDasharray="2 2"
            strokeOpacity="0.8"
          />

          {/* Lateral Reference Hatch Lines */}
          <line x1="26" y1="72" x2="74" y2="72" stroke="#10b981" strokeWidth="0.5" strokeOpacity="0.4" strokeDasharray="1 2" />
          <line x1="22" y1="85" x2="78" y2="85" stroke="#10b981" strokeWidth="0.5" strokeOpacity="0.5" strokeDasharray="1 2" />
        </svg>
      )}

      {/* 2. Motion Trails for Tracked Entities */}
      {showTrails && (
        <svg className="w-full h-full absolute inset-0" viewBox={`0 0 ${imgW} ${imgH}`} preserveAspectRatio="none">
          {tracks.map((track) => {
            if (track.history.length < 2) return null;
            const pointsStr = track.history.map((pt) => `${pt[0]},${pt[1]}`).join(' ');
            const isBarrier = track.category === 'stair_hazard' || track.category === 'obstacle';
            return (
              <polyline
                key={`trail-${track.trackId}`}
                points={pointsStr}
                fill="none"
                stroke={isBarrier ? '#f43f5e' : '#06b6d4'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity="0.75"
                strokeDasharray="2 3"
              />
            );
          })}
        </svg>
      )}

      {/* 3. Bounding Boxes, Classification Badges & Spatial Tags */}
      {tracks.map((track) => {
        const [x1, y1, x2, y2] = track.bbox;
        const leftPct = (x1 / imgW) * 100;
        const topPct = (y1 / imgH) * 100;
        const widthPct = ((x2 - x1) / imgW) * 100;
        const heightPct = ((y2 - y1) / imgH) * 100;

        const isBarrier = track.category === 'stair_hazard' || track.category === 'obstacle';
        const isInside = track.corridorRelation === 'INSIDE';

        // Border & styling by corridor relevance
        let borderClass = 'border-cyan-400 bg-cyan-500/10 text-cyan-300';
        let badgeBg = 'bg-cyan-950 text-cyan-300 border-cyan-800';

        if (isBarrier && isInside) {
          borderClass = 'border-rose-500 bg-rose-500/15 text-rose-300 animate-pulse';
          badgeBg = 'bg-rose-950 text-rose-300 border-rose-800';
        } else if (isBarrier && !isInside) {
          borderClass = 'border-amber-400 bg-amber-500/10 text-amber-300';
          badgeBg = 'bg-amber-950 text-amber-300 border-amber-800';
        } else if (isInside) {
          borderClass = 'border-emerald-400 bg-emerald-500/10 text-emerald-300';
          badgeBg = 'bg-emerald-950 text-emerald-300 border-emerald-800';
        }

        return (
          <div
            key={track.trackId}
            style={{
              left: `${leftPct}%`,
              top: `${topPct}%`,
              width: `${widthPct}%`,
              height: `${heightPct}%`,
            }}
            className={`absolute border-2 transition-all duration-200 rounded-md shadow-sm ${borderClass}`}
          >
            {/* Top Label Tag */}
            <div className="absolute -top-6 left-0 flex items-center space-x-1 whitespace-nowrap">
              <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded border shadow-md flex items-center space-x-1 ${badgeBg}`}>
                <span className="font-extrabold text-[8px] text-white/90">{track.trackId}</span>
                <span>•</span>
                <span>{track.className}</span>
                <span className="opacity-75">{Math.round(track.confidence * 100)}%</span>
              </span>

              {/* Corridor Relation Badge */}
              <span className={`px-1 py-0.5 text-[8px] font-mono font-bold uppercase rounded border ${
                isInside
                  ? 'bg-rose-950 text-rose-300 border-rose-800'
                  : track.corridorRelation === 'OUTSIDE'
                  ? 'bg-slate-900 text-slate-400 border-slate-700'
                  : 'bg-amber-950 text-amber-300 border-amber-800'
              }`}>
                {track.corridorRelation}
              </span>
            </div>

            {/* Target Reticle in Center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
              <div className="w-2 h-2 border border-current rounded-full" />
            </div>
          </div>
        );
      })}

      {/* 4. Bottom Disclosure / Caution Pill */}
      {showCorridor && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-full border border-slate-800 text-[9px] font-mono text-slate-400 flex items-center space-x-1.5 shadow-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Navigation Corridor: Inferred Monocular Overlay (Heuristic • Uncalibrated 2D)</span>
        </div>
      )}
    </div>
  );
};
