/**
 * Audio synthesis, analysis, and sound effects for Myraa Voice Companion
 */

class SoundEffectPlayer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Sweet gentle call connect chime
  playConnectChime() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Note 1: E5 (659.25Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.18, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.45);

      // Note 2: G#5 (830.61Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(830.61, now + 0.12);
      gain2.gain.setValueAtTime(0.001, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.2, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.65);

      // Note 3: B5 (987.77Hz)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(987.77, now + 0.25);
      gain3.gain.setValueAtTime(0.001, now + 0.25);
      gain3.gain.exponentialRampToValueAtTime(0.22, now + 0.32);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.25);
      osc3.stop(now + 0.9);
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  // Gentle call end tone
  playDisconnectChime() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(392.00, now + 0.3); // G4
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // ignore
    }
  }

  // Function call trigger sound
  playActionChime() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(783.99, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    } catch {
      // ignore
    }
  }
}

export const soundEffects = new SoundEffectPlayer();

// Helper to sanitize and format text for natural spoken conversation
export function sanitizeSpokenText(text: string): string {
  return text
    .replace(/[*_#`~[\]()]/g, ' ') // strip markdown / brackets
    .replace(/https?:\/\/\S+/g, 'link') // replace raw urls with "link"
    .replace(/\.{3,}|…/g, ' ... ') // preserve ellipses for natural breathing pauses
    .replace(/—|–/g, ', ') // replace dashes with gentle pauses
    .replace(/\s+/g, ' ')
    .trim();
}

// Global voice cache
let cachedSpeechVoices: SpeechSynthesisVoice[] = [];
function refreshVoiceList() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const list = window.speechSynthesis.getVoices();
    if (list && list.length > 0) {
      cachedSpeechVoices = list;
    }
  }
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refreshVoiceList();
  window.speechSynthesis.onvoiceschanged = refreshVoiceList;
}

// Intelligent heuristic to select natural human voices and reject mechanical/robotic synths
export function selectBestNaturalVoice(preferredURI?: string | null): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  refreshVoiceList();
  const voices = cachedSpeechVoices.length > 0 ? cachedSpeechVoices : window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  if (preferredURI) {
    const matched = voices.find(v => v.voiceURI === preferredURI || v.name === preferredURI);
    if (matched) return matched;
  }

  // Filter out known mechanical/robotic synth names
  const nonRobotic = voices.filter(v => {
    const n = v.name.toLowerCase();
    return (
      !n.includes('espeak') &&
      !n.includes('robot') &&
      !n.includes('mechanical') &&
      !n.includes('sampler') &&
      !n.includes('klatt') &&
      !n.includes('synthesizer')
    );
  });

  const candidates = nonRobotic.length > 0 ? nonRobotic : voices;

  const scoreVoice = (v: SpeechSynthesisVoice): number => {
    let score = 0;
    const name = v.name.toLowerCase();
    const lang = (v.lang || '').toLowerCase();

    // High quality neural / natural / cloud speech voices
    if (name.includes('natural') || name.includes('online')) score += 60;
    if (name.includes('neural')) score += 55;
    if (name.includes('google')) score += 45;
    if (name.includes('siri') || name.includes('enhanced') || name.includes('premium')) score += 40;

    // Warm feminine voice names
    if (
      name.includes('female') ||
      name.includes('swara') ||
      name.includes('neerja') ||
      name.includes('priya') ||
      name.includes('kalpana') ||
      name.includes('aditi') ||
      name.includes('shruti') ||
      name.includes('ananya') ||
      name.includes('samantha') ||
      name.includes('jenny') ||
      name.includes('aria') ||
      name.includes('sonia') ||
      name.includes('karen') ||
      name.includes('victoria') ||
      name.includes('zira')
    ) {
      score += 35;
    }

    // Language priority for natural Hinglish
    if (lang.startsWith('hi')) score += 50;
    else if (lang === 'en-in' || lang.startsWith('en-in')) score += 45;
    else if (lang.startsWith('en-gb') || lang.startsWith('en-us')) score += 20;

    // Heavily penalize outdated mechanical desktop voices
    if (name.includes('david') || name.includes('mark') || name.includes('george')) score -= 30;
    if (name.includes('desktop')) score -= 25;

    return score;
  };

  const sorted = [...candidates].sort((a, b) => scoreVoice(b) - scoreVoice(a));
  return sorted[0] || null;
}

// Audio player for base64 audio with AnalyserNode for visualizer
export class CompanionAudioPlayer {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private isPlaying = false;
  private onEndCallbacks: (() => void)[] = [];
  private preferredVoiceURI: string | null = null;
  private customPitch = 1.0; // natural human pitch
  private customRate = 0.96; // warm, natural conversational cadence
  private fallbackPulseTimer: any = null;
  private currentPlaybackId = 0;
  private pauseTimeoutId: any = null;

  constructor() {
    try {
      this.preferredVoiceURI = localStorage.getItem('myraa_preferred_voice') || null;
      const savedPitch = localStorage.getItem('myraa_voice_pitch');
      if (savedPitch) this.customPitch = parseFloat(savedPitch);
      const savedRate = localStorage.getItem('myraa_voice_rate');
      if (savedRate) this.customRate = parseFloat(savedRate);
    } catch {}
  }

  public setVoiceSettings(uri: string | null, pitch?: number, rate?: number) {
    if (uri !== undefined) {
      this.preferredVoiceURI = uri;
      try {
        if (uri) localStorage.setItem('myraa_preferred_voice', uri);
        else localStorage.removeItem('myraa_preferred_voice');
      } catch {}
    }
    if (pitch !== undefined) {
      this.customPitch = pitch;
      try {
        localStorage.setItem('myraa_voice_pitch', pitch.toString());
      } catch {}
    }
    if (rate !== undefined) {
      this.customRate = rate;
      try {
        localStorage.setItem('myraa_voice_rate', rate.toString());
      } catch {}
    }
  }

  public getVoiceSettings() {
    return {
      preferredVoiceURI: this.preferredVoiceURI,
      pitch: this.customPitch,
      rate: this.customRate,
    };
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    refreshVoiceList();
    const voices = cachedSpeechVoices.length > 0 ? cachedSpeechVoices : (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : []);
    return voices.filter(v => {
      const n = v.name.toLowerCase();
      return !n.includes('espeak') && !n.includes('sampler') && !n.includes('klatt');
    });
  }

  private initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.8;
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(64);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);

    // If playing fallback speech synthesis, generate warm organic speech harmonics
    if (this.isPlaying && !this.audioElement) {
      const now = Date.now() / 150;
      for (let i = 0; i < data.length; i++) {
        const wave = Math.sin(now + i * 0.4) * 0.5 + 0.5;
        const jitter = Math.sin(now * 1.7 + i) * 0.25;
        data[i] = Math.min(255, Math.floor((wave + jitter + 0.2) * 160));
      }
    }

    return data;
  }

  public stop() {
    this.currentPlaybackId++;
    if (this.pauseTimeoutId) {
      clearTimeout(this.pauseTimeoutId);
      this.pauseTimeoutId = null;
    }

    if (this.fallbackPulseTimer) {
      clearInterval(this.fallbackPulseTimer);
      this.fallbackPulseTimer = null;
    }

    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch {
        // already stopped
      }
      this.currentSource = null;
    }

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.audioElement = null;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    this.isPlaying = false;
    this.triggerEnd();
  }

  public onEnded(cb: () => void) {
    this.onEndCallbacks.push(cb);
  }

  private triggerEnd() {
    const cbs = [...this.onEndCallbacks];
    this.onEndCallbacks = [];
    cbs.forEach(cb => cb());
  }

  public async playBase64Wav(base64Wav: string): Promise<void> {
    this.stop();
    this.initContext();
    this.isPlaying = true;

    try {
      const audioUrl = `data:audio/wav;base64,${base64Wav}`;
      const audio = new Audio(audioUrl);
      this.audioElement = audio;

      if (this.audioCtx && this.analyser) {
        try {
          const source = this.audioCtx.createMediaElementSource(audio);
          source.connect(this.analyser);
          this.analyser.connect(this.audioCtx.destination);
        } catch (sourceErr) {
          console.warn('Source connection note:', sourceErr);
        }
      }

      return new Promise<void>((resolve) => {
        audio.onended = () => {
          this.isPlaying = false;
          this.triggerEnd();
          resolve();
        };
        audio.onerror = (e) => {
          console.warn('Audio element error:', e);
          this.isPlaying = false;
          this.triggerEnd();
          resolve();
        };
        audio.play().catch(err => {
          console.warn('Audio play prevented:', err);
          this.isPlaying = false;
          this.triggerEnd();
          resolve();
        });
      });
    } catch (err) {
      console.warn('Playback error:', err);
      this.isPlaying = false;
      this.triggerEnd();
    }
  }

  // Natural human speech synthesis with dynamic pitch variation, breath pauses, and expressive rhythm
  public speakFallback(text: string): Promise<void> {
    this.stop();
    const playbackId = ++this.currentPlaybackId;

    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();

      const spokenClean = sanitizeSpokenText(text);
      if (!spokenClean) {
        resolve();
        return;
      }

      this.initContext();
      this.isPlaying = true;

      const bestVoice = selectBestNaturalVoice(this.preferredVoiceURI);
      const chunks = this.parseConversationalChunks(spokenClean);

      let chunkIdx = 0;

      const playNextChunk = () => {
        if (playbackId !== this.currentPlaybackId || !this.isPlaying) {
          resolve();
          return;
        }

        if (chunkIdx >= chunks.length) {
          this.isPlaying = false;
          this.triggerEnd();
          resolve();
          return;
        }

        const currentChunk = chunks[chunkIdx++];
        const utterance = new SpeechSynthesisUtterance(currentChunk.text);
        utterance.pitch = currentChunk.pitch;
        utterance.rate = currentChunk.rate;

        if (bestVoice) {
          utterance.voice = bestVoice;
          utterance.lang = bestVoice.lang;
        }

        utterance.onend = () => {
          if (playbackId !== this.currentPlaybackId) return;
          if (currentChunk.pauseMs > 0 && chunkIdx < chunks.length) {
            this.pauseTimeoutId = setTimeout(() => {
              playNextChunk();
            }, currentChunk.pauseMs);
          } else {
            playNextChunk();
          }
        };

        utterance.onerror = () => {
          if (playbackId !== this.currentPlaybackId) return;
          playNextChunk();
        };

        window.speechSynthesis.speak(utterance);
      };

      playNextChunk();
    });
  }

  // Splits spoken text into expressive human breath units and modulates pitch naturally
  private parseConversationalChunks(
    rawText: string
  ): { text: string; pitch: number; rate: number; pauseMs: number }[] {
    // Split into natural breath phrases by ellipses, exclamations, questions, or commas
    const rawSegments = rawText.split(/(?<=\.\.\.)|(?<=[.!?])|(?<=,\s)/g);
    const chunks: { text: string; pitch: number; rate: number; pauseMs: number }[] = [];

    for (const segment of rawSegments) {
      const trimmed = segment.replace(/\.\.\./g, '').trim();
      const hasEllipsis = segment.includes('...');
      if (!trimmed && !hasEllipsis) continue;

      if (!trimmed && hasEllipsis) {
        if (chunks.length > 0) {
          chunks[chunks.length - 1].pauseMs += 200;
        }
        continue;
      }

      const lower = trimmed.toLowerCase();
      let phrasePitch = this.customPitch;
      let phraseRate = this.customRate;
      let pauseMs = 120; // default breath pause

      // Expressive Fillers & Conversational Cues ("Achaa...", "Arre haan!", "Hmm...", "Suno...", "Sahi hai!")
      if (
        lower.startsWith('arre haan') ||
        lower.startsWith('arre waah') ||
        lower.startsWith('arre') ||
        lower.startsWith('achaa') ||
        lower.startsWith('achha') ||
        lower.startsWith('suno') ||
        lower.startsWith('sahi hai') ||
        lower.startsWith('sach mein') ||
        lower.startsWith('haanji')
      ) {
        phrasePitch = Math.min(1.15, this.customPitch * 1.05); // lively, expressive filler
        phraseRate = this.customRate * 1.02;
        pauseMs = 180;
      } else if (lower.startsWith('hmm')) {
        phrasePitch = this.customPitch * 0.98; // soft thoughtful filler
        phraseRate = this.customRate * 0.94;
        pauseMs = 220;
      } else if (trimmed.endsWith('?')) {
        phrasePitch = Math.min(1.14, this.customPitch * 1.05); // upward question inflection
        pauseMs = 180;
      } else if (trimmed.endsWith('!')) {
        phrasePitch = Math.min(1.12, this.customPitch * 1.03); // cheerful exclamation
        phraseRate = this.customRate * 1.02;
        pauseMs = 150;
      } else {
        phrasePitch = this.customPitch * 0.99; // relaxed warm conversational base
        pauseMs = 130;
      }

      if (hasEllipsis) {
        pauseMs = Math.max(pauseMs, 220); // authentic breathing pause on ellipses
      }

      chunks.push({
        text: trimmed,
        pitch: Number(phrasePitch.toFixed(2)),
        rate: Number(phraseRate.toFixed(2)),
        pauseMs,
      });
    }

    return chunks.length > 0
      ? chunks
      : [{ text: rawText, pitch: this.customPitch, rate: this.customRate, pauseMs: 0 }];
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const companionAudio = new CompanionAudioPlayer();
