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

/* ─── Activities ─── */
export interface ActivityType {
  id: string;
  name: string;
  color: string;
}

export interface ActivityDefinition {
  id: string;
  typeId: string;
  title: string;
  description: string;
  shortName: string;
  color: string;
  images: ImageData[];
  recurrence: RecurrenceRule | null;
  createdAt: number;
}

export type ActivityStatus = 'pending' | 'in-progress' | 'completed' | 'postponed' | 'cancelled';

export const ACTIVITY_STATUSES: ActivityStatus[] = ['pending', 'in-progress', 'completed', 'postponed', 'cancelled'];
export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  'pending': 'Pendiente',
  'in-progress': 'Ejecutando',
  'completed': 'Completada',
  'postponed': 'Pospuesta',
  'cancelled': 'Cancelada',
};
export const ACTIVITY_STATUS_COLORS: Record<ActivityStatus, string> = {
  'pending': '#6b7280',
  'in-progress': '#3b82f6',
  'completed': '#22c55e',
  'postponed': '#f59e0b',
  'cancelled': '#ef4444',
};

export interface ActivityInstance {
  id: string;
  definitionId: string;
  status: ActivityStatus;
  secondaryTitle: string;
  description: string;
  images: ImageData[];
  date: number;
  year: number;
  month: number;
  weekOfMonth: number;
  sortOrder: number;
  postponedFrom: string | null;
  postponedHistory: string[];
  createdAt: number;
  updatedAt: number;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  byDay?: number[];
  byMonthDay?: number[];
  byMonth?: number[];
  endDate?: number;
  count?: number;
  indefinite?: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  images: ImageData[];
  startDate: number;
  endDate: number | null;
  allDay: boolean;
  color: string;
  tags: string[];
  notify: boolean;
  notifyBefore: number;
  recurrence: RecurrenceRule | null;
  createdAt: number;
  updatedAt: number;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  fontSize: number;
  notificationsEnabled: boolean;
  activityHoverView?: 'compact' | 'detailed';
}

export interface Database {
  notes: Note[];
  folders: Folder[];
  todoFolders?: Folder[];
  todos: Todo[];
  tags: Tag[];
  settings: UserSettings;
  calendarEvents: CalendarEvent[];
  activityTypes?: ActivityType[];
  activityDefinitions?: ActivityDefinition[];
  activityInstances?: ActivityInstance[];
  version: string;
}
