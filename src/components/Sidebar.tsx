import React, { useState } from 'react';
import { FiBookmark, FiCheck, FiSettings, FiFolder, FiPlus, FiMoon, FiSun, FiMenu, FiSearch, FiTag } from 'react-icons/fi';
import { useAppStore } from '../stores/appStore';
import { useFoldersStore } from '../stores/foldersStore';
import { useNotesStore } from '../stores/notesStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useTodoFoldersStore } from '../stores/todoFoldersStore';
import { useTodosStore } from '../stores/todosStore';
import { generateId } from '../utils/helpers';
import FolderTree from './FolderTree';
import TodoFolderTree from './TodoFolderTree';

const Sidebar: React.FC = () => {
  const {
    currentTab,
    setCurrentTab,
    currentNotesFolderId,
    setCurrentNotesFolderId,
    currentTodoFolderId,
    setCurrentTodoFolderId,
    setCurrentNoteId,
    setCurrentTodoId,
    sidebarMode,
    toggleSidebarMode,
  } = useAppStore();
  const { addFolder } = useFoldersStore();
  const { addFolder: addTodoFolder } = useTodoFoldersStore();
  const { addTodo } = useTodosStore();
  const { addNote } = useNotesStore();
  const { toggleTheme, getTheme } = useSettingsStore();
  const [showNotesFolderInput, setShowNotesFolderInput] = useState(false);
  const [notesFolderName, setNotesFolderName] = useState('');
  const [notesExplorerSearchQuery, setNotesExplorerSearchQuery] = useState('');
  const [isAllNotesDropActive, setIsAllNotesDropActive] = useState(false);
  const [showTodoFolderInput, setShowTodoFolderInput] = useState(false);
  const [todoFolderName, setTodoFolderName] = useState('');
  const [todosExplorerSearchQuery, setTodosExplorerSearchQuery] = useState('');
  const [isAllTodosDropActive, setIsAllTodosDropActive] = useState(false);

  const clearOpenViews = () => {
    setCurrentNoteId(null);
    setCurrentTodoId(null);
    useAppStore.getState().setCurrentNotesFolderViewId(null);
    useAppStore.getState().setCurrentTodoFolderViewId(null);
  };

  const handleNewNote = () => {
    const newNote = {
      id: generateId(),
      title: '',
      content: '',
      folderId: currentNotesFolderId,
      images: [],
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addNote(newNote);
    setCurrentTab('notes');
    setCurrentNoteId(newNote.id);
  };

  const handleNewNotesFolder = () => {
    if (notesFolderName.trim()) {
      const newFolder = {
        id: generateId(),
        name: notesFolderName,
        parentId: currentNotesFolderId,
        sortOrder: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      addFolder(newFolder);
      setNotesFolderName('');
      setShowNotesFolderInput(false);
    }
  };

  const handleNewTodo = () => {
    const newTodo = {
      id: generateId(),
      title: '',
      description: '',
      completed: false,
      completedAt: null,
      folderId: currentTodoFolderId,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addTodo(newTodo);
    setCurrentTab('todos');
    setCurrentTodoId(newTodo.id);
  };

  const handleNewTodoFolder = () => {
    if (todoFolderName.trim()) {
      const newFolder = {
        id: generateId(),
        name: todoFolderName,
        parentId: currentTodoFolderId,
        sortOrder: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      addTodoFolder(newFolder);
      setTodoFolderName('');
      setShowTodoFolderInput(false);
    }
  };

  return (
    <aside
      className={`flex shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-light-secondary transition-all duration-200 dark:border-dark-tertiary dark:bg-dark-secondary ${
        sidebarMode === 'compact' ? 'w-20' : 'w-72'
      }`}
    >
      <div className="border-b border-gray-200 p-3 dark:border-dark-tertiary">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className={`font-semibold tracking-tight ${sidebarMode === 'compact' ? 'text-sm' : 'text-lg'}`}>
            {sidebarMode === 'compact' ? 'QN' : 'QuickNotes'}
          </h2>
          <button
            onClick={toggleSidebarMode}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 dark:border-dark-tertiary dark:bg-dark-secondary dark:text-gray-300 dark:hover:bg-dark-tertiary"
            title={sidebarMode === 'compact' ? 'Agrandar panel' : 'Compactar panel'}
          >
            <FiMenu size={18} />
          </button>
        </div>
        <nav className="space-y-1.5">
          <button
            onClick={() => {
              clearOpenViews();
              setCurrentTab('notes');
              setCurrentNotesFolderId(null);
            }}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              currentTab === 'notes'
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-300 dark:hover:bg-dark-tertiary'
            }`}
          >
            <FiBookmark /> {sidebarMode === 'compact' ? '' : 'Notas'}
          </button>
          <button
            onClick={() => {
              clearOpenViews();
              setCurrentTab('todos');
              setCurrentTodoFolderId(null);
            }}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              currentTab === 'todos'
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-300 dark:hover:bg-dark-tertiary'
            }`}
          >
            <FiCheck /> {sidebarMode === 'compact' ? '' : 'Tareas'}
          </button>
          <button
            onClick={() => {
              clearOpenViews();
              setCurrentTab('tags');
              setCurrentNotesFolderId(null);
            }}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              currentTab === 'tags'
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-300 dark:hover:bg-dark-tertiary'
            }`}
          >
            <FiTag /> {sidebarMode === 'compact' ? '' : 'Etiquetas'}
          </button>
          <button
            onClick={() => {
              clearOpenViews();
              setCurrentTab('settings');
            }}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              currentTab === 'settings'
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-300 dark:hover:bg-dark-tertiary'
            }`}
          >
            <FiSettings /> {sidebarMode === 'compact' ? '' : 'Configuración'}
          </button>
        </nav>
      </div>

      {currentTab === 'notes' && (
        <div className={`flex-1 overflow-y-auto ${sidebarMode === 'compact' ? 'p-2' : 'p-3'}`}>
          <div className={`mb-3 ${sidebarMode === 'compact' ? 'space-y-2' : 'flex gap-2'}`}>
            <button
              onClick={handleNewNote}
              className={`flex items-center justify-center gap-2 rounded-lg bg-blue-500 text-sm text-white transition-colors hover:bg-blue-600 ${
                sidebarMode === 'compact' ? 'w-full px-2 py-2' : 'flex-1 px-3 py-2'
              }`}
              title="Nueva nota"
            >
              <FiPlus /> {sidebarMode === 'compact' ? '' : 'Nueva Nota'}
            </button>
            <button
              onClick={() => setShowNotesFolderInput(true)}
              className={`flex items-center justify-center gap-2 rounded-lg bg-green-500 text-sm text-white transition-colors hover:bg-green-600 ${
                sidebarMode === 'compact' ? 'w-full px-2 py-2' : 'flex-1 px-3 py-2'
              }`}
              title="Nueva carpeta"
            >
              <FiFolder /> {sidebarMode === 'compact' ? '' : 'Carpeta'}
            </button>
          </div>

          {sidebarMode !== 'compact' && (
            <div className="mb-3 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-dark-tertiary dark:bg-dark-secondary">
              <div className="flex items-center gap-2">
                <FiSearch className="shrink-0 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar en carpetas y notas"
                  value={notesExplorerSearchQuery}
                  onChange={(event) => setNotesExplorerSearchQuery(event.target.value)}
                  className="w-full border-0 bg-transparent p-0 text-sm outline-none placeholder:text-gray-400"
                />
              </div>
            </div>
          )}

          {showNotesFolderInput && (
            <div className="mb-3 rounded-lg bg-gray-200 p-3 dark:bg-dark-tertiary">
              <input
                type="text"
                placeholder="Nombre de la carpeta"
                value={notesFolderName}
                onChange={(e) => setNotesFolderName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleNewNotesFolder();
                }}
                autoFocus
                className="input-field mb-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleNewNotesFolder}
                  className="flex-1 rounded bg-green-500 px-2 py-1 text-sm text-white hover:bg-green-600"
                >
                  Crear
                </button>
                <button
                  onClick={() => setShowNotesFolderInput(false)}
                  className="flex-1 rounded bg-gray-400 px-2 py-1 text-sm text-white hover:bg-gray-500"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1 text-sm">
            <button
              onClick={() => {
                setCurrentNotesFolderId(null);
                setCurrentNoteId(null);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsAllNotesDropActive(true);
              }}
              onDragLeave={() => setIsAllNotesDropActive(false)}
              onDrop={(event) => {
                event.preventDefault();
                const noteId = event.dataTransfer.getData('text/quicknotes-note-id');
                const folderId = event.dataTransfer.getData('text/quicknotes-folder-id');
                if (noteId) {
                  const { moveNoteToFolder } = useNotesStore.getState();
                  moveNoteToFolder(noteId, null);
                }
                if (folderId) {
                  const { moveFolder } = useFoldersStore.getState();
                  moveFolder(folderId, null);
                }
                setIsAllNotesDropActive(false);
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
                currentNotesFolderId === null
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                  : isAllNotesDropActive
                    ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:ring-blue-800'
                  : 'hover:bg-gray-300 dark:hover:bg-dark-tertiary'
              }`}
              title="Todas las notas"
            >
              <FiBookmark size={15} /> {sidebarMode === 'compact' ? '' : 'Todas las Notas'}
            </button>
            {sidebarMode !== 'compact' && <FolderTree parentId={null} searchQuery={notesExplorerSearchQuery} />}
          </div>
        </div>
      )}

      {currentTab === 'todos' && (
        <div className={`flex-1 overflow-y-auto ${sidebarMode === 'compact' ? 'p-2' : 'p-3'}`}>
          <div className={`mb-3 ${sidebarMode === 'compact' ? 'space-y-2' : 'flex gap-2'}`}>
            <button
              onClick={handleNewTodo}
              className={`flex items-center justify-center gap-2 rounded-lg bg-blue-500 text-sm text-white transition-colors hover:bg-blue-600 ${
                sidebarMode === 'compact' ? 'w-full px-2 py-2' : 'flex-1 px-3 py-2'
              }`}
              title="Nueva tarea"
            >
              <FiPlus /> {sidebarMode === 'compact' ? '' : 'Nueva Tarea'}
            </button>
            <button
              onClick={() => setShowTodoFolderInput(true)}
              className={`flex items-center justify-center gap-2 rounded-lg bg-green-500 text-sm text-white transition-colors hover:bg-green-600 ${
                sidebarMode === 'compact' ? 'w-full px-2 py-2' : 'flex-1 px-3 py-2'
              }`}
              title="Nueva carpeta de tareas"
            >
              <FiFolder /> {sidebarMode === 'compact' ? '' : 'Carpeta'}
            </button>
          </div>

          {sidebarMode !== 'compact' && (
            <div className="mb-3 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-dark-tertiary dark:bg-dark-secondary">
              <div className="flex items-center gap-2">
                <FiSearch className="shrink-0 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar en carpetas y tareas"
                  value={todosExplorerSearchQuery}
                  onChange={(event) => setTodosExplorerSearchQuery(event.target.value)}
                  className="w-full border-0 bg-transparent p-0 text-sm outline-none placeholder:text-gray-400"
                />
              </div>
            </div>
          )}

          {showTodoFolderInput && (
            <div className="mb-3 rounded-lg bg-gray-200 p-3 dark:bg-dark-tertiary">
              <input
                type="text"
                placeholder="Nombre de la carpeta"
                value={todoFolderName}
                onChange={(e) => setTodoFolderName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleNewTodoFolder();
                }}
                autoFocus
                className="input-field mb-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleNewTodoFolder}
                  className="flex-1 rounded bg-green-500 px-2 py-1 text-sm text-white hover:bg-green-600"
                >
                  Crear
                </button>
                <button
                  onClick={() => setShowTodoFolderInput(false)}
                  className="flex-1 rounded bg-gray-400 px-2 py-1 text-sm text-white hover:bg-gray-500"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1 text-sm">
            <button
              onClick={() => {
                setCurrentTodoFolderId(null);
                setCurrentTodoId(null);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setIsAllTodosDropActive(true);
              }}
              onDragLeave={() => setIsAllTodosDropActive(false)}
              onDrop={(event) => {
                event.preventDefault();
                const todoId = event.dataTransfer.getData('text/quicknotes-todo-id');
                const folderId = event.dataTransfer.getData('text/quicknotes-todo-folder-id');
                if (todoId) {
                  const { moveTodoToFolder } = useTodosStore.getState();
                  moveTodoToFolder(todoId, null);
                }
                if (folderId) {
                  const { moveFolder } = useTodoFoldersStore.getState();
                  moveFolder(folderId, null);
                }
                setIsAllTodosDropActive(false);
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
                currentTodoFolderId === null
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                  : isAllTodosDropActive
                    ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:ring-blue-800'
                    : 'hover:bg-gray-300 dark:hover:bg-dark-tertiary'
              }`}
              title="Todas las tareas"
            >
              <FiCheck size={15} /> {sidebarMode === 'compact' ? '' : 'Todas las Tareas'}
            </button>
            {sidebarMode !== 'compact' && <TodoFolderTree parentId={null} searchQuery={todosExplorerSearchQuery} />}
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 p-3 dark:border-dark-tertiary">
        <button
          onClick={toggleTheme}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 dark:border-dark-tertiary dark:bg-dark-secondary dark:hover:bg-dark-tertiary"
        >
          {getTheme() === 'dark' ? <FiSun /> : <FiMoon />} Tema
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
