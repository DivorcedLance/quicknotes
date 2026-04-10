import React, { useState } from 'react';
import { FiBookmark, FiCheck, FiSettings, FiFolder, FiPlus, FiMoon, FiSun, FiMenu, FiSearch, FiTag } from 'react-icons/fi';
import { useAppStore } from '../stores/appStore';
import { useFoldersStore } from '../stores/foldersStore';
import { useNotesStore } from '../stores/notesStore';
import { useSettingsStore } from '../stores/settingsStore';
import { generateId } from '../utils/helpers';
import FolderTree from './FolderTree';

const Sidebar: React.FC = () => {
  const {
    currentTab,
    setCurrentTab,
    currentFolderId,
    setCurrentFolderId,
    setCurrentNoteId,
    sidebarMode,
    toggleSidebarMode,
  } = useAppStore();
  const { addFolder } = useFoldersStore();
  const { addNote } = useNotesStore();
  const { toggleTheme, getTheme } = useSettingsStore();
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [explorerSearchQuery, setExplorerSearchQuery] = useState('');
  const [isAllNotesDropActive, setIsAllNotesDropActive] = useState(false);

  const clearOpenViews = () => {
    setCurrentNoteId(null);
    useAppStore.getState().setCurrentTodoId(null);
    useAppStore.getState().setCurrentFolderViewId(null);
  };

  const handleNewNote = () => {
    const newNote = {
      id: generateId(),
      title: '',
      content: '',
      folderId: currentFolderId,
      images: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: [],
    };
    addNote(newNote);
    setCurrentTab('notes');
    setCurrentNoteId(newNote.id);
  };

  const handleNewFolder = () => {
    if (folderName.trim()) {
      const newFolder = {
        id: generateId(),
        name: folderName,
        parentId: currentFolderId,
        sortOrder: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      addFolder(newFolder);
      setFolderName('');
      setShowFolderInput(false);
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
              setCurrentFolderId(null);
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
              setCurrentFolderId(null);
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
              onClick={() => setShowFolderInput(true)}
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
                  value={explorerSearchQuery}
                  onChange={(event) => setExplorerSearchQuery(event.target.value)}
                  className="w-full border-0 bg-transparent p-0 text-sm outline-none placeholder:text-gray-400"
                />
              </div>
            </div>
          )}

          {showFolderInput && (
            <div className="mb-3 rounded-lg bg-gray-200 p-3 dark:bg-dark-tertiary">
              <input
                type="text"
                placeholder="Nombre de la carpeta"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleNewFolder();
                }}
                autoFocus
                className="input-field mb-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleNewFolder}
                  className="flex-1 rounded bg-green-500 px-2 py-1 text-sm text-white hover:bg-green-600"
                >
                  Crear
                </button>
                <button
                  onClick={() => setShowFolderInput(false)}
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
                setCurrentFolderId(null);
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
                currentFolderId === null
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                  : isAllNotesDropActive
                    ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:ring-blue-800'
                  : 'hover:bg-gray-300 dark:hover:bg-dark-tertiary'
              }`}
              title="Todas las notas"
            >
              <FiBookmark size={15} /> {sidebarMode === 'compact' ? '' : 'Todas las Notas'}
            </button>
            {sidebarMode !== 'compact' && <FolderTree parentId={null} searchQuery={explorerSearchQuery} />}
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
