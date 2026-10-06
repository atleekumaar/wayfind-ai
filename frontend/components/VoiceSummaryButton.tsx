'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Square, Loader2 } from 'lucide-react';

interface VoiceSummaryButtonProps {
  speechText: string;
  label?: string;
}

export const VoiceSummaryButton: React.FC<VoiceSummaryButtonProps> = ({
  speechText,
  label = 'Listen to Assessment',
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleToggleSpeak = () => {
    if (!isSupported || typeof window === 'undefined') return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel(); // Reset any existing speech

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    utteranceRef.current = utterance;
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  if (!isSupported) {
    return null;
  }

  return (
    <button
      onClick={handleToggleSpeak}
      title={isPlaying ? 'Stop audio assessment' : 'Play spoken accessibility assessment'}
      aria-label={isPlaying ? 'Stop audio accessibility assessment' : 'Listen to accessibility assessment'}
      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all border shadow-sm ${
        isPlaying
          ? 'bg-rose-950/80 border-rose-700 text-rose-300 hover:bg-rose-900/80 ring-1 ring-rose-500/50 animate-pulse'
          : 'bg-cyan-950/60 hover:bg-cyan-900/80 border-cyan-800/80 text-cyan-300'
      }`}
    >
      {isPlaying ? (
        <>
          <Square className="w-3.5 h-3.5 fill-rose-300 text-rose-300" />
          <span>Stop Audio</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};
