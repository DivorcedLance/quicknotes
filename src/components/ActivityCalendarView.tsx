import React, { useMemo, useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { DndContext, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { useActivitiesStore } from '../stores/activitiesStore';
import type { ActivityInstance, ActivityStatus, ActivityDefinition } from '../types';
import { ACTIVITY_STATUS_LABELS, ACTIVITY_STATUS_COLORS } from '../types';

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTHS_PER_PAGE = 12;

function getMaxWeeks(year: number, month: number) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  return Math.ceil((lastDay + firstDay) / 7);
}

interface MonthBlock {
  year: number; month: number; name: string; maxWeeks: number;
}

/* ─── Cell droppable ─── */
const ActivityCell: React.FC<{
  year: number; month: number; week: number;
  children?: React.ReactNode;
  onClick?: () => void; onContextMenu?: (e: React.MouseEvent) => void;
}> = ({ year, month, week, children, onClick, onContextMenu }) => {
  const { setNodeRef, isOver } = useDroppable({ id: `activity-cell:${year}:${month}:${week}` });
  return (
    <div ref={setNodeRef} onClick={onClick} onContextMenu={onContextMenu}
      className={`min-h-[80px] rounded border p-1.5 text-xs transition-colors cursor-pointer ${
        isOver ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/30' : 'border-gray-100 dark:border-dark-tertiary hover:border-blue-300 dark:hover:border-blue-700'
      }`}>
      {children}
    </div>
  );
};

/* ─── Hover popup ─── */
type HoverTarget = { inst: ActivityInstance; def?: ActivityDefinition; x: number; y: number; color: string } | null;
let hoverPopupSetter: React.Dispatch<React.SetStateAction<HoverTarget>> | null = null;

const HoverPopup: React.FC = () => {
  const [target, setTarget] = useState<HoverTarget>(null);
  useEffect(() => { hoverPopupSetter = setTarget; return () => { hoverPopupSetter = null; }; }, []);
  if (!target) return null;
  return createPortal(
    <div className="fixed z-[70] max-w-xs rounded-xl border bg-white p-3 shadow-xl dark:border-dark-tertiary dark:bg-dark-secondary pointer-events-none"
      style={{ left: target.x + 12, top: target.y - 10 }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: target.color }} />
        <span className="text-xs font-semibold">{target.def?.shortName}</span>
        <span style={{ backgroundColor: ACTIVITY_STATUS_COLORS[target.inst.status] }}
          className="text-[9px] text-white px-1 rounded">{ACTIVITY_STATUS_LABELS[target.inst.status]}</span>
      </div>
      {target.inst.secondaryTitle && <div className="text-xs font-medium mb-1">{target.inst.secondaryTitle}</div>}
      {target.def?.title && <div className="text-[10px] text-gray-500 mb-1">{target.def.title}</div>}
      {target.inst.description && (
        <div className="text-[10px] text-gray-600 dark:text-gray-400 line-clamp-4 [&_img]:max-h-20 [&_img]:rounded"
          dangerouslySetInnerHTML={{ __html: target.inst.description.replace(/<img[^>]+>/g, '') }} />
      )}
      <div className="mt-1 text-[9px] text-gray-400">
        {new Date(target.inst.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
        {target.inst.postponedHistory?.length > 0 && ` · ${target.inst.postponedHistory.length} aplazamiento${target.inst.postponedHistory.length > 1 ? 's' : ''}`}
      </div>
    </div>,
    document.body
  );
};

/* ─── Draggable instance ─── */
const DraggableInstance: React.FC<{
  instance: ActivityInstance;
  mode: 'planning' | 'status';
  defColor: string;
  defShortName?: string;
  def?: ActivityDefinition;
  onClick?: () => void; onContextMenu?: (e: React.MouseEvent) => void;
}> = ({ instance, mode, defColor, defShortName, def, onClick, onContextMenu }) => {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: `activity-instance:${instance.id}`,
    disabled: mode === 'status',
    activationConstraint: { distance: 8 },
  } as any);
  const color = ACTIVITY_STATUS_COLORS[instance.status];
  return (
    <div ref={setNodeRef} {...(mode === 'planning' ? listeners : {})} {...(mode === 'planning' ? attributes : {})}
      onClick={onClick} onContextMenu={onContextMenu}
      onMouseEnter={(e) => hoverPopupSetter?.({ inst: instance, def, x: e.clientX, y: e.clientY, color: defColor })}
      onMouseMove={(e) => hoverPopupSetter?.({ inst: instance, def, x: e.clientX, y: e.clientY, color: defColor })}
      onMouseLeave={() => setTimeout(() => hoverPopupSetter?.((prev) => prev?.inst.id === instance.id ? null : prev), 50)}
      data-dragging={isDragging ? 'true' : undefined}
      className={`rounded px-1.5 py-1 mb-1 border-l-2 text-[10px] leading-tight transition-opacity ${
        isDragging ? 'opacity-30' : ''
      } ${mode === 'planning' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} hover:opacity-80`}
      style={{ borderLeftColor: color, backgroundColor: `${color}10` }}
    >
      <span className="font-medium" style={{ color: defColor }}>{defShortName}</span>
      {instance.secondaryTitle && <span className="ml-1 text-gray-600 dark:text-gray-400">{instance.secondaryTitle}</span>}
      {mode === 'status' && (
        <span className="ml-1 text-[9px] px-1 rounded" style={{ backgroundColor: color, color: '#fff' }}>
          {ACTIVITY_STATUS_LABELS[instance.status]}
        </span>
      )}
    </div>
  );
};

/* ─── Context menu ─── */
export interface ActivityContextMenuState {
  x: number; y: number;
  type: 'cell' | 'instance';
  year: number; month: number; week: number;
  instanceId?: string;
}

/* ─── Generate month range ─── */
function generateMonths(startYear: number, startMonth: number, count: number): MonthBlock[] {
  const result: MonthBlock[] = [];
  const d = new Date(startYear, startMonth, 1);
  for (let i = 0; i < count; i++) {
    const y = d.getFullYear();
    const m = d.getMonth();
    result.push({ year: y, month: m, name: MONTH_NAMES[m], maxWeeks: getMaxWeeks(y, m) });
    d.setMonth(d.getMonth() + 1);
  }
  return result;
}

/* ─── Main component ─── */
interface Props {
  mode: 'planning' | 'status';
  onContextMenu: (m: ActivityContextMenuState) => void;
  onEditInstance: (id: string) => void;
  onChangeStatus: (id: string, status: ActivityStatus) => void;
  onCellClick: (year: number, month: number, week: number) => void;
  scrollToTodayRef?: React.MutableRefObject<(() => void) | null>;
}

const ActivityCalendarView: React.FC<Props> = ({ mode, onContextMenu, onEditInstance, onChangeStatus, onCellClick, scrollToTodayRef }) => {
  const { definitions, instances, moveInstance } = useActivitiesStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const currentMonthRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth();

  // Build initial months: 24 back, 24 forward from current month
  const [months, setMonths] = useState<MonthBlock[]>(() => {
    const past = generateMonths(todayYear, todayMonth - 24, 24);
    const future = generateMonths(todayYear, todayMonth, 25);
    return [...past, ...future];
  });

  // Scroll to current month on mount
  useEffect(() => {
    if (hasScrolledRef.current) return;
    if (currentMonthRef.current && scrollRef.current) {
      currentMonthRef.current.scrollIntoView({ block: 'center', behavior: 'auto' });
      hasScrolledRef.current = true;
    }
  }, [months]);

  // Scroll to today ("Hoy")
  const scrollToToday = () => {
    currentMonthRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };
  // Expose via ref
  useEffect(() => { if (scrollToTodayRef) scrollToTodayRef.current = scrollToToday; }, []);

  // Load more months via IntersectionObserver
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl || !topSentinelRef.current || !bottomSentinelRef.current) return;
    let loading = false;

    const observer = new IntersectionObserver(
      (entries) => {
        if (loading) return;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          loading = true;
          const isTop = entry.target === topSentinelRef.current;
          const prevScrollHeight = scrollEl.scrollHeight;

          setMonths((prev) => {
            const first = prev[0];
            const last = prev[prev.length - 1];
            if (isTop && first) {
              return [...generateMonths(first.year, first.month - MONTHS_PER_PAGE, MONTHS_PER_PAGE), ...prev];
            } else if (!isTop && last) {
              return [...prev, ...generateMonths(last.year, last.month + 1, MONTHS_PER_PAGE)];
            }
            return prev;
          });

          requestAnimationFrame(() => {
            loading = false;
            if (isTop) {
              scrollEl.scrollTop = scrollEl.scrollHeight - prevScrollHeight;
            }
          });
          break;
        }
      },
      { root: scrollEl, threshold: 0.1 }
    );

    observer.observe(topSentinelRef.current);
    observer.observe(bottomSentinelRef.current);
    return () => observer.disconnect();
  }, []);

  // Instance map
  const cellMap = useMemo(() => {
    const map = new Map<string, ActivityInstance[]>();
    for (const inst of instances) {
      const key = `${inst.year}:${inst.month}:${inst.weekOfMonth}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(inst);
    }
    return map;
  }, [instances]);

  const sortedInstances = (list: ActivityInstance[]) =>
    [...list].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt - b.createdAt);

  const keyedMap = useMemo(() => {
    const m = new Map<string, ActivityInstance[]>();
    for (const [k, v] of cellMap) m.set(k, sortedInstances(v));
    return m;
  }, [cellMap]);

  const activeInstance = activeId ? instances.find((i) => i.id === activeId) : null;
  const activeDef = activeInstance ? definitions.find((d) => d.id === activeInstance.definitionId) : null;

  const handleDragStart = (e: DragStartEvent) => {
    const id = e.active.id as string;
    if (id.startsWith('activity-instance:')) setActiveId(id.slice('activity-instance:'.length));
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    if (!e.over) return;
    const overId = e.over.id as string;
    if (overId.startsWith('activity-cell:')) {
      const parts = overId.split(':');
      const y = parseInt(parts[1], 10);
      const m = parseInt(parts[2], 10);
      const w = parseInt(parts[3], 10);
      const firstDay = new Date(y, m, 1).getDay();
      const dayOfMonth = (w - 1) * 7 - firstDay + 4;
      const date = new Date(y, m, Math.max(1, Math.min(dayOfMonth, new Date(y, m + 1, 0).getDate())));
      moveInstance((e.active.id as string).slice('activity-instance:'.length), y, m, w, date.getTime());
    }
  };

  const isCurrentMonth = (m: MonthBlock) => m.year === todayYear && m.month === todayMonth;
  const years = useMemo(() => [...new Set(months.map((m) => m.year))].sort(), [months]);

  const GRID_COLS = `minmax(4rem, auto) repeat(6, 1fr)`;

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div ref={scrollRef} className="h-full overflow-auto">
        <div ref={topSentinelRef} className="h-4" />

        {/* Unified week header (sticky, one row) */}
        <div className="sticky top-0 z-20 grid gap-0.5 px-1 pt-1 bg-white/95 backdrop-blur dark:bg-dark-secondary/95"
          style={{ gridTemplateColumns: GRID_COLS }}>
          <div />
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 py-1 border-b border-gray-200 dark:border-dark-tertiary">S{i + 1}</div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid gap-0.5 px-1 pb-1" style={{ gridTemplateColumns: GRID_COLS }}>
          {years.map((year, yi) => (
            <React.Fragment key={year}>
              {/* Year separator (spans all columns) */}
              {yi > 0 && (
                <div className="flex items-center gap-3 py-3" style={{ gridColumn: '1 / -1' }}>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{year}</span>
                  <div className="flex-1 h-px bg-blue-200 dark:bg-blue-800" />
                </div>
              )}
              {months.filter((m) => m.year === year).map((m) => {
                const maxW = m.maxWeeks;
                const rowRef = isCurrentMonth(m) ? currentMonthRef : undefined;

                return (
                  <React.Fragment key={`${m.year}-${m.month}`}>
                    {/* Month row header */}
                    <div ref={rowRef}
                      className="flex flex-col items-center justify-center text-xs font-semibold text-gray-700 dark:text-gray-300 pr-2 border-r border-gray-200 dark:border-dark-tertiary min-h-[80px]">
                      {m.name} {yi === 0 ? m.year : ''}
                      {isCurrentMonth(m) && <span className="text-[9px] font-normal text-blue-500 bg-blue-100 dark:bg-blue-900/50 px-1 py-0.5 rounded mt-0.5">Actual</span>}
                    </div>
                    {/* 6 week cells */}
                    {Array.from({ length: 6 }, (_, wi) => {
                      const w = wi + 1;
                      if (w > maxW) {
                        return (
                          <div key={w} className="min-h-[80px] rounded border border-dashed border-gray-200 dark:border-dark-tertiary bg-gray-50/50 dark:bg-dark-tertiary/20 flex items-center justify-center">
                            <span className="text-[9px] text-gray-300 dark:text-gray-600">—</span>
                          </div>
                        );
                      }
                      const list = keyedMap.get(`${m.year}:${m.month}:${w}`) || [];
                      return (
                        <ActivityCell key={w} year={m.year} month={m.month} week={w}
                          onClick={() => onCellClick(m.year, m.month, w)}
                          onContextMenu={(e) => { e.preventDefault(); onContextMenu({ x: e.clientX, y: e.clientY, type: 'cell', year: m.year, month: m.month, week: w }); }}
                        >
                          {list.map((inst) => {
                            const def = definitions.find((d) => d.id === inst.definitionId);
                            return (
                              <DraggableInstance key={inst.id} instance={inst} mode={mode} def={def}
                                defColor={def?.color ?? '#666'} defShortName={def?.shortName}
                                onClick={() => {
                                  if (mode === 'status') {
                                    onChangeStatus(inst.id, inst.status === 'completed' ? 'pending' :
                                      inst.status === 'pending' ? 'in-progress' :
                                      inst.status === 'in-progress' ? 'completed' : 'pending');
                                  } else {
                                    onEditInstance(inst.id);
                                  }
                                }}
                                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenu({ x: e.clientX, y: e.clientY, type: 'instance', year: m.year, month: m.month, week: w, instanceId: inst.id }); }}
                              />
                            );
                          })}
                        </ActivityCell>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          ))}
        </div>
        <div ref={bottomSentinelRef} className="h-4" />
      </div>
      <DragOverlay>
        {activeInstance && activeDef && (
          <div className="rounded-lg px-3 py-2 text-sm text-white shadow-lg select-none pointer-events-none"
            style={{ backgroundColor: activeDef.color, maxWidth: 200 }}>
            <div className="font-medium truncate">{activeDef.shortName}{activeInstance.secondaryTitle ? `: ${activeInstance.secondaryTitle}` : ''}</div>
          </div>
        )}
      </DragOverlay>
      <HoverPopup />
    </DndContext>
  );
};

export default ActivityCalendarView;
