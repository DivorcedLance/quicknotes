import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../stores/appStore';
import { useTheme } from '../hooks/useTheme';
import { useSettingsStore } from '../stores/settingsStore';
import { useCalendarStore } from '../stores/calendarStore';
import Sidebar from './Sidebar';
import NotesView from './NotesView';
import TodosView from './TodosView';
import TagsView from './TagsView';
import SettingsView from './SettingsView';
import { FiMenu } from 'react-icons/fi';
import NoteFolderView from './NoteFolderView';
import TodoFolderView from './TodoFolderView';
import NoteEditor from './NoteEditor';
import TodoEditor from './TodoEditor';
import CalendarView from './CalendarView';
import CalendarEventEditor from './CalendarEventEditor';

const App: React.FC = () => {
  useTheme();
  const {
    currentTab,
    currentNoteId,
    currentTodoId,
    currentNotesFolderViewId,
    currentTodoFolderViewId,
    currentCalendarEventId,
    showMainSidebar,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
  } = useAppStore();

  const { settings } = useSettingsStore();
  const { events } = useCalendarStore();
  const notifiedRef = useRef<Set<string>>(new Set());

  // Notification scheduler - checks every minute for events that need notifications
  useEffect(() => {
    if (!settings.notificationsEnabled) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const check = () => {
      const now = Date.now();
      events.forEach((evt) => {
        if (!evt.notify) return;
        const notificationTime = evt.startDate - evt.notifyBefore * 60000;
        if (notificationTime <= now && now < evt.startDate && !notifiedRef.current.has(evt.id)) {
          notifiedRef.current.add(evt.id);
          new Notification('QuickNotes - Recordatorio', {
            body: evt.title || 'Evento sin título',
            icon: '/pwa-icon.svg',
            tag: evt.id,
          });
        }
      });
    };

    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [settings.notificationsEnabled, events]);

  const touchStartX = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches && e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchCurrentX.current = touchStartX.current;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches && e.touches.length === 1) {
      touchCurrentX.current = e.touches[0].clientX;
    }
  };

  const onTouchEnd = () => {
    const start = touchStartX.current;
    const end = touchCurrentX.current;
    if (start == null || end == null) {
      touchStartX.current = null;
      touchCurrentX.current = null;
      return;
    }
    const dx = end - start;
    // swipe right from left edge to open
    if (start < 30 && dx > 50) {
      setIsMobileSidebarOpen(true);
    }
    // swipe left to close when open
    if (isMobileSidebarOpen && dx < -50) {
      setIsMobileSidebarOpen(false);
    }
    touchStartX.current = null;
    touchCurrentX.current = null;
  };

  return (
    <div
      className="relative flex h-screen bg-light-primary dark:bg-dark-primary text-gray-900 dark:text-gray-100"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {(showMainSidebar || isMobileSidebarOpen) && <Sidebar />}
      {/* Backdrop for mobile sidebar */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 sm:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden
        />
      )}
      {/* Mobile sidebar is opened via swipe gesture from the left edge */}
      {!showMainSidebar && (
        <button
          onClick={() => useAppStore.getState().setShowMainSidebar(true)}
          className="fixed bottom-4 left-4 z-50 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-3 text-sm shadow-lg hover:bg-gray-50 dark:border-dark-tertiary dark:bg-dark-secondary dark:hover:bg-dark-tertiary"
          title="Mostrar panel lateral"
        >
          <FiMenu size={18} /> Panel
        </button>
      )}
      <div className="flex-1 overflow-auto">
        {currentCalendarEventId ? (
          <CalendarEventEditor
            key={currentCalendarEventId}
            eventId={currentCalendarEventId}
            onClose={() => useAppStore.getState().setCurrentCalendarEventId(null)}
          />
        ) : currentNoteId ? (
          <NoteEditor
            key={currentNoteId}
            noteId={currentNoteId}
            onClose={() => useAppStore.getState().setCurrentNoteId(null)}
          />
        ) : currentTodoId ? (
          <TodoEditor
            key={currentTodoId}
            todoId={currentTodoId}
            onClose={() => useAppStore.getState().setCurrentTodoId(null)}
          />
        ) : currentNotesFolderViewId ? (
          <NoteFolderView />
        ) : currentTodoFolderViewId ? (
          <TodoFolderView />
        ) : currentTab === 'calendar' ? (
          <CalendarView />
        ) : currentTab === 'tags' ? (
          <TagsView />
        ) : currentTab === 'notes' ? (
          <NotesView />
        ) : currentTab === 'todos' ? (
          <TodosView />
        ) : (
          <SettingsView />
        )}
      </div>
    </div>
  );
};

export default App;
