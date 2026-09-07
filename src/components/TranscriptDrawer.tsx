import React, { useRef, useEffect } from 'react';
import { ExternalLink, Bot, User, CheckCircle2, Volume2, Sparkles } from 'lucide-react';
import { ChatMessage, ToolCallItem } from '../types';

interface TranscriptDrawerProps {
  messages: ChatMessage[];
  liveUserTranscript?: string;
  isProcessing?: boolean;
  onOpenAppUrl?: (toolCall: ToolCallItem) => void;
  onReplayAudio?: (msg: ChatMessage) => void;
}

export const TranscriptDrawer: React.FC<TranscriptDrawerProps> = ({
  messages,
  liveUserTranscript,
  isProcessing,
  onOpenAppUrl,
  onReplayAudio,
}) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveUserTranscript, isProcessing]);

  if (messages.length === 0 && !liveUserTranscript) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-6 text-center text-white/40 text-xs">
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-center gap-2 mb-1.5 text-white/80 font-medium">
            <Sparkles className="w-4 h-4 text-[#FF2D75]" />
            <span>Call or speak to hear Myraa in real-time Hinglish, Hindi, English, or Odia</span>
          </div>
          <p className="text-white/40">
            Your spoken conversation and app triggers will appear here in real-time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-2 flex flex-col gap-3">
      <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
          Spoken Conversation Stream
        </span>
        <span className="text-[10px] text-white/40">
          {messages.length} exchanges
        </span>
      </div>

      <div className="flex flex-col gap-3.5 max-h-72 overflow-y-auto pr-1 no-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col gap-1.5 ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[11px] text-white/50">
              {msg.role === 'assistant' ? (
                <>
                  <Bot className="w-3.5 h-3.5 text-[#FF2D75]" />
                  <span className="font-semibold text-white/90">Myraa</span>
                  {msg.mood && (
                    <span className="text-[10px] text-white/40 uppercase tracking-wider font-mono">
                      • {msg.mood}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="font-medium text-white/70">You</span>
                  <User className="w-3.5 h-3.5 text-white/40" />
                </>
              )}
              <span className="text-[10px] text-white/30">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Frosted Bubble */}
            <div
              className={`p-4 rounded-2xl text-sm leading-relaxed max-w-[88%] shadow-lg ${
                msg.role === 'user'
                  ? 'backdrop-blur-md bg-white/5 border border-white/10 text-white/90 rounded-tr-sm'
                  : 'backdrop-blur-xl bg-white/[0.08] border border-[#FF2D75]/25 text-white rounded-tl-sm shadow-[0_4px_30px_rgba(0,0,0,0.3)]'
              }`}
            >
              <p className="whitespace-pre-wrap font-light tracking-wide">{msg.text}</p>

              {/* Function Tool Calls invoked */}
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-col gap-1.5">
                  {msg.toolCalls.map((tc, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl backdrop-blur-md bg-white/5 border border-[#FF2D75]/30 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div className="truncate">
                          <span className="font-semibold text-white">
                            {tc.name === 'open_app'
                              ? `Opened ${tc.args?.app_name || 'App'}`
                              : tc.name === 'open_website'
                              ? `Opened ${tc.args?.url || 'Website'}`
                              : tc.name === 'open_app_or_website'
                              ? `Opened ${tc.args?.app_name || 'App'}`
                              : tc.name === 'set_reminder'
                              ? `Reminder: ${tc.args?.title}`
                              : 'Saved Memory'}
                          </span>
                          {tc.args?.query && (
                            <span className="text-white/50 text-[11px] block truncate">
                              Search: "{tc.args.query}"
                            </span>
                          )}
                        </div>
                      </div>

                      {(tc.args?.url || tc.args?.url_scheme) && (
                        <button
                          type="button"
                          onClick={() => onOpenAppUrl?.(tc)}
                          className="px-2.5 py-1 rounded-full bg-[#FF2D75] hover:bg-[#ff1a69] text-white font-medium flex items-center gap-1 text-[11px] shrink-0 transition-colors shadow-sm cursor-pointer"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Replay voice button */}
              {msg.audioBase64 && onReplayAudio && (
                <div className="mt-2 pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onReplayAudio(msg)}
                    className="text-[11px] text-[#FF2D75] hover:text-pink-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Replay Voice</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Live speech transcription preview while user is speaking */}
        {liveUserTranscript && (
          <div className="flex flex-col gap-1.5 items-end opacity-90">
            <div className="flex items-center gap-1 text-[11px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-medium">Hearing you...</span>
            </div>
            <div className="p-3.5 rounded-2xl backdrop-blur-md bg-emerald-500/10 border border-emerald-400/30 text-sm text-white rounded-tr-sm italic">
              "{liveUserTranscript}"
            </div>
          </div>
        )}

        {/* Thinking / Mayra processing indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-[#FF2D75] py-1.5 pl-1">
            <span className="w-2 h-2 rounded-full bg-[#FF2D75] animate-ping" />
            <span>Mayra is thinking what witty thing to say...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};
