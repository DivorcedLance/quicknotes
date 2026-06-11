import { create } from 'zustand';
import type { CalendarEvent } from '../types';

interface CalendarStore {
  events: CalendarEvent[];
  loadEvents: (events: CalendarEvent[]) => void;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (id: string, data: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
}

const STORAGE_KEY = 'quicknotes_calendar_events';

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  events: (() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  })(),

  loadEvents: (events) => {
    set({ events });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  },

  addEvent: (event) => {
    const events = [...get().events, event];
    set({ events });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  },

  updateEvent: (id, data) => {
    const events = get().events.map((e) =>
      e.id === id ? { ...e, ...data, updatedAt: Date.now() } : e
    );
    set({ events });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  },

  deleteEvent: (id) => {
    const events = get().events.filter((e) => e.id !== id);
    set({ events });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  },
}));
