import React, { useEffect, useMemo, useState } from 'react';
import { FiArrowLeft, FiFileText, FiFolder, FiSave, FiTrash2 } from 'react-icons/fi';
import { useAppStore } from '../stores/appStore';
import { useFoldersStore } from '../stores/foldersStore';
import { useNotesStore } from '../stores/notesStore';
import { formatDate } from '../utils/helpers';

const NoteFolderView: React.FC = () => {
  const folderViewId = useAppStore((state) => state.currentNotesFolderViewId);
  const setFolderViewId = useAppStore((state) => state.setCurrentNotesFolderViewId);
  const setCurrentFolderId = useAppStore((state) => state.setCurrentNotesFolderId);
  const setCurrentNoteId = useAppStore((state) => state.setCurrentNoteId);

  const folders = useFoldersStore((state) => state.folders);
  const updateFolder = useFoldersStore((state) => state.updateFolder);
  const deleteFolder = useFoldersStore((state) => state.deleteFolder);
  const getFolderPath = useFoldersStore((state) => state.getFolderPath);

  const notes = useNotesStore((state) => state.notes);

  const folder = folders.find((item) => item.id === folderViewId) ?? null;
  const folderPath = useMemo(() => (folderViewId ? getFolderPath(folderViewId) : []), [folderViewId, folders]);
  const childFolders = useMemo(
    () => folders.filter((item) => item.parentId === folderViewId),
    [folders, folderViewId]
  );

  const getAllDescendantFolderIds = (parentId: string): string[] => {
    const descendants: string[] = [parentId];
    const children = folders.filter((item) => item.parentId === parentId);
    children.forEach((child) => {
      descendants.push(...getAllDescendantFolderIds(child.id));
    });
    return descendants;
  };

  const folderNotes = useMemo(
    () => {
      if (!folderViewId) return [];
      const descendantFolderIds = getAllDescendantFolderIds(folderViewId);
      return notes.filter((item) => item.folderId !== null && descendantFolderIds.includes(item.folderId));
    },
    [notes, folderViewId, folders]
  );

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

  const handleDelete = () => {
    deleteFolder(folder.id);
    setFolderViewId(null);
    setCurrentFolderId(null);
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
            {childFolders.length} carpetas · {folderNotes.length} notas
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-dark-tertiary dark:bg-dark-secondary">
          <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
            {folderPath.map((item) => item.name).join(' / ')}
          </p>
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
              <FiSave /> Guardar
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-red-600"
            >
              <FiTrash2 /> Eliminar carpeta
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
            <FiFileText /> Notas
          </h3>
          {folderNotes.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No hay notas en esta carpeta.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {folderNotes.map((note) => (
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
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default NoteFolderView;
