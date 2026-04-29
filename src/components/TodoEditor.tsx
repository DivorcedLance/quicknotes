import React, { useEffect, useRef, useState } from 'react';
import { FiArrowLeft, FiTag, FiEye, FiEyeOff, FiSearch } from 'react-icons/fi';
import RichTextEditor, { type RichTextEditorHandle } from './RichTextEditor';
import { useTodosStore } from '../stores/todosStore';
import { useTagsStore } from '../stores/tagsStore';
import { useAppStore } from '../stores/appStore';
import { useTodoFoldersStore } from '../stores/todoFoldersStore';
import { generateId } from '../utils/helpers';
import type { Todo } from '../types';
import Tag from './Tag';

interface TodoEditorProps {
  todoId: string | null;
  onClose: () => void;
}

const TodoEditor: React.FC<TodoEditorProps> = ({ todoId, onClose }) => {
  const { todos, updateTodo, addTodo, deleteTodo } = useTodosStore();
  const { tags } = useTagsStore();
  const { showInspectorPanel, currentTodoFolderId } = useAppStore();
  const folders = useTodoFoldersStore((state) => state.folders);
  const editorRef = useRef<RichTextEditorHandle>(null);
  const [editorSearchQuery, setEditorSearchQuery] = useState('');

  const existingTodo = todoId ? todos.find((t) => t.id === todoId) : null;
  const [todo, setTodo] = useState<Todo>(
    existingTodo || {
      id: generateId(),
      title: '',
      description: '',
      completed: false,
      folderId: currentTodoFolderId,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  );

  const [selectedTags, setSelectedTags] = useState<string[]>(todo.tags);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!todo.title.trim()) {
        return;
      }

      const nextTodo = {
        ...todo,
        tags: selectedTags,
        updatedAt: Date.now(),
      };

      if (todoId) {
        updateTodo(todoId, nextTodo);
      } else {
        addTodo(nextTodo);
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [todo, selectedTags, todoId, updateTodo, addTodo]);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleBack = () => {
    const isEmptyTodo = todo.title.trim().length === 0 && todo.description.trim().length === 0;

    if (todoId && isEmptyTodo) {
      const todoExists = todos.some((item) => item.id === todoId);
      if (todoExists) {
        deleteTodo(todoId);
      }
    }

    onClose();
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (editorSearchQuery.trim()) {
        editorRef.current?.search(editorSearchQuery);
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [editorSearchQuery, todo.description]);

  return (
    <div className="relative h-full overflow-hidden bg-light-primary text-gray-900 dark:bg-dark-primary dark:text-gray-100">
      <button
        onClick={handleBack}
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-3 py-2 text-sm backdrop-blur hover:bg-white dark:border-dark-tertiary dark:bg-dark-secondary/90 dark:hover:bg-dark-secondary"
      >
        <FiArrowLeft /> Volver
      </button>

      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        <label className="flex items-center gap-2 rounded-full border border-gray-200 bg-white/85 px-3 py-2 text-xs text-gray-600 shadow-sm backdrop-blur dark:border-dark-tertiary dark:bg-dark-secondary/85 dark:text-gray-300">
          <FiSearch />
          <input
            type="text"
            value={editorSearchQuery}
            onChange={(event) => setEditorSearchQuery(event.target.value)}
            placeholder="Buscar en la tarea"
            className="w-40 border-0 bg-transparent p-0 text-xs outline-none placeholder:text-gray-400 lg:w-56"
          />
        </label>

        <button
          onClick={() => useAppStore.getState().setShowInspectorPanel(!showInspectorPanel)}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/85 px-3 py-2 text-xs text-gray-600 shadow-sm backdrop-blur hover:bg-white dark:border-dark-tertiary dark:bg-dark-secondary/85 dark:text-gray-300 dark:hover:bg-dark-secondary"
        >
          {showInspectorPanel ? <FiEyeOff /> : <FiEye />} Etiquetas
        </button>
      </div>

      <div className={`grid h-full grid-cols-1 gap-0 overflow-hidden pt-16 ${showInspectorPanel ? 'lg:grid-cols-[1fr_300px]' : ''}`}>
        <div className="overflow-auto p-4 lg:p-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-4">
            <label className="space-y-2">
              <span className="block text-sm font-medium text-gray-600 dark:text-gray-300">Título*</span>
              <input
                type="text"
                placeholder="¿Qué necesitas hacer?"
                value={todo.title}
                onChange={(e) => setTodo({ ...todo, title: e.target.value })}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-xl font-semibold outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 dark:border-dark-tertiary dark:bg-dark-secondary dark:placeholder:text-gray-500"
                autoFocus
              />
            </label>

            <div className="space-y-2">
              <span className="block text-sm font-medium text-gray-600 dark:text-gray-300">Descripción</span>
              <RichTextEditor
                ref={editorRef}
                value={todo.description}
                onChange={(description) => setTodo((current) => ({ ...current, description }))}
                placeholder="Escribe la descripción como un documento. Pega imágenes y redimensiónalas en el editor."
                className="shadow-md"
              />
            </div>

            <label className="space-y-2">
              <span className="block text-sm font-medium text-gray-600 dark:text-gray-300">Carpeta</span>
              <select
                value={todo.folderId ?? ''}
                onChange={(event) =>
                  setTodo({
                    ...todo,
                    folderId: event.target.value || null,
                  })
                }
                className="input-field"
              >
                <option value="">Sin carpeta</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {showInspectorPanel && (
          <aside className="border-t border-gray-200 bg-gray-50 p-4 dark:border-dark-tertiary dark:bg-dark-secondary lg:border-t-0 lg:border-l">
            <h4 className="mb-3 flex items-center gap-2 font-semibold">
              <FiTag /> Etiquetas
            </h4>
            <div className="space-y-2 overflow-y-auto">
              {tags.length === 0 ? (
                <p className="text-sm text-gray-500">No hay etiquetas disponibles</p>
              ) : (
                tags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-gray-200 dark:hover:bg-dark-tertiary"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag.id)}
                      onChange={() => toggleTag(tag.id)}
                      className="rounded"
                    />
                    <Tag tag={tag} />
                  </label>
                ))
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default TodoEditor;
