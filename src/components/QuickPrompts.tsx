import React from 'react';
import { ExternalLink, Flame, MessageCircle, Music, Compass, Heart, Bell } from 'lucide-react';

interface QuickPromptsProps {
  onSelectPrompt: (promptText: string) => void;
  disabled?: boolean;
}

export const QuickPrompts: React.FC<QuickPromptsProps> = ({
  onSelectPrompt,
  disabled = false,
}) => {
  const promptList = [
    {
      text: 'Suno Myraa, YouTube par mast music chalao na',
      icon: <Music className="w-3.5 h-3.5 text-rose-400" />,
      tag: 'YouTube',
      isApp: true,
    },
    {
      text: 'Arre Myraa, Spotify kholo',
      icon: <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />,
      tag: 'Spotify',
      isApp: true,
    },
    {
      text: 'Myraa, kaisi ho? Sab theek chal raha hai na?',
      icon: <Heart className="w-3.5 h-3.5 text-pink-400" />,
      tag: 'Casual Talk',
    },
    {
      text: 'Suno, Maps par aas-paas ke coffee spots dikhao',
      icon: <Compass className="w-3.5 h-3.5 text-blue-400" />,
      tag: 'Maps',
      isApp: true,
    },
    {
      text: 'Arre haan! Ek zaroori break ka reminder laga do',
      icon: <Bell className="w-3.5 h-3.5 text-amber-400" />,
      tag: 'Reminder',
    },
    {
      text: 'Myraa, WhatsApp open karo',
      icon: <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />,
      tag: 'WhatsApp',
      isApp: true,
    },
    {
      text: 'Suno Myraa, kuch mast aur interesting batao na!',
      icon: <Flame className="w-3.5 h-3.5 text-orange-400" />,
      tag: 'Banter',
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto px-4 mt-4">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-semibold text-white/40 tracking-[0.2em] uppercase flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5 text-[#FF2D75]" />
          Quick Voice Prompts & App Triggers
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {promptList.map((item, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelectPrompt(item.text)}
            className="group px-3.5 py-1.5 rounded-full backdrop-blur-md bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 hover:border-[#FF2D75]/40 text-xs font-medium transition-all flex items-center gap-2 shadow-sm disabled:opacity-40 text-left cursor-pointer"
          >
            <span>{item.icon}</span>
            <span className="truncate max-w-[240px] sm:max-w-[320px]">{item.text}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 group-hover:bg-[#FF2D75]/20 text-white/50 group-hover:text-pink-300 font-medium">
              {item.tag}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
