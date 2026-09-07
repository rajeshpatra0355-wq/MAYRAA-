import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { CallStatus, PartnerMood } from '../types';
import { companionAudio } from '../utils/audio';

interface AuraOrbProps {
  callStatus: CallStatus;
  mood: PartnerMood;
  isMuted: boolean;
  onOrbClick?: () => void;
}

export const AuraOrb: React.FC<AuraOrbProps> = ({
  callStatus,
  mood,
  isMuted,
  onOrbClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Mood color schemes with Frosted Glass palette
  const moodColors: Record<PartnerMood, { primary: string; secondary: string; glow: string; text: string }> = {
    flirty: {
      primary: '#FF2D75',
      secondary: '#ff6b9a',
      glow: 'rgba(255, 45, 117, 0.45)',
      text: '#FF2D75',
    },
    playful: {
      primary: '#FF2D75',
      secondary: '#00D2FF',
      glow: 'rgba(255, 45, 117, 0.4)',
      text: '#00D2FF',
    },
    caring: {
      primary: '#ff6596',
      secondary: '#a78bfa',
      glow: 'rgba(167, 139, 250, 0.4)',
      text: '#ff85ac',
    },
    witty: {
      primary: '#00D2FF',
      secondary: '#FF2D75',
      glow: 'rgba(0, 210, 255, 0.45)',
      text: '#00D2FF',
    },
    sassy: {
      primary: '#FF2D75',
      secondary: '#c026d3',
      glow: 'rgba(255, 45, 117, 0.45)',
      text: '#f472b6',
    },
  };

  const currentTheme = moodColors[mood] || moodColors.playful;

  // Real-time audio frequency polling for canvas waves
  useEffect(() => {
    let active = true;

    const checkAudio = () => {
      if (!active) return;

      if (callStatus === 'speaking') {
        const freqs = companionAudio.getFrequencyData();
        let sum = 0;
        for (let i = 0; i < 24; i++) {
          sum += freqs[i] || 0;
        }
        const avg = sum / (24 * 255);
        setAudioLevel(avg);
      } else if (callStatus === 'listening') {
        // Subtle rhythmic user listening pulse
        setAudioLevel(0.18 + Math.sin(Date.now() / 200) * 0.1);
      } else if (callStatus === 'processing') {
        setAudioLevel(0.25 + Math.sin(Date.now() / 150) * 0.15);
      } else {
        setAudioLevel(0.04);
      }

      animFrameRef.current = requestAnimationFrame(checkAudio);
    };

    animFrameRef.current = requestAnimationFrame(checkAudio);
    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [callStatus]);

  // Render canvas particles & aura ripples
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const render = () => {
      time += 0.03;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = 78 + audioLevel * 35;

      // Draw subtle orbital rings
      const ringCount = 3;
      for (let r = 1; r <= ringCount; r++) {
        const ringRadius = baseRadius + r * 28 + Math.sin(time + r) * (6 + audioLevel * 14);
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.max(10, ringRadius), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(244, 114, 182, ${Math.max(0.04, (0.22 / r) * (audioLevel * 2 + 0.3))})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 12]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw dynamic floating sparkles / particles
      const particleCount = callStatus === 'speaking' ? 18 : 8;
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2 + time * 0.4 * (i % 2 === 0 ? 1 : -1);
        const dist = baseRadius + 18 + (i * 11) % 55 + Math.sin(time * 2 + i) * 12;
        const x = centerX + Math.cos(angle) * dist;
        const y = centerY + Math.sin(angle) * dist;
        const pSize = 1.8 + (audioLevel * 3);

        ctx.beginPath();
        ctx.arc(x, y, pSize, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? currentTheme.primary : currentTheme.secondary;
        ctx.globalAlpha = 0.5 + Math.sin(time * 3 + i) * 0.35;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [audioLevel, callStatus, currentTheme]);

  return (
    <div className="relative flex flex-col items-center justify-center select-none py-8">
      {/* Outer ambient glow backlight */}
      <motion.div
        className="absolute w-80 h-80 rounded-full blur-3xl pointer-events-none"
        animate={{
          scale: callStatus === 'speaking' ? [1, 1.35, 1.15, 1.4, 1] : callStatus === 'listening' ? [1, 1.2, 1] : [1, 1.08, 1],
          opacity: callStatus === 'speaking' ? [0.65, 0.9, 0.7] : callStatus === 'listening' ? [0.4, 0.65, 0.4] : 0.35,
        }}
        transition={{
          repeat: Infinity,
          duration: callStatus === 'speaking' ? 2 : 3.5,
          ease: 'easeInOut',
        }}
        style={{
          background: `radial-gradient(circle, ${currentTheme.primary} 0%, ${currentTheme.secondary} 40%, transparent 75%)`,
        }}
      />

      {/* Frosted Glass Outer Concentric Ring (320px) */}
      <div className="absolute w-[320px] h-[320px] rounded-full border border-white/5 bg-white/5 backdrop-blur-3xl animate-pulse pointer-events-none" />

      {/* Frosted Glass Middle Concentric Ring (240px) */}
      <div className="absolute w-[240px] h-[240px] rounded-full border border-[#FF2D75]/20 bg-gradient-to-tr from-[#FF2D75]/10 to-transparent pointer-events-none" />

      {/* Canvas for floating sparkles & acoustic ripple orbits */}
      <canvas
        ref={canvasRef}
        width={340}
        height={340}
        className="absolute pointer-events-none"
      />

      {/* Interactive Luminous Core Orb (160px) */}
      <motion.button
        type="button"
        onClick={onOrbClick}
        title={callStatus === 'active' || callStatus === 'speaking' ? 'Click to speak to Myraa' : 'Click to interact with Myraa'}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="relative z-10 w-[160px] h-[160px] rounded-full flex items-center justify-center cursor-pointer transition-shadow outline-none focus:ring-4 focus:ring-[#FF2D75]/40 bg-white"
        style={{
          boxShadow: `0 0 80px rgba(255, 255, 255, 0.35), 0 0 45px ${currentTheme.glow}`,
        }}
      >
        {/* Luminous Core Content */}
        <motion.div
          className="w-full h-full rounded-full relative overflow-hidden flex flex-col items-center justify-center"
          animate={{
            scale: 1 + audioLevel * 0.2,
          }}
          transition={{
            scale: { duration: 0.08 },
          }}
        >
          {/* Subtle sheen highlight */}
          <div className="absolute -top-6 -left-6 w-24 h-24 bg-white/80 rounded-full blur-lg pointer-events-none" />
          <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-[#FF2D75]/20 rounded-full blur-xl pointer-events-none" />

          {/* Central Acoustic Waveform Bars matching Frosted Glass Theme */}
          <div className="flex gap-1.5 items-end h-10 select-none z-10 mb-1">
            <div
              className="w-1 bg-[#0A0510] rounded-full transition-all duration-75"
              style={{ height: `${Math.max(12, 14 + audioLevel * 18)}px` }}
            />
            <div
              className="w-1 bg-[#0A0510] rounded-full transition-all duration-75"
              style={{ height: `${Math.max(16, 22 + audioLevel * 22)}px` }}
            />
            <div
              className="w-1 bg-[#FF2D75] rounded-full transition-all duration-75 shadow-[0_0_8px_#FF2D75]"
              style={{ height: `${Math.max(20, 28 + audioLevel * 26)}px` }}
            />
            <div
              className="w-1 bg-[#0A0510] rounded-full transition-all duration-75"
              style={{ height: `${Math.max(14, 18 + audioLevel * 20)}px` }}
            />
            <div
              className="w-1 bg-[#0A0510] rounded-full transition-all duration-75"
              style={{ height: `${Math.max(10, 12 + audioLevel * 14)}px` }}
            />
          </div>

          <span className="text-[10px] font-bold tracking-widest text-[#0A0510] uppercase font-['Outfit']">
            {mood}
          </span>
        </motion.div>
      </motion.button>

      {/* Frosted Glass Dynamic Status Pill */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 flex items-center gap-2.5 px-5 py-2 rounded-full backdrop-blur-md bg-white/5 border border-white/10 text-xs shadow-xl"
      >
        <span
          className="w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_currentColor]"
          style={{ backgroundColor: currentTheme.primary, color: currentTheme.primary }}
        />
        <span className="font-medium text-white/90">
          {callStatus === 'connecting' && 'Connecting with Myraa...'}
          {callStatus === 'listening' && 'Listening attentively...'}
          {callStatus === 'processing' && 'Myraa is thinking...'}
          {callStatus === 'speaking' && 'Myraa is speaking...'}
          {callStatus === 'active' && 'Connected • Ready to speak'}
          {callStatus === 'idle' && 'Tap Call to start speaking'}
          {callStatus === 'ended' && 'Call ended • Tap to reconnect'}
        </span>
        {isMuted && (
          <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-medium ml-1 border border-rose-500/30">
            Mic Muted
          </span>
        )}
      </motion.div>
    </div>
  );
};
