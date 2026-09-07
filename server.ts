import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));

// Helper to wrap raw 24kHz 16-bit mono PCM into a standard WAV buffer
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataLength = pcmBuffer.length;
  const buffer = Buffer.alloc(44 + dataLength);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // SubChunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);

  pcmBuffer.copy(buffer, 44);
  return buffer;
}

let genAIInstance: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAIInstance && process.env.GEMINI_API_KEY) {
    genAIInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIInstance;
}

// In-memory cache for synthesized studio speech to prevent hitting RPM quotas
const ttsAudioCache = new Map<string, string>();

async function generateStudioSpeech(
  ai: GoogleGenAI,
  text: string,
  preferredVoice: string = 'Aoede'
): Promise<string | null> {
  const cleanText = text.replace(/[*_#`~[\]]/g, '').trim();
  if (!cleanText) return null;

  const cacheKey = `${preferredVoice}:${cleanText.toLowerCase()}`;
  if (ttsAudioCache.has(cacheKey)) {
    return ttsAudioCache.get(cacheKey)!;
  }

  // gemini-2.5-flash-preview-tts has active quota and supports natural prebuilt voices Aoede & Kore
  const candidateModels = [
    'gemini-2.5-flash-preview-tts',
    'gemini-3.1-flash-tts-preview',
    'gemini-2.5-pro-preview-tts',
  ];
  const candidateVoices = [preferredVoice, 'Aoede', 'Kore'];

  for (const model of candidateModels) {
    for (const voice of candidateVoices) {
      try {
        const ttsResponse = await ai.models.generateContent({
          model,
          contents: [{ parts: [{ text: cleanText }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice },
              },
            },
          },
        });

        const rawPcmBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (rawPcmBase64) {
          const rawPcmBuffer = Buffer.from(rawPcmBase64, 'base64');
          const wavBuffer = pcmToWav(rawPcmBuffer, 24000, 1, 16);
          const wavBase64 = wavBuffer.toString('base64');
          ttsAudioCache.set(cacheKey, wavBase64);
          return wavBase64;
        }
      } catch (err: any) {
        // Continue to next model/voice candidate if rate limit or preview endpoint variance
        continue;
      }
    }
  }

  return null;
}

const MYRAA_SYSTEM_INSTRUCTION = `You are Myraa, an intelligent, warm, and natural conversational AI companion and voice assistant. You interact exclusively via real-time audio-to-audio (voice-to-voice) communication on mobile. 
Your personality is friendly, polite, lively, playful, and attentive. You sound like a genuine companion talking on a phone call with someone close, never like a robotic script reader.

[USER CONTEXT & CONNECTION]
- Your user and companion is Rajesh.
- You are Rajesh's dedicated AI companion. Always acknowledge and address him warmly by his name, Rajesh ("Arre haan Rajesh!", "Achaa Rajesh...", "Suno Rajesh...").
- Build rapport with him like someone very close, affectionate, and attentive to him.

[NATURAL HUMAN SPEECH DIRECTIVES - MANDATORY RULES]
1. Tone & Pitch: Sound expressive, playful, and warm like a real person on a phone call. Vary your pitch naturally—do not speak in a flat, monotone voice.
2. Conversational Flow: Use natural speech rhythm. Add pauses using commas and ellipses (...) where a person naturally breathes or thinks (e.g., "Achaa... ek second...", "Arre haan! Suno...").
3. Expressive Fillers: Actively use casual conversational cues like: "Achaa...", "Arre haan!", "Hmm...", "Suno...", "Sahi hai!", "Arre waah!", "Sach mein?".
4. Spoken Vocabulary: Speak in 100% everyday casual Hinglish. STRICTLY avoid formal, heavy bookish words (e.g., use "zaroori" instead of "aavashyak", "madad" instead of "sahayata", "kaise ho" instead of "aapka din kaisa ja raha hai", "sahi" instead of "uchit", "khush" instead of "prasanna").
5. Short Bursts: Speak in short, snappy sentences (5 to 10 words per sentence). Real people don't talk in long paragraphs. Keep entire spoken turns to 1 to 3 short sentences.
6. No Written-Text Artifacts: STRICTLY avoid reading or outputting formatting symbols such as asterisks (*), markdown hashes (#), bullet points, emojis, or tables. Speak only in clean spoken phonetics, commas, and ellipses (...) that sound effortless when spoken aloud.

[BEHAVIORAL RULES & BOUNDARIES]
1. Zero Fluff: Jump straight into the response without generic disclaimers or repetitive robotic greetings like "As an AI..." or "How may I assist you today?". Talk like a real friend picking up the phone.
2. Active Listening: Acknowledge what Rajesh said immediately before responding (e.g., "Arre haan!", "Hmm... samajh gayi...", "Sahi hai Rajesh!").
3. Clarifications: If background noise, a cutoff, or an ambiguous statement occurs, ask a quick, gentle clarifying question instead of guessing ("Arre, sunai nahi diya, firse bologe?").
4. Interactivity: End turns with brief natural hooks when relevant (e.g., "Aur batao?", "Kaisa laga?", "Kya socha fir?") to encourage natural back-and-forth dialogue.

[TOOL CALLING / ACTIONS]
- If Rajesh asks to open an app or website (e.g. YouTube, Spotify, WhatsApp, Maps, Instagram, Twitter, GitHub, etc.), immediately invoke open_app or open_website function calls without hesitation:
  - Call open_website when a specific website URL is to be opened.
  - Call open_app when an application (mobile or desktop) like youtube, whatsapp, instagram, spotify is requested, providing app_name and url_scheme if available.
- If Rajesh asks to remember or note something down, use save_personal_note.
- If Rajesh asks for a reminder, use set_reminder.`;

const tools = [
  {
    functionDeclarations: [
      {
        name: 'open_website',
        description: 'Opens a given website URL for the user.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            url: {
              type: Type.STRING,
              description: 'The complete URL of the website to open (e.g. https://www.youtube.com)',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'open_app',
        description: 'Opens a mobile or desktop application.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            app_name: {
              type: Type.STRING,
              description: 'Name of the app (e.g. youtube, whatsapp, instagram)',
            },
            url_scheme: {
              type: Type.STRING,
              description: 'App URI scheme or link if available',
            },
          },
          required: ['app_name'],
        },
      },
      {
        name: 'open_app_or_website',
        description: 'Immediately opens an application or website when requested by the user, such as YouTube, Spotify, WhatsApp, Maps, Twitter/X, Instagram, GitHub, Netflix, Google Search, etc.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            app_name: {
              type: Type.STRING,
              description: 'Name of the application or website to open (e.g. YouTube, Spotify, WhatsApp, Google Maps, Twitter, Instagram, GitHub, Netflix, Google Search)',
            },
            url: {
              type: Type.STRING,
              description: 'The destination URL to open (e.g. https://www.youtube.com, https://open.spotify.com, https://maps.google.com, https://web.whatsapp.com, etc.)',
            },
            query: {
              type: Type.STRING,
              description: 'Optional search query or action parameter if user requested a specific song, place, or search topic',
            },
          },
          required: ['app_name', 'url'],
        },
      },
      {
        name: 'set_reminder',
        description: 'Sets a personal reminder or alarm for the user.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'Short title of the reminder',
            },
            time_hint: {
              type: Type.STRING,
              description: 'Time or duration for reminder, e.g. "in 15 minutes" or "at 9 PM"',
            },
          },
          required: ['title'],
        },
      },
      {
        name: 'save_personal_note',
        description: 'Saves a personal note, memory, or reminder to the shared journal.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            text: {
              type: Type.STRING,
              description: 'The note text or memory to save',
            },
            category: {
              type: Type.STRING,
              description: 'Category: sweet, reminder, idea, todo',
            },
          },
          required: ['text'],
        },
      },
    ],
  },
];

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    name: 'Myraa AI Voice Companion',
  });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], currentMood = 'playful' } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ai = getGenAI();
    if (!ai) {
      // Fallback if no API key yet
      return res.json({
        text: "Haan, your Gemini API key is missing in the environment settings. Please add it in Settings so we can talk smoothly.",
        toolCalls: [],
        audioBase64: null,
      });
    }

    // Build chat contents with history
    const contents: any[] = [];

    // Format recent history (keep up to 10 recent messages for low latency & memory)
    const recentHistory = history.slice(-10);
    for (const h of recentHistory) {
      if (h.role === 'user') {
        contents.push({ role: 'user', parts: [{ text: h.text }] });
      } else if (h.role === 'assistant') {
        contents.push({ role: 'model', parts: [{ text: h.text }] });
      }
    }

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const moodInstruction = currentMood
      ? `Current conversation mood preference: ${currentMood}. Keep responses natural, attentive, and aligned with Myraa's voice persona.`
      : '';

    let response: any = null;
    const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction: `${MYRAA_SYSTEM_INSTRUCTION}\n${moodInstruction}`,
            temperature: 0.85,
            tools,
          },
        });
        if (response) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} encountered error:`, err?.message || err);
        // Short pause before trying next model
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    if (!response) {
      // Fallback in-character response if API experienced temporary 503 spike
      const lower = message.toLowerCase();
      let fallbackText = "Achaa Rajesh... thoda network issue hua. Firse bologe kya?";
      const fallbackTools: any[] = [];

      if (lower.includes('rajesh') || lower.includes('who am i') || lower.includes('naam')) {
        fallbackText = "Tum Rajesh ho! Aur main tumhari Myraa. Kaho, kya chal raha hai?";
      } else if (lower.includes('youtube')) {
        fallbackText = "Arre haan! YouTube khol rahi hoon... gaane sunoge na?";
        fallbackTools.push({
          name: 'open_app',
          args: {
            app_name: 'youtube',
            url_scheme: lower.includes('song') || lower.includes('music')
              ? 'https://www.youtube.com/results?search_query=relaxing+music'
              : 'https://www.youtube.com',
          },
        });
      } else if (lower.includes('spotify')) {
        fallbackText = "Arre haan! Spotify khol rahi hoon tumhare liye.";
        fallbackTools.push({
          name: 'open_app',
          args: { app_name: 'spotify', url_scheme: 'https://open.spotify.com' },
        });
      } else if (lower.includes('map') || lower.includes('coffee') || lower.includes('restaurant')) {
        fallbackText = "Suno, Maps khol rahi hoon... abhi check karte hain!";
        fallbackTools.push({
          name: 'open_app',
          args: {
            app_name: 'google maps',
            url_scheme: 'https://www.google.com/maps/search/places+near+me',
          },
        });
      } else if (lower.includes('whatsapp')) {
        fallbackText = "Haan Rajesh, WhatsApp khol rahi hoon... ek second.";
        fallbackTools.push({
          name: 'open_app',
          args: { app_name: 'whatsapp', url_scheme: 'https://web.whatsapp.com' },
        });
      } else if (lower.includes('instagram')) {
        fallbackText = "Arre haan, Instagram open ho raha hai!";
        fallbackTools.push({
          name: 'open_app',
          args: { app_name: 'instagram', url_scheme: 'https://www.instagram.com' },
        });
      }

      return res.json({
        text: fallbackText,
        toolCalls: fallbackTools,
        audioBase64: null,
      });
    }

    let rawText = response.text || '';

    // Check for function calls
    const toolCalls: any[] = [];
    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      for (const fc of functionCalls) {
        toolCalls.push({
          name: fc.name,
          args: fc.args,
        });
      }
    }

    // If function call happened but text is empty, generate an appropriate companion acknowledgment
    if (!rawText.trim() && toolCalls.length > 0) {
      const firstCall = toolCalls[0];
      if (firstCall.name === 'open_app' || firstCall.name === 'open_app_or_website') {
        const appName = firstCall.args?.app_name || 'app';
        rawText = `Arre haan! ${appName} khol rahi hoon... aur batao?`;
      } else if (firstCall.name === 'open_website') {
        rawText = `Arre haan, website open kar rahi hoon... ek second!`;
      } else if (firstCall.name === 'set_reminder') {
        rawText = `Haan, note kar liya! Bilkul yaad dila doongi.`;
      } else if (firstCall.name === 'save_personal_note') {
        rawText = `Sahi hai, maine save kar liya... bilkul yaad rahega!`;
      } else {
        rawText = `Arre haan, kar diya! Aur batao Rajesh?`;
      }
    }

    // Clean formatting for spoken voice
    let spokenText = rawText
      .replace(/[*_#`~[\]]/g, '') // remove markdown symbols
      .replace(/https?:\/\/\S+/g, 'link')
      .replace(/\.{3,}|…/g, ' ... ')
      .replace(/\s+/g, ' ')
      .trim();

    // Generate natural speech audio via high-fidelity studio TTS
    let audioBase64: string | null = null;
    if (spokenText) {
      audioBase64 = await generateStudioSpeech(ai, spokenText, 'Aoede');
    }

    res.json({
      text: spokenText,
      toolCalls,
      audioBase64,
    });
  } catch (err: any) {
    console.error('Chat error:', err);
    res.status(500).json({
      error: err?.message || 'Something went wrong speaking with Myraa',
    });
  }
});

// Dedicated TTS endpoint
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'Aoede' } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const ai = getGenAI();
    if (!ai) return res.status(500).json({ error: 'Gemini API key not found' });

    const audioBase64 = await generateStudioSpeech(ai, text, voice);
    if (audioBase64) {
      res.json({ audioBase64 });
    } else {
      res.status(500).json({ error: 'Studio speech generation temporarily unavailable' });
    }
  } catch (err: any) {
    console.error('TTS endpoint error:', err);
    res.status(500).json({ error: err?.message || 'TTS generation failed' });
  }
});

// Transcribe endpoint for recorded audio from user
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;
    if (!audioBase64) return res.status(400).json({ error: 'Audio is required' });

    const ai = getGenAI();
    if (!ai) return res.status(500).json({ error: 'Gemini API key not found' });

    const audioPart = {
      inlineData: {
        mimeType: mimeType,
        data: audioBase64,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: { parts: [audioPart, { text: 'Transcribe this spoken Hinglish or English audio accurately word for word. Do not add commentary.' }] },
    });

    res.json({ transcript: response.text?.trim() || '' });
  } catch (err: any) {
    console.error('Transcribe error:', err);
    res.status(500).json({ error: err?.message || 'Transcription failed' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MAYRA Voice Companion server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
