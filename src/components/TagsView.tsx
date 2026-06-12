import React, { useMemo, useState } from 'react';
import { FiAlertTriangle, FiArrowLeft, FiCheck, FiPlus, FiSave, FiTag, FiTrash2 } from 'react-icons/fi';
import { useAppStore } from '../stores/appStore';
import { useNotesStore } from '../stores/notesStore';
import { useTagsStore } from '../stores/tagsStore';
import { useTodosStore } from '../stores/todosStore';
import { generateId } from '../utils/helpers';
import Tag from './Tag';

interface TagEditorFormProps {
  tag: { id: string; name: string; color: string; description: string } | null;
  isCreatingNew: boolean;
  selectedTagId: string | null;
  onSaved: () => void;
}

const presetColorsList = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFA07A',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E2',
  '#F8B88B',
  '#B2EBF2',
  '#DDA0DD',
  '#F0E68C',
  '#90EE90',
  '#87CEEB',
  '#FFB6C1',
];

const TagEditorForm: React.FC<TagEditorFormProps> = ({ tag, isCreatingNew, selectedTagId, onSaved }) => {
  const { addTag, updateTag } = useTagsStore();
  const [name, setName] = useState(tag?.name ?? '');
  const [color, setColor] = useState(tag?.color ?? '#4ECDC4');
  const [description, setDescription] = useState(tag?.description ?? '');

  const saveTag = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    if (selectedTagId && !isCreatingNew) {
      updateTag(selectedTagId, { name: trimmedName, color, description });
    } else {
      addTag({ id: generateId(), name: trimmedName, color, description });
    }

    onSaved();
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-dark-tertiary dark:bg-dark-secondary">
      <div className="mb-4 flex items-center gap-2">
        <FiSave className="text-blue-500" />
        <h3 className="text-lg font-semibold">{tag ? 'Editar etiqueta' : 'Nueva etiqueta'}</h3>
      </div>

      <div className="space-y-4">
        <label className="block space-y-2">
          <span className="block text-sm font-medium text-gray-600 dark:text-gray-300">Nombre*</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nombre de la etiqueta"
            className="input-field"
            autoFocus
          />
        </label>

        <label className="block space-y-2">
          <span className="block text-sm font-medium text-gray-600 dark:text-gray-300">Descripción</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe para qué sirve"
            className="input-field min-h-24 resize-none"
          />
        </label>

        <div>
          <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Color</span>
          <div className="flex flex-wrap gap-2">
            {presetColorsList.map((presetColor) => (
              <button
                key={presetColor}
                onClick={() => setColor(presetColor)}
                className={`h-9 w-9 rounded-lg transition-transform ${color === presetColor ? 'scale-110 ring-2 ring-offset-2 dark:ring-offset-dark-secondary' : ''}`}
                style={{ backgroundColor: presetColor }}
              />
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              className="h-12 w-12 cursor-pointer rounded border-2 border-gray-300 dark:border-dark-tertiary"
            />
            <input
              type="text"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              className="input-field flex-1"
              placeholder="#4ECDC4"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-dark-tertiary dark:bg-dark-primary/30">
          <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-300">Vista previa</p>
          <Tag tag={{ id: tag?.id || 'preview', name: name || 'Nueva etiqueta', color, description }} />
        </div>

        <div className="flex gap-2">
          <button
            onClick={saveTag}
            className="flex-1 rounded-xl bg-green-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-600"
            disabled={!name.trim()}
          >
            <FiCheck className="inline-block" /> Guardar
          </button>
          <button
            onClick={onSaved}
            className="rounded-xl bg-gray-200 px-4 py-3 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-300 dark:bg-dark-tertiary dark:text-gray-100 dark:hover:bg-dark-secondary"
          >
            Limpiar
          </button>
        </div>
      </div>
    </div>
  );
};

const TagsView: React.FC = () => {
  const { setCurrentTab, setCurrentNotesFolderViewId, setCurrentTodoFolderViewId, setCurrentNoteId, setCurrentTodoId } = useAppStore();
  const { tags, deleteTag } = useTagsStore();
  const { notes } = useNotesStore();
  const { todos } = useTodosStore();

  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [pendingDeleteTagId, setPendingDeleteTagId] = useState<string | null>(null);

  const activeTag = useMemo(
    () => tags.find((tag) => tag.id === selectedTagId) ?? null,
    [tags, selectedTagId]
  );

  const getUsage = (tagId: string) => ({
    notes: notes.filter((note) => note.tags.includes(tagId)),
    todos: todos.filter((todo) => todo.tags.includes(tagId)),
  });

  const startCreating = () => {
    setSelectedTagId(null);
    setIsCreatingNew(true);
  };

  const startEditing = (tagId: string) => {
    setSelectedTagId(tagId);
    setIsCreatingNew(false);
  };

  const requestDelete = (tagId: string) => {
    const usage = getUsage(tagId);
    if (usage.notes.length === 0 && usage.todos.length === 0) {
      deleteTag(tagId);
      if (selectedTagId === tagId) {
        setSelectedTagId(null);
        setIsCreatingNew(false);
      }
      return;
    }

    setPendingDeleteTagId(tagId);
  };

  const confirmDelete = () => {
    if (!pendingDeleteTagId) {
      return;
    }

    deleteTag(pendingDeleteTagId);
    if (selectedTagId === pendingDeleteTagId) {
      setSelectedTagId(null);
      setIsCreatingNew(false);
    }
    setPendingDeleteTagId(null);
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Etiquetas</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Crea, edita y organiza las etiquetas usadas en notas y tareas.</p>
          </div>
          <button
            onClick={() => {
              setCurrentTab('notes');
              setCurrentNotesFolderViewId(null);
              setCurrentTodoFolderViewId(null);
              setCurrentNoteId(null);
              setCurrentTodoId(null);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 dark:border-dark-tertiary dark:bg-dark-secondary dark:hover:bg-dark-tertiary"
          >
            <FiArrowLeft /> Volver
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Lista</h3>
              <button
                onClick={startCreating}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-600"
              >
                <FiPlus /> Nueva etiqueta
              </button>
            </div>

            {tags.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-sm text-gray-500 dark:border-dark-tertiary dark:text-gray-400">
                No hay etiquetas todavía.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {tags.map((tag) => {
                  const usage = getUsage(tag.id);
                  return (
                    <div
                      key={tag.id}
                      className={`rounded-2xl border bg-white p-4 shadow-sm dark:bg-dark-secondary ${
                        selectedTagId === tag.id && !isCreatingNew ? 'border-blue-400 ring-2 ring-blue-200 dark:border-blue-700 dark:ring-blue-900' : 'border-gray-200 dark:border-dark-tertiary'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <Tag tag={tag} />
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {usage.notes.length} notas · {usage.todos.length} tareas
                          </p>
                        </div>
                        <FiTag className="shrink-0 text-gray-400" />
                      </div>

                      <p className="mt-3 line-clamp-3 text-sm text-gray-600 dark:text-gray-300">
                        {tag.description || 'Sin descripción'}
                      </p>

                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => startEditing(tag.id)}
                          className="flex-1 rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:hover:bg-blue-900"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => requestDelete(tag.id)}
                          className="inline-flex items-center justify-center rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-200 dark:bg-red-950 dark:text-red-200 dark:hover:bg-red-900"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <TagEditorForm
              key={isCreatingNew ? 'new' : activeTag?.id ?? 'none'}
              tag={isCreatingNew ? null : activeTag}
              isCreatingNew={isCreatingNew}
              selectedTagId={selectedTagId}
              onSaved={() => {
                setIsCreatingNew(false);
                setSelectedTagId(null);
              }}
            />

            {pendingDeleteTagId && (() => {
              const tag = tags.find((item) => item.id === pendingDeleteTagId);
              const usage = getUsage(pendingDeleteTagId);

              return (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-200">
                    <FiAlertTriangle /> Confirmar borrado
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    Vas a borrar {tag ? <span className="font-semibold">{tag.name}</span> : 'esta etiqueta'}. Está usada en:
                  </p>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl bg-white p-3 dark:bg-dark-secondary">
                      <p className="mb-2 text-sm font-semibold">Notas</p>
                      {usage.notes.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Ninguna</p>
                      ) : (
                        <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                          {usage.notes.map((note) => (
                            <li key={note.id} className="truncate">{note.title || 'Sin título'}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="rounded-xl bg-white p-3 dark:bg-dark-secondary">
                      <p className="mb-2 text-sm font-semibold">Tareas</p>
                      {usage.todos.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Ninguna</p>
                      ) : (
                        <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                          {usage.todos.map((todo) => (
                            <li key={todo.id} className="truncate">{todo.title || 'Sin título'}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={confirmDelete}
                      className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-red-600"
                    >
                      Borrar igualmente
                    </button>
                    <button
                      onClick={() => setPendingDeleteTagId(null)}
                      className="flex-1 rounded-xl bg-gray-200 px-4 py-3 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-300 dark:bg-dark-tertiary dark:text-gray-100 dark:hover:bg-dark-secondary"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              );
            })()}
          </section>
        </div>
      </div>
    </div>
  );
};

export default TagsView;