import React, { useEffect, useMemo, useState } from 'react';
import { FiArrowLeft, FiFileText, FiFolder, FiSave } from 'react-icons/fi';
import { useAppStore } from '../stores/appStore';
import { useFoldersStore } from '../stores/foldersStore';
import { useNotesStore } from '../stores/notesStore';
import { useTodosStore } from '../stores/todosStore';
import { formatDate } from '../utils/helpers';

const FolderView: React.FC = () => {
  const folderViewId = useAppStore((state) => state.currentFolderViewId);
  const setFolderViewId = useAppStore((state) => state.setCurrentFolderViewId);
  const setCurrentFolderId = useAppStore((state) => state.setCurrentFolderId);
  const setCurrentNoteId = useAppStore((state) => state.setCurrentNoteId);
  const setCurrentTodoId = useAppStore((state) => state.setCurrentTodoId);
  const folders = useFoldersStore((state) => state.folders);
  const updateFolder = useFoldersStore((state) => state.updateFolder);
  const notes = useNotesStore((state) => state.notes);
  const todos = useTodosStore((state) => state.todos);

  const folder = folders.find((item) => item.id === folderViewId) ?? null;
  const childFolders = useMemo(
    () => folders.filter((item) => item.parentId === folderViewId),
    [folders, folderViewId]
  );
  const folderNotes = useMemo(
    () => notes.filter((item) => item.folderId === folderViewId),
    [notes, folderViewId]
  );
  const folderTodos = useMemo(
    () => todos.filter((item) => item.folderId === folderViewId),
    [todos, folderViewId]
  );

  const contentType: 'notes' | 'todos' = folderNotes.length > 0 ? 'notes' : 'todos';
  const hasContent = contentType === 'notes' ? folderNotes.length > 0 : folderTodos.length > 0;
  const contentCount = contentType === 'notes' ? folderNotes.length : folderTodos.length;

  const [folderName, setFolderName] = useState(folder?.name ?? '');

  useEffect(() => {
    setFolderName(folder?.name ?? '');
  }, [folder?.id, folder?.name]);

  if (!folder) {
    return null;
  }

  const handleSave = () => {
    const nextName = folderName.trim();
    if (!nextName) {
      return;
    }

    updateFolder(folder.id, { name: nextName });
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setFolderViewId(null)}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 dark:border-dark-tertiary dark:bg-dark-secondary dark:hover:bg-dark-tertiary"
          >
            <FiArrowLeft /> Volver
          </button>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {childFolders.length} carpetas · {contentCount} {contentType === 'notes' ? 'notas' : 'tareas'}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-dark-tertiary dark:bg-dark-secondary">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <label className="flex-1 space-y-2">
              <span className="block text-sm font-medium text-gray-600 dark:text-gray-300">Nombre de la carpeta</span>
              <input
                type="text"
                value={folderName}
                onChange={(event) => setFolderName(event.target.value)}
                className="input-field text-lg font-semibold"
                placeholder="Nombre de la carpeta"
              />
            </label>
            <button
              onClick={handleSave}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-600"
            >
              <FiSave /> Guardar nombre
            </button>
          </div>
        </div>

        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <FiFolder /> Subcarpetas
          </h3>
          {childFolders.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No hay subcarpetas dentro de esta carpeta.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {childFolders.map((childFolder) => (
                <button
                  key={childFolder.id}
                  onClick={() => {
                    setCurrentFolderId(childFolder.id);
                    setFolderViewId(childFolder.id);
                  }}
                  className="rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-colors hover:bg-gray-50 dark:border-dark-tertiary dark:bg-dark-secondary dark:hover:bg-dark-tertiary"
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <FiFolder />
                    <span className="truncate">{childFolder.name}</span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Abrir carpeta</p>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <FiFileText /> {contentType === 'notes' ? 'Notas' : 'Tareas'}
          </h3>
          {!hasContent ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No hay {contentType === 'notes' ? 'notas' : 'tareas'} en esta carpeta.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {contentType === 'notes'
                ? folderNotes.map((note) => (
                    <button
                      key={note.id}
                      onClick={() => setCurrentNoteId(note.id)}
                      className="rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-colors hover:bg-gray-50 dark:border-dark-tertiary dark:bg-dark-secondary dark:hover:bg-dark-tertiary"
                    >
                      <div className="flex items-center gap-2 font-semibold">
                        <FiFileText />
                        <span className="truncate">{note.title || 'Sin título'}</span>
                      </div>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{formatDate(note.updatedAt)}</p>
                    </button>
                  ))
                : folderTodos.map((todo) => (
                    <button
                      key={todo.id}
                      onClick={() => setCurrentTodoId(todo.id)}
                      className="rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-colors hover:bg-gray-50 dark:border-dark-tertiary dark:bg-dark-secondary dark:hover:bg-dark-tertiary"
                    >
                      <div className="flex items-center gap-2 font-semibold">
                        <FiFileText />
                        <span className="truncate">{todo.title || 'Sin título'}</span>
                      </div>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{formatDate(todo.updatedAt)}</p>
                    </button>
                  ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default FolderView;