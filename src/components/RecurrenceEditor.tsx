import React from 'react';
import type { RecurrenceRule } from '../types';

interface RecurrenceEditorProps {
  value: RecurrenceRule | null;
  onChange: (rule: RecurrenceRule | null) => void;
}

const RecurrenceEditor: React.FC<RecurrenceEditorProps> = ({ value, onChange }) => {
  if (!value) {
    return (
      <div>
        <button
          type="button"
          onClick={() =>
            onChange({
              frequency: 'daily',
              interval: 1,
              indefinite: true,
            })
          }
          className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
        >
          Activar repetición
        </button>
      </div>
    );
  }

  const update = (partial: Partial<RecurrenceRule>) => {
    onChange({ ...value, ...partial });
  };

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const daysOfWeek = value.byDay ?? [];
  const toggleDay = (d: number) => {
    const next = daysOfWeek.includes(d)
      ? daysOfWeek.filter((x) => x !== d)
      : [...daysOfWeek, d].sort();
    update({ byDay: next });
  };

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-dark-tertiary dark:bg-dark-secondary">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Repetición</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs text-red-500 hover:text-red-600"
        >
          Eliminar repetición
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm">Cada</span>
        <input
          type="number"
          min={1}
          max={999}
          value={value.interval}
          onChange={(e) => update({ interval: Math.max(1, parseInt(e.target.value) || 1) })}
          className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center dark:border-dark-tertiary dark:bg-dark-tertiary"
        />
        <select
          value={value.frequency}
          onChange={(e) => update({ frequency: e.target.value as RecurrenceRule['frequency'] })}
          className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-dark-tertiary dark:bg-dark-tertiary"
        >
          <option value="daily">día(s)</option>
          <option value="weekly">semana(s)</option>
          <option value="monthly">mes(es)</option>
          <option value="yearly">año(s)</option>
        </select>
      </div>

      {value.frequency === 'weekly' && (
        <div>
          <span className="text-xs text-gray-500">Repetir los días:</span>
          <div className="mt-1 flex gap-1">
            {dayNames.map((name, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                className={`h-8 w-8 rounded-full text-xs font-medium transition-colors ${
                  daysOfWeek.includes(i)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-dark-tertiary dark:text-gray-400'
                }`}
              >
                {name[0]}
              </button>
            ))}
          </div>
        </div>
      )}

      {value.frequency === 'monthly' && (
        <div>
          <span className="text-xs text-gray-500">Días del mes (separados por coma):</span>
          <input
            type="text"
            value={(value.byMonthDay ?? []).join(', ')}
            onChange={(e) => {
              const days = e.target.value
                .split(',')
                .map((s) => parseInt(s.trim()))
                .filter((n) => !isNaN(n) && n >= 1 && n <= 31);
              update({ byMonthDay: days });
            }}
            placeholder="ej: 1, 15, 30"
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-dark-tertiary dark:bg-dark-tertiary"
          />
        </div>
      )}

      {value.frequency === 'yearly' && (
        <div>
          <span className="text-xs text-gray-500">Meses (separados por coma, 1-12):</span>
          <input
            type="text"
            value={(value.byMonth ?? []).join(', ')}
            onChange={(e) => {
              const months = e.target.value
                .split(',')
                .map((s) => parseInt(s.trim()))
                .filter((n) => !isNaN(n) && n >= 1 && n <= 12);
              update({ byMonth: months });
            }}
            placeholder="ej: 1, 6, 12"
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-dark-tertiary dark:bg-dark-tertiary"
          />
        </div>
      )}

      <div className="space-y-1">
        <span className="text-xs text-gray-500">Termina:</span>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="recurrence-end"
            checked={!!value.indefinite}
            onChange={() => update({ indefinite: true, endDate: undefined, count: undefined })}
          />
          Nunca (indefinido)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="recurrence-end"
            checked={!!value.count && !value.indefinite}
            onChange={() => update({ indefinite: false, endDate: undefined, count: value.count || 10 })}
          />
          Después de
          <input
            type="number"
            min={1}
            value={value.count || 10}
            onChange={(e) => update({ count: Math.max(1, parseInt(e.target.value) || 1), indefinite: false, endDate: undefined })}
            className="w-16 rounded border border-gray-300 px-2 py-0.5 text-sm text-center dark:border-dark-tertiary dark:bg-dark-tertiary"
            disabled={!value.count && value.indefinite}
          />
          ocurrencias
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="recurrence-end"
            checked={!!value.endDate && !value.indefinite}
            onChange={() => update({ indefinite: false, count: undefined, endDate: value.endDate || Date.now() })}
          />
          El
          <input
            type="date"
            value={value.endDate ? new Date(value.endDate).toISOString().split('T')[0] : ''}
            onChange={(e) => {
              const d = e.target.value ? new Date(e.target.value).getTime() : undefined;
              update({ endDate: d, indefinite: false, count: undefined });
            }}
            className="rounded border border-gray-300 px-2 py-0.5 text-sm dark:border-dark-tertiary dark:bg-dark-tertiary"
          />
        </label>
      </div>
    </div>
  );
};

export default RecurrenceEditor;
