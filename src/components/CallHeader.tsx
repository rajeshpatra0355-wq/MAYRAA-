import React from 'react';
import { Sparkles, Heart, Clock, BookOpen, Volume2, VolumeX, Info } from 'lucide-react';
import { CallStatus, PartnerMood } from '../types';

interface CallHeaderProps {
  callStatus: CallStatus;
  callDurationSeconds: number;
  mood: PartnerMood;
  onSelectMood: (mood: PartnerMood) => void;
  onOpenNotes: () => void;
  onOpenProfile: () => void;
  isSpeakerMuted: boolean;
  onToggleSpeakerMute: () => void;
}

export const CallHeader: React.FC<CallHeaderProps> = ({
  callStatus,
  callDurationSeconds,
  mood,
  onSelectMood,
  onOpenNotes,
  onOpenProfile,
  isSpeakerMuted,
  onToggleSpeakerMute,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const moods: { id: PartnerMood; label: string; emoji: string }[] = [
    { id: 'playful', label: 'Playful', emoji: '✨' },
    { id: 'flirty', label: 'Flirty', emoji: '💋' },
    { id: 'caring', label: 'Caring', emoji: '💖' },
    { id: 'witty', label: 'Witty', emoji: '⚡' },
    { id: 'sassy', label: 'Sassy', emoji: '💅' },
  ];

  const isCallLive = callStatus !== 'idle' && callStatus !== 'ended';

  return (
    <header className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-3.5">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3">
        {/* Identity & Branding */}
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF2D75] via-[#ff6b9a] to-[#00D2FF] p-0.5 shadow-lg shadow-[#FF2D75]/25">
              <div className="w-full h-full rounded-[14px] bg-[#0A0510] flex items-center justify-center">
                <Heart className="w-5 h-5 text-[#FF2D75] fill-[#FF2D75]/30" />
              </div>
            </div>
            {isCallLive && (
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#0A0510] rounded-full shadow-[0_0_8px_#34d399]" />
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tighter bg-gradient-to-r from-white via-white to-[#FF2D75] bg-clip-text text-transparent font-['Outfit']">
                MYRAA
              </h1>
              <div className="hidden sm:flex items-center gap-1.5 backdrop-blur-md bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5 text-[10px] text-white/70 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF2D75] animate-pulse" />
                <span>Rajesh's Companion</span>
              </div>
            </div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 mt-0.5 font-medium">
              Always listening • Connected with Rajesh
            </p>
          </div>
        </div>

        {/* Action Controls & Telemetry Pills */}
        <div className="flex items-center gap-2">
          {/* Live Call Duration / Status Pill */}
          {isCallLive ? (
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-2 text-xs font-medium text-emerald-400 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(callDurationSeconds)}</span>
            </div>
          ) : (
            <div className="hidden md:flex backdrop-blur-md bg-white/5 border border-white/10 rounded-full px-3 py-1.5 items-center gap-2 text-[11px] font-medium text-white/60">
              <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399]" />
              <span>LATENCY 42ms</span>
            </div>
          )}

          {/* Speaker Mute */}
          <button
            type="button"
            onClick={onToggleSpeakerMute}
            title={isSpeakerMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="w-10 h-10 rounded-full border border-white/10 backdrop-blur-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all shadow-sm"
          >
            {isSpeakerMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-white/80" />
            )}
          </button>

          {/* Memory & Notes Button */}
          <button
            type="button"
            onClick={onOpenNotes}
            title="Shared Memory & Reminders"
            className="h-10 px-3.5 rounded-full border border-white/10 backdrop-blur-md bg-white/5 hover:bg-white/10 flex items-center gap-1.5 text-xs font-medium text-white/80 hover:text-white transition-all shadow-sm"
          >
            <BookOpen className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">Memory</span>
          </button>

          {/* Persona Info */}
          <button
            type="button"
            onClick={onOpenProfile}
            title="About Myraa's Persona"
            className="w-10 h-10 rounded-full border border-white/10 backdrop-blur-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all shadow-sm"
          >
            <Info className="w-4 h-4 text-[#FF2D75]" />
          </button>
        </div>
      </div>

      {/* Mood Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <span className="text-[11px] uppercase tracking-widest text-white/40 font-semibold mr-1 whitespace-nowrap">
          Vibe:
        </span>
        {moods.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelectMood(m.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer backdrop-blur-md ${
              mood === m.id
                ? 'bg-[#FF2D75]/20 border border-[#FF2D75] text-white shadow-[0_0_20px_rgba(255,45,117,0.35)] font-semibold'
                : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>{m.emoji}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>
    </header>
  );
};
