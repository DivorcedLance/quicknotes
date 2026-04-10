import { create } from 'zustand';
import type { Folder } from '../types';

interface FoldersStore {
  folders: Folder[];
  addFolder: (folder: Folder) => void;
  updateFolder: (id: string, folder: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
  moveFolder: (folderId: string, parentId: string | null, targetFolderId?: string | null) => void;
  getFoldersByParent: (parentId: string | null) => Folder[];
  getFolderPath: (folderId: string) => Folder[];
  loadFolders: (folders: Folder[]) => void;
}

const normalizeFolders = (folders: Folder[]): Folder[] => {
  const foldersByParent = new Map<string | null, Folder[]>();

  folders.forEach((folder) => {
    const parentKey = folder.parentId;
    const parentFolders = foldersByParent.get(parentKey) ?? [];
    parentFolders.push(folder);
    foldersByParent.set(parentKey, parentFolders);
  });

  const normalized: Folder[] = [];

  Array.from(foldersByParent.entries()).forEach(([parentId, parentFolders]) => {
    parentFolders
      .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt - b.createdAt)
      .forEach((folder, index) => {
        normalized.push({
          ...folder,
          parentId,
          sortOrder: index,
        });
      });
  });

  return normalized;
};

export const useFoldersStore = create<FoldersStore>((set, get) => ({
  folders: (() => {
    const saved = localStorage.getItem('quicknotes_folders');
    const parsed = saved ? (JSON.parse(saved) as Folder[]) : [];
    return normalizeFolders(parsed.map((folder) => ({ ...folder, sortOrder: folder.sortOrder ?? 0 })));
  })(),

  addFolder: (folder) => {
    set((state) => {
      const siblingFolders = state.folders.filter((item) => item.parentId === folder.parentId);
      const newFolder = {
        ...folder,
        sortOrder: siblingFolders.length,
      };
      const newFolders = normalizeFolders([...state.folders, newFolder]);
      localStorage.setItem('quicknotes_folders', JSON.stringify(newFolders));
      return { folders: newFolders };
    });
  },

  updateFolder: (id, updates) => {
    set((state) => {
      const newFolders = state.folders.map((folder) =>
        folder.id === id
          ? { ...folder, ...updates, updatedAt: Date.now() }
          : folder
      );
      localStorage.setItem('quicknotes_folders', JSON.stringify(newFolders));
      return { folders: newFolders };
    });
  },

  deleteFolder: (id) => {
    set((state) => {
      const newFolders = state.folders.filter((folder) => folder.id !== id);
      const normalized = normalizeFolders(newFolders);
      localStorage.setItem('quicknotes_folders', JSON.stringify(normalized));
      return { folders: normalized };
    });
  },

  moveFolder: (folderId, parentId, targetFolderId) => {
    set((state) => {
      const movingFolder = state.folders.find((folder) => folder.id === folderId);
      if (!movingFolder) {
        return state;
      }

      const remainingFolders = state.folders.filter((folder) => folder.id !== folderId);
      const siblings = remainingFolders.filter((folder) => folder.parentId === parentId);
      const targetIndex = targetFolderId
        ? siblings.findIndex((folder) => folder.id === targetFolderId)
        : -1;

      const reorderedSiblings = [...siblings];
      const nextFolder = {
        ...movingFolder,
        parentId,
        updatedAt: Date.now(),
      };

      if (targetIndex >= 0) {
        reorderedSiblings.splice(targetIndex, 0, nextFolder);
      } else {
        reorderedSiblings.push(nextFolder);
      }

      const otherFolders = remainingFolders.filter((folder) => folder.parentId !== parentId);
      const normalized = normalizeFolders([...otherFolders, ...reorderedSiblings]);
      localStorage.setItem('quicknotes_folders', JSON.stringify(normalized));
      return { folders: normalized };
    });
  },

  getFoldersByParent: (parentId) => {
    return get()
      .folders
      .filter((folder) => folder.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt - b.createdAt);
  },

  getFolderPath: (folderId) => {
    const path: Folder[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const folder = get().folders.find((f) => f.id === currentId);
      if (!folder) break;
      path.unshift(folder);
      currentId = folder.parentId;
    }

    return path;
  },

  loadFolders: (folders) => {
    const normalized = normalizeFolders(folders.map((folder) => ({ ...folder, sortOrder: folder.sortOrder ?? 0 })));
    set({ folders: normalized });
    localStorage.setItem('quicknotes_folders', JSON.stringify(normalized));
  },
}));
