import React, { useEffect } from 'react';
import { ExternalLink, X, CheckCircle2, ArrowUpRight, Sparkles } from 'lucide-react';
import { ToolCallItem } from '../types';

interface AppLauncherModalProps {
  toolCall: ToolCallItem | null;
  onClose: () => void;
}

export const AppLauncherModal: React.FC<AppLauncherModalProps> = ({
  toolCall,
  onClose,
}) => {
  if (!toolCall) return null;

  let appName = toolCall.args?.app_name;
  let url = toolCall.args?.url || toolCall.args?.url_scheme;

  if (toolCall.name === 'open_website') {
    url = toolCall.args?.url || 'https://google.com';
    try {
      const parsed = new URL(url);
      appName = parsed.hostname.replace(/^www\./, '');
    } catch {
      appName = 'Website';
    }
  } else if (toolCall.name === 'open_app') {
    appName = toolCall.args?.app_name || 'Application';
    if (!url) {
      const lower = appName.toLowerCase();
      if (lower.includes('youtube')) url = 'https://www.youtube.com';
      else if (lower.includes('whatsapp')) url = 'https://web.whatsapp.com';
      else if (lower.includes('spotify')) url = 'https://open.spotify.com';
      else if (lower.includes('instagram')) url = 'https://www.instagram.com';
      else if (lower.includes('map')) url = 'https://maps.google.com';
      else if (lower.includes('twitter') || lower === 'x') url = 'https://x.com';
      else if (lower.includes('github')) url = 'https://github.com';
      else if (lower.includes('netflix')) url = 'https://www.netflix.com';
      else url = `https://www.google.com/search?q=${encodeURIComponent(appName)}`;
    }
  } else {
    appName = appName || 'Application';
    url = url || 'https://google.com';
  }

  const query = toolCall.args?.query;

  // Try to automatically open in a new tab if allowed
  useEffect(() => {
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      // Browser popup blocker might require user click
    }
  }, [url]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-md p-6 sm:p-7 rounded-3xl bg-[#0A0510]/90 backdrop-blur-2xl border border-white/10 shadow-[0_0_60px_rgba(255,45,117,0.2)] flex flex-col gap-4 text-center text-white">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF2D75] via-[#ff6b9a] to-[#00D2FF] p-0.5 flex items-center justify-center shadow-lg shadow-[#FF2D75]/30">
          <div className="w-full h-full rounded-[14px] bg-[#0A0510] flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-[#FF2D75]" />
          </div>
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Function Invoked by Mayra</span>
          </div>
          <h2 className="text-xl font-bold text-white font-['Outfit'] tracking-tight">
            Opening {appName}
          </h2>
          {query ? (
            <p className="text-sm text-pink-300 mt-1">
              Search / Action: <span className="font-semibold text-white">"{query}"</span>
            </p>
          ) : (
            <p className="text-xs text-white/50 mt-1">
              Navigating directly to requested application
            </p>
          )}
        </div>

        <div className="p-3 rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 text-xs text-white/60 font-mono truncate text-left">
          {url}
        </div>

        {/* Direct Launch Button */}
        <div className="flex flex-col sm:flex-row gap-2.5 mt-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex-1 py-3.5 px-5 rounded-full bg-[#FF2D75] hover:bg-[#ff1a69] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(255,45,117,0.4)] transition-all cursor-pointer"
          >
            <span>Launch {appName}</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="py-3.5 px-5 rounded-full backdrop-blur-md bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 font-medium text-sm transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
