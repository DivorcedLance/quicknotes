import { create } from 'zustand';
import type { Note } from '../types';

interface NotesStore {
  notes: Note[];
  addNote: (note: Note) => void;
  updateNote: (id: string, note: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  moveNoteToFolder: (id: string, folderId: string | null) => void;
  getNotesByFolder: (folderId: string | null) => Note[];
  searchNotes: (query: string) => Note[];
  getNotesByTag: (tagId: string) => Note[];
  loadNotes: (notes: Note[]) => void;
}

export const useNotesStore = create<NotesStore>((set, get) => ({
  notes: (() => {
    const saved = localStorage.getItem('quicknotes_notes');
    return saved ? JSON.parse(saved) : [];
  })(),
  
  addNote: (note) => {
    set((state) => {
      const newNotes = [...state.notes, note];
      localStorage.setItem('quicknotes_notes', JSON.stringify(newNotes));
      return { notes: newNotes };
    });
  },

  updateNote: (id, updates) => {
    set((state) => {
      const newNotes = state.notes.map((note) =>
        note.id === id ? { ...note, ...updates, updatedAt: Date.now() } : note
      );
      localStorage.setItem('quicknotes_notes', JSON.stringify(newNotes));
      return { notes: newNotes };
    });
  },

  deleteNote: (id) => {
    set((state) => {
      const newNotes = state.notes.filter((note) => note.id !== id);
      localStorage.setItem('quicknotes_notes', JSON.stringify(newNotes));
      return { notes: newNotes };
    });
  },

  moveNoteToFolder: (id, folderId) => {
    set((state) => {
      const newNotes = state.notes.map((note) =>
        note.id === id ? { ...note, folderId, updatedAt: Date.now() } : note
      );
      localStorage.setItem('quicknotes_notes', JSON.stringify(newNotes));
      return { notes: newNotes };
    });
  },

  getNotesByFolder: (folderId) => {
    return get().notes.filter((note) => note.folderId === folderId);
  },

  searchNotes: (query) => {
    const lowerQuery = query.toLowerCase();
    return get().notes.filter(
      (note) =>
        note.title.toLowerCase().includes(lowerQuery) ||
        note.content.toLowerCase().includes(lowerQuery)
    );
  },

  getNotesByTag: (tagId) => {
    return get().notes.filter((note) => note.tags.includes(tagId));
  },

  loadNotes: (notes) => {
    set({ notes });
    localStorage.setItem('quicknotes_notes', JSON.stringify(notes));
  },
}));
