'use client';

import React from 'react';
import { AlertOctagon, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { Risk, RiskSeverity } from '../lib/types';

interface RiskListProps {
  risks: Risk[];
}

export const RiskList: React.FC<RiskListProps> = ({ risks }) => {
  const getSeverityStyle = (severity: RiskSeverity) => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return {
          cardBg: 'bg-rose-950/30 border-rose-900/60 text-rose-200',
          badge: 'bg-rose-950 text-rose-300 border-rose-800',
          icon: AlertOctagon,
          iconColor: 'text-rose-400',
        };
      case 'MEDIUM':
        return {
          cardBg: 'bg-amber-950/30 border-amber-900/60 text-amber-200',
          badge: 'bg-amber-950 text-amber-300 border-amber-800',
          icon: AlertTriangle,
          iconColor: 'text-amber-400',
        };
      case 'LOW':
      default:
        return {
          cardBg: 'bg-slate-900/40 border-slate-800 text-slate-300',
          badge: 'bg-slate-900 text-slate-400 border-slate-700',
          icon: Info,
          iconColor: 'text-slate-400',
        };
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <ShieldAlert className="w-4 h-4 text-rose-400" />
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-300">
          Detected Accessibility Barriers ({risks.length})
        </h3>
      </div>

      {risks.length === 0 ? (
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 text-xs flex items-center space-x-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span>No critical physical barriers detected in the pedestrian corridor.</span>
        </div>
      ) : (
        <div className="space-y-3">
          {risks.map((risk, index) => {
            const style = getSeverityStyle(risk.severity);
            const Icon = style.icon;
            return (
              <div
                key={index}
                className={`p-3.5 rounded-xl border ${style.cardBg} flex items-start space-x-3 transition-all`}
              >
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${style.iconColor}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      {risk.type.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${style.badge} shrink-0`}>
                      {risk.severity}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-300 break-words">{risk.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
