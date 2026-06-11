import React, { useState, useRef } from 'react';
import { FiGrid, FiBarChart2, FiLayers, FiEdit3, FiCheckCircle, FiPlus, FiX, FiSettings } from 'react-icons/fi';
import { createPortal } from 'react-dom';
import { useActivitiesStore } from '../stores/activitiesStore';
import type { ActivityStatus, ActivityDefinition, ActivityInstance } from '../types';
import { ACTIVITY_STATUSES, ACTIVITY_STATUS_LABELS, ACTIVITY_STATUS_COLORS } from '../types';
import ActivityCalendarView from './ActivityCalendarView';
import type { ActivityContextMenuState } from './ActivityCalendarView';
import ActivityDashboard from './ActivityDashboard';
import ActivityTypeManager from './ActivityTypeManager';
import RichTextEditor, { type RichTextEditorHandle } from './RichTextEditor';
import ColorPicker from './ColorPicker';
import RecurrenceEditor from './RecurrenceEditor';
import type { RecurrenceRule, ImageData } from '../types';

function getMaxWeeks(year: number, month: number) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  return Math.ceil((lastDay + firstDay) / 7);
}

/* ─── Modal: Create/Edit Definition ─── */
const DefinitionModal: React.FC<{
  editDef?: ActivityDefinition;
  onClose: () => void;
}> = ({ editDef, onClose }) => {
  const { types, addDefinition, updateDefinition } = useActivitiesStore();
  const descRef = useRef<RichTextEditorHandle>(null);
  const shortNameTouched = useRef(false);
  const [title, setTitle] = useState(editDef?.title ?? '');
  const [shortName, setShortName] = useState(editDef?.shortName ?? '');
  const [description, setDescription] = useState(editDef?.description ?? '');
  const [typeId, setTypeId] = useState(editDef?.typeId ?? types[0]?.id ?? '');
  const [color, setColor] = useState(editDef?.color ?? '#3b82f6');
  const [recurrence, setRecurrence] = useState<RecurrenceRule | null>(editDef?.recurrence ?? null);

  const autoShortName = (t: string) => {
    const words = t.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '';
    if (words.length === 1) {
      const w = words[0];
      if (w.length === 1) return w.toUpperCase();
      return w[0].toUpperCase() + w[1].toLowerCase();
    }
    return words.map((w) => w[0].toUpperCase()).join('');
  };

  const handleTitleChange = (t: string) => {
    setTitle(t);
    if (!shortNameTouched.current && !editDef) {
      setShortName(autoShortName(t));
    }
  };

  const handleShortNameChange = (v: string) => {
    shortNameTouched.current = true;
    setShortName(v);
  };

  const handleSave = () => {
    if (!title.trim()) return;
    const finalDesc = descRef.current?.getHtml() ?? description;
    if (editDef) {
      updateDefinition(editDef.id, { title: title.trim(), shortName: shortName.trim(), description: finalDesc, typeId, color, images: editDef.images ?? [], recurrence });
    } else {
      addDefinition({ title: title.trim(), shortName: shortName.trim(), description: finalDesc, typeId, color, images: [], recurrence });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="mx-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-dark-secondary" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-semibold">{editDef ? 'Editar' : 'Nueva'} Actividad</h3>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">Título</label>
              <input value={title} onChange={(e) => handleTitleChange(e.target.value)} className="input-field w-full text-sm" autoFocus />
            </div>
            <div className="w-32">
              <label className="mb-1 block text-xs text-gray-500">Nombre corto</label>
              <input value={shortName} onChange={(e) => handleShortNameChange(e.target.value)} className="input-field w-full text-sm" placeholder={autoShortName(title) || 'Abr.'} />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">Tipo</label>
              <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className="input-field w-full text-sm">
                {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Color</label>
              <ColorPicker value={color} onChange={setColor} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Descripción</label>
            <RichTextEditor ref={descRef} value={description} onChange={setDescription}
              placeholder="Describe la actividad..." className="!shadow-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Frecuencia (opcional)</label>
            <RecurrenceEditor value={recurrence} onChange={setRecurrence} />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-100 dark:border-dark-tertiary dark:hover:bg-dark-tertiary">Cancelar</button>
          <button onClick={handleSave} className="rounded-lg bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600">Guardar</button>
        </div>
      </div>
    </div>
  );
};

/* ─── Modal: Create Instance ─── */
const InstanceModal: React.FC<{
  defaultYear: number; defaultMonth: number; defaultWeek: number;
  definitions: ActivityDefinition[];
  types: { id: string; name: string; color: string }[];
  onClose: () => void;
  onSave: (defId: string, secondaryTitle: string, description: string, images: ImageData[], year: number, month: number, weekOfMonth: number) => void;
}> = ({ defaultYear, defaultMonth, defaultWeek, definitions, types, onClose, onSave }) => {
  const descRef = useRef<RichTextEditorHandle>(null);
  const [defId, setDefId] = useState(definitions[0]?.id ?? '');
  const [secTitle, setSecTitle] = useState('');
  const [description, setDescription] = useState('');
  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);
  const [week, setWeek] = useState(defaultWeek);

  const maxW = getMaxWeeks(year, month);

  const handleSave = () => {
    if (!defId) return;
    const finalDesc = descRef.current?.getHtml() ?? description;
    onSave(defId, secTitle.trim(), finalDesc, [], year, month, Math.min(week, maxW));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="mx-4 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-dark-secondary" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-semibold">Nueva Actividad</h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Actividad</label>
            <select value={defId} onChange={(e) => setDefId(e.target.value)} className="input-field w-full text-sm">
              {definitions.map((d) => {
                const t = types.find((tp) => tp.id === d.typeId);
                return <option key={d.id} value={d.id}>{t?.name} - {d.shortName} - {d.title}</option>;
              })}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Título secundario</label>
            <input value={secTitle} onChange={(e) => setSecTitle(e.target.value)} className="input-field w-full text-sm" />
          </div>
          <div>
              <label className="mb-1 block text-xs text-gray-500">Descripción</label>
              <RichTextEditor ref={descRef} value={description} onChange={setDescription}
                placeholder="Descripción de la actividad..." className="!shadow-none" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">Año</label>
              <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="input-field w-full text-sm" />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">Mes</label>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="input-field w-full text-sm">
                {Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{i + 1}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-500">Semana</label>
              <select value={Math.min(week, maxW)} onChange={(e) => setWeek(Number(e.target.value))} className="input-field w-full text-sm">
                {Array.from({ length: maxW }, (_, i) => <option key={i} value={i + 1}>S{i + 1}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-100 dark:border-dark-tertiary dark:hover:bg-dark-tertiary">Cancelar</button>
          <button onClick={handleSave} className="rounded-lg bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600">Crear</button>
        </div>
      </div>
    </div>
  );
};

/* ─── Edit instance details modal ─── */
const EditInstanceModal: React.FC<{
  instance: ActivityInstance;
  definitions: ActivityDefinition[];
  types: { id: string; name: string; color: string }[];
  onClose: () => void;
  onSave: (id: string, data: Partial<ActivityInstance>) => void;
}> = ({ instance, definitions, types, onClose, onSave }) => {
  const descRef = useRef<RichTextEditorHandle>(null);
  const [secTitle, setSecTitle] = useState(instance.secondaryTitle);
  const [description, setDescription] = useState(instance.description);
  const [status, setStatus] = useState(instance.status);

  const def = definitions.find((d) => d.id === instance.definitionId);
  const t = def ? types.find((tp) => tp.id === def.typeId) : null;

  const handleSave = () => {
    const finalDesc = descRef.current?.getHtml() ?? description;
    onSave(instance.id, { secondaryTitle: secTitle, description: finalDesc, status });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="mx-4 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-dark-secondary" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-semibold">Detalles de Actividad</h3>
        <div className="mb-3 rounded-lg border p-3 dark:border-dark-tertiary">
          <div className="flex items-center gap-3 text-sm">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: def?.color ?? '#666' }} />
            <span className="font-medium">{def?.shortName}</span>
            <span className="text-gray-500">—</span>
            <span>{def?.title}</span>
            {t && <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] dark:bg-dark-tertiary">{t.name}</span>}
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Título secundario</label>
            <input value={secTitle} onChange={(e) => setSecTitle(e.target.value)} className="input-field w-full text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Descripción</label>
            <RichTextEditor ref={descRef} value={description} onChange={setDescription}
              placeholder="Descripción..." className="!shadow-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Estado</label>
            <div className="flex flex-wrap gap-1">
              {ACTIVITY_STATUSES.map((s) => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`rounded px-2 py-1 text-xs font-medium transition-colors ${status === s ? 'text-white' : 'opacity-60 hover:opacity-100'}`}
                  style={{ backgroundColor: ACTIVITY_STATUS_COLORS[s] }}>
                  {ACTIVITY_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          {instance.postponedHistory && instance.postponedHistory.length > 0 && (
            <div className="text-xs text-gray-500">
              Historial de aplazamientos: {instance.postponedHistory.length} vez{instance.postponedHistory.length !== 1 ? 'es' : ''}
            </div>
          )}
          {instance.postponedFrom && (
            <div className="text-xs text-gray-500">Aplazada desde: {instance.postponedFrom.slice(0, 8)}</div>
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-100 dark:border-dark-tertiary dark:hover:bg-dark-tertiary">Cancelar</button>
          <button onClick={handleSave} className="rounded-lg bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600">Guardar</button>
        </div>
      </div>
    </div>
  );
};

/* ─── Context menu portal ─── */
const ContextMenu: React.FC<{
  menu: ActivityContextMenuState | null;
  mode: 'planning' | 'status';
  onClose: () => void;
  onNewInstance: (m: ActivityContextMenuState) => void;
  onEditInstance: (id: string) => void;
  onDeleteInstance: (id: string) => void;
  onPostpone: (id: string) => void;
  onChangeStatus: (id: string, status: ActivityStatus) => void;
}> = ({ menu, mode, onClose, onNewInstance, onEditInstance, onDeleteInstance, onPostpone, onChangeStatus }) => {
  if (!menu) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60]" onClick={onClose} onContextMenu={(e) => e.preventDefault()}>
      <div className="absolute rounded-lg border bg-white py-1 shadow-xl dark:border-dark-tertiary dark:bg-dark-secondary"
        style={{ left: menu.x, top: menu.y, minWidth: 180 }}>
        {menu.type === 'cell' ? (
          <button onClick={() => { onNewInstance(menu); onClose(); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-dark-tertiary">
            <FiPlus size={14} /> Nueva actividad
          </button>
        ) : (
          <>
            {mode === 'planning' ? (
              <button onClick={() => { onEditInstance(menu.instanceId!); onClose(); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-dark-tertiary">
                <FiEdit3 size={14} /> Editar detalles
              </button>
            ) : null}
            <div className="border-t border-gray-200 dark:border-dark-tertiary my-1" />
            {ACTIVITY_STATUSES.map((s) => (
              <button key={s} onClick={() => { onChangeStatus(menu.instanceId!, s); onClose(); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-dark-tertiary">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ACTIVITY_STATUS_COLORS[s] }} />
                {ACTIVITY_STATUS_LABELS[s]}
              </button>
            ))}
            <div className="border-t border-gray-200 dark:border-dark-tertiary my-1" />
            <button onClick={() => { onPostpone(menu.instanceId!); onClose(); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-dark-tertiary">
              <FiCheckCircle size={14} /> Aplazar
            </button>
            <button onClick={() => { onDeleteInstance(menu.instanceId!); onClose(); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30">
              <FiX size={14} /> Eliminar
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

/* ─── Main Activities View ─── */
const ActivitiesView: React.FC = () => {
  const { types, definitions, instances, addInstance, updateInstance, deleteInstance, postponeInstance } = useActivitiesStore();
  const [view, setView] = useState<'calendar' | 'dashboard' | 'types'>('calendar');
  const [mode, setMode] = useState<'planning' | 'status'>('planning');
  const [showDefModal, setShowDefModal] = useState(false);
  const [editDef, setEditDef] = useState<ActivityDefinition | undefined>(undefined);
  const [showInstModal, setShowInstModal] = useState(false);
  const [instModalDefaults, setInstModalDefaults] = useState({ year: 2025, month: 0, week: 1 });
  const [editInstanceId, setEditInstanceId] = useState<string | null>(null);
  const [showTypeManager, setShowTypeManager] = useState(false);
  const [contextMenu, setContextMenu] = useState<ActivityContextMenuState | null>(null);
  const scrollToTodayRef = useRef<(() => void) | null>(null);

  const editInstance = editInstanceId ? instances.find((i) => i.id === editInstanceId) ?? null : null;

  const handleNewInstance = (defId: string, secTitle: string, desc: string, _images: ImageData[], y: number, m: number, w: number) => {
    const firstDay = new Date(y, m, 1).getDay();
    const dayOfMonth = (w - 1) * 7 - firstDay + 4;
    const date = new Date(y, m, Math.max(1, Math.min(dayOfMonth, new Date(y, m + 1, 0).getDate())));
    addInstance({
      definitionId: defId,
      status: 'pending',
      secondaryTitle: secTitle,
      description: desc,
      images: [],
      date: date.getTime(),
      year: y, month: m, weekOfMonth: w,
      sortOrder: instances.length,
      postponedFrom: null,
      postponedHistory: [],
    });
  };

  const handlePostpone = (id: string) => {
    const inst = instances.find((i) => i.id === id);
    if (!inst) return;
    let nextWeek = inst.weekOfMonth + 1;
    let nextMonth = inst.month;
    let nextYear = inst.year;
    const maxW = getMaxWeeks(nextYear, nextMonth);
    if (nextWeek > maxW) { nextWeek = 1; nextMonth++; }
    if (nextMonth > 11) { nextMonth = 0; nextYear++; }
    const firstDay = new Date(nextYear, nextMonth, 1).getDay();
    const dayOfMonth = (nextWeek - 1) * 7 - firstDay + 4;
    const date = new Date(nextYear, nextMonth, Math.max(1, Math.min(dayOfMonth, new Date(nextYear, nextMonth + 1, 0).getDate())));
    postponeInstance(id, nextYear, nextMonth, nextWeek, date.getTime());
  };

  const handleEditInstanceSave = (id: string, data: Partial<ActivityInstance>) => {
    updateInstance(id, data);
    setEditInstanceId(null);
  };

  const handleCellContextMenu = (m: ActivityContextMenuState) => {
    setContextMenu(m);
  };

  const handleChangeStatus = (id: string, status: ActivityStatus) => {
    updateInstance(id, { status });
  };

  // In planning mode, clicking instance opens the editor
  const handleEditRequest = (id: string) => {
    if (mode === 'planning') {
      setEditInstanceId(id);
    }
  };

  // Clicking a cell opens the create-instance modal
  const handleCellClick = (year: number, month: number, week: number) => {
    if (mode === 'planning') {
      setInstModalDefaults({ year, month, week });
      setShowInstModal(true);
    }
  };

  return (
    <div className="flex h-full flex-col" style={{ fontSize: 14 }}>
      {/* Toolbar */}
      <div className="sticky top-0 z-30 flex items-center gap-2 border-b bg-white/95 backdrop-blur p-3 dark:border-dark-tertiary dark:bg-dark-secondary/95">
        {view === 'calendar' && (
          <button onClick={() => scrollToTodayRef.current?.()}
            className="flex items-center gap-1 rounded px-2 py-1.5 text-xs font-medium hover:bg-gray-200 dark:hover:bg-dark-tertiary">
            Hoy
          </button>
        )}

        <div className="mx-2 h-5 w-px bg-gray-300 dark:bg-dark-tertiary" />

        <button onClick={() => setView('calendar')}
          className={`flex items-center gap-1 rounded px-2 py-1.5 text-xs font-medium ${view === 'calendar' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-dark-tertiary'}`}>
          <FiGrid /> Calendario
        </button>
        <button onClick={() => setView('dashboard')}
          className={`flex items-center gap-1 rounded px-2 py-1.5 text-xs font-medium ${view === 'dashboard' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-dark-tertiary'}`}>
          <FiBarChart2 /> Dashboard
        </button>
        <button onClick={() => setView('types')}
          className={`flex items-center gap-1 rounded px-2 py-1.5 text-xs font-medium ${view === 'types' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-dark-tertiary'}`}>
          <FiLayers /> Definiciones
        </button>

        <div className="mx-2 h-5 w-px bg-gray-300 dark:bg-dark-tertiary" />

        <button onClick={() => setMode('planning')}
          className={`flex items-center gap-1 rounded px-2 py-1.5 text-xs font-medium ${mode === 'planning' ? 'bg-green-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-dark-tertiary'}`}>
          <FiEdit3 /> Planificar
        </button>
        <button onClick={() => setMode('status')}
          className={`flex items-center gap-1 rounded px-2 py-1.5 text-xs font-medium ${mode === 'status' ? 'bg-amber-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-dark-tertiary'}`}>
          <FiCheckCircle /> Estado
        </button>

        <div className="flex-1" />

        <button onClick={() => { setEditDef(undefined); setShowDefModal(true); }}
          className="flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-1.5 text-xs text-white hover:bg-blue-600">
          <FiPlus /> Definición
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {view === 'types' && (
          definitions.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              <p className="mb-3">Sin definiciones de actividad</p>
              <button onClick={() => { setEditDef(undefined); setShowDefModal(true); }}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600">
                Crear primera definición
              </button>
            </div>
          ) : (
            <div className="space-y-1 p-3">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{definitions.length} definiciones</span>
                <div className="flex-1" />
                <button onClick={() => setShowTypeManager(true)}
                  className="flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-gray-200 dark:hover:bg-dark-tertiary">
                  <FiSettings size={12} /> Tipos
                </button>
              </div>
              {definitions.map((d) => {
                const t = types.find((tp) => tp.id === d.typeId);
                const count = instances.filter((i) => i.definitionId === d.id).length;
                return (
                  <div key={d.id} className="flex items-center gap-3 rounded-lg border p-3 dark:border-dark-tertiary">
                    <span className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{d.title}</span>
                        <span className="text-xs text-gray-500">({d.shortName})</span>
                        {t && <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] dark:bg-dark-tertiary">{t.name}</span>}
                      </div>
                      {d.recurrence && (
                        <div className="text-[10px] text-blue-500 mt-0.5">
                          Cada {d.recurrence.interval} {d.recurrence.frequency === 'daily' ? 'día(s)' : d.recurrence.frequency === 'weekly' ? 'semana(s)' : d.recurrence.frequency === 'monthly' ? 'mes(es)' : 'año(s)'}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{count} actividades</span>
                    <button onClick={() => { setEditDef(d); setShowDefModal(true); }} className="rounded p-1 text-xs text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30">Editar</button>
                  </div>
                );
              })}
            </div>
          )
        )}
        {view === 'calendar' && (
          <ActivityCalendarView mode={mode}
            onContextMenu={handleCellContextMenu}
            onEditInstance={handleEditRequest}
            onChangeStatus={handleChangeStatus}
            onCellClick={handleCellClick}
            scrollToTodayRef={scrollToTodayRef}
          />
        )}
        {view === 'dashboard' && <ActivityDashboard />}
      </div>

      {/* Modals */}
      {showDefModal && <DefinitionModal editDef={editDef} onClose={() => { setShowDefModal(false); setEditDef(undefined); }} />}
      {showInstModal && (
        <InstanceModal
          defaultYear={instModalDefaults.year} defaultMonth={instModalDefaults.month} defaultWeek={instModalDefaults.week}
          definitions={definitions} types={types}
          onClose={() => setShowInstModal(false)}
          onSave={handleNewInstance}
        />
      )}
      {editInstance && (
        <EditInstanceModal instance={editInstance} definitions={definitions} types={types}
          onClose={() => setEditInstanceId(null)}
          onSave={handleEditInstanceSave}
        />
      )}
      {showTypeManager && <ActivityTypeManager onClose={() => setShowTypeManager(false)} />}
      <ContextMenu menu={contextMenu} mode={mode} onClose={() => setContextMenu(null)}
        onNewInstance={(m) => { setInstModalDefaults({ year: m.year, month: m.month, week: m.week }); setShowInstModal(true); }}
        onEditInstance={(id) => setEditInstanceId(id)}
        onDeleteInstance={deleteInstance}
        onPostpone={(id) => { handlePostpone(id); setContextMenu(null); }}
        onChangeStatus={handleChangeStatus}
      />
    </div>
  );
};

export default ActivitiesView;
