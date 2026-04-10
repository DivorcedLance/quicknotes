import { create } from 'zustand';
import type { Tag } from '../types';
import { useNotesStore } from './notesStore';
import { useTodosStore } from './todosStore';

interface TagsStore {
  tags: Tag[];
  addTag: (tag: Tag) => void;
  updateTag: (id: string, tag: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
  getTag: (id: string) => Tag | undefined;
  loadTags: (tags: Tag[]) => void;
}

export const useTagsStore = create<TagsStore>((set, get) => ({
  tags: (() => {
    const saved = localStorage.getItem('quicknotes_tags');
    return saved ? JSON.parse(saved) : [];
  })(),

  addTag: (tag) => {
    set((state) => {
      const newTags = [...state.tags, tag];
      localStorage.setItem('quicknotes_tags', JSON.stringify(newTags));
      return { tags: newTags };
    });
  },

  updateTag: (id, updates) => {
    set((state) => {
      const newTags = state.tags.map((tag) =>
        tag.id === id ? { ...tag, ...updates } : tag
      );
      localStorage.setItem('quicknotes_tags', JSON.stringify(newTags));
      return { tags: newTags };
    });
  },

  deleteTag: (id) => {
    set((state) => {
      const newTags = state.tags.filter((tag) => tag.id !== id);
      localStorage.setItem('quicknotes_tags', JSON.stringify(newTags));

      const cleanedNotes = useNotesStore.getState().notes.map((note) => ({
        ...note,
        tags: note.tags.filter((tagId) => tagId !== id),
      }));
      useNotesStore.getState().loadNotes(cleanedNotes);

      const cleanedTodos = useTodosStore.getState().todos.map((todo) => ({
        ...todo,
        tags: todo.tags.filter((tagId) => tagId !== id),
      }));
      useTodosStore.getState().loadTodos(cleanedTodos);

      return { tags: newTags };
    });
  },

  getTag: (id) => {
    return get().tags.find((tag) => tag.id === id);
  },

  loadTags: (tags) => {
    set({ tags });
    localStorage.setItem('quicknotes_tags', JSON.stringify(tags));
  },
}));
