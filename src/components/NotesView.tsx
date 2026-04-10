import React, { useMemo } from 'react';
import { FiTrash2, FiEdit2 } from 'react-icons/fi';
import { useNotesStore } from '../stores/notesStore';
import { useAppStore } from '../stores/appStore';
import { useTagsStore } from '../stores/tagsStore';
import {
  clampTextPreview,
  formatDate,
  htmlToPreviewText,
  sortItems,
} from '../utils/helpers';
import Tag from './Tag';

const NotesView: React.FC = () => {
  const { notes, deleteNote, getNotesByFolder } = useNotesStore();
  const { currentNotesFolderId, setCurrentNoteId, searchQuery, selectedTagFilters, sortBy } = useAppStore();
  const { tags } = useTagsStore();

  const filteredNotes = useMemo(() => {
    let result = currentNotesFolderId !== null ? getNotesByFolder(currentNotesFolderId) : notes;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query)
      );
    }

    // Apply tag filters
    if (selectedTagFilters.length > 0) {
      result = result.filter((note) =>
        selectedTagFilters.some((tagId) => note.tags.includes(tagId))
      );
    }

    return sortItems(result, sortBy);
  }, [notes, currentNotesFolderId, searchQuery, selectedTagFilters, sortBy]);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Notas</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Abre una nota desde la barra lateral para editarla directamente.</p>
        </div>
      </div>

      {filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {searchQuery ? 'No se encontraron notas' : 'No hay notas en esta carpeta'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="card hover:shadow-lg cursor-pointer transition-all group"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1" onClick={() => setCurrentNoteId(note.id)}>
                  <h3 className="font-bold text-lg truncate group-hover:text-blue-500">
                    {note.title || 'Sin título'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(note.updatedAt)}
                  </p>
                </div>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="p-1 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-opacity"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-3">
                {clampTextPreview(htmlToPreviewText(note.content) || 'Sin contenido', 120)}
              </p>

              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {note.tags.map((tagId) => {
                    const tag = tags.find((t) => t.id === tagId);
                    return tag ? <Tag key={tagId} tag={tag} /> : null;
                  })}
                </div>
              )}

              {note.images.length > 0 && (
                <div className="text-xs text-gray-500">
                  📷 Contenido con imágenes incrustadas
                </div>
              )}

              <button
                onClick={() => setCurrentNoteId(note.id)}
                className="mt-3 w-full px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <FiEdit2 size={16} /> Editar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesView;
