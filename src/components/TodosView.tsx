import React, { useMemo } from 'react';
import { FiCheckCircle, FiEdit2, FiFilter, FiPlus, FiSearch, FiTag, FiTrash2, FiX } from 'react-icons/fi';
import { useTodosStore } from '../stores/todosStore';
import { useAppStore } from '../stores/appStore';
import { useTagsStore } from '../stores/tagsStore';
import { useTodoFoldersStore } from '../stores/todoFoldersStore';
import {
  clampTextPreview,
  formatDateTime,
  htmlToPreviewText,
  getDateLabel,
  getSearchSnippet,
  sortItems,
} from '../utils/helpers';
import Tag from './Tag';
import SearchHighlight from './SearchHighlight';

const TodosView: React.FC = () => {
  const {
    todos,
    toggleTodo,
    deleteTodo,
    getTodosByFolder,
    addTodo,
  } = useTodosStore();
  const {
    searchQuery,
    setSearchQuery,
    showOnlyActiveTodos,
    setShowOnlyActiveTodos,
    selectedTagFilters,
    setSelectedTagFilters,
    sortBy,
    currentTodoFolderId,
    setCurrentTodoId,
  } = useAppStore();
  const { tags } = useTagsStore();
  const getFolderPath = useTodoFoldersStore((state) => state.getFolderPath);

  const currentFolderPath = useMemo(
    () => (currentTodoFolderId ? getFolderPath(currentTodoFolderId) : []),
    [currentTodoFolderId, getFolderPath]
  );

  const scopedTodos = useMemo(() => {
    const folderScopedTodos = currentTodoFolderId !== null ? getTodosByFolder(currentTodoFolderId) : todos;
    const query = searchQuery.trim().toLowerCase();

    let result = folderScopedTodos;

    if (query) {
      result = result.filter(
        (todo) =>
          todo.title.toLowerCase().includes(query) ||
          todo.description.toLowerCase().includes(query)
      );
    }

    if (selectedTagFilters.length > 0) {
      result = result.filter((todo) => selectedTagFilters.some((tagId) => todo.tags.includes(tagId)));
    }

    return sortItems(result, sortBy);
  }, [todos, currentTodoFolderId, getTodosByFolder, searchQuery, selectedTagFilters, sortBy]);

  const groupedTodos = useMemo(() => {
    const ordered = [...scopedTodos].sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
    const grouped: Record<string, (typeof todos)[number][]> = {};

    ordered.forEach((todo) => {
      const label = getDateLabel(todo.updatedAt || todo.createdAt);
      if (!grouped[label]) {
        grouped[label] = [];
      }
      grouped[label].push(todo);
    });

    return grouped;
  }, [scopedTodos, todos]);

  const activeTagCount = selectedTagFilters.length;

  const toggleTagFilter = (tagId: string) => {
    setSelectedTagFilters(
      selectedTagFilters.includes(tagId)
        ? selectedTagFilters.filter((id) => id !== tagId)
        : [...selectedTagFilters, tagId]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTagFilters([]);
  };

  const renderTodoCard = (todo: (typeof todos)[number]) => (
    <div
      key={todo.id}
      className={`group rounded-2xl border bg-white p-4 shadow-sm transition-all hover:shadow-md dark:bg-dark-secondary ${
        todo.completed
          ? 'border-gray-200 opacity-80 dark:border-dark-tertiary'
          : 'border-gray-200 dark:border-dark-tertiary'
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => toggleTodo(todo.id)}
          className="mt-1 h-5 w-5 rounded border-gray-300"
        />

        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setCurrentTodoId(todo.id)}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h4 className={`truncate text-base font-semibold ${todo.completed ? 'text-gray-500 line-through' : ''}`}>
                <SearchHighlight text={todo.title || 'Sin título'} query={searchQuery} />
              </h4>
              {todo.description && (
                <p className={`mt-1 text-sm ${todo.completed ? 'text-gray-500 line-through' : 'text-gray-600 dark:text-gray-300'}`}>
                  <SearchHighlight
                    text={
                      searchQuery
                        ? getSearchSnippet(htmlToPreviewText(todo.description) || 'Sin descripción', searchQuery, 60, 140)
                        : clampTextPreview(htmlToPreviewText(todo.description) || 'Sin descripción', 140)
                    }
                    query={searchQuery}
                  />
                </p>
              )}
            </div>

            <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  setCurrentTodoId(todo.id);
                }}
                className="rounded-lg p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-950"
                title="Editar"
              >
                <FiEdit2 size={16} />
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  deleteTodo(todo.id);
                }}
                className="rounded-lg p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-950"
                title="Eliminar"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Creada: {formatDateTime(todo.createdAt)}</span>
            <span>Modificada: {formatDateTime(todo.updatedAt || todo.createdAt)}</span>
            <span>
              Completada: {todo.completedAt ? formatDateTime(todo.completedAt) : 'Sin completar'}
            </span>
            {todo.folderId && (
              <span className="rounded-full bg-gray-100 px-2 py-1 dark:bg-dark-tertiary">
                Carpeta asignada
              </span>
            )}
          </div>

          {todo.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {todo.tags.map((tagId) => {
                const tag = tags.find((item) => item.id === tagId);
                return tag ? <Tag key={tagId} tag={tag} /> : null;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-dark-tertiary dark:bg-dark-secondary">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Tareas</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Busca, filtra por etiquetas y decide si quieres ocultar o mostrar las completadas.
              </p>
              {currentFolderPath.length > 0 && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Carpeta actual: {currentFolderPath.map((item) => item.name).join(' / ')}
                </p>
              )}
            </div>

            <button
              onClick={() => {
                const newTodo = {
                  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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
                setCurrentTodoId(newTodo.id);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-600"
            >
              <FiPlus /> Nueva Tarea
            </button>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <label className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-dark-tertiary dark:bg-dark-primary/40">
              <FiSearch className="shrink-0 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Buscar tareas por título o descripción"
                className="w-full border-0 bg-transparent p-0 text-sm outline-none placeholder:text-gray-400"
              />
            </label>

            <label className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-dark-tertiary dark:bg-dark-primary/40">
              <input
                type="checkbox"
                checked={showOnlyActiveTodos}
                onChange={(event) => setShowOnlyActiveTodos(event.target.checked)}
                className="rounded"
              />
              Ocultar completadas
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-dark-primary/50 dark:text-gray-300">
              <FiFilter /> Filtros
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
                      onClick={() => toggleTagFilter(tag.id)}
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
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-dark-tertiary dark:bg-dark-primary/40 dark:text-gray-300 dark:hover:bg-dark-tertiary"
                  >
                    <FiX /> Limpiar filtros
                  </button>
                ) : null}
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="rounded-full bg-gray-100 px-3 py-1 dark:bg-dark-primary/50">{scopedTodos.filter((todo) => !todo.completed).length} pendientes</span>
            <span className="rounded-full bg-gray-100 px-3 py-1 dark:bg-dark-primary/50">{scopedTodos.filter((todo) => todo.completed).length} completadas</span>
            <span className="rounded-full bg-gray-100 px-3 py-1 dark:bg-dark-primary/50">{scopedTodos.length} visibles</span>
            {activeTagCount > 0 && (
              <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                {activeTagCount} filtro{activeTagCount === 1 ? '' : 's'} de etiqueta
              </span>
            )}
          </div>
        </div>

        {scopedTodos.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500 shadow-sm dark:border-dark-tertiary dark:bg-dark-secondary dark:text-gray-400">
            No se encontraron tareas con esos filtros.
          </div>
        ) : (
          <div className="grid gap-6">
            {Object.entries(groupedTodos).map(([dateLabel, items]) => {
              return (
                <section key={dateLabel} className="space-y-3">
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <FiCheckCircle className="text-blue-500" /> {dateLabel}
                  </h3>

                  {items.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500 shadow-sm dark:border-dark-tertiary dark:bg-dark-secondary dark:text-gray-400">
                      No hay tareas para este día.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {items.map(renderTodoCard)}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodosView;
