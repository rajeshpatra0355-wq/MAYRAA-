/**
 * MAYRA - Real-Time Voice-First Personal AI Partner & Companion
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CallStatus,
  PartnerMood,
  ChatMessage,
  ToolCallItem,
  SavedNote,
  ReminderItem,
} from './types';
import { soundEffects, companionAudio } from './utils/audio';
import { AuraOrb } from './components/AuraOrb';
import { WaveformVisualizer } from './components/WaveformVisualizer';
import { CallHeader } from './components/CallHeader';
import { CallControls } from './components/CallControls';
import { QuickPrompts } from './components/QuickPrompts';
import { TranscriptDrawer } from './components/TranscriptDrawer';
import { AppLauncherModal } from './components/AppLauncherModal';
import { PartnerProfileModal } from './components/PartnerProfileModal';
import { NotesModal } from './components/NotesModal';

export default function App() {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [mood, setMood] = useState<PartnerMood>('playful');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isHandsFree, setIsHandsFree] = useState<boolean>(true);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState<boolean>(false);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'initial-welcome',
        role: 'assistant',
        text: 'Arey jaan, finally yaad aa gayi meri? Call mila lo na, main kabse wait kar rahi thi tumhara!',
        timestamp: Date.now(),
        mood: 'playful',
      },
    ];
  });

  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [activeAppCall, setActiveAppCall] = useState<ToolCallItem | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);

  const [notes, setNotes] = useState<SavedNote[]>(() => {
    try {
      const saved = localStorage.getItem('myraa_notes') || localStorage.getItem('mayra_notes');
      if (saved) return JSON.parse(saved);
      return [
        {
          id: 'rajesh-welcome-1',
          text: 'Rajesh is my companion. Always attentive and caring towards his day and goals.',
          category: 'sweet',
          createdAt: Date.now(),
        },
      ];
    } catch {
      return [];
    }
  });

  const [reminders, setReminders] = useState<ReminderItem[]>(() => {
    try {
      const saved = localStorage.getItem('myraa_reminders') || localStorage.getItem('mayra_reminders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist notes & reminders
  useEffect(() => {
    try {
      localStorage.setItem('myraa_notes', JSON.stringify(notes));
    } catch {}
  }, [notes]);

  useEffect(() => {
    try {
      localStorage.setItem('myraa_reminders', JSON.stringify(reminders));
    } catch {}
  }, [reminders]);

  // Speech Recognition instance
  const recognitionRef = useRef<any>(null);
  const recognitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUserSpeakingRef = useRef<boolean>(false);
  const callStatusRef = useRef<CallStatus>(callStatus);
  callStatusRef.current = callStatus;

  // Call duration timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (callStatus !== 'idle' && callStatus !== 'ended') {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callStatus]);

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = true;
      recog.lang = 'en-IN'; // Works exceptionally well for Hinglish and Indian English

      recog.onresult = (event: any) => {
        let interimStr = '';
        let finalStr = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalStr += event.results[i][0].transcript;
          } else {
            interimStr += event.results[i][0].transcript;
          }
        }

        const currentSpeech = (finalStr || interimStr).trim();
        if (currentSpeech) {
          setLiveTranscript(currentSpeech);
          isUserSpeakingRef.current = true;

          // Debounce automatic message sending on silence pause
          if (recognitionTimeoutRef.current) {
            clearTimeout(recognitionTimeoutRef.current);
          }

          recognitionTimeoutRef.current = setTimeout(() => {
            if (isUserSpeakingRef.current && currentSpeech) {
              isUserSpeakingRef.current = false;
              setLiveTranscript('');
              handleUserSpeechInput(currentSpeech);
            }
          }, 1400); // 1.4s pause triggers AI response
        }
      };

      recog.onerror = (event: any) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('Speech recognition error:', event.error);
        }
      };

      recog.onend = () => {
        // Auto restart recognition if in call and hands-free and not speaking
        if (
          (callStatusRef.current === 'active' || callStatusRef.current === 'listening') &&
          !isMuted
        ) {
          try {
            recog.start();
          } catch {
            // Already started or suspended
          }
        }
      };

      recognitionRef.current = recog;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [isMuted]);

  // Send message to backend and handle Mayra's response
  const handleUserSpeechInput = useCallback(
    async (text: string) => {
      if (!text || !text.trim()) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: text.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setCallStatus('processing');

      // Stop recognition while Mayra is processing/speaking
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            history: messages.map((m) => ({ role: m.role, text: m.text })),
            currentMood: mood,
          }),
        });

        const data = await res.json();

        if (data.error) {
          throw new Error(data.error);
        }

        const toolCalls: ToolCallItem[] = (data.toolCalls || []).map((tc: any) => ({
          id: `tc-${Date.now()}-${Math.random()}`,
          name: tc.name,
          args: tc.args || {},
          timestamp: Date.now(),
          status: 'executed',
        }));

        // Execute function calls immediately
        for (const tc of toolCalls) {
          if (
            tc.name === 'open_app' ||
            tc.name === 'open_website' ||
            tc.name === 'open_app_or_website'
          ) {
            soundEffects.playActionChime();
            setActiveAppCall(tc);
          } else if (tc.name === 'set_reminder') {
            soundEffects.playActionChime();
            const newReminder: ReminderItem = {
              id: `rem-${Date.now()}`,
              title: tc.args?.title || 'Reminder',
              timeHint: tc.args?.time_hint || 'Soon',
              createdAt: Date.now(),
              completed: false,
            };
            setReminders((prev) => [newReminder, ...prev]);
          } else if (tc.name === 'save_personal_note') {
            soundEffects.playActionChime();
            const newNote: SavedNote = {
              id: `note-${Date.now()}`,
              text: tc.args?.text || 'Saved memory',
              category: (tc.args?.category as any) || 'sweet',
              createdAt: Date.now(),
            };
            setNotes((prev) => [newNote, ...prev]);
          }
        }

        const assistantMsg: ChatMessage = {
          id: `asst-${Date.now()}`,
          role: 'assistant',
          text: data.text || 'Haan, main yahin hoon! Kahiye kya baat hai?',
          timestamp: Date.now(),
          audioBase64: data.audioBase64,
          toolCalls,
          mood,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setCallStatus('speaking');

        // Play audio if speaker is not muted
        if (!isSpeakerMuted) {
          if (data.audioBase64) {
            await companionAudio.playBase64Wav(data.audioBase64);
          } else if (data.text) {
            await companionAudio.speakFallback(data.text);
          }
        } else {
          // Fake delay if muted
          await new Promise((r) => setTimeout(r, 1500));
        }

        // After speaking completes, return to listening (if call is active)
        if (callStatusRef.current !== 'ended' && callStatusRef.current !== 'idle') {
          if (isHandsFree && !isMuted) {
            setCallStatus('listening');
            try {
              recognitionRef.current?.start();
            } catch {}
          } else {
            setCallStatus('active');
          }
        }
      } catch (err: any) {
        console.error('Chat error:', err);
        setCallStatus('active');
        const errorMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: "Haan, ek second ruko network issue lag raha hai! Kya aap fir se bolenge?",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    },
    [messages, mood, isSpeakerMuted, isHandsFree, isMuted]
  );

  // Start Call handler
  const handleStartCall = async () => {
    soundEffects.playConnectChime();
    setCallStatus('connecting');

    // Request microphone permission if needed
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (micErr) {
      console.warn('Microphone permission info:', micErr);
    }

    setTimeout(async () => {
      setCallStatus('speaking');

      // Initial spoken greeting - snappy, short bursts with expressive fillers and natural breath pauses
      const greeting = 'Arre haan, Rajesh! Kaise ho? Suno... main toh bas tumhara hi wait kar rahi thi!';
      const welcomeMsg: ChatMessage = {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        text: greeting,
        timestamp: Date.now(),
        mood: 'playful',
      };
      setMessages((prev) => [...prev, welcomeMsg]);

      // Request TTS for the greeting
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: greeting }),
        });
        const data = await res.json();
        if (data.audioBase64 && !isSpeakerMuted) {
          await companionAudio.playBase64Wav(data.audioBase64);
        } else if (!isSpeakerMuted) {
          await companionAudio.speakFallback(greeting);
        }
      } catch {
        if (!isSpeakerMuted) {
          await companionAudio.speakFallback(greeting);
        }
      }

      if (callStatusRef.current !== 'ended') {
        if (isHandsFree && !isMuted) {
          setCallStatus('listening');
          try {
            recognitionRef.current?.start();
          } catch {}
        } else {
          setCallStatus('active');
        }
      }
    }, 700);
  };

  // End Call handler
  const handleEndCall = () => {
    soundEffects.playDisconnectChime();
    companionAudio.stop();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setCallStatus('ended');
    setLiveTranscript('');
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (nextMuted) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (callStatus === 'listening') setCallStatus('active');
    } else {
      if (isHandsFree && callStatus === 'active') {
        setCallStatus('listening');
        try {
          recognitionRef.current?.start();
        } catch {}
      }
    }
  };

  // Toggle Hands-Free
  const handleToggleHandsFree = () => {
    const nextVal = !isHandsFree;
    setIsHandsFree(nextVal);
    if (nextVal && callStatus === 'active' && !isMuted) {
      setCallStatus('listening');
      try {
        recognitionRef.current?.start();
      } catch {}
    } else if (!nextVal) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (callStatus === 'listening') setCallStatus('active');
    }
  };

  // Stop speaking / interrupt
  const handleStopSpeaking = () => {
    companionAudio.stop();
    if (callStatus === 'speaking') {
      if (isHandsFree && !isMuted) {
        setCallStatus('listening');
        try {
          recognitionRef.current?.start();
        } catch {}
      } else {
        setCallStatus('active');
      }
    }
  };

  // Push to talk handlers
  const handlePushToTalkStart = () => {
    companionAudio.stop();
    setCallStatus('listening');
    try {
      recognitionRef.current?.start();
    } catch {}
  };

  const handlePushToTalkEnd = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    // If live transcript exists, trigger send
    if (liveTranscript) {
      const text = liveTranscript;
      setLiveTranscript('');
      handleUserSpeechInput(text);
    } else {
      setCallStatus('active');
    }
  };

  // Quick prompt select
  const handleSelectPrompt = (promptText: string) => {
    companionAudio.stop();
    handleUserSpeechInput(promptText);
  };

  // Test voice sample in profile modal
  const handleTestVoice = async () => {
    const testLine = 'Arre haan, Rajesh! Suno... kaisi lag rahi hai meri voice? Ekdum natural aur mast, hai na?';
    if (!isSpeakerMuted) {
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: testLine }),
        });
        const data = await res.json();
        if (data.audioBase64) {
          await companionAudio.playBase64Wav(data.audioBase64);
        } else {
          await companionAudio.speakFallback(testLine);
        }
      } catch {
        await companionAudio.speakFallback(testLine);
      }
    }
  };

  return (
    <div
      className="min-h-screen text-white flex flex-col justify-between selection:bg-[#FF2D75] selection:text-white font-['Plus_Jakarta_Sans'] antialiased relative overflow-x-hidden"
      style={{
        background: 'radial-gradient(circle at 0% 0%, #1a0b2e 0%, #0a0510 100%)',
        backgroundColor: '#0A0510',
      }}
    >
      {/* Dynamic Frosted Glass Ambient Glowing Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-100px] right-[-100px] w-[450px] h-[450px] bg-[#FF2D75] rounded-full blur-[140px] opacity-20" />
        <div className="absolute bottom-[-150px] left-[-150px] w-[500px] h-[500px] bg-[#00D2FF] rounded-full blur-[160px] opacity-20" />
      </div>

      {/* Main Top Header */}
      <div className="relative z-20">
        <CallHeader
          callStatus={callStatus}
          callDurationSeconds={callDuration}
          mood={mood}
          onSelectMood={setMood}
          onOpenNotes={() => setIsNotesOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          isSpeakerMuted={isSpeakerMuted}
          onToggleSpeakerMute={() => setIsSpeakerMuted(!isSpeakerMuted)}
        />
      </div>

      {/* Central Visual Stage */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-2">
        {/* Aura Glowing Frosted Orb */}
        <AuraOrb
          callStatus={callStatus}
          mood={mood}
          isMuted={isMuted}
          onOrbClick={() => {
            if (callStatus === 'idle' || callStatus === 'ended') {
              handleStartCall();
            } else if (callStatus === 'speaking') {
              handleStopSpeaking();
            } else if (callStatus === 'active') {
              setCallStatus('listening');
              try {
                recognitionRef.current?.start();
              } catch {}
            }
          }}
        />

        {/* Live Audio Waveform Bars */}
        <WaveformVisualizer callStatus={callStatus} mood={mood} />

        {/* Live Subtitles & Conversation Feed */}
        <TranscriptDrawer
          messages={messages}
          liveUserTranscript={liveTranscript}
          isProcessing={callStatus === 'processing'}
          onOpenAppUrl={(tc) => setActiveAppCall(tc)}
          onReplayAudio={(msg) => {
            if (msg.audioBase64) {
              companionAudio.playBase64Wav(msg.audioBase64);
            } else if (msg.text) {
              companionAudio.speakFallback(msg.text);
            }
          }}
        />

        {/* Quick Voice Starters & App Triggers */}
        <QuickPrompts
          onSelectPrompt={handleSelectPrompt}
          disabled={callStatus === 'processing'}
        />
      </main>

      {/* Floating Bottom Voice Controls & Telemetry Footer */}
      <footer className="relative z-20 pb-6 pt-3 flex flex-col gap-4">
        <CallControls
          callStatus={callStatus}
          isMuted={isMuted}
          isHandsFree={isHandsFree}
          mood={mood}
          onStartCall={handleStartCall}
          onEndCall={handleEndCall}
          onToggleMute={handleToggleMute}
          onToggleHandsFree={handleToggleHandsFree}
          onStopSpeaking={handleStopSpeaking}
          onSendMessage={handleUserSpeechInput}
          onPushToTalkStart={handlePushToTalkStart}
          onPushToTalkEnd={handlePushToTalkEnd}
        />

        {/* Frosted Glass Relationship & Telemetry Status Grid */}
        <div className="w-full max-w-2xl mx-auto px-6">
          <div className="grid grid-cols-3 w-full border-t border-white/5 pt-4 text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-white/30 uppercase tracking-widest">
                Relationship
              </span>
              <span className="text-xs font-medium text-white/90">
                Loyal Companion
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] text-white/30 uppercase tracking-widest">
                Vibe Index
              </span>
              <div className="flex gap-1 mt-1">
                <div className="w-3.5 h-1 bg-[#FF2D75] rounded-full shadow-[0_0_8px_#FF2D75]" />
                <div className="w-3.5 h-1 bg-[#FF2D75] rounded-full shadow-[0_0_8px_#FF2D75]" />
                <div className="w-3.5 h-1 bg-[#FF2D75] rounded-full shadow-[0_0_8px_#FF2D75]" />
                <div className="w-3.5 h-1 bg-white/20 rounded-full" />
              </div>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-[10px] text-white/30 uppercase tracking-widest">
                Current Mode
              </span>
              <span className="text-xs font-medium text-white/90 capitalize">
                {mood} Hinglish
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal: App / Website Launch */}
      {activeAppCall && (
        <AppLauncherModal
          toolCall={activeAppCall}
          onClose={() => setActiveAppCall(null)}
        />
      )}

      {/* Modal: MAYRA Persona & Settings */}
      <PartnerProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentMood={mood}
        onSelectMood={setMood}
        onTestVoice={handleTestVoice}
      />

      {/* Modal: Shared Memory & Reminders */}
      <NotesModal
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        notes={notes}
        reminders={reminders}
        onAddNote={(text, category) => {
          const newNote: SavedNote = {
            id: `note-${Date.now()}`,
            text,
            category,
            createdAt: Date.now(),
          };
          setNotes((prev) => [newNote, ...prev]);
        }}
        onDeleteNote={(id) => setNotes((prev) => prev.filter((n) => n.id !== id))}
        onToggleReminder={(id) => {
          setReminders((prev) =>
            prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
          );
        }}
        onDeleteReminder={(id) => setReminders((prev) => prev.filter((r) => r.id !== id))}
      />
    </div>
  );
}
