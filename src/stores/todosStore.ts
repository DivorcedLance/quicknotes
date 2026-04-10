import { create } from 'zustand';
import type { Todo } from '../types';

interface TodosStore {
  todos: Todo[];
  addTodo: (todo: Todo) => void;
  updateTodo: (id: string, todo: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;
  toggleTodo: (id: string) => void;
  moveTodoToFolder: (id: string, folderId: string | null) => void;
  getTodosByTag: (tagId: string) => Todo[];
  getTodosByFolder: (folderId: string | null) => Todo[];
  getActiveTodos: () => Todo[];
  getTodosByDate: (date: number) => Todo[];
  getTodosByDateRange: (startDate: number, endDate: number) => Todo[];
  loadTodos: (todos: Todo[]) => void;
}

export const useTodosStore = create<TodosStore>((set, get) => ({
  todos: (() => {
    const saved = localStorage.getItem('quicknotes_todos');
    return saved ? JSON.parse(saved) : [];
  })(),

  addTodo: (todo) => {
    set((state) => {
      const newTodos = [...state.todos, todo];
      localStorage.setItem('quicknotes_todos', JSON.stringify(newTodos));
      return { todos: newTodos };
    });
  },

  updateTodo: (id, updates) => {
    set((state) => {
      const newTodos = state.todos.map((todo) =>
        todo.id === id ? { ...todo, ...updates, updatedAt: Date.now() } : todo
      );
      localStorage.setItem('quicknotes_todos', JSON.stringify(newTodos));
      return { todos: newTodos };
    });
  },

  deleteTodo: (id) => {
    set((state) => {
      const newTodos = state.todos.filter((todo) => todo.id !== id);
      localStorage.setItem('quicknotes_todos', JSON.stringify(newTodos));
      return { todos: newTodos };
    });
  },

  toggleTodo: (id) => {
    set((state) => {
      const newTodos = state.todos.map((todo) =>
        todo.id === id
          ? { ...todo, completed: !todo.completed, updatedAt: Date.now() }
          : todo
      );
      localStorage.setItem('quicknotes_todos', JSON.stringify(newTodos));
      return { todos: newTodos };
    });
  },

  moveTodoToFolder: (id, folderId) => {
    set((state) => {
      const newTodos = state.todos.map((todo) =>
        todo.id === id ? { ...todo, folderId, updatedAt: Date.now() } : todo
      );
      localStorage.setItem('quicknotes_todos', JSON.stringify(newTodos));
      return { todos: newTodos };
    });
  },

  getTodosByTag: (tagId) => {
    return get().todos.filter((todo) => todo.tags.includes(tagId));
  },

  getTodosByFolder: (folderId) => {
    return get().todos.filter((todo) => todo.folderId === folderId);
  },

  getActiveTodos: () => {
    return get().todos.filter((todo) => !todo.completed);
  },

  getTodosByDate: (date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return get().todos.filter(
      (todo) =>
        todo.createdAt >= startOfDay.getTime() &&
        todo.createdAt <= endOfDay.getTime()
    );
  },

  getTodosByDateRange: (startDate, endDate) => {
    return get().todos.filter(
      (todo) => todo.createdAt >= startDate && todo.createdAt <= endDate
    );
  },

  loadTodos: (todos) => {
    set({ todos });
    localStorage.setItem('quicknotes_todos', JSON.stringify(todos));
  },
}));
