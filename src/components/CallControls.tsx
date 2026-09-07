import React, { useState } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Send,
  Square,
  Radio,
  Sparkles,
} from 'lucide-react';
import { CallStatus, PartnerMood } from '../types';

interface CallControlsProps {
  callStatus: CallStatus;
  isMuted: boolean;
  isHandsFree: boolean;
  mood: PartnerMood;
  onStartCall: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleHandsFree: () => void;
  onStopSpeaking: () => void;
  onSendMessage: (text: string) => void;
  onPushToTalkStart?: () => void;
  onPushToTalkEnd?: () => void;
}

export const CallControls: React.FC<CallControlsProps> = ({
  callStatus,
  isMuted,
  isHandsFree,
  onStartCall,
  onEndCall,
  onToggleMute,
  onToggleHandsFree,
  onStopSpeaking,
  onSendMessage,
  onPushToTalkStart,
  onPushToTalkEnd,
}) => {
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);

  const isCallActive = callStatus !== 'idle' && callStatus !== 'ended';

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    onSendMessage(textInput.trim());
    setTextInput('');
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 flex flex-col gap-4">
      {/* Primary Voice Action Bar */}
      <div className="flex items-center justify-center gap-5 sm:gap-6">
        {/* Toggle Mute Button (when on call) */}
        {isCallActive && (
          <button
            type="button"
            onClick={onToggleMute}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border backdrop-blur-md cursor-pointer ${
              isMuted
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30 shadow-[0_0_25px_rgba(244,63,94,0.3)]'
                : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:text-white shadow-sm'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        )}

        {/* Central Master Button: Start Call or Push to Talk / Hangup */}
        {!isCallActive ? (
          <button
            type="button"
            onClick={onStartCall}
            className="w-20 h-20 sm:w-auto sm:px-8 sm:py-4 rounded-full bg-[#FF2D75] hover:bg-[#ff1a69] text-white font-semibold flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(255,45,117,0.45)] hover:shadow-[0_0_55px_rgba(255,45,117,0.65)] hover:scale-105 active:scale-95 transition-all text-base tracking-wide font-['Outfit'] cursor-pointer"
          >
            <Phone className="w-6 h-6 animate-pulse" />
            <span className="hidden sm:inline">Call Mayra</span>
          </button>
        ) : (
          <div className="flex items-center gap-4">
            {/* Push to talk or interrupt button */}
            {callStatus === 'speaking' ? (
              <button
                type="button"
                onClick={onStopSpeaking}
                title="Interrupt Mayra"
                className="px-6 py-3.5 rounded-full border border-amber-400/30 backdrop-blur-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-medium flex items-center gap-2 transition-all shadow-[0_0_25px_rgba(245,158,11,0.2)] text-sm cursor-pointer"
              >
                <Square className="w-4 h-4 fill-amber-300" />
                <span>Stop Speaking</span>
              </button>
            ) : (
              <button
                type="button"
                onMouseDown={onPushToTalkStart}
                onMouseUp={onPushToTalkEnd}
                onTouchStart={onPushToTalkStart}
                onTouchEnd={onPushToTalkEnd}
                className={`px-7 py-3.5 rounded-full font-semibold flex items-center gap-2.5 transition-all text-sm cursor-pointer ${
                  callStatus === 'listening'
                    ? 'bg-[#FF2D75] text-white shadow-[0_0_40px_rgba(255,45,117,0.6)] ring-4 ring-[#FF2D75]/30 scale-105'
                    : 'bg-[#FF2D75] text-white hover:bg-[#ff1a69] shadow-[0_0_35px_rgba(255,45,117,0.45)]'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>{callStatus === 'listening' ? 'Listening...' : 'Push to Talk'}</span>
              </button>
            )}

            {/* Hang up button */}
            <button
              type="button"
              onClick={onEndCall}
              title="End Voice Call"
              className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(225,29,72,0.4)] border border-rose-500/50 cursor-pointer"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Hands-Free continuous mode switch */}
        {isCallActive && (
          <button
            type="button"
            onClick={onToggleHandsFree}
            title={isHandsFree ? 'Hands-free Mode ON (Automatic mic)' : 'Push-to-Talk Mode (Manual mic)'}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border backdrop-blur-md cursor-pointer ${
              isHandsFree
                ? 'bg-[#00D2FF]/15 text-[#00D2FF] border-[#00D2FF]/40 shadow-[0_0_25px_rgba(0,210,255,0.25)]'
                : 'bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10 shadow-sm'
            }`}
          >
            <Radio className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Mode hint & keyboard fallback trigger */}
      <div className="flex items-center justify-between px-2 text-xs text-white/50">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#FF2D75]" />
          {isHandsFree ? 'Hands-Free voice active' : 'Push-to-talk enabled'}
        </span>
        <button
          type="button"
          onClick={() => setShowTextInput(!showTextInput)}
          className="text-[#FF2D75] hover:text-pink-300 transition-colors font-medium underline underline-offset-2 cursor-pointer"
        >
          {showTextInput ? 'Hide text bar' : 'Type message'}
        </button>
      </div>

      {/* Optional text message bar */}
      {showTextInput && (
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type in Hinglish or English (e.g., 'Arey Mayra open YouTube')..."
            className="w-full backdrop-blur-md bg-white/5 border border-white/10 rounded-full py-3 pl-5 pr-13 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#FF2D75] focus:ring-1 focus:ring-[#FF2D75] shadow-inner"
          />
          <button
            type="submit"
            disabled={!textInput.trim() || callStatus === 'processing'}
            className="absolute right-1.5 p-2.5 rounded-full bg-[#FF2D75] hover:bg-[#ff1a69] disabled:opacity-40 disabled:hover:bg-[#FF2D75] text-white transition-all shadow-[0_0_15px_rgba(255,45,117,0.35)] cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
};
