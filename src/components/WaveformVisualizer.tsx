import React, { useEffect, useState } from 'react';
import { CallStatus, PartnerMood } from '../types';
import { companionAudio } from '../utils/audio';

interface WaveformVisualizerProps {
  callStatus: CallStatus;
  mood: PartnerMood;
  barCount?: number;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  callStatus,
  mood,
  barCount = 28,
}) => {
  const [frequencies, setFrequencies] = useState<number[]>(() =>
    Array(barCount).fill(4)
  );

  useEffect(() => {
    let animId: number;

    const updateWaves = () => {
      if (callStatus === 'speaking') {
        const raw = companionAudio.getFrequencyData();
        const step = Math.floor(raw.length / barCount) || 1;
        const mapped = Array.from({ length: barCount }, (_, i) => {
          const val = raw[i * step] || 0;
          // Scale from 4px to 48px
          return Math.max(6, Math.min(48, (val / 255) * 44 + 6));
        });
        setFrequencies(mapped);
      } else if (callStatus === 'listening') {
        // Soft animated wave for user input
        const now = Date.now() / 180;
        const mapped = Array.from({ length: barCount }, (_, i) => {
          const wave = Math.sin(now + i * 0.35);
          return Math.max(6, Math.abs(wave) * 26 + 6);
        });
        setFrequencies(mapped);
      } else if (callStatus === 'processing') {
        // Gentle ripple
        const now = Date.now() / 140;
        const mapped = Array.from({ length: barCount }, (_, i) => {
          return 10 + Math.sin(now + i * 0.5) * 8;
        });
        setFrequencies(mapped);
      } else {
        // Resting baseline
        setFrequencies(Array(barCount).fill(5));
      }

      animId = requestAnimationFrame(updateWaves);
    };

    animId = requestAnimationFrame(updateWaves);
    return () => cancelAnimationFrame(animId);
  }, [callStatus, barCount]);

  const moodGradients: Record<PartnerMood, string> = {
    flirty: 'from-[#FF2D75] to-[#ff6b9a]',
    playful: 'from-[#FF2D75] to-[#00D2FF]',
    caring: 'from-[#ff6596] to-[#a78bfa]',
    witty: 'from-[#00D2FF] to-[#FF2D75]',
    sassy: 'from-[#FF2D75] to-[#c026d3]',
  };

  const gradient = moodGradients[mood] || 'from-[#FF2D75] to-[#00D2FF]';

  return (
    <div className="flex items-center justify-center gap-1.5 h-14 px-4">
      {frequencies.map((height, idx) => (
        <div
          key={idx}
          className={`w-1 rounded-full bg-gradient-to-t ${gradient} transition-all duration-75`}
          style={{
            height: `${height}px`,
            opacity: callStatus === 'idle' || callStatus === 'ended' ? 0.25 : 0.85,
          }}
        />
      ))}
    </div>
  );
};
