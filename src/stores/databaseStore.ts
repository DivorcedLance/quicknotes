import { create } from 'zustand';
import type { Database } from '../types';
import { useNotesStore } from './notesStore';
import { useTodosStore } from './todosStore';
import { useFoldersStore } from './foldersStore';
import { useTodoFoldersStore } from './todoFoldersStore';
import { useTagsStore } from './tagsStore';
import { useSettingsStore } from './settingsStore';
import { useCalendarStore } from './calendarStore';
import { useActivitiesStore } from './activitiesStore';

interface DatabaseStore {
  exportDatabase: () => string;
  importDatabase: (json: string) => boolean;
  resetDatabase: () => void;
}

export const useDatabaseStore = create<DatabaseStore>(() => ({
  exportDatabase: () => {
    const database: Database = {
      notes: useNotesStore.getState().notes,
      todos: useTodosStore.getState().todos,
      folders: useFoldersStore.getState().folders,
      todoFolders: useTodoFoldersStore.getState().folders,
      tags: useTagsStore.getState().tags,
      settings: useSettingsStore.getState().settings,
      calendarEvents: useCalendarStore.getState().events,
      activityTypes: useActivitiesStore.getState().types,
      activityDefinitions: useActivitiesStore.getState().definitions,
      activityInstances: useActivitiesStore.getState().instances,
      version: '2.0.0',
    };
    return JSON.stringify(database, null, 2);
  },

  importDatabase: (json: string) => {
    try {
      const database: Database = JSON.parse(json);

      // Validate database structure
      if (
        !Array.isArray(database.notes) ||
        !Array.isArray(database.todos) ||
        !Array.isArray(database.folders) ||
        !Array.isArray(database.tags)
      ) {
        throw new Error('Invalid database structure');
      }

      // Load all data
      useNotesStore.getState().loadNotes(database.notes);
      useTodosStore.getState().loadTodos(database.todos);
      useFoldersStore.getState().loadFolders(database.folders);
      useTodoFoldersStore
        .getState()
        .loadFolders(Array.isArray(database.todoFolders) ? database.todoFolders : []);
      useTagsStore.getState().loadTags(database.tags);
      if (database.settings) {
        useSettingsStore.getState().updateSettings(database.settings);
      }
      if (Array.isArray(database.calendarEvents)) {
        useCalendarStore.getState().loadEvents(database.calendarEvents);
      }
      if (Array.isArray(database.activityTypes)) {
        useActivitiesStore.getState().loadTypes(database.activityTypes);
      }
      if (Array.isArray(database.activityDefinitions)) {
        useActivitiesStore.getState().loadDefinitions(database.activityDefinitions);
      }
      if (Array.isArray(database.activityInstances)) {
        useActivitiesStore.getState().loadInstances(database.activityInstances);
      }

      return true;
    } catch (error) {
      console.error('Failed to import database:', error);
      return false;
    }
  },

  resetDatabase: () => {
    localStorage.removeItem('quicknotes_notes');
    localStorage.removeItem('quicknotes_todos');
    localStorage.removeItem('quicknotes_folders');
    localStorage.removeItem('quicknotes_todo_folders');
    localStorage.removeItem('quicknotes_tags');
    localStorage.removeItem('quicknotes_calendar_events');
    localStorage.removeItem('quicknotes_activity_types');
    localStorage.removeItem('quicknotes_activity_definitions');
    localStorage.removeItem('quicknotes_activity_instances');
    useNotesStore.setState({ notes: [] });
    useTodosStore.setState({ todos: [] });
    useFoldersStore.setState({ folders: [] });
    useTodoFoldersStore.setState({ folders: [] });
    useTagsStore.setState({ tags: [] });
    useCalendarStore.setState({ events: [] });
    useActivitiesStore.setState({ types: [], definitions: [], instances: [] });
  },
}));
