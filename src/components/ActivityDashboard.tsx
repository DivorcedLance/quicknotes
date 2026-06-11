import React, { useMemo } from 'react';
import { useActivitiesStore } from '../stores/activitiesStore';
import type { ActivityStatus } from '../types';
import { ACTIVITY_STATUS_LABELS, ACTIVITY_STATUS_COLORS } from '../types';

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const ActivityDashboard: React.FC = () => {
  const { definitions, instances } = useActivitiesStore();

  const stats = useMemo(() => {
    const byDef: Record<string, Record<ActivityStatus, number>> = {};
    const byMonth: Record<string, Record<ActivityStatus, number>> = {};

    for (const inst of instances) {
      const defId = inst.definitionId;
      if (!byDef[defId]) byDef[defId] = { 'pending': 0, 'in-progress': 0, 'completed': 0, 'postponed': 0, 'cancelled': 0 };
      byDef[defId][inst.status]++;

      const monthKey = `${inst.year}-${String(inst.month + 1).padStart(2, '0')}`;
      if (!byMonth[monthKey]) byMonth[monthKey] = { 'pending': 0, 'in-progress': 0, 'completed': 0, 'postponed': 0, 'cancelled': 0 };
      byMonth[monthKey][inst.status]++;
    }

    return { byDef, byMonth, total: instances.length };
  }, [instances]);

  const statuses: ActivityStatus[] = ['pending', 'in-progress', 'completed', 'postponed', 'cancelled'];

  return (
    <div className="space-y-6 p-4" style={{ fontSize: 14 }}>
      <h2 className="text-lg font-semibold">Dashboard de Actividades</h2>
      <div className="text-center text-[11px] text-gray-500">Total: {stats.total} actividades</div>

      {/* By definition */}
      <div>
        <div className="mb-1 flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Por Definición</h3>
          <span className="text-[10px] text-gray-400">({definitions.length} definiciones)</span>
        </div>
        <div className="space-y-2">
          {definitions.map((d) => {
            const data = stats.byDef[d.id];
            if (!data) return null;
            const defTotal = statuses.reduce((sum, s) => sum + (data[s] || 0), 0);
            return (
              <div key={d.id} className="rounded-lg border p-3 dark:border-dark-tertiary">
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-sm font-medium">{d.shortName}</span>
                  <span className="text-xs text-gray-500">— {d.title}</span>
                  <span className="text-[10px] text-gray-400 ml-auto">{defTotal} actividades</span>
                </div>
                {/* Stacked bar */}
                <div className="mb-1.5 flex h-4 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-dark-tertiary">
                  {statuses.map((s) => {
                    const pct = defTotal > 0 ? (data[s] || 0) / defTotal * 100 : 0;
                    if (pct === 0) return null;
                    return (
                      <div key={s} style={{ width: `${pct}%`, backgroundColor: ACTIVITY_STATUS_COLORS[s], minWidth: pct > 0 ? 4 : 0 }} title={`${ACTIVITY_STATUS_LABELS[s]}: ${data[s]}`} />
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-3 text-[10px]">
                  {statuses.map((s) => (
                    <span key={s} className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ACTIVITY_STATUS_COLORS[s] }} />
                      {ACTIVITY_STATUS_LABELS[s]}: {data[s] || 0}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
          {definitions.length === 0 && <p className="text-sm text-gray-500">Sin definiciones</p>}
        </div>
      </div>

      {/* By month */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-600 dark:text-gray-400">Por Mes</h3>
        <div className="space-y-2">
          {Object.entries(stats.byMonth).sort().reverse().map(([monthKey, data]) => {
            const [y, m] = monthKey.split('-').map(Number);
            const monthTotal = statuses.reduce((sum, s) => sum + (data[s] || 0), 0);
            return (
              <div key={monthKey} className="rounded-lg border p-3 dark:border-dark-tertiary">
                <div className="mb-2 text-sm font-medium">{MONTH_NAMES[m - 1]} {y}</div>
                <div className="mb-1 flex h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-dark-tertiary">
                  {statuses.map((s) => {
                    const pct = monthTotal > 0 ? (data[s] || 0) / monthTotal * 100 : 0;
                    if (pct === 0) return null;
                    return <div key={s} style={{ width: `${pct}%`, backgroundColor: ACTIVITY_STATUS_COLORS[s], minWidth: pct > 0 ? 4 : 0 }} />;
                  })}
                </div>
                <div className="flex flex-wrap gap-3 text-[10px]">
                  {statuses.map((s) => (
                    <span key={s} className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ACTIVITY_STATUS_COLORS[s] }} />
                      {data[s] || 0}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
          {Object.keys(stats.byMonth).length === 0 && <p className="text-sm text-gray-500">Sin actividades</p>}
        </div>
      </div>
    </div>
  );
};

export default ActivityDashboard;
