import React, { useEffect, useRef, useState } from 'react';
import { FiArrowLeft, FiClock, FiBell, FiCalendar } from 'react-icons/fi';
import RichTextEditor, { type RichTextEditorHandle } from './RichTextEditor';
import { useCalendarStore } from '../stores/calendarStore';
import { useSettingsStore } from '../stores/settingsStore';
import { generateId } from '../utils/helpers';
import type { CalendarEvent } from '../types';
import ColorPicker from './ColorPicker';
import RecurrenceEditor from './RecurrenceEditor';

interface CalendarEventEditorProps {
  eventId: string | null;
  onClose: () => void;
}

const formatDateInput = (ts: number) => {
  const d = new Date(ts);
  return d.toISOString().split('T')[0];
};

const formatTimeInput = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const CalendarEventEditor: React.FC<CalendarEventEditorProps> = ({ eventId, onClose }) => {
  const { events, addEvent, updateEvent, deleteEvent } = useCalendarStore();
  const { settings } = useSettingsStore();
  const editorRef = useRef<RichTextEditorHandle>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const isClosingRef = useRef(false);
  const initialSnapshotRef = useRef<string>('');

  const existingEvent = eventId ? events.find((e) => e.id === eventId) : null;
  const [event, setEvent] = useState<CalendarEvent>(
    existingEvent || {
      id: generateId(),
      title: '',
      description: '',
      images: [],
      startDate: Date.now(),
      endDate: new Date(Date.now() + 3600000).getTime(),
      allDay: false,
      color: '#3b82f6',
      tags: [],
      notify: settings.notificationsEnabled,
      notifyBefore: 15,
      recurrence: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  );

  const [startDateStr, setStartDateStr] = useState(formatDateInput(event.startDate));
  const [startTimeStr, setStartTimeStr] = useState(formatTimeInput(event.startDate));
  const [endDateStr, setEndDateStr] = useState(event.endDate ? formatDateInput(event.endDate) : '');
  const [endTimeStr, setEndTimeStr] = useState(event.endDate ? formatTimeInput(event.endDate) : '');

  useEffect(() => {
    const snapshot = JSON.stringify({
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      allDay: event.allDay,
      color: event.color,
      notify: event.notify,
      notifyBefore: event.notifyBefore,
      recurrence: event.recurrence,
    });
    if (!initialSnapshotRef.current) {
      initialSnapshotRef.current = snapshot;
    }
  }, []);

  const getCurrentSnapshot = () =>
    JSON.stringify({
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      allDay: event.allDay,
      color: event.color,
      notify: event.notify,
      notifyBefore: event.notifyBefore,
      recurrence: event.recurrence,
    });

  const persistEvent = () => {
    const snapshot = getCurrentSnapshot();
    if (snapshot === initialSnapshotRef.current) return;

    if (eventId) {
      updateEvent(eventId, event);
    } else {
      addEvent(event);
    }
    initialSnapshotRef.current = snapshot;
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (isClosingRef.current) return;
      persistEvent();
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [event]);

  const updateDates = (startDate: string, startTime: string, endDate: string, endTime: string) => {
    const start = new Date(`${startDate}T${startTime}`).getTime();
    let end: number | null = null;
    if (endDate && endTime) {
      end = new Date(`${endDate}T${endTime}`).getTime();
    } else if (endDate) {
      end = new Date(`${endDate}T23:59`).getTime();
    }
    if (end !== null && end <= start) {
      end = start + 3600000;
    }
    setEvent((prev) => ({ ...prev, startDate: start, endDate: end }));
  };

  const handleBack = () => {
    isClosingRef.current = true;
    const latestTitle = titleInputRef.current?.value ?? event.title;
    const latestDescription = editorRef.current?.getHtml() ?? event.description;
    const normalizedTitle = latestTitle.trim().length === 0 ? '' : latestTitle;
    const nextEvent = { ...event, title: normalizedTitle, description: latestDescription };
    const isEmpty = !nextEvent.title && !nextEvent.description && nextEvent.images.length === 0;

    if (eventId) {
      const exists = events.some((e) => e.id === eventId);
      if (exists && isEmpty) {
        deleteEvent(eventId);
      } else if (exists) {
        updateEvent(eventId, { ...nextEvent, updatedAt: Date.now() });
      } else if (!isEmpty) {
        addEvent({ ...nextEvent, updatedAt: Date.now() });
      }
    } else if (!isEmpty) {
      addEvent({ ...nextEvent, updatedAt: Date.now() });
    }
    onClose();
  };

  const handleDelete = () => {
    if (eventId && window.confirm('¿Eliminar este evento?')) {
      deleteEvent(eventId);
      onClose();
    }
  };

  return (
    <div className="relative h-full overflow-auto bg-light-primary text-gray-900 dark:bg-dark-primary dark:text-gray-100">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-dark-tertiary dark:bg-dark-secondary/90">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-3 py-2 text-sm backdrop-blur hover:bg-white dark:border-dark-tertiary dark:bg-dark-secondary/90 dark:hover:bg-dark-secondary"
        >
          <FiArrowLeft /> Volver
        </button>
        <div className="flex items-center gap-2">
          {eventId && (
            <button
              onClick={handleDelete}
              className="rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-4xl p-6 space-y-6">
        {/* Title */}
        <input
          ref={titleInputRef}
          type="text"
          placeholder="Título del evento"
          value={event.title}
          onChange={(e) => setEvent({ ...event, title: e.target.value })}
          className="w-full border-0 border-b-2 border-transparent bg-transparent px-0 py-2 text-3xl font-semibold outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 dark:placeholder:text-gray-500"
        />

        {/* Type: Reminder vs Event */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={!event.endDate}
              onChange={() => {
                setEndDateStr('');
                setEndTimeStr('');
                setEvent({ ...event, endDate: null });
              }}
            />
            <FiClock /> Recordatorio (instante)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={!!event.endDate}
              onChange={() => {
                const end = event.startDate + 3600000;
                setEndDateStr(formatDateInput(end));
                setEndTimeStr(formatTimeInput(end));
                setEvent({ ...event, endDate: end });
              }}
            />
            <FiCalendar /> Evento (con inicio y fin)
          </label>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Inicio</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={startDateStr}
                onChange={(e) => {
                  setStartDateStr(e.target.value);
                  updateDates(e.target.value, startTimeStr, endDateStr, endTimeStr);
                }}
                className="input-field flex-1"
              />
              {!event.allDay && (
                <input
                  type="time"
                  value={startTimeStr}
                  onChange={(e) => {
                    setStartTimeStr(e.target.value);
                    updateDates(startDateStr, e.target.value, endDateStr, endTimeStr);
                  }}
                  className="input-field"
                />
              )}
            </div>
          </div>

          {event.endDate !== null && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Fin</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={endDateStr}
                  onChange={(e) => {
                    setEndDateStr(e.target.value);
                    updateDates(startDateStr, startTimeStr, e.target.value, endTimeStr);
                  }}
                  className="input-field flex-1"
                />
                {!event.allDay && (
                  <input
                    type="time"
                    value={endTimeStr}
                    onChange={(e) => {
                      setEndTimeStr(e.target.value);
                      updateDates(startDateStr, startTimeStr, endDateStr, e.target.value);
                    }}
                    className="input-field"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={event.allDay}
            onChange={(e) => setEvent({ ...event, allDay: e.target.checked })}
          />
          Todo el día
        </label>

        {/* Color */}
        <div className="space-y-2">
          <span className="block text-sm font-medium">Color</span>
          <ColorPicker
            value={event.color}
            onChange={(color) => setEvent({ ...event, color })}
          />
        </div>

        {/* Notification */}
        <div className="space-y-2 rounded-lg border border-gray-200 p-4 dark:border-dark-tertiary">
          <label className="flex items-center gap-2 text-sm font-medium">
            <FiBell />
            <input
              type="checkbox"
              checked={event.notify}
              onChange={(e) => setEvent({ ...event, notify: e.target.checked })}
            />
            Notificar
          </label>
          {event.notify && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Antes:</span>
              <select
                value={event.notifyBefore}
                onChange={(e) => setEvent({ ...event, notifyBefore: parseInt(e.target.value) })}
                className="input-field w-auto"
              >
                <option value={0}>En el momento</option>
                <option value={5}>5 minutos</option>
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={60}>1 hora</option>
                <option value={120}>2 horas</option>
                <option value={1440}>1 día</option>
                <option value={10080}>1 semana</option>
              </select>
            </div>
          )}
        </div>

        {/* Recurrence */}
        <div className="space-y-2">
          <span className="block text-sm font-medium">Repetición</span>
          <RecurrenceEditor
            value={event.recurrence}
            onChange={(rule) => setEvent({ ...event, recurrence: rule })}
          />
        </div>

        {/* Description (RichTextEditor) */}
        <div className="space-y-2">
          <span className="block text-sm font-medium">Descripción</span>
          <RichTextEditor
            ref={editorRef}
            value={event.description}
            onChange={(description) => setEvent((prev) => ({ ...prev, description }))}
            placeholder="Describe el evento o recordatorio. Pega imágenes con Ctrl+V."
            className="shadow-md"
          />
        </div>
      </div>
    </div>
  );
};

export default CalendarEventEditor;
