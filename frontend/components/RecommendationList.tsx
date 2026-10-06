'use client';

import React from 'react';
import { ArrowRightCircle, Sparkles, Navigation } from 'lucide-react';
import { Recommendation } from '../lib/types';

interface RecommendationListProps {
  recommendations: Recommendation[];
}

export const RecommendationList: React.FC<RecommendationListProps> = ({ recommendations }) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center space-x-2 mb-4">
        <Navigation className="w-4 h-4 text-cyan-400" />
        <h3 className="text-xs uppercase font-bold tracking-widest text-slate-400">
          Actionable Wayfinding Recommendations
        </h3>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className="p-3.5 rounded-xl border border-cyan-900/40 bg-cyan-950/20 text-slate-200 flex items-start space-x-3 hover:border-cyan-800/60 transition-all"
          >
            <ArrowRightCircle className="w-4 h-4 mt-0.5 text-cyan-400 shrink-0" />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Priority: {rec.priority}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-200">{rec.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
