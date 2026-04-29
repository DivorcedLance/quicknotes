export interface Note {
  id: string;
  title: string;
  content: string; // Markdown content
  folderId: string | null;
  images: ImageData[];
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

export interface ImageData {
  id: string;
  data: string; // Base64
  name: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt: number | null;
  folderId: string | null;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  dueDate?: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  description: string;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  fontSize: number;
}

export interface Database {
  notes: Note[];
  folders: Folder[];
  todoFolders?: Folder[];
  todos: Todo[];
  tags: Tag[];
  settings: UserSettings;
  version: string;
}
