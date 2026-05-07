import React, { useEffect, useRef, useState } from 'react';
import { FiArrowLeft, FiTag, FiEye, FiEyeOff, FiSearch } from 'react-icons/fi';
import RichTextEditor, { type RichTextEditorHandle } from './RichTextEditor';
import { useNotesStore } from '../stores/notesStore';
import { useTagsStore } from '../stores/tagsStore';
import { useAppStore } from '../stores/appStore';
import { generateId } from '../utils/helpers';
import type { Note } from '../types';
import Tag from './Tag';

interface NoteEditorProps {
  noteId: string | null;
  onClose: () => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ noteId, onClose }) => {
  const { notes, updateNote, addNote, deleteNote } = useNotesStore();
  const { tags } = useTagsStore();
  const { currentNotesFolderId, showInspectorPanel } = useAppStore();
  const editorRef = useRef<RichTextEditorHandle>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const isClosingRef = useRef(false);
  const initialSnapshotRef = useRef<string>('');
  const [editorSearchQuery, setEditorSearchQuery] = useState('');

  const existingNote = noteId ? notes.find((n) => n.id === noteId) : null;
  const [note, setNote] = useState<Note>(
    existingNote || {
      id: noteId ?? generateId(),
      title: '',
      content: '',
      folderId: currentNotesFolderId,
      images: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: [],
    }
  );

  const [selectedTags, setSelectedTags] = useState<string[]>(note.tags);

  useEffect(() => {
    const snapshot = JSON.stringify({
      title: note.title,
      content: note.content,
      folderId: note.folderId,
      images: note.images,
      tags: selectedTags,
    });

    if (!initialSnapshotRef.current) {
      initialSnapshotRef.current = snapshot;
    }
  }, []);

  const getCurrentSnapshot = (nextNote: Note, nextTags: string[]) =>
    JSON.stringify({
      title: nextNote.title,
      content: nextNote.content,
      folderId: nextNote.folderId,
      images: nextNote.images,
      tags: nextTags,
    });

  const persistNote = (nextNote: Note, nextTags: string[]) => {
    const snapshot = getCurrentSnapshot(nextNote, nextTags);
    if (snapshot === initialSnapshotRef.current) {
      return;
    }

    const payload = {
      ...nextNote,
      tags: nextTags,
      updatedAt: Date.now(),
    };

    if (noteId) {
      updateNote(noteId, payload);
    } else {
      addNote(payload);
    }

    initialSnapshotRef.current = snapshot;
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (isClosingRef.current) {
        return;
      }

      persistNote(note, selectedTags);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [note, selectedTags, noteId, updateNote, addNote]);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleBack = () => {
    isClosingRef.current = true;

    const latestTitle = titleInputRef.current?.value ?? note.title;
    const latestContent = editorRef.current?.getHtml() ?? note.content;
    const normalizedTitle = latestTitle.trim().length === 0 ? '' : latestTitle;

    const nextNote = {
      ...note,
      title: normalizedTitle,
      content: latestContent,
      tags: selectedTags,
    };

    const hasMeaningfulContent =
      nextNote.title.trim().length > 0 ||
      nextNote.content.trim().length > 0 ||
      nextNote.images.length > 0 ||
      selectedTags.length > 0;

    const isEmptyNote =
      nextNote.title.trim().length === 0 &&
      nextNote.content.trim().length === 0 &&
      nextNote.images.length === 0;

    if (noteId) {
      const noteExists = notes.some((item) => item.id === noteId);
      if (noteExists) {
        if (isEmptyNote) {
          deleteNote(noteId);
        } else {
          persistNote(nextNote, selectedTags);
        }
      } else if (hasMeaningfulContent) {
        persistNote(nextNote, selectedTags);
      }
      onClose();
      return;
    }

    if (hasMeaningfulContent) {
      persistNote(nextNote, selectedTags);
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
  }, [editorSearchQuery, note.content]);

  return (
    <div className="relative h-full overflow-hidden bg-light-primary text-gray-900 dark:bg-dark-primary dark:text-gray-100">
      <button
        onClick={handleBack}
        className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-2 py-2 sm:px-3 text-sm backdrop-blur hover:bg-white dark:border-dark-tertiary dark:bg-dark-secondary/90 dark:hover:bg-dark-secondary"
      >
        <FiArrowLeft /> <span className="hidden sm:inline">Volver</span>
      </button>

      <div className="absolute right-4 top-4 z-20 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2 rounded-full border border-gray-200 bg-white/85 px-3 py-2 text-xs text-gray-600 shadow-sm backdrop-blur dark:border-dark-tertiary dark:bg-dark-secondary/85 dark:text-gray-300">
          <FiSearch />
          <input
            type="text"
            value={editorSearchQuery}
            onChange={(event) => setEditorSearchQuery(event.target.value)}
            placeholder="Buscar"
            className="w-24 border-0 bg-transparent p-0 text-xs outline-none placeholder:text-gray-400 sm:w-40 lg:w-56"
          />
        </label>

        <button
          onClick={() => useAppStore.getState().setShowInspectorPanel(!showInspectorPanel)}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/85 px-3 py-2 text-xs text-gray-600 shadow-sm backdrop-blur hover:bg-white dark:border-dark-tertiary dark:bg-dark-secondary/85 dark:text-gray-300 dark:hover:bg-dark-secondary"
        >
          {showInspectorPanel ? <FiEyeOff /> : <FiEye />} <span className="hidden sm:inline">Etiquetas</span>
        </button>
      </div>

      <div className={`grid h-full grid-cols-1 gap-0 overflow-hidden pt-16 ${showInspectorPanel ? 'lg:grid-cols-[1fr_300px]' : ''}`}>
        <div className="overflow-auto p-4 lg:p-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-4">
            <input
              ref={titleInputRef}
              type="text"
              placeholder="Título de la nota"
              value={note.title}
              onChange={(e) => setNote({ ...note, title: e.target.value })}
              className="w-full border-0 border-b-2 border-transparent bg-transparent px-0 py-2 text-3xl font-semibold outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 dark:placeholder:text-gray-500"
            />

            <RichTextEditor
              ref={editorRef}
              value={note.content}
              onChange={(content) => setNote((current) => ({ ...current, content }))}
              placeholder="Escribe aquí como en Word. Pega imágenes con Ctrl+V y después redimensiónalas desde la barra del editor."
              className="shadow-md"
            />
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

export default NoteEditor;
