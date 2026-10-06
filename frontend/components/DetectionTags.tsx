'use client';

import React from 'react';
import { Tag } from 'lucide-react';
import { Detection } from '../lib/types';

interface DetectionTagsProps {
  detections: Detection[];
}

export const DetectionTags: React.FC<DetectionTagsProps> = ({ detections }) => {
  if (detections.length === 0) return null;

  const getTagColor = (category: string) => {
    switch (category) {
      case 'stair_hazard':
        return 'bg-rose-950/60 border-rose-800 text-rose-300';
      case 'obstacle':
        return 'bg-amber-950/60 border-amber-800 text-amber-300';
      case 'vehicle':
        return 'bg-orange-950/60 border-orange-800 text-orange-300';
      case 'accessible_feature':
        return 'bg-emerald-950/60 border-emerald-800 text-emerald-300';
      default:
        return 'bg-slate-800/80 border-slate-700 text-slate-300';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center space-x-2 mb-3">
        <Tag className="w-4 h-4 text-cyan-400" />
        <h3 className="text-xs uppercase font-bold tracking-widest text-slate-400">
          Identified Visual Entities ({detections.length})
        </h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {detections.map((det, index) => (
          <div
            key={index}
            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg border text-xs font-medium ${getTagColor(
              det.category
            )}`}
          >
            <span className="capitalize">{det.class_name}</span>
            <span className="text-[10px] font-mono opacity-75">
              {Math.round(det.confidence * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
