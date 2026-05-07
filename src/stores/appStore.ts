import { create } from 'zustand';
import type { DateTimeFormat } from '../utils/helpers';

interface AppStore {
  currentTab: 'notes' | 'todos' | 'tags' | 'settings';
  setCurrentTab: (tab: 'notes' | 'todos' | 'tags' | 'settings') => void;
  currentNoteId: string | null;
  setCurrentNoteId: (noteId: string | null) => void;
  currentNotesFolderId: string | null;
  setCurrentNotesFolderId: (folderId: string | null) => void;
  currentNotesFolderViewId: string | null;
  setCurrentNotesFolderViewId: (folderId: string | null) => void;
  currentTodoId: string | null;
  setCurrentTodoId: (todoId: string | null) => void;
  currentTodoFolderId: string | null;
  setCurrentTodoFolderId: (folderId: string | null) => void;
  currentTodoFolderViewId: string | null;
  setCurrentTodoFolderViewId: (folderId: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showMainSidebar: boolean;
  setShowMainSidebar: (show: boolean) => void;
  sidebarMode: 'expanded' | 'compact';
  setSidebarMode: (mode: 'expanded' | 'compact') => void;
  toggleSidebarMode: () => void;
  showInspectorPanel: boolean;
  setShowInspectorPanel: (show: boolean) => void;
  selectedTagFilters: string[];
  setSelectedTagFilters: (tags: string[]) => void;
  sortBy: 'date' | 'name' | 'modified';
  setSortBy: (sortBy: 'date' | 'name' | 'modified') => void;
  groupByDate: boolean;
  setGroupByDate: (group: boolean) => void;
  sortTodosByDate: 'createdAt' | 'updatedAt' | 'completedAt';
  setSortTodosByDate: (sortBy: 'createdAt' | 'updatedAt' | 'completedAt') => void;
  todoFilterStatus: 'all' | 'completed' | 'pending';
  setTodoFilterStatus: (status: 'all' | 'completed' | 'pending') => void;
  dateTimeFormat: DateTimeFormat;
  setDateTimeFormat: (format: DateTimeFormat) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  currentTab: 'notes',
  setCurrentTab: (tab) => set({ currentTab: tab }),

  currentNoteId: null,
  setCurrentNoteId: (noteId) => set({ currentNoteId: noteId }),
  
  currentNotesFolderId: null,
  setCurrentNotesFolderId: (folderId) => set({ currentNotesFolderId: folderId }),

  currentNotesFolderViewId: null,
  setCurrentNotesFolderViewId: (folderId) => set({ currentNotesFolderViewId: folderId }),

  currentTodoId: null,
  setCurrentTodoId: (todoId) => set({ currentTodoId: todoId }),

  currentTodoFolderId: null,
  setCurrentTodoFolderId: (folderId) => set({ currentTodoFolderId: folderId }),

  currentTodoFolderViewId: null,
  setCurrentTodoFolderViewId: (folderId) => set({ currentTodoFolderViewId: folderId }),

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  showMainSidebar:
    typeof window !== 'undefined' && window.localStorage.getItem('quicknotes.showMainSidebar') === 'false'
      ? false
      : true,
  setShowMainSidebar: (show) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('quicknotes.showMainSidebar', String(show));
    }
    set({ showMainSidebar: show });
  },

  sidebarMode:
    typeof window !== 'undefined' && window.localStorage.getItem('quicknotes.sidebarMode') === 'compact'
      ? 'compact'
      : 'expanded',
  setSidebarMode: (mode) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('quicknotes.sidebarMode', mode);
    }
    set({ sidebarMode: mode });
  },
  toggleSidebarMode: () =>
    set((state) => {
      const nextMode = state.sidebarMode === 'compact' ? 'expanded' : 'compact';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('quicknotes.sidebarMode', nextMode);
      }
      return { sidebarMode: nextMode };
    }),

  showInspectorPanel:
    typeof window !== 'undefined' && window.localStorage.getItem('quicknotes.showInspectorPanel') === 'false'
      ? false
      : true,
  setShowInspectorPanel: (show) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('quicknotes.showInspectorPanel', String(show));
    }
    set({ showInspectorPanel: show });
  },

  selectedTagFilters: [],
  setSelectedTagFilters: (tags) => set({ selectedTagFilters: tags }),

  sortBy: 'date',
  setSortBy: (sortBy) => set({ sortBy }),

  groupByDate: true,
  setGroupByDate: (group) => set({ groupByDate: group }),

  sortTodosByDate:
    typeof window !== 'undefined' && (window.localStorage.getItem('quicknotes.sortTodosByDate') as any)
      ? (window.localStorage.getItem('quicknotes.sortTodosByDate') as any)
      : 'updatedAt',
  setSortTodosByDate: (sortBy) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('quicknotes.sortTodosByDate', sortBy);
    }
    set({ sortTodosByDate: sortBy });
  },

  todoFilterStatus:
    typeof window !== 'undefined' && (window.localStorage.getItem('quicknotes.todoFilterStatus') as any)
      ? (window.localStorage.getItem('quicknotes.todoFilterStatus') as any)
      : 'all',
  setTodoFilterStatus: (status) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('quicknotes.todoFilterStatus', status);
    }
    set({ todoFilterStatus: status });
  },

  dateTimeFormat:
    typeof window !== 'undefined' && (window.localStorage.getItem('quicknotes.dateTimeFormat') as DateTimeFormat | null)
      ? (window.localStorage.getItem('quicknotes.dateTimeFormat') as DateTimeFormat)
      : 'completo',
  setDateTimeFormat: (format) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('quicknotes.dateTimeFormat', format);
    }
    set({ dateTimeFormat: format });
  },
}));
