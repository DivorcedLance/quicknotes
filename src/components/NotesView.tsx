import React, { useMemo } from 'react';
import { FiTrash2, FiEdit2, FiPlus, FiSearch, FiTag, FiX, FiFilter, FiCalendar, FiClock, FiCheckCircle } from 'react-icons/fi';
import { useNotesStore } from '../stores/notesStore';
import { useFoldersStore } from '../stores/foldersStore';
import { useAppStore } from '../stores/appStore';
import { useTagsStore } from '../stores/tagsStore';
import {
  clampTextPreview,
  htmlToPreviewText,
  getSearchSnippet,
  sortItems,
  formatDateTimeByFormat,
  getDateLabel,
} from '../utils/helpers';
import { generateId } from '../utils/helpers';
import Tag from './Tag';
import SearchHighlight from './SearchHighlight';

const NotesView: React.FC = () => {
  const { notes, deleteNote, getNotesByFolder, addNote } = useNotesStore();
  const {
    currentNotesFolderId,
    setCurrentNoteId,
    searchQuery,
    setSearchQuery,
    selectedTagFilters,
    setSelectedTagFilters,
    sortBy,
    setSortBy,
  } = useAppStore();
  const getFolderPath = useFoldersStore((state) => state.getFolderPath);

  const currentFolderPath = useMemo(
    () => (currentNotesFolderId ? getFolderPath(currentNotesFolderId) : []),
    [currentNotesFolderId, getFolderPath]
  );
  const { tags } = useTagsStore();
  const { dateTimeFormat } = useAppStore();

  const scopedNotes = useMemo(() => {
    const folderScoped = currentNotesFolderId !== null ? getNotesByFolder(currentNotesFolderId) : notes;
    const query = searchQuery.trim().toLowerCase();

    let result = folderScoped;

    if (query) {
      result = result.filter(
        (note) => note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query)
      );
    }

    if (selectedTagFilters.length > 0) {
      result = result.filter((note) => selectedTagFilters.some((tagId) => note.tags.includes(tagId)));
    }

    return sortItems(result, sortBy === 'date' ? 'date' : 'modified');
  }, [notes, currentNotesFolderId, getNotesByFolder, searchQuery, selectedTagFilters, sortBy]);

  const groupedNotes = useMemo(() => {
    const ordered = [...scopedNotes].sort((a, b) => {
      const getDateForSort = (note: typeof notes[number]) => (sortBy === 'date' ? note.createdAt : note.updatedAt || note.createdAt);
      return getDateForSort(b) - getDateForSort(a);
    });

    const grouped: Record<string, (typeof notes)[number][]> = {};

    ordered.forEach((note) => {
      const dateToUse = sortBy === 'date' ? note.createdAt : note.updatedAt || note.createdAt;
      const label = getDateLabel(dateToUse);
      if (!grouped[label]) grouped[label] = [];
      grouped[label].push(note);
    });

    return grouped;
  }, [scopedNotes, sortBy]);

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-dark-tertiary dark:bg-dark-secondary">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{currentFolderPath.length > 0 ? currentFolderPath.map((item) => item.name).join(' / ') : 'Notas'}</h2>
              {currentFolderPath.length > 0 && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Carpeta actual</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
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
                  setCurrentNoteId(newNote.id);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-600"
              >
                <FiPlus /> Nueva Nota
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
            <label className="flex flex-1 items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-dark-tertiary dark:bg-dark-primary/40">
              <FiSearch className="shrink-0 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar notas por título o contenido"
                className="w-full border-0 bg-transparent p-0 text-sm outline-none placeholder:text-gray-400"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchQuery('');
                  }}
                  className="ml-2 rounded-full p-1 text-gray-500 hover:bg-gray-100"
                  title="Limpiar búsqueda"
                >
                  <FiX />
                </button>
              ) : null}
            </label>

            <div className="inline-flex gap-1 rounded-2xl border border-gray-200 bg-gray-50 p-1 dark:border-dark-tertiary dark:bg-dark-primary/40">
              <button
                onClick={() => setSortBy('date')}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  sortBy === 'date' ? 'bg-purple-500 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-tertiary'
                }`}
                title="Agrupar por fecha de creación"
              >
                <FiCalendar className="inline mr-1" size={14} /> Creadas
              </button>
              <button
                onClick={() => setSortBy('modified')}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  sortBy === 'modified' ? 'bg-purple-500 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-tertiary'
                }`}
                title="Agrupar por fecha de modificación"
              >
                <FiClock className="inline mr-1" size={14} /> Modificadas
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              <FiFilter className="inline mr-1" size={14} />
              Filtros
            </span>
            {tags.length === 0 ? (
              <span className="text-xs text-gray-500 dark:text-gray-400">No hay etiquetas disponibles.</span>
            ) : (
              <>
                {tags.map((tag) => {
                  const isActive = selectedTagFilters.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => setSelectedTagFilters(isActive ? selectedTagFilters.filter((t) => t !== tag.id) : [...selectedTagFilters, tag.id])}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        isActive
                          ? 'border-transparent text-white shadow-sm'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-dark-tertiary dark:bg-dark-primary/40 dark:text-gray-200 dark:hover:bg-dark-tertiary'
                      }`}
                      style={isActive ? { backgroundColor: tag.color } : undefined}
                    >
                      <FiTag /> {tag.name}
                    </button>
                  );
                })}
                {selectedTagFilters.length > 0 || searchQuery ? (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedTagFilters([]);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-dark-tertiary dark:bg-dark-primary/40 dark:text-gray-300 dark:hover:bg-dark-tertiary"
                  >
                    <FiX /> Limpiar filtros
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>

        {Object.keys(groupedNotes).length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500 shadow-sm dark:border-dark-tertiary dark:bg-dark-secondary dark:text-gray-400">
            No se encontraron notas con esos filtros.
          </div>
        ) : (
          <div className="grid gap-6">
            {Object.entries(groupedNotes).map(([dateLabel, items]) => (
              <section key={dateLabel} className="space-y-3">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <FiCheckCircle className="text-blue-500" /> {dateLabel}
                </h3>

                {items.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500 shadow-sm dark:border-dark-tertiary dark:bg-dark-secondary dark:text-gray-400">
                    No hay notas para este día.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {items.map((note) => (
                      <div
                        key={note.id}
                        className="group rounded-2xl border bg-white p-4 shadow-sm transition-all hover:shadow-md dark:bg-dark-secondary border-gray-200 dark:border-dark-tertiary flex items-start justify-between"
                      >
                        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setCurrentNoteId(note.id)}>
                          <h4 className="truncate text-base font-semibold">
                            <SearchHighlight text={note.title || 'Sin título'} query={searchQuery} />
                          </h4>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            <span className="inline-flex items-center gap-1 mr-3" title={`Creada: ${formatDateTimeByFormat(note.createdAt, dateTimeFormat)}`}>
                              <FiCalendar size={14} /> {formatDateTimeByFormat(note.createdAt, dateTimeFormat)}
                            </span>
                            <span className="inline-flex items-center gap-1" title={`Modificada: ${formatDateTimeByFormat(note.updatedAt || note.createdAt, dateTimeFormat)}`}>
                              <FiClock size={14} /> {formatDateTimeByFormat(note.updatedAt || note.createdAt, dateTimeFormat)}
                            </span>
                            {note.folderId && (() => {
                              const folderPath = getFolderPath(note.folderId);
                              return folderPath.length > 0 ? (
                                <span className="ml-3 rounded-full bg-gray-100 px-2 py-1 text-xs dark:bg-dark-tertiary">
                                  {folderPath.map((item) => item.name).join(' / ')}
                                </span>
                              ) : null;
                            })()}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mt-2">
                            <SearchHighlight
                              text={
                                searchQuery
                                  ? getSearchSnippet(htmlToPreviewText(note.content) || 'Sin contenido', searchQuery, 60, 140)
                                  : clampTextPreview(htmlToPreviewText(note.content) || 'Sin contenido', 120)
                              }
                              query={searchQuery}
                            />
                          </p>
                          {note.tags.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {note.tags.map((tagId) => {
                                const tag = tags.find((t) => t.id === tagId);
                                return tag ? <Tag key={tagId} tag={tag} /> : null;
                              })}
                            </div>
                          )}
                        </div>

                        <div className="ml-3 flex items-start gap-2 opacity-0 group-hover:opacity-100">
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentNoteId(note.id);
                              }}
                              className="rounded-lg p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-950"
                              title="Editar"
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNote(note.id);
                              }}
                              className="rounded-lg p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-950"
                              title="Eliminar"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesView;
