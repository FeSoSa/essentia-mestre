'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useStore, useNotes } from '@/store';
import type { Note } from '@/store/types';

const COLORS = ['#fbbf24', '#f87171', '#4ade80', '#60a5fa', '#c084fc', '#94a3b8'];

function autoGrow(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

export default function NotesPanel() {
  const notes = useNotes();
  const { setNotes } = useStore();
  const [draft, setDraft] = useState('');
  const draftRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api.get<Note[]>('/master/notes').then((r) => setNotes(r.data)).catch(() => {});
  }, [setNotes]);

  useEffect(() => { autoGrow(draftRef.current); }, [draft]);

  async function addNote() {
    const text = draft.trim();
    if (!text) return;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const res = await api.post<Note[]>('/master/notes', { text, color });
    setNotes(res.data);
    setDraft('');
  }

  async function removeNote(id: string) {
    const res = await api.delete<Note[]>(`/master/notes/${id}`);
    setNotes(res.data);
  }

  async function updateNoteText(id: string, text: string) {
    const res = await api.put<Note[]>(`/master/notes/${id}`, { text });
    setNotes(res.data);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-5 py-3.5 border-b border-e-border shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-e-faint">Anotações</p>
      </div>

      <div className="px-5 pt-4 shrink-0 flex gap-2 items-end">
        <textarea
          ref={draftRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addNote(); } }}
          placeholder="Nova anotação..."
          rows={1}
          className="flex-1 bg-e-card border border-e-border rounded-lg px-3 py-1.5 text-sm text-e-text placeholder:text-e-faint focus:outline-none focus:border-e-accent resize-none overflow-hidden max-h-48"
        />
        <button
          onClick={addNote}
          className="px-3 py-1.5 rounded-lg bg-e-accent/15 text-e-accent text-sm font-medium hover:bg-e-accent/25 transition-colors"
        >
          +
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {notes.length === 0 ? (
          <p className="text-sm text-e-faint text-center py-6">Nenhuma anotação.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 content-start">
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded-lg p-3 text-sm text-e-text/90 shadow-sm group relative"
                style={{ backgroundColor: `${note.color}26`, borderLeft: `3px solid ${note.color}` }}
              >
                <textarea
                  defaultValue={note.text}
                  onBlur={(e) => {
                    if (e.target.value.trim() !== note.text) updateNoteText(note.id, e.target.value.trim());
                  }}
                  onInput={(e) => autoGrow(e.currentTarget)}
                  ref={(el) => autoGrow(el)}
                  rows={1}
                  className="w-full bg-transparent resize-none overflow-hidden focus:outline-none text-sm leading-snug pr-5"
                />
                <button
                  onClick={() => removeNote(note.id)}
                  className="absolute top-2 right-2 text-e-faint opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity text-xs"
                  title="Remover"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
