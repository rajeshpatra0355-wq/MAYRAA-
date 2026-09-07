import React, { useState, useEffect } from 'react';
import { X, Heart, Sparkles, Volume2, ShieldCheck, MessageSquareHeart, Sliders, CheckCircle2 } from 'lucide-react';
import { PartnerMood } from '../types';
import { companionAudio } from '../utils/audio';

interface PartnerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMood: PartnerMood;
  onSelectMood: (mood: PartnerMood) => void;
  onTestVoice: () => void;
}

export const PartnerProfileModal: React.FC<PartnerProfileModalProps> = ({
  isOpen,
  onClose,
  currentMood,
  onSelectMood,
  onTestVoice,
}) => {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [pitch, setPitch] = useState<number>(1.0);
  const [rate, setRate] = useState<number>(0.96);

  useEffect(() => {
    if (isOpen) {
      const voices = companionAudio.getAvailableVoices();
      setAvailableVoices(voices);
      const settings = companionAudio.getVoiceSettings();
      setSelectedVoiceURI(settings.preferredVoiceURI || '');
      setPitch(settings.pitch || 1.0);
      setRate(settings.rate || 0.96);
    }
  }, [isOpen]);

  const handleVoiceChange = (uri: string) => {
    setSelectedVoiceURI(uri);
    companionAudio.setVoiceSettings(uri || null, pitch, rate);
  };

  const handlePitchChange = (p: number) => {
    setPitch(p);
    companionAudio.setVoiceSettings(selectedVoiceURI || null, p, rate);
  };

  const handleRateChange = (r: number) => {
    setRate(r);
    companionAudio.setVoiceSettings(selectedVoiceURI || null, pitch, r);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg p-6 sm:p-7 rounded-3xl bg-[#0A0510]/90 backdrop-blur-2xl border border-white/10 shadow-[0_0_60px_rgba(255,45,117,0.15)] flex flex-col gap-5 max-h-[90vh] overflow-y-auto no-scrollbar text-white">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Card */}
        <div className="flex items-center gap-4 pt-1">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF2D75] via-[#ff6b9a] to-[#00D2FF] p-0.5 shadow-lg shadow-[#FF2D75]/30">
            <div className="w-full h-full rounded-[14px] bg-[#0A0510] flex items-center justify-center">
              <Heart className="w-8 h-8 text-[#FF2D75] fill-[#FF2D75]/30" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white font-['Outfit'] tracking-tight">
                MYRAA
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#FF2D75]/20 text-[#FF2D75] text-xs font-semibold border border-[#FF2D75]/30">
                Rajesh's Companion
              </span>
            </div>
            <p className="text-xs text-white/50 mt-0.5">
              Warm, expressive & natural human voice cadence
            </p>
          </div>
        </div>

        {/* Anti-Robotic Voice Certified Badge */}
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <div className="font-semibold text-emerald-300">Natural Human Speech Active</div>
            <div className="text-emerald-200/70 text-[11px] leading-tight mt-0.5">
              Robotic pitch and mechanical tones removed. Conversational micro-pauses and warm acoustic resonance enabled.
            </div>
          </div>
        </div>

        {/* Voice Customization Settings */}
        <div className="p-4 rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 flex flex-col gap-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white/90 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-[#FF2D75]" />
              Voice Tone & Pitch Tuning
            </span>
            <span className="text-[11px] text-white/40 font-mono">
              Pitch: {pitch.toFixed(2)} • Rate: {rate.toFixed(2)}x
            </span>
          </div>

          {/* Voice Selector */}
          {availableVoices.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-white/70 text-[11px]">Natural Voice Profile:</label>
              <select
                value={selectedVoiceURI}
                onChange={(e) => handleVoiceChange(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-black/40 border border-white/15 text-white/90 text-xs focus:outline-none focus:border-[#FF2D75] cursor-pointer"
              >
                <option value="">Auto-Selected Warmest Neural Voice (Recommended)</option>
                {availableVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sliders for Pitch and Rate */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px] text-white/60">
                <span>Vocal Pitch</span>
                <span className="text-white/80 font-mono">{pitch === 1.0 ? 'Natural (1.0)' : pitch.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.9"
                max="1.1"
                step="0.02"
                value={pitch}
                onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
                className="w-full accent-[#FF2D75] cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px] text-white/60">
                <span>Speaking Rate</span>
                <span className="text-white/80 font-mono">{rate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.85"
                max="1.1"
                step="0.03"
                value={rate}
                onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                className="w-full accent-[#FF2D75] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Persona Traits */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3.5 rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 flex flex-col gap-1">
            <span className="text-[#FF2D75] font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Conversational Flow
            </span>
            <span className="text-white/80 leading-relaxed text-[11px]">
              Attentive & smooth phone-call rhythm with natural fillers ("haan", "achha")
            </span>
          </div>

          <div className="p-3.5 rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 flex flex-col gap-1">
            <span className="text-amber-300 font-semibold flex items-center gap-1.5">
              <MessageSquareHeart className="w-3.5 h-3.5" /> Language Style
            </span>
            <span className="text-white/80 leading-relaxed text-[11px]">
              Warm spoken Hinglish crafted personally for Rajesh
            </span>
          </div>
        </div>

        {/* Persona Rules */}
        <div className="p-4 rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 flex flex-col gap-2 text-xs">
          <span className="font-semibold text-white/90 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#FF2D75]" />
            Natural Human Speech Directives
          </span>
          <ul className="list-disc pl-4 space-y-1 text-white/70 leading-relaxed text-[11px]">
            <li><strong>Tone & Pitch:</strong> Expressive, playful & warm phone-call cadence; zero flat monotone drone.</li>
            <li><strong>Conversational Flow:</strong> Natural breathing rhythm with micro-pauses using commas and ellipses (...).</li>
            <li><strong>Expressive Fillers:</strong> Actively uses casual cues like "Achaa...", "Arre haan!", "Hmm...", "Suno...", "Sahi hai!".</li>
            <li><strong>Spoken Vocabulary:</strong> 100% everyday casual Hinglish (no heavy bookish words like "aavashyak" or "sahayata").</li>
            <li><strong>Short Bursts:</strong> Snappy sentences (5 to 10 words per sentence) for rapid, natural back-and-forth chat.</li>
          </ul>
        </div>

        {/* Vibe Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-white/70">
            Current Conversation Mood:
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {(['playful', 'flirty', 'caring', 'witty', 'sassy'] as PartnerMood[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onSelectMood(m)}
                className={`py-2 px-1 rounded-xl text-xs font-medium capitalize transition-all border backdrop-blur-md cursor-pointer ${
                  currentMood === m
                    ? 'bg-[#FF2D75]/20 text-white border-[#FF2D75] shadow-[0_0_15px_rgba(255,45,117,0.3)] font-semibold'
                    : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Test Voice Button */}
        <button
          type="button"
          onClick={onTestVoice}
          className="w-full py-3 rounded-2xl backdrop-blur-md bg-[#FF2D75]/20 hover:bg-[#FF2D75]/30 text-white font-medium text-xs flex items-center justify-center gap-2 border border-[#FF2D75]/40 transition-colors cursor-pointer shadow-[0_0_20px_rgba(255,45,117,0.2)]"
        >
          <Volume2 className="w-4 h-4 text-[#FF2D75]" />
          <span>Hear Voice Sample with Rajesh</span>
        </button>
      </div>
    </div>
  );
};
