import { create } from 'zustand';
import type { ActivityType, ActivityDefinition, ActivityInstance } from '../types';
import { generateId } from '../utils/helpers';

interface ActivitiesStore {
  types: ActivityType[];
  definitions: ActivityDefinition[];
  instances: ActivityInstance[];

  loadTypes: (types: ActivityType[]) => void;
  loadDefinitions: (definitions: ActivityDefinition[]) => void;
  loadInstances: (instances: ActivityInstance[]) => void;

  addType: (type: Omit<ActivityType, 'id'>) => void;
  updateType: (id: string, data: Partial<ActivityType>) => void;
  deleteType: (id: string) => void;

  addDefinition: (def: Omit<ActivityDefinition, 'id' | 'createdAt'>) => ActivityDefinition;
  updateDefinition: (id: string, data: Partial<ActivityDefinition>) => void;
  deleteDefinition: (id: string) => void;

  addInstance: (inst: Omit<ActivityInstance, 'id' | 'createdAt' | 'updatedAt'>) => ActivityInstance;
  updateInstance: (id: string, data: Partial<ActivityInstance>) => void;
  deleteInstance: (id: string) => void;
  moveInstance: (id: string, year: number, month: number, weekOfMonth: number, date: number) => void;
  postponeInstance: (id: string, year: number, month: number, weekOfMonth: number, date: number) => ActivityInstance | null;
}

const TYPES_KEY = 'quicknotes_activity_types';
const DEFS_KEY = 'quicknotes_activity_definitions';
const INSTS_KEY = 'quicknotes_activity_instances';

function loadJSON<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function saveJSON(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const useActivitiesStore = create<ActivitiesStore>((set, get) => ({
  types: loadJSON<ActivityType[]>(TYPES_KEY, [
    { id: 'default-task', name: 'Tarea', color: '#3b82f6' },
    { id: 'default-project', name: 'Proyecto', color: '#8b5cf6' },
    { id: 'default-study', name: 'Estudio', color: '#22c55e' },
  ]),
  definitions: loadJSON<ActivityDefinition[]>(DEFS_KEY, []),
  instances: loadJSON<ActivityInstance[]>(INSTS_KEY, []),

  loadTypes: (types) => { set({ types }); saveJSON(TYPES_KEY, types); },
  loadDefinitions: (definitions) => { set({ definitions }); saveJSON(DEFS_KEY, definitions); },
  loadInstances: (instances) => { set({ instances }); saveJSON(INSTS_KEY, instances); },

  addType: (type) => {
    const types = [...get().types, { ...type, id: generateId() }];
    set({ types }); saveJSON(TYPES_KEY, types);
  },
  updateType: (id, data) => {
    const types = get().types.map((t) => t.id === id ? { ...t, ...data } : t);
    set({ types }); saveJSON(TYPES_KEY, types);
  },
  deleteType: (id) => {
    const types = get().types.filter((t) => t.id !== id);
    set({ types }); saveJSON(TYPES_KEY, types);
  },

  addDefinition: (def) => {
    const item: ActivityDefinition = { ...def, id: generateId(), createdAt: Date.now() };
    const definitions = [...get().definitions, item];
    set({ definitions }); saveJSON(DEFS_KEY, definitions);
    return item;
  },
  updateDefinition: (id, data) => {
    const definitions = get().definitions.map((d) => d.id === id ? { ...d, ...data } : d);
    set({ definitions }); saveJSON(DEFS_KEY, definitions);
  },
  deleteDefinition: (id) => {
    const definitions = get().definitions.filter((d) => d.id !== id);
    set({ definitions }); saveJSON(DEFS_KEY, definitions);
  },

  addInstance: (inst) => {
    const item: ActivityInstance = { ...inst, id: generateId(), createdAt: Date.now(), updatedAt: Date.now() };
    const instances = [...get().instances, item];
    set({ instances }); saveJSON(INSTS_KEY, instances);
    return item;
  },
  updateInstance: (id, data) => {
    const instances = get().instances.map((i) => i.id === id ? { ...i, ...data, updatedAt: Date.now() } : i);
    set({ instances }); saveJSON(INSTS_KEY, instances);
  },
  deleteInstance: (id) => {
    const instances = get().instances.filter((i) => i.id !== id);
    set({ instances }); saveJSON(INSTS_KEY, instances);
  },
  moveInstance: (id, year, month, weekOfMonth, date) => {
    const instances = get().instances.map((i) =>
      i.id === id ? { ...i, year, month, weekOfMonth, date, updatedAt: Date.now() } : i
    );
    set({ instances }); saveJSON(INSTS_KEY, instances);
  },
  postponeInstance: (id, year, month, weekOfMonth, date) => {
    const state = get();
    const original = state.instances.find((i) => i.id === id);
    if (!original) return null;
    const newInst: ActivityInstance = {
      id: generateId(),
      definitionId: original.definitionId,
      status: 'pending',
      secondaryTitle: original.secondaryTitle,
      description: original.description,
      images: original.images,
      date, year, month, weekOfMonth,
      sortOrder: original.sortOrder,
      postponedFrom: id,
      postponedHistory: [...(original.postponedHistory || []), id],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const instances = [...state.instances, newInst].map((i) =>
      i.id === id ? { ...i, status: 'postponed' as const, updatedAt: Date.now() } : i
    );
    set({ instances }); saveJSON(INSTS_KEY, instances);
    return newInst;
  },
}));
