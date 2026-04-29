export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateTime = (timestamp: number): string => {
  return `${formatDate(timestamp)} ${formatTime(timestamp)}`;
};

export const isToday = (timestamp: number): boolean => {
  const date = new Date(timestamp);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const isYesterday = (timestamp: number): boolean => {
  const date = new Date(timestamp);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
};

export const getDateLabel = (timestamp: number): string => {
  if (isToday(timestamp)) return 'Hoy';
  if (isYesterday(timestamp)) return 'Ayer';
  return formatDate(timestamp);
};

export const groupByDate = <T extends { createdAt: number }>(items: T[]): Record<string, T[]> => {
  const grouped: Record<string, T[]> = {};
  
  items.forEach((item) => {
    const dateLabel = getDateLabel(item.createdAt);
    if (!grouped[dateLabel]) {
      grouped[dateLabel] = [];
    }
    grouped[dateLabel].push(item);
  });

  return grouped;
};

export const downloadJson = (data: string, filename: string): void => {
  const element = document.createElement('a');
  element.setAttribute('href', `data:application/json;charset=utf-8,${encodeURIComponent(data)}`);
  element.setAttribute('download', filename);
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        resolve(content);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};

export const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        resolve(content);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

export const insertTextAtSelection = (
  text: string,
  insertText: string,
  selectionStart: number | null,
  selectionEnd: number | null
): string => {
  const start = selectionStart ?? text.length;
  const end = selectionEnd ?? start;
  return `${text.slice(0, start)}${insertText}${text.slice(end)}`;
};

export const clipboardImageFilesFromEvent = (
  clipboardData: DataTransfer
): File[] => {
  const imageFiles: File[] = [];

  Array.from(clipboardData.items).forEach((item) => {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) {
        imageFiles.push(file);
      }
    }
  });

  return imageFiles;
};

export const stripMarkdownImages = (text: string): string => {
  return text.replace(/!\[[^\]]*\]\([^)]*\)/g, '[imagen]');
};

export const htmlToPreviewText = (html: string): string => {
  const withImageTokens = html.replace(/<img\b[^>]*>/gi, ' [imagen] ');

  const parser = new DOMParser();
  const documentNode = parser.parseFromString(withImageTokens, 'text/html');
  return (documentNode.body.textContent || '').replace(/\s+/g, ' ').trim();
};

export const clampTextPreview = (text: string, maxLength = 100): string => {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trimEnd()}...`;
};

export const getSearchSnippet = (
  text: string,
  query: string,
  contextLength = 45,
  maxLength = 140
): string => {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedText = text.trim();

  if (!normalizedQuery) {
    return clampTextPreview(normalizedText, maxLength);
  }

  const lowerText = normalizedText.toLowerCase();
  const matchIndex = lowerText.indexOf(normalizedQuery);

  if (matchIndex < 0) {
    return clampTextPreview(normalizedText, maxLength);
  }

  const start = Math.max(0, matchIndex - contextLength);
  const end = Math.min(normalizedText.length, matchIndex + normalizedQuery.length + contextLength);
  const snippet = normalizedText.slice(start, end).trim();

  const prefix = start > 0 ? '...' : '';
  const suffix = end < normalizedText.length ? '...' : '';

  return `${prefix}${snippet}${suffix}`;
};

export const sortItems = <T extends { createdAt?: number; updatedAt?: number; title?: string; name?: string }>(
  items: T[],
  sortBy: 'date' | 'name' | 'modified'
): T[] => {
  const sorted = [...items];

  if (sortBy === 'date') {
    sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } else if (sortBy === 'modified') {
    sorted.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } else if (sortBy === 'name') {
    sorted.sort((a, b) => {
      const nameA = (a.title || a.name || '').toLowerCase();
      const nameB = (b.title || b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }

  return sorted;
};
