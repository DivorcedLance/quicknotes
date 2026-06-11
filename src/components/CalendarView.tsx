import React, { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronLeft, FiChevronRight, FiPlus, FiClock, FiCalendar, FiSun } from 'react-icons/fi';
import { useAppStore } from '../stores/appStore';
import { useCalendarStore } from '../stores/calendarStore';
import { useSettingsStore } from '../stores/settingsStore';
import { generateId } from '../utils/helpers';
import type { CalendarEvent } from '../types';

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 48;

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
const isSameDay = (a: number, b: number) => {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
};
const isToday = (ts: number) => isSameDay(ts, Date.now());
const startOfDay = (ts: number) => {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};
const getHourMinutes = (ts: number) => {
  const d = new Date(ts);
  return d.getHours() * 60 + d.getMinutes();
};
const snapToMinutes = (minutes: number, snap = 15) => Math.round(minutes / snap) * snap;

/* ─── Overlap layout: assign columns so overlapping events share width ─── */
function assignColumns(intervals: { id: string; startMin: number; endMin: number }[]) {
  const sorted = [...intervals].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
  const colEnd: number[] = [];
  const map = new Map<string, number>();

  for (const iv of sorted) {
    let col = -1;
    for (let i = 0; i < colEnd.length; i++) {
      if (colEnd[i] <= iv.startMin) { col = i; break; }
    }
    if (col === -1) { col = colEnd.length; colEnd.push(iv.endMin); }
    else { colEnd[col] = Math.max(colEnd[col], iv.endMin); }
    map.set(iv.id, col);
  }

  // Per-event max simultaneous overlaps (so non-overlapping events keep full width)
  const overlapTotals = new Map<string, number>();
  for (const target of intervals) {
    const points: { time: number; change: number }[] = [];
    for (const other of intervals) {
      if (other.id === target.id) continue;
      const ovStart = Math.max(target.startMin, other.startMin);
      const ovEnd = Math.min(target.endMin, other.endMin);
      if (ovStart < ovEnd) {
        points.push({ time: ovStart, change: 1 });
        points.push({ time: ovEnd, change: -1 });
      }
    }
    if (points.length === 0) { overlapTotals.set(target.id, 1); continue; }
    points.sort((a, b) => a.time - b.time || a.change - b.change);
    let cur = 1, max = 1;
    for (const p of points) { cur += p.change; if (cur > max) max = cur; }
    overlapTotals.set(target.id, max);
  }

  const result = new Map<string, { column: number; total: number }>();
  for (const [id, column] of map) result.set(id, { column, total: overlapTotals.get(id) ?? 1 });
  return result;
}

/* ─── Main Calendar ─── */
const CalendarView: React.FC = () => {
  const { calendarView, setCalendarView, calendarDate, setCalendarDate, setCurrentCalendarEventId } = useAppStore();
  const { events, addEvent, updateEvent } = useCalendarStore();
  const { settings } = useSettingsStore();
  const hoveredEventRef = useRef<string | null>(null);
  const setHoveredEvent = (id: string | null) => { hoveredEventRef.current = id; };
  const [resizing, setResizing] = useState<{ id: string; edge: 'start' | 'end'; startY: number; startMinutes: number } | null>(null);
  const resizeJustFinished = useRef(false);
  const [dragOverHour, setDragOverHour] = useState<{ dayTs: number; hour: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; ts: number; isAllDay?: boolean } | null>(null);

  const date = new Date(calendarDate);
  const year = date.getFullYear();
  const month = date.getMonth();
  const fontSize = settings.fontSize;

  useEffect(() => {
    if (contextMenu) {
      const close = () => setContextMenu(null);
      window.addEventListener('click', close);
      window.addEventListener('scroll', close, true);
      return () => { window.removeEventListener('click', close); window.removeEventListener('scroll', close, true); };
    }
  }, [contextMenu]);

  const navigate = (direction: number) => {
    const d = new Date(calendarDate);
    if (calendarView === 'day') d.setDate(d.getDate() + direction);
    else if (calendarView === 'week' || calendarView === 'list') d.setDate(d.getDate() + direction * 7);
    else if (calendarView === 'month') d.setMonth(d.getMonth() + direction);
    else if (calendarView === 'year') d.setFullYear(d.getFullYear() + direction);
    setCalendarDate(d.getTime());
  };

  const goToday = () => setCalendarDate(Date.now());

  const handleNewEvent = (startDate: number, endDate?: number, allDay?: boolean) => {
    const id = generateId();
    const event: CalendarEvent = {
      id, title: '', description: '', images: [],
      startDate, endDate: endDate ?? null, allDay: allDay ?? false, color: '#3b82f6',
      tags: [], notify: false, notifyBefore: 15, recurrence: null,
      createdAt: Date.now(), updatedAt: Date.now(),
    };
    addEvent(event);
    setCurrentCalendarEventId(id);
  };

  const handleEditEvent = (eventId: string) => {
    if (resizeJustFinished.current) { resizeJustFinished.current = false; return; }
    setHoveredEvent(null);
    setCurrentCalendarEventId(eventId);
  };

  const handleDropOnDay = (dayTimestamp: number) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverHour(null);
    const eventId = e.dataTransfer.getData('text/calendar-event-id');
    if (eventId) {
      const ev = events.find((evt) => evt.id === eventId);
      if (ev) {
        const diff = ev.startDate - startOfDay(ev.startDate);
        const ns = dayTimestamp + diff;
        const dur = ev.endDate ? ev.endDate - ev.startDate : 0;
        updateEvent(eventId, { startDate: ns, endDate: ev.endDate ? ns + dur : null });
      }
    }
  };

  const handleDropOnHour = (hourTimestamp: number) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverHour(null);
    const eventId = e.dataTransfer.getData('text/calendar-event-id');
    if (eventId) {
      const ev = events.find((evt) => evt.id === eventId);
      if (ev) {
        const origMin = new Date(ev.startDate).getMinutes();
        const ns = new Date(hourTimestamp);
        ns.setMinutes(origMin);
        const nst = ns.getTime();
        const dur = ev.endDate ? ev.endDate - ev.startDate : 3600000;
        updateEvent(eventId, { startDate: nst, endDate: ev.endDate ? nst + dur : null });
      }
    }
  };

  const handleDragStart = (eventId: string) => (e: React.DragEvent) => {
    setHoveredEvent(null);
    e.dataTransfer.setData('text/calendar-event-id', eventId);
    e.dataTransfer.effectAllowed = 'move';
    // Remove default drag ghost
    const img = new Image(); img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
    const el = e.currentTarget as HTMLElement;
    el.classList.add('dragging-source');
    el.closest('.calendar-views-container')?.classList.add('calendar-dragging');
  };

  // Clean up drag CSS classes when any drag ends
  useEffect(() => {
    const handler = () => {
      document.querySelector('.dragging-source')?.classList.remove('dragging-source');
      document.querySelector('.calendar-dragging')?.classList.remove('calendar-dragging');
    };
    document.addEventListener('dragend', handler);
    return () => document.removeEventListener('dragend', handler);
  }, []);

  const handleResizeMouseDown = (eventId: string, edge: 'start' | 'end') => (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation?.();
    const ev = events.find((evt) => evt.id === eventId);
    if (!ev) return;
    setResizing({ id: eventId, edge, startY: e.clientY, startMinutes: edge === 'start' ? getHourMinutes(ev.startDate) : getHourMinutes(ev.endDate ?? ev.startDate + 3600000) });
    resizeJustFinished.current = false;
  };

  useEffect(() => {
    if (!resizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - resizing.startY;
      const deltaMin = Math.round((deltaY / HOUR_HEIGHT) * 60);
      const snapped = snapToMinutes(deltaMin) - snapToMinutes(0);
      const ev = events.find((evt) => evt.id === resizing.id);
      if (!ev) return;
      const newMin = resizing.startMinutes + snapped;
      const ds = startOfDay(ev.startDate);
      if (resizing.edge === 'start') {
        const clamped = Math.max(0, Math.min(newMin, ev.endDate ? getHourMinutes(ev.endDate) - 15 : 1439));
        const ns = ds + clamped * 60000;
        if (ev.endDate && ns >= ev.endDate) return;
        updateEvent(resizing.id, { startDate: ns });
      } else {
        const clamped = Math.max(getHourMinutes(ev.startDate) + 15, Math.min(newMin, 1439));
        const ne = ds + clamped * 60000;
        if (ne <= ev.startDate) return;
        updateEvent(resizing.id, { endDate: ne });
      }
    };
    const handleMouseUp = () => { resizeJustFinished.current = true; setResizing(null); };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [resizing, events, updateEvent]);

  const handleDayClick = (dayTimestamp: number) => {
    if (calendarView === 'month') { setCalendarDate(new Date(dayTimestamp).getTime()); setCalendarView('day'); }
  };

  const viewLabel = useMemo(() => {
    if (calendarView === 'day') return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (calendarView === 'week' || calendarView === 'list') {
      const ws = new Date(calendarDate); ws.setDate(ws.getDate() - ws.getDay());
      const we = new Date(ws); we.setDate(we.getDate() + 6);
      return `${ws.getDate()} - ${we.getDate()} de ${MONTH_NAMES[we.getMonth()]} ${we.getFullYear()}`;
    }
    if (calendarView === 'month') return `${MONTH_NAMES[month]} ${year}`;
    return `${year}`;
  }, [calendarView, calendarDate, month, year]);

  return (
    <div className="flex h-full flex-col bg-light-primary dark:bg-dark-primary" style={{ fontSize }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-dark-tertiary">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="rounded-lg p-2 hover:bg-gray-200 dark:hover:bg-dark-tertiary"><FiChevronLeft size={20} /></button>
          <button onClick={goToday} className="rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-gray-200 dark:hover:bg-dark-tertiary">Hoy</button>
          <button onClick={() => navigate(1)} className="rounded-lg p-2 hover:bg-gray-200 dark:hover:bg-dark-tertiary"><FiChevronRight size={20} /></button>
          <h2 className="ml-2 text-xl font-semibold capitalize">{viewLabel}</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 dark:border-dark-tertiary overflow-hidden text-sm">
            {(['day', 'week', 'month', 'year', 'list'] as const).map((v) => (
              <button key={v} onClick={() => setCalendarView(v)}
                className={`px-3 py-1.5 font-medium transition-colors ${calendarView === v ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-dark-tertiary'}`}>
                {v === 'day' ? 'Día' : v === 'week' ? 'Semana' : v === 'month' ? 'Mes' : v === 'year' ? 'Año' : 'Lista'}
              </button>
            ))}
          </div>
          <button onClick={() => handleNewEvent(Date.now())} className="flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600">
            <FiPlus size={16} /> Nuevo
          </button>
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-xl dark:border-dark-tertiary dark:bg-dark-secondary"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => { handleNewEvent(contextMenu.ts, contextMenu.ts + 3600000, contextMenu.isAllDay); setContextMenu(null); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-tertiary"
          >
            <FiCalendar size={14} /> Nuevo evento
          </button>
          <button
            onClick={() => { handleNewEvent(contextMenu.ts, undefined, contextMenu.isAllDay); setContextMenu(null); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-tertiary"
          >
            <FiClock size={14} /> Nuevo recordatorio
          </button>
        </div>
      )}

      <style>{`.calendar-dragging .calendar-event:not(.dragging-source) { pointer-events: none !important; }`}</style>
      {/* Calendar body */}
      <div className="calendar-views-container flex-1 overflow-auto">
        {calendarView === 'month' && (
          <MonthView
            year={year} month={month} events={events}
            onHover={setHoveredEvent} fontSize={fontSize}
            onDayClick={handleDayClick} onNewEvent={handleNewEvent} onEditEvent={handleEditEvent}
            onDrop={handleDropOnDay} onDragStart={handleDragStart}
          />
        )}
        {calendarView === 'week' && (
          <WeekView
            date={calendarDate} events={events}
            onHover={setHoveredEvent} fontSize={fontSize}
            onNewEvent={handleNewEvent} onEditEvent={handleEditEvent}
            onDrop={handleDropOnHour} onDropOnDay={handleDropOnDay} onDragStart={handleDragStart}
            onResizeMouseDown={handleResizeMouseDown} resizing={resizing?.id ?? null}
            dragOverHour={dragOverHour} onDragOverHour={setDragOverHour}
            onContextMenu={setContextMenu}
          />
        )}
        {calendarView === 'day' && (
          <DayView
            date={calendarDate} events={events}
            onHover={setHoveredEvent} fontSize={fontSize}
            onNewEvent={handleNewEvent} onEditEvent={handleEditEvent}
            onDragStart={handleDragStart}
            onDropOnDay={handleDropOnDay}
            onResizeMouseDown={handleResizeMouseDown} resizing={resizing?.id ?? null}
            dragOverHour={dragOverHour} onDragOverHour={setDragOverHour}
            onContextMenu={setContextMenu}
          />
        )}
        {calendarView === 'year' && (
          <YearView year={year} events={events} fontSize={fontSize}
            onMonthClick={(m) => { setCalendarDate(new Date(year, m, 1).getTime()); setCalendarView('month'); }}
          />
        )}
        {calendarView === 'list' && (
          <ListView
            date={calendarDate} events={events} fontSize={fontSize}
            onEditEvent={handleEditEvent} onNewEvent={handleNewEvent}
          />
        )}
      </div>
    </div>
  );
};

/* ─── Tooltip ─── */
const EventTooltip: React.FC<{ event: CalendarEvent }> = ({ event }) => {
  const hasDescription = event.description && event.description.length > 0;
  return (
    <div className="rounded-lg bg-gray-900 px-4 py-3 text-sm text-white shadow-xl dark:bg-gray-100 dark:text-gray-900 max-w-md pointer-events-none">
      <p className="font-semibold mb-1 flex items-center gap-1.5 text-base">
        {event.endDate ? <FiCalendar size={14} /> : <FiClock size={14} />}
        {event.title || '(sin título)'}
      </p>
      {event.allDay && <p className="text-amber-300 dark:text-amber-600 text-xs mb-1">Todo el día</p>}
      <p className="opacity-70 text-xs mb-2">
        {new Date(event.startDate).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        {event.endDate && ` — ${new Date(event.endDate).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
      </p>
      {hasDescription ? (
        <div className="border-t border-white/20 pt-2 mt-1 text-xs leading-relaxed break-words whitespace-pre-wrap [&_img]:max-w-full [&_img]:rounded [&_img]:my-1 [&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4" dangerouslySetInnerHTML={{ __html: event.description }} />
      ) : (
        <p className="opacity-50 italic border-t border-white/20 pt-2 mt-1">Sin descripción</p>
      )}
      {event.recurrence && <p className="mt-2 text-blue-300 dark:text-blue-600 text-xs">↻ Repite</p>}
    </div>
  );
};

/* ─── EventBadge ─── */
const EventBadge: React.FC<{ event: CalendarEvent }> = ({ event }) => (
  event.endDate
    ? <FiCalendar size={10} className="shrink-0 opacity-80" />
    : <FiClock size={10} className="shrink-0 opacity-80" />
);

/* ─── TooltipPortal ─── */
const TooltipPortal: React.FC<{ event: CalendarEvent; x: number; y: number }> = ({ event, x, y }) => {
  const elRef = useRef<HTMLDivElement>(null);
  const [finalPos, setFinalPos] = useState({ left: 0, top: 0, ready: false });

  useLayoutEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 10;
    let left = x - rect.width / 2;
    let top = y - gap - rect.height;

    if (left < 8) left = 8;
    if (left + rect.width > window.innerWidth - 8) left = window.innerWidth - rect.width - 8;
    if (top < 8) top = y + gap;

    setFinalPos({ left, top, ready: true });
  }, [x, y]);

  return createPortal(
    <div ref={elRef} style={{ position: 'fixed', left: finalPos.left, top: finalPos.top, zIndex: 9999, visibility: finalPos.ready ? 'visible' : 'hidden' }} className="pointer-events-none">
      <EventTooltip event={event} />
    </div>,
    document.body
  );
};

/* ─── Month View ─── */
const MonthView: React.FC<{
  year: number; month: number; events: CalendarEvent[];
  onHover: (id: string | null) => void; fontSize: number;
  onDayClick: (ts: number) => void; onNewEvent: (ts: number) => void; onEditEvent: (id: string) => void;
  onDrop: (ts: number) => (e: React.DragEvent) => void; onDragStart: (id: string) => (e: React.DragEvent) => void;
}> = ({ year, month, events, onHover, fontSize, onDayClick, onNewEvent, onEditEvent, onDrop, onDragStart }) => {
  const [tooltipState, setTooltipState] = useState<{ event: CalendarEvent; x: number; y: number } | null>(null);
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);
  const totalSlots = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const slots = [];
  for (let i = 0; i < totalSlots; i++) {
    let day: number, date: Date, isCurrentMonth: boolean;
    if (i < firstDay) { day = daysInPrevMonth - firstDay + i + 1; date = new Date(year, month - 1, day); isCurrentMonth = false; }
    else if (i >= firstDay + daysInMonth) { day = i - firstDay - daysInMonth + 1; date = new Date(year, month + 1, day); isCurrentMonth = false; }
    else { day = i - firstDay + 1; date = new Date(year, month, day); isCurrentMonth = true; }
    slots.push({ day, date, timestamp: date.getTime(), isCurrentMonth });
  }

  return (
    <div className="p-4" style={{ fontSize }}>
      <div className="grid grid-cols-7 gap-px">
        {DAY_NAMES.map((n) => <div key={n} className="p-2 text-center text-xs font-semibold text-gray-500">{n}</div>)}
        {slots.map((slot) => {
          const dayEvents = events.filter((evt) => {
            const es = evt.startDate, ee = evt.endDate ?? evt.startDate;
            const ds = slot.timestamp, de = ds + 86400000;
            return es < de && ee >= ds;
          });
          const today = isToday(slot.timestamp);
          return (
            <div key={slot.timestamp}
              onDoubleClick={() => onNewEvent(slot.timestamp)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop(slot.timestamp)}
              onClick={() => onDayClick(slot.timestamp)}
              className={`relative min-h-[100px] cursor-pointer rounded-lg border p-1 text-sm transition-colors ${
                slot.isCurrentMonth ? 'border-gray-100 dark:border-dark-tertiary' : 'border-gray-50 bg-gray-50/50 dark:border-dark-tertiary/50 dark:bg-dark-secondary/30'
              } ${today ? 'ring-2 ring-blue-500' : 'hover:bg-gray-100 dark:hover:bg-dark-tertiary'}`}
            >
              <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                today ? 'bg-blue-500 text-white' : slot.isCurrentMonth ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'
              }`}>{slot.day}</div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((evt) => (
                  <div key={evt.id} draggable onDragStart={onDragStart(evt.id)}
                    onMouseEnter={(e) => { onHover(evt.id); setTooltipState({ event: evt, x: e.clientX, y: e.clientY }); }}
                    onMouseMove={(e) => { setTooltipState(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null); }}
                    onMouseLeave={() => { onHover(null); setTooltipState(null); }}
                    onClick={(e) => { e.stopPropagation(); onEditEvent(evt.id); }}
                    className={`calendar-event relative truncate rounded px-1 py-0.5 text-xs cursor-pointer hover:opacity-80 flex items-center gap-1 ${evt.endDate ? 'text-white' : 'text-white/90'}`}
                    style={{ backgroundColor: evt.color }}
                  >
                    <EventBadge event={evt} />
                    {evt.allDay ? <FiSun size={10} /> : new Date(evt.startDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) + ' '}
                    {evt.title || '(sin título)'}
                  </div>
                ))}
                {dayEvents.length > 3 && <div className="text-xs text-gray-500 px-1">+{dayEvents.length - 3} más</div>}
              </div>
            </div>
          );
        })}
      </div>
      {tooltipState && <TooltipPortal event={tooltipState.event} x={tooltipState.x} y={tooltipState.y} />}
    </div>
  );
};

/* ─── Week View ─── */
const WeekView: React.FC<{
  date: number; events: CalendarEvent[];
  onHover: (id: string | null) => void; fontSize: number;
  onNewEvent: (s: number, e?: number) => void; onEditEvent: (id: string) => void;
  onDrop: (ts: number) => (e: React.DragEvent) => void; onDropOnDay: (ts: number) => (e: React.DragEvent) => void;
  onDragStart: (id: string) => (e: React.DragEvent) => void;
  onResizeMouseDown: (id: string, edge: 'start' | 'end') => (e: React.MouseEvent) => void; resizing: string | null;
  dragOverHour: { dayTs: number; hour: number } | null; onDragOverHour: (v: { dayTs: number; hour: number } | null) => void;
  onContextMenu: (v: { x: number; y: number; ts: number; isAllDay?: boolean } | null) => void;
}> = ({ date, events, onHover, fontSize, onNewEvent, onEditEvent, onDrop, onDropOnDay, onDragStart, onResizeMouseDown, resizing, dragOverHour, onDragOverHour, onContextMenu }) => {
  const [tooltipState, setTooltipState] = useState<{ event: CalendarEvent; x: number; y: number } | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(id); }, []);
  const d = new Date(date); d.setDate(d.getDate() - d.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(d); day.setDate(d.getDate() + i);
    const ts = startOfDay(day.getTime());
    return { timestamp: ts, dayName: DAY_NAMES[i], dayNum: day.getDate(), isToday: isToday(ts) };
  });

  const handleSlotClick = (dayTimestamp: number, hour: number) => onNewEvent(dayTimestamp + hour * 3600000, dayTimestamp + (hour + 1) * 3600000);

  const allDayEvents = events.filter((evt) => evt.allDay && weekDays.some((wd) => isSameDay(evt.startDate, wd.timestamp)));

  // Build timed events per day with overlap layout
  const dayColumns = useMemo(() => {
    const result: Record<number, { event: CalendarEvent; column: number; total: number; top: number; height: number }[]> = {};
    for (const wd of weekDays) {
      const dayStart = wd.timestamp;
      const dayEnd = dayStart + 86400000;
      const timed = events.filter((evt) => {
        if (evt.allDay) return false;
        return evt.startDate < dayEnd && (evt.endDate ?? evt.startDate) >= dayStart;
      });
      if (timed.length === 0) continue;
      const cols = assignColumns(timed.map((evt) => {
        const es = evt.startDate < dayStart ? dayStart : evt.startDate;
        const ee = (evt.endDate ?? evt.startDate + 3600000) > dayEnd ? dayEnd : (evt.endDate ?? evt.startDate + 3600000);
        return { id: evt.id, startMin: getHourMinutes(es), endMin: getHourMinutes(ee) };
      }));
      result[wd.timestamp] = timed.map((evt) => {
        const info = cols.get(evt.id)!;
        const es = evt.startDate < dayStart ? dayStart : evt.startDate;
        const ee = (evt.endDate ?? evt.startDate + 3600000) > dayEnd ? dayEnd : (evt.endDate ?? evt.startDate + 3600000);
        const top = ((getHourMinutes(es)) / 60) * HOUR_HEIGHT;
        const height = Math.max(HOUR_HEIGHT / 2, ((getHourMinutes(ee) - getHourMinutes(es)) / 60) * HOUR_HEIGHT);
        return { event: evt, column: info.column, total: info.total, top, height };
      });
    }
    return result;
  }, [events, weekDays]);

  return (
    <div className="flex h-full flex-col overflow-auto" style={{ fontSize }}>
      {/* Day headers */}
      <div className="sticky top-0 z-20 grid grid-cols-8 border-b bg-white dark:bg-dark-primary">
        <div className="p-2" />
        {weekDays.map((day) => (
          <div key={day.timestamp} className={`p-2 text-center ${day.isToday ? 'text-blue-500' : ''}`}>
            <div className="text-xs text-gray-500">{day.dayName}</div>
            <div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${day.isToday ? 'bg-blue-500 text-white' : ''}`}>
              {day.dayNum}
            </div>
          </div>
        ))}
      </div>

      {/* All-day row */}
      <div className="grid grid-cols-8 border-b bg-amber-50/50 dark:bg-amber-950/20">
        <div className="flex items-center justify-end pr-2 text-[10px] font-medium text-amber-600 dark:text-amber-400"><FiSun size={12} /> Todo el día</div>
        {weekDays.map((day) => {
          const dayAllDay = allDayEvents.filter((evt) => isSameDay(evt.startDate, day.timestamp));
          return (
            <div key={day.timestamp}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDropOnDay(day.timestamp)}
              onContextMenu={(e) => { e.preventDefault(); onContextMenu({ x: e.clientX, y: e.clientY, ts: day.timestamp, isAllDay: true }); }}
              className="flex flex-wrap gap-0.5 border-l border-amber-200/50 p-1 dark:border-amber-800/30 min-h-[2rem]">
              {dayAllDay.map((evt) => (
                <div key={evt.id} draggable
                  onDragStart={onDragStart(evt.id)}
                  onMouseEnter={(e) => { onHover(evt.id); setTooltipState({ event: evt, x: e.clientX, y: e.clientY }); }}
                  onMouseMove={(e) => { setTooltipState(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null); }}
                  onMouseLeave={() => { onHover(null); setTooltipState(null); }} onClick={() => onEditEvent(evt.id)}
                  className="calendar-event relative flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-white cursor-pointer hover:opacity-80 truncate max-w-full"
                  style={{ backgroundColor: evt.color }}>
                  <FiSun size={9} /> {evt.title || '(sin título)'}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Hour rows + events */}
      <div className="grid grid-cols-8 flex-1">
        <div>
          {HOURS.map((h) => (
            <div key={h} className="flex h-12 items-start justify-end pr-2 pt-0 text-xs text-gray-400">{String(h).padStart(2, '0')}:00</div>
          ))}
        </div>
        {weekDays.map((day) => {
          const laidOut = dayColumns[day.timestamp] ?? [];
          return (
            <div key={day.timestamp} className="relative border-l border-gray-100 dark:border-dark-tertiary">
              <div style={{ position: 'relative', height: HOUR_HEIGHT * 24 }}>
                {/* Hour grid cells */}
                {HOURS.map((h) => (
                  <div key={h}
                    onDoubleClick={() => handleSlotClick(day.timestamp, h)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const relY = e.clientY - rect.top;
                      const absoluteHour = h + Math.round(relY / HOUR_HEIGHT * 10) / 10;
                      onDragOverHour({ dayTs: day.timestamp, hour: Math.min(23.75, Math.max(0, absoluteHour)) });
                    }}
                    onDragLeave={() => onDragOverHour(null)}
                    onDrop={(e) => { onDrop(day.timestamp + h * 3600000)(e); onDragOverHour(null); }}
                    onContextMenu={(e) => { e.preventDefault(); onContextMenu({ x: e.clientX, y: e.clientY, ts: day.timestamp + h * 3600000 }); }}
                    className="absolute w-full cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-950/30"
                    style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT, borderBottom: '1px solid rgba(0,0,0,0.06)' }}
                  />
                ))}
                {/* Drag indicator line */}
                {dragOverHour && dragOverHour.dayTs === day.timestamp && (
                  <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: dragOverHour.hour * HOUR_HEIGHT, height: 2 }}>
                    <div className="h-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-blue-500" />
                  </div>
                )}
                {/* Events */}
                {laidOut.map(({ event: evt, column, total, top, height }) => {
                  const isReminder = !evt.endDate;
                  return (
                    <div key={evt.id}
                      draggable={resizing !== evt.id}
                      onDragStart={resizing !== evt.id ? onDragStart(evt.id) : undefined}
                      onMouseEnter={(e) => { onHover(evt.id); setTooltipState({ event: evt, x: e.clientX, y: e.clientY }); }}
                      onMouseMove={(e) => { setTooltipState(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null); }}
                      onMouseLeave={() => { onHover(null); setTooltipState(null); }}
                      onClick={() => onEditEvent(evt.id)}
                      className={`calendar-event absolute z-10 rounded px-1.5 py-0.5 text-xs text-white cursor-pointer select-none ${
                        resizing === evt.id ? 'opacity-80 ring-2 ring-blue-400' : 'hover:opacity-90'
                      } ${isReminder ? 'border-l-2 border-white/40' : ''}`}
                      style={{ top, height, backgroundColor: evt.color, minHeight: '1.25rem', left: `${(column / total) * 100}%`, width: `${(1 / total) * 100}%` }}
                    >
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-1 font-medium truncate"><EventBadge event={evt} />{evt.title || '(sin título)'}</div>
                        <div className="opacity-80 text-[10px] flex items-center gap-1">
                          {new Date(evt.startDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          {evt.endDate && ` - ${new Date(evt.endDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
                          {isReminder && <span className="italic opacity-60">recordatorio</span>}
                        </div>
                      </div>
                      {evt.endDate && <div onMouseDown={onResizeMouseDown(evt.id, 'start')} className="absolute left-0 right-0 top-0 z-30 h-2 cursor-ns-resize hover:bg-white/30" />}
                      {evt.endDate && <div onMouseDown={onResizeMouseDown(evt.id, 'end')} className="absolute left-0 right-0 bottom-0 z-30 h-2 cursor-ns-resize hover:bg-white/30" />}
                    </div>
                  );
                })}
                {day.isToday && (() => {
                  const d = new Date(now);
                  const top = (d.getHours() + d.getMinutes() / 60) * HOUR_HEIGHT;
                  return <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top, height: 2 }}><div className="h-full bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.6)]" /></div>;
                })()}
              </div>
            </div>
          );
        })}
      </div>
      {tooltipState && <TooltipPortal event={tooltipState.event} x={tooltipState.x} y={tooltipState.y} />}
    </div>
  );
};

/* ─── Day View ─── */
const DayView: React.FC<{
  date: number; events: CalendarEvent[];
  onHover: (id: string | null) => void; fontSize: number;
  onNewEvent: (s: number, e?: number) => void; onEditEvent: (id: string) => void;
  onDragStart: (id: string) => (e: React.DragEvent) => void;
  onDropOnDay: (ts: number) => (e: React.DragEvent) => void;
  onResizeMouseDown: (id: string, edge: 'start' | 'end') => (e: React.MouseEvent) => void; resizing: string | null;
  dragOverHour: { dayTs: number; hour: number } | null; onDragOverHour: (v: { dayTs: number; hour: number } | null) => void;
  onContextMenu: (v: { x: number; y: number; ts: number; isAllDay?: boolean } | null) => void;
}> = ({ date, events, onHover, fontSize, onNewEvent, onEditEvent, onDragStart, onDropOnDay, onResizeMouseDown, resizing, dragOverHour, onDragOverHour, onContextMenu }) => {
  const [tooltipState, setTooltipState] = useState<{ event: CalendarEvent; x: number; y: number } | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(id); }, []);
  const ds = startOfDay(date);
  const dayEvents = events.filter((evt) => {
    if (evt.allDay) return isSameDay(evt.startDate, date);
    return evt.startDate < ds + 86400000 && (evt.endDate ?? evt.startDate) >= ds;
  });
  const timedEvents = dayEvents.filter((evt) => !evt.allDay);
  const allDayEvts = dayEvents.filter((evt) => evt.allDay);

  const handleSlotClick = (hour: number) => onNewEvent(ds + hour * 3600000, ds + (hour + 1) * 3600000);

  const laidOut = useMemo(() => {
    if (timedEvents.length === 0) return [];
    const cols = assignColumns(timedEvents.map((evt) => ({
      id: evt.id, startMin: getHourMinutes(evt.startDate), endMin: getHourMinutes(evt.endDate ?? evt.startDate + 3600000),
    })));
    return timedEvents.map((evt) => {
      const info = cols.get(evt.id)!;
      const top = (getHourMinutes(evt.startDate) / 60) * HOUR_HEIGHT;
      const height = Math.max(HOUR_HEIGHT / 2, ((getHourMinutes(evt.endDate ?? evt.startDate + 3600000) - getHourMinutes(evt.startDate)) / 60) * HOUR_HEIGHT);
      return { event: evt, column: info.column, total: info.total, top, height };
    });
  }, [timedEvents]);

  return (
    <div className="flex h-full flex-col overflow-auto" style={{ fontSize }}>
      <h3 className="sticky top-0 z-20 bg-white px-4 py-3 text-lg font-semibold dark:bg-dark-primary">
        {new Date(date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
      </h3>

      <div className="border-b bg-amber-50/50 px-4 py-2 dark:bg-amber-950/20"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDropOnDay(ds)}
        onContextMenu={(e) => { e.preventDefault(); onContextMenu({ x: e.clientX, y: e.clientY, ts: ds, isAllDay: true }); }}>
        <div className="flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-400 mb-1"><FiSun size={12} /> Todo el día</div>
        <div className="flex flex-wrap gap-1">
          {allDayEvts.map((evt) => (
            <div key={evt.id} draggable
              onDragStart={onDragStart(evt.id)}
              onMouseEnter={(e) => { onHover(evt.id); setTooltipState({ event: evt, x: e.clientX, y: e.clientY }); }}
              onMouseMove={(e) => { setTooltipState(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null); }}
              onMouseLeave={() => { onHover(null); setTooltipState(null); }} onClick={() => onEditEvent(evt.id)}
              className="calendar-event relative flex items-center gap-1 rounded px-2 py-1 text-xs text-white cursor-pointer hover:opacity-80"
              style={{ backgroundColor: evt.color }}>
              <FiSun size={10} /> {evt.title || '(sin título)'}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1">
        <div className="w-14 shrink-0 border-r border-gray-100 dark:border-dark-tertiary">
          {HOURS.map((h) => (
            <div key={h} className="flex h-12 items-start justify-end pr-2 pt-0 text-xs text-gray-400">{String(h).padStart(2, '0')}:00</div>
          ))}
        </div>

        <div className="relative flex-1" style={{ height: HOUR_HEIGHT * 24 }}>
          {HOURS.map((h) => (
            <div key={h}
              onDoubleClick={() => handleSlotClick(h)}
              onDragOver={(e) => {
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
                const relY = e.clientY - rect.top;
                const absoluteHour = h + Math.round(relY / HOUR_HEIGHT * 10) / 10;
                onDragOverHour({ dayTs: ds, hour: Math.min(23.75, Math.max(0, absoluteHour)) });
              }}
              onDragLeave={() => onDragOverHour(null)}
              onDrop={(e) => {
                e.preventDefault(); onDragOverHour(null);
                const eventId = e.dataTransfer.getData('text/calendar-event-id');
                if (!eventId) return;
                const ev = events.find((evt) => evt.id === eventId);
                if (!ev) return;
                const origMin = new Date(ev.startDate).getMinutes();
                const ns = new Date(ds + h * 3600000); ns.setMinutes(origMin);
                const nst = ns.getTime();
                const dur = ev.endDate ? ev.endDate - ev.startDate : 3600000;
                useCalendarStore.getState().updateEvent(eventId, { startDate: nst, endDate: ev.endDate ? nst + dur : null });
              }}
              onContextMenu={(e) => { e.preventDefault(); onContextMenu({ x: e.clientX, y: e.clientY, ts: ds + h * 3600000 }); }}
              className="absolute left-0 right-0 cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-950/30"
              style={{ top: h * HOUR_HEIGHT, height: HOUR_HEIGHT, borderBottom: '1px solid rgba(0,0,0,0.06)' }}
            />
          ))}
          {/* Drag indicator */}
          {dragOverHour && dragOverHour.dayTs === ds && (
            <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: dragOverHour.hour * HOUR_HEIGHT, height: 2 }}>
              <div className="h-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-blue-500" />
            </div>
          )}
          {/* Events */}
          {laidOut.map(({ event: evt, column, total, top, height }) => {
            const isReminder = !evt.endDate;
            return (
              <div key={evt.id}
                draggable={resizing !== evt.id}
                onDragStart={resizing !== evt.id ? onDragStart(evt.id) : undefined}
                onMouseEnter={(e) => { onHover(evt.id); setTooltipState({ event: evt, x: e.clientX, y: e.clientY }); }}
                onMouseMove={(e) => { setTooltipState(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null); }}
                onMouseLeave={() => { onHover(null); setTooltipState(null); }}
                onClick={() => onEditEvent(evt.id)}
                className={`calendar-event absolute z-10 rounded px-2 py-1 text-xs text-white cursor-pointer select-none ${
                  resizing === evt.id ? 'opacity-80 ring-2 ring-blue-400' : 'hover:opacity-90'
                } ${isReminder ? 'border-l-2 border-white/40' : ''}`}
                style={{ top, height, backgroundColor: evt.color, minHeight: '1.25rem', left: `${(column / total) * 100}%`, width: `${(1 / total) * 100}%` }}
              >
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1 font-medium truncate"><EventBadge event={evt} />{evt.title || '(sin título)'}</div>
                  <div className="opacity-80 text-[10px] flex items-center gap-1">
                    {new Date(evt.startDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    {evt.endDate && ` - ${new Date(evt.endDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
                    {isReminder && <span className="italic opacity-60">recordatorio</span>}
                  </div>
                </div>
                {evt.endDate && <div onMouseDown={onResizeMouseDown(evt.id, 'start')} className="absolute left-0 right-0 top-0 z-30 h-2 cursor-ns-resize hover:bg-white/30" />}
                {evt.endDate && <div onMouseDown={onResizeMouseDown(evt.id, 'end')} className="absolute left-0 right-0 bottom-0 z-30 h-2 cursor-ns-resize hover:bg-white/30" />}
              </div>
            );
          })}
          {isToday(ds) && (() => {
            const d = new Date(now);
            const top = (d.getHours() + d.getMinutes() / 60) * HOUR_HEIGHT;
            return <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top, height: 2 }}><div className="h-full bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.6)]" /></div>;
          })()}
        </div>
      </div>
      {tooltipState && <TooltipPortal event={tooltipState.event} x={tooltipState.x} y={tooltipState.y} />}
    </div>
  );
};

/* ─── Year View ─── */
const YearView: React.FC<{
  year: number; events: CalendarEvent[]; fontSize: number;
  onMonthClick: (month: number) => void;
}> = ({ year, events, fontSize, onMonthClick }) => {
  const months = Array.from({ length: 12 }, (_, i) => {
    const ms = new Date(year, i, 1).getTime();
    const me = new Date(year, i + 1, 0).getTime();
    return { index: i, name: MONTH_NAMES[i], count: events.filter((evt) => evt.startDate >= ms && evt.startDate <= me).length };
  });

  return (
    <div className="p-6" style={{ fontSize }}>
      <h2 className="mb-6 text-2xl font-bold text-center">{year}</h2>
      <div className="grid grid-cols-3 gap-4">
        {months.map((m) => (
          <button key={m.index} onClick={() => onMonthClick(m.index)}
            className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 p-8 hover:bg-gray-100 dark:border-dark-tertiary dark:hover:bg-dark-tertiary transition-colors">
            <span className="text-lg font-semibold">{m.name}</span>
            <span className="mt-2 text-sm text-gray-500">{m.count} {m.count === 1 ? 'evento' : 'eventos'}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ─── List View ─── */
const ListView: React.FC<{
  date: number; events: CalendarEvent[]; fontSize: number;
  onEditEvent: (id: string) => void; onNewEvent: (ts: number) => void;
}> = ({ date, events, fontSize, onEditEvent, onNewEvent }) => {
  const [showMode, setShowMode] = useState<'all' | 'withEvents'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'reminders' | 'events'>('all');

  const ws = new Date(date); ws.setDate(ws.getDate() - ws.getDay());
  let days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(ws); d.setDate(d.getDate() + i);
    const ts = startOfDay(d.getTime());
    let dayEvents = events
      .filter((evt) => {
        const es = startOfDay(evt.startDate);
        const ee = evt.endDate ? startOfDay(evt.endDate) : es;
        return ts >= es && ts <= ee;
      });
    if (typeFilter === 'reminders') dayEvents = dayEvents.filter((evt) => !evt.endDate);
    else if (typeFilter === 'events') dayEvents = dayEvents.filter((evt) => evt.endDate);
    dayEvents.sort((a, b) => a.startDate - b.startDate);
    return { timestamp: ts, events: dayEvents };
  });
  if (showMode === 'withEvents') days = days.filter((d) => d.events.length > 0);

  const btn = (active: boolean, label: string, onClick: () => void) => (
    <button onClick={onClick}
      className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${active ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-dark-tertiary'}`}>
      {label}
    </button>
  );

  return (
    <div style={{ fontSize }}>
      <div className="sticky top-0 z-20 bg-white dark:bg-dark-primary border-b border-gray-200 dark:border-dark-tertiary px-4 py-2 flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span>Mostrar:</span>
          {btn(showMode === 'all', 'Todos los días', () => setShowMode('all'))}
          {btn(showMode === 'withEvents', 'Con eventos', () => setShowMode('withEvents'))}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span>Tipo:</span>
          {btn(typeFilter === 'all', 'Todos', () => setTypeFilter('all'))}
          {btn(typeFilter === 'reminders', 'Recordatorios', () => setTypeFilter('reminders'))}
          {btn(typeFilter === 'events', 'Eventos', () => setTypeFilter('events'))}
        </div>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-dark-tertiary">
        {days.map((day) => {
          const d = new Date(day.timestamp);
          const today = isToday(day.timestamp);
          return (
            <div key={day.timestamp} className={`p-4 ${today ? 'bg-blue-50/40 dark:bg-blue-950/10' : ''}`}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold capitalize">
                  {d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
                {today && <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-medium">Hoy</span>}
                {day.events.length > 0 && <span className="text-[10px] text-gray-400">{day.events.length} {day.events.length === 1 ? 'evento' : 'eventos'}</span>}
              </div>
              {day.events.length === 0 ? (
                <button onClick={() => onNewEvent(day.timestamp)}
                  className="w-full text-left py-3 px-3 rounded-lg text-sm text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-tertiary transition-colors">
                  + Nuevo evento
                </button>
              ) : (
                <div className="space-y-1">
                  {day.events.map((evt) => {
                    const startTime = `${String(new Date(evt.startDate).getHours()).padStart(2, '0')}:${String(new Date(evt.startDate).getMinutes()).padStart(2, '0')}`;
                    const endTime = evt.endDate ? `${String(new Date(evt.endDate).getHours()).padStart(2, '0')}:${String(new Date(evt.endDate).getMinutes()).padStart(2, '0')}` : null;
                    const isReminder = !evt.endDate;
                    return (
                      <div key={evt.id} onClick={() => onEditEvent(evt.id)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-tertiary transition-colors">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: evt.color }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate flex items-center gap-1.5">
                            {evt.title || '(sin título)'}
                            {isReminder && <FiClock size={11} className="text-amber-500 shrink-0" />}
                          </div>
                          {evt.description && <div className="text-xs text-gray-500 truncate mt-0.5">{evt.description}</div>}
                        </div>
                        <div className="text-xs text-gray-400 shrink-0 whitespace-nowrap">
                          {evt.allDay ? (
                            <span className="text-amber-500 font-medium">Todo el día</span>
                          ) : (
                            <span>{startTime}{endTime ? ` - ${endTime}` : ''}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <button onClick={() => onNewEvent(day.timestamp)}
                    className="w-full text-left py-2 px-3 rounded-lg text-xs text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-tertiary transition-colors">
                    + Nuevo evento
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
