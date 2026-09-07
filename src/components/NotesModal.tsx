import React, { useState } from 'react';
import { X, BookOpen, Trash2, Plus, Bell, Heart, CheckCircle } from 'lucide-react';
import { SavedNote, ReminderItem } from '../types';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: SavedNote[];
  reminders: ReminderItem[];
  onAddNote: (text: string, category: 'sweet' | 'reminder' | 'idea') => void;
  onDeleteNote: (id: string) => void;
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
}

export const NotesModal: React.FC<NotesModalProps> = ({
  isOpen,
  onClose,
  notes,
  reminders,
  onAddNote,
  onDeleteNote,
  onToggleReminder,
  onDeleteReminder,
}) => {
  const [activeTab, setActiveTab] = useState<'reminders' | 'notes'>('reminders');
  const [newNoteText, setNewNoteText] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    onAddNote(newNoteText.trim(), 'sweet');
    setNewNoteText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg p-6 rounded-3xl bg-[#0A0510]/90 backdrop-blur-2xl border border-white/10 shadow-[0_0_60px_rgba(255,45,117,0.15)] flex flex-col gap-4 max-h-[85vh] overflow-y-auto no-scrollbar text-white">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-[#FF2D75]" />
            <h2 className="text-lg font-bold text-white font-['Outfit'] tracking-tight">
              Memory & Reminders
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 pb-2 gap-4 text-sm">
          <button
            type="button"
            onClick={() => setActiveTab('reminders')}
            className={`pb-1 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'reminders'
                ? 'text-[#FF2D75] border-b-2 border-[#FF2D75]'
                : 'text-white/40 hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Reminders ({reminders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`pb-1 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'notes'
                ? 'text-[#FF2D75] border-b-2 border-[#FF2D75]'
                : 'text-white/40 hover:text-white'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Shared Journal ({notes.length})</span>
          </button>
        </div>

        {/* Content */}
        {activeTab === 'reminders' ? (
          <div className="flex flex-col gap-2.5">
            {reminders.length === 0 ? (
              <p className="text-white/40 text-xs py-8 text-center">
                No reminders yet. Say "Remind me to drink water in 15 minutes" to Mayra!
              </p>
            ) : (
              reminders.map((r) => (
                <div
                  key={r.id}
                  className="p-3.5 rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => onToggleReminder(r.id)}
                      className={`p-1 rounded-full cursor-pointer ${
                        r.completed ? 'text-emerald-400' : 'text-white/40 hover:text-white'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <div>
                      <span className={`font-medium ${r.completed ? 'line-through text-white/40' : 'text-white/90'}`}>
                        {r.title}
                      </span>
                      <span className="text-[11px] text-[#FF2D75] block mt-0.5 font-medium">
                        Due: {r.timeHint || 'Soon'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteReminder(r.id)}
                    className="text-white/40 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <form onSubmit={handleAdd} className="flex gap-2">
              <input
                type="text"
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Add a sweet memory or note..."
                className="flex-1 px-3.5 py-2.5 rounded-xl backdrop-blur-md bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF2D75]"
              />
              <button
                type="submit"
                disabled={!newNoteText.trim()}
                className="px-4 py-2.5 rounded-xl bg-[#FF2D75] hover:bg-[#ff1a69] disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </form>

            <div className="flex flex-col gap-2">
              {notes.length === 0 ? (
                <p className="text-white/40 text-xs py-8 text-center">
                  Our shared journal is empty right now. Ask Myraa to remember something!
                </p>
              ) : (
                notes.map((n) => (
                  <div
                    key={n.id}
                    className="p-3.5 rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex-1">
                      <p className="text-white/90 leading-relaxed">{n.text}</p>
                      <span className="text-[10px] text-white/40 mt-1 block">
                        {new Date(n.createdAt).toLocaleDateString()} at{' '}
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteNote(n.id)}
                      className="text-white/40 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
