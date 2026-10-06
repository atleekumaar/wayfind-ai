'use client';

import React from 'react';
import { Compass, ShieldCheck, Cpu, Sparkles } from 'lucide-react';

interface HeaderProps {
  backendConnected: boolean | null;
}

export const Header: React.FC<HeaderProps> = ({ backendConnected }) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight text-white">
                WAYFIND <span className="text-cyan-400">AI</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                Evidence AI
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Visual Intelligence for Accessible Places
            </p>
          </div>
        </div>

        {/* Live system state & telemetry badges */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
            <span
              className={`w-2 h-2 rounded-full ${
                backendConnected === true
                  ? 'bg-emerald-400 animate-pulse'
                  : backendConnected === false
                  ? 'bg-rose-500'
                  : 'bg-amber-400 animate-ping'
              }`}
            />
            <span className="text-slate-300 font-medium">
              {backendConnected === true
                ? 'CV Engine Live'
                : backendConnected === false
                ? 'Offline'
                : 'Connecting...'}
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-1.5 text-xs text-slate-400 bg-slate-900/60 border border-slate-800/60 px-3 py-1.5 rounded-full">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>YOLOv8n + Deterministic Rules</span>
          </div>
        </div>
      </div>
    </header>
  );
};
