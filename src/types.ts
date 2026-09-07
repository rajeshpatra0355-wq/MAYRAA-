export type CallStatus =
  | 'idle'
  | 'connecting'
  | 'active'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'ended';

export type PartnerMood = 'playful' | 'flirty' | 'caring' | 'witty' | 'sassy';

export interface ToolCallItem {
  id: string;
  name: string;
  args: {
    app_name?: string;
    url?: string;
    url_scheme?: string;
    query?: string;
    title?: string;
    time_hint?: string;
    text?: string;
    category?: string;
    [key: string]: any;
  };
  timestamp: number;
  status: 'executed' | 'pending';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
  audioBase64?: string | null;
  toolCalls?: ToolCallItem[];
  mood?: PartnerMood;
}

export interface AppShortcut {
  id: string;
  name: string;
  url: string;
  icon: string;
  description: string;
  category: 'social' | 'entertainment' | 'utility' | 'productivity';
}

export interface SavedNote {
  id: string;
  text: string;
  category: 'sweet' | 'reminder' | 'idea' | 'todo';
  createdAt: number;
}

export interface ReminderItem {
  id: string;
  title: string;
  timeHint: string;
  createdAt: number;
  completed: boolean;
}
