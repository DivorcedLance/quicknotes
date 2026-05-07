import React, { useRef } from 'react';
import { useAppStore } from '../stores/appStore';
import { useTheme } from '../hooks/useTheme';
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

const App: React.FC = () => {
  useTheme();
  const {
    currentTab,
    currentNoteId,
    currentTodoId,
    currentNotesFolderViewId,
    currentTodoFolderViewId,
    showMainSidebar,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
  } = useAppStore();

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
        {currentNoteId ? (
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
