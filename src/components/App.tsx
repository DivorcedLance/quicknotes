import React from 'react';
import { useAppStore } from '../stores/appStore';
import { useTheme } from '../hooks/useTheme';
import Sidebar from './Sidebar';
import NotesView from './NotesView';
import TodosView from './TodosView';
import TagsView from './TagsView';
import SettingsView from './SettingsView';
import { FiMenu } from 'react-icons/fi';
import FolderView from './FolderView';
import NoteEditor from './NoteEditor';
import TodoEditor from './TodoEditor';

const App: React.FC = () => {
  useTheme();
  const { currentTab, currentNoteId, currentTodoId, currentFolderViewId, showMainSidebar } = useAppStore();

  return (
    <div className="relative flex h-screen bg-light-primary dark:bg-dark-primary text-gray-900 dark:text-gray-100">
      {showMainSidebar && <Sidebar />}
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
        ) : currentFolderViewId ? (
          <FolderView />
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
