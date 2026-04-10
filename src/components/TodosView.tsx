import React, { useMemo } from 'react';
import { FiTrash2, FiEdit2, FiPlus } from 'react-icons/fi';
import { useTodosStore } from '../stores/todosStore';
import { useAppStore } from '../stores/appStore';
import { useTagsStore } from '../stores/tagsStore';
import {
  clampTextPreview,
  formatDate,
  htmlToPreviewText,
  groupByDate,
  sortItems,
} from '../utils/helpers';
import Tag from './Tag';

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
    showOnlyActiveTodos,
    setShowOnlyActiveTodos,
    selectedTagFilters,
    sortBy,
    groupByDate: groupByDateSetting,
    currentFolderId,
    setCurrentTodoId,
  } = useAppStore();
  const { tags } = useTagsStore();

  const filteredTodos = useMemo(() => {
    let result = currentFolderId !== null ? getTodosByFolder(currentFolderId) : todos;

    if (showOnlyActiveTodos) {
      result = result.filter((todo) => !todo.completed);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (todo) =>
          todo.title.toLowerCase().includes(query) ||
          todo.description.toLowerCase().includes(query)
      );
    }

    // Apply tag filters
    if (selectedTagFilters.length > 0) {
      result = result.filter((todo) =>
        selectedTagFilters.some((tagId) => todo.tags.includes(tagId))
      );
    }

    return sortItems(result, sortBy);
  }, [todos, currentFolderId, showOnlyActiveTodos, searchQuery, selectedTagFilters, sortBy]);

  const groupedTodos = useMemo(() => {
    if (groupByDateSetting) {
      return groupByDate(filteredTodos);
    }
    return { 'Tareas': filteredTodos };
  }, [filteredTodos, groupByDateSetting]);

  return (
    <div className="p-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <button
          onClick={() => {
            const newTodo = {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              title: '',
              description: '',
              completed: false,
              folderId: currentFolderId,
              tags: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            addTodo(newTodo);
            setCurrentTodoId(newTodo.id);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <FiPlus /> Nueva Tarea
        </button>

        <label className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-dark-tertiary rounded-lg cursor-pointer hover:bg-gray-300 dark:hover:bg-dark-secondary transition-colors">
          <input
            type="checkbox"
            checked={showOnlyActiveTodos}
            onChange={(e) => setShowOnlyActiveTodos(e.target.checked)}
            className="rounded"
          />
          Solo pendientes
        </label>
      </div>

      {/* Todos List */}
      {Object.entries(groupedTodos).map(([dateLabel, todos]) => (
        <div key={dateLabel} className="mb-8">
          <h3 className="text-lg font-bold mb-4 text-blue-600 dark:text-blue-400">
            {dateLabel}
          </h3>

          {todos.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              {showOnlyActiveTodos ? 'No hay tareas pendientes' : 'No hay tareas'}
            </p>
          ) : (
            <div className="space-y-3">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className="card group flex items-start gap-4 hover:shadow-lg transition-all cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                    className="mt-1 w-5 h-5 rounded cursor-pointer"
                  />

                  <div className="flex-1 min-w-0" onClick={() => setCurrentTodoId(todo.id)}>
                    <h4
                      className={`font-bold ${
                        todo.completed
                          ? 'line-through text-gray-500 dark:text-gray-400'
                          : ''
                      }`}
                    >
                      {todo.title}
                    </h4>
                    {todo.description && (
                      <p
                        className={`text-sm ${
                          todo.completed
                            ? 'line-through text-gray-500 dark:text-gray-400'
                            : 'text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {clampTextPreview(htmlToPreviewText(todo.description) || 'Sin descripción', 120)}
                      </p>
                    )}
                    {todo.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {todo.tags.map((tagId) => {
                          const tag = tags.find((t) => t.id === tagId);
                          return tag ? <Tag key={tagId} tag={tag} /> : null;
                        })}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {formatDate(todo.createdAt)}
                    </p>
                    {todo.folderId && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Carpeta asignada
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setCurrentTodoId(todo.id)}
                      className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors"
                    >
                      <FiEdit2 size={18} />
                    </button>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TodosView;
