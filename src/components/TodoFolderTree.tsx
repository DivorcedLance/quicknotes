import React, { useEffect, useMemo, useState } from 'react';
import { FiCheckSquare, FiChevronDown, FiChevronRight, FiEdit2, FiFolder, FiTrash2 } from 'react-icons/fi';
import { useAppStore } from '../stores/appStore';
import { useTodoFoldersStore } from '../stores/todoFoldersStore';
import { useTodosStore } from '../stores/todosStore';

interface TodoFolderTreeProps {
  parentId: string | null;
  depth?: number;
  searchQuery?: string;
}

const TodoFolderTree: React.FC<TodoFolderTreeProps> = ({ parentId, depth = 0, searchQuery = '' }) => {
  const foldersState = useTodoFoldersStore((state) => state.folders);
  const {
    currentTodoFolderId,
    currentTodoId,
    setCurrentTodoFolderId,
    setCurrentTodoId,
    setCurrentTodoFolderViewId,
    setCurrentNoteId,
  } = useAppStore();
  const todosState = useTodosStore((state) => state.todos);
  const moveTodoToFolder = useTodosStore((state) => state.moveTodoToFolder);
  const deleteTodo = useTodosStore((state) => state.deleteTodo);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [deleteConfirmTodoId, setDeleteConfirmTodoId] = useState<string | null>(null);

  const folders = useMemo(
    () =>
      foldersState
        .filter((folder) => folder.parentId === parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt - b.createdAt),
    [foldersState, parentId]
  );
  const todos = useMemo(
    () => todosState.filter((todo) => todo.folderId === parentId),
    [todosState, parentId]
  );

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const isSearching = normalizedSearchQuery.length > 0;

  const folderMatchesSearch = (folderName: string) => folderName.toLowerCase().includes(normalizedSearchQuery);
  const todoMatchesSearch = (todoTitle: string) => todoTitle.toLowerCase().includes(normalizedSearchQuery);

  const hasMatchingDescendant = (folderId: string): boolean => {
    if (!isSearching) {
      return true;
    }

    const directTodoMatch = todosState.some(
      (todo) => todo.folderId === folderId && todoMatchesSearch(todo.title || 'Sin título')
    );

    if (directTodoMatch) {
      return true;
    }

    return foldersState.some((folder) => {
      if (folder.parentId !== folderId) {
        return false;
      }

      return folderMatchesSearch(folder.name) || hasMatchingDescendant(folder.id);
    });
  };

  const visibleTodos = isSearching
    ? todos.filter((todo) => todoMatchesSearch(todo.title || 'Sin título'))
    : todos;

  const visibleFolders = isSearching
    ? folders.filter((folder) => folderMatchesSearch(folder.name) || hasMatchingDescendant(folder.id))
    : folders;

  useEffect(() => {
    if (!currentTodoId) {
      return;
    }

    const selectedTodo = todosState.find((todo) => todo.id === currentTodoId);
    if (!selectedTodo?.folderId) {
      return;
    }

    const folderPath = useTodoFoldersStore.getState().getFolderPath(selectedTodo.folderId).map((folder) => folder.id);
    const foldersInThisLevel = folders.map((folder) => folder.id);
    const foldersToExpand = foldersInThisLevel.filter((folderId) => folderPath.includes(folderId));

    if (foldersToExpand.length > 0) {
      setExpanded((prev) => {
        const nextExpanded = { ...prev };
        foldersToExpand.forEach((folderId) => {
          nextExpanded[folderId] = true;
        });
        return nextExpanded;
      });
    }
  }, [currentTodoId, todosState, folders]);

  if (visibleFolders.length === 0 && visibleTodos.length === 0) {
    if (isSearching && parentId === null) {
      return (
        <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
          No se encontraron tareas ni carpetas.
        </div>
      );
    }

    return null;
  }

  const toggleExpand = (folderId: string) => {
    setExpanded((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const moveDraggedTodo = (event: React.DragEvent<HTMLDivElement>, folderId: string | null) => {
    event.preventDefault();
    const todoId = event.dataTransfer.getData('text/quicknotes-todo-id');
    if (todoId) {
      moveTodoToFolder(todoId, folderId);
    }
    setDragOverFolderId(null);
  };

  const moveDraggedFolder = (
    event: React.DragEvent<HTMLDivElement>,
    targetFolderId: string
  ) => {
    event.preventDefault();
    const folderId = event.dataTransfer.getData('text/quicknotes-todo-folder-id');
    if (folderId && folderId !== targetFolderId) {
      useTodoFoldersStore.getState().moveFolder(folderId, targetFolderId);
    }
    setDragOverFolderId(null);
  };

  const renderTodo = (todo: (typeof todosState)[number]) => (
    <button
      key={todo.id}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('text/quicknotes-todo-id', todo.id);
        event.dataTransfer.effectAllowed = 'move';
      }}
      onClick={() => {
        setCurrentTodoFolderId(todo.folderId);
        setCurrentTodoId(todo.id);
      }}
      aria-current={currentTodoId === todo.id ? 'true' : undefined}
      className={`group flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
        currentTodoId === todo.id
          ? 'border border-blue-300 bg-blue-100 font-semibold text-blue-800 shadow-sm dark:border-blue-700 dark:bg-blue-950 dark:text-blue-200'
          : 'hover:bg-gray-200 dark:hover:bg-dark-tertiary'
      }`}
    >
      <FiCheckSquare
        className={`mt-0.5 shrink-0 ${currentTodoId === todo.id ? 'text-blue-600 dark:text-blue-300' : 'text-gray-400'}`}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={todo.title || 'Sin título'}>
          {todo.title || 'Sin título'}
        </p>
      </div>
      <FiTrash2
        className="mt-1 shrink-0 text-red-500 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
        size={14}
        onClick={(event) => {
          event.stopPropagation();
          setDeleteConfirmTodoId(todo.id);
        }}
      />
      
      {deleteConfirmTodoId === todo.id && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-dark-secondary">
            <p className="mb-4 text-sm font-medium text-gray-900 dark:text-gray-100">
              ¿Estás seguro de que quieres eliminar esta tarea?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  deleteTodo(todo.id);
                  setDeleteConfirmTodoId(null);
                  if (currentTodoId === todo.id) {
                    setCurrentTodoId(null);
                  }
                }}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
              <button
                onClick={() => setDeleteConfirmTodoId(null)}
                className="rounded-lg bg-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-400 transition-colors dark:bg-dark-tertiary dark:text-gray-100"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </button>
  );

  return (
    <div style={{ marginLeft: `${depth * 16}px` }}>
      {visibleTodos.length > 0 && (
        <div
          className="mb-2 space-y-1 rounded-xl border border-dashed border-transparent"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => moveDraggedTodo(event, parentId)}
        >
          {visibleTodos.map(renderTodo)}
        </div>
      )}

      {visibleFolders.map((folder) => {
        const isExpanded = isSearching ? true : expanded[folder.id];

        return (
          <div key={folder.id}>
            <div
              className={`group flex cursor-pointer items-center justify-between rounded-lg p-2 hover:bg-gray-300 dark:hover:bg-dark-tertiary ${
                dragOverFolderId === folder.id ? 'bg-blue-100 dark:bg-blue-950' : ''
              }`}
              onClick={() => {
                setCurrentTodoFolderId(folder.id);
                toggleExpand(folder.id);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOverFolderId(folder.id);
              }}
              onDragLeave={() => setDragOverFolderId(null)}
              onDrop={(event) => {
                moveDraggedTodo(event, folder.id);
                moveDraggedFolder(event, folder.id);
              }}
            >
              <div className="flex min-w-0 flex-1 items-center gap-1">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleExpand(folder.id);
                  }}
                  className="rounded p-0 hover:bg-gray-400 dark:hover:bg-dark-secondary"
                >
                  {isExpanded ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                </button>
                <div
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData('text/quicknotes-todo-folder-id', folder.id);
                    event.dataTransfer.effectAllowed = 'move';
                  }}
                  className={`flex min-w-0 flex-1 items-center gap-2 text-left ${
                    currentTodoFolderId === folder.id
                      ? 'font-semibold text-blue-600 dark:text-blue-400'
                      : ''
                  }`}
                >
                  <FiFolder size={16} className="shrink-0" />
                  <span className="truncate">{folder.name}</span>
                </div>
              </div>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  setCurrentNoteId(null);
                  setCurrentTodoId(null);
                  setCurrentTodoFolderViewId(folder.id);
                  setCurrentTodoFolderId(folder.id);
                }}
                className="rounded p-1 text-gray-500 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-tertiary"
                title="Editar carpeta"
              >
                <FiEdit2 size={14} />
              </button>
            </div>

            {isExpanded && <TodoFolderTree parentId={folder.id} depth={depth + 1} searchQuery={searchQuery} />}
          </div>
        );
      })}
    </div>
  );
};

export default TodoFolderTree;
