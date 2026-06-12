import React, { useMemo, useState } from 'react';
import { FiArrowLeft, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import type { ActivityStatus, ActivityInstance, ActivityDefinition } from '../types';
import { ACTIVITY_STATUS_LABELS, ACTIVITY_STATUS_COLORS } from '../types';

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];

interface Props {
  year: number;
  month?: number;
  instances: ActivityInstance[];
  definitions: ActivityDefinition[];
  onBack: () => void;
}

const ActivityPeriodDetail: React.FC<Props> = ({ year, month, instances, definitions, onBack }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const displayInstances = useMemo(() => {
    return month !== undefined
      ? instances.filter((i) => i.year === year && i.month === month)
      : instances.filter((i) => i.year === year);
  }, [instances, year, month]);

  const sorted = useMemo(() => {
    return [...displayInstances].sort((a, b) => a.date - b.date);
  }, [displayInstances]);

  const groups = useMemo(() => {
    if (month !== undefined) {
      const map = new Map<number, ActivityInstance[]>();
      for (const inst of sorted) {
        if (!map.has(inst.weekOfMonth)) map.set(inst.weekOfMonth, []);
        map.get(inst.weekOfMonth)!.push(inst);
      }
      return [...map.entries()].sort(([a], [b]) => a - b).map(([week, insts]) => ({ label: `Semana ${week}`, instances: insts }));
    } else {
      const map = new Map<number, ActivityInstance[]>();
      for (const inst of sorted) {
        if (!map.has(inst.month)) map.set(inst.month, []);
        map.get(inst.month)!.push(inst);
      }
      return [...map.entries()].sort(([a], [b]) => a - b).map(([m, insts]) => ({ label: MONTH_NAMES[m], instances: insts }));
    }
  }, [sorted, month]);

  const byDef = useMemo(() => {
    const map: Record<string, { color: string; statuses: Record<ActivityStatus, number>; total: number }> = {};
    for (const inst of sorted) {
      const d = definitions.find((def) => def.id === inst.definitionId);
      const name = d?.shortName ?? '?';
      if (!map[name]) map[name] = { color: d?.color ?? '#666', statuses: { pending: 0, 'in-progress': 0, completed: 0, postponed: 0, cancelled: 0 }, total: 0 };
      map[name].statuses[inst.status]++;
      map[name].total++;
    }
    return map;
  }, [sorted, definitions]);

  const byStatus = useMemo(() => {
    const map: Record<ActivityStatus, number> = { pending: 0, 'in-progress': 0, completed: 0, postponed: 0, cancelled: 0 };
    for (const inst of sorted) map[inst.status]++;
    return map;
  }, [sorted]);

  const statuses: ActivityStatus[] = ['pending', 'in-progress', 'completed', 'postponed', 'cancelled'];
  const total = sorted.length;
  const title = month !== undefined ? `${MONTH_NAMES[month]} ${year}` : `Año ${year}`;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center gap-3 border-b bg-white/95 backdrop-blur p-3 dark:border-dark-tertiary dark:bg-dark-secondary/95">
        <button onClick={onBack} className="rounded p-1.5 hover:bg-gray-200 dark:hover:bg-dark-tertiary">
          <FiArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-xs text-gray-500">{total} actividades</span>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Dashboard section */}
        <div className="border-b p-4 dark:border-dark-tertiary">
          <div className="mb-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-600 dark:text-gray-400">Por estado</h3>
            <div className="flex h-4 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-dark-tertiary">
              {statuses.map((s) => {
                const pct = total > 0 ? (byStatus[s] || 0) / total * 100 : 0;
                if (pct === 0) return null;
                return <div key={s} style={{ width: `${pct}%`, backgroundColor: ACTIVITY_STATUS_COLORS[s], minWidth: 4 }} title={`${ACTIVITY_STATUS_LABELS[s]}: ${byStatus[s]}`} />;
              })}
            </div>
            <div className="mt-1 flex flex-wrap gap-3 text-[11px]">
              {statuses.map((s) => (
                <span key={s} className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ACTIVITY_STATUS_COLORS[s] }} />
                  {ACTIVITY_STATUS_LABELS[s]}: {byStatus[s] || 0}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-600 dark:text-gray-400">Por definición</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(byDef).sort().map(([name, data]) => (
                <div key={name} className="rounded-lg border p-3 dark:border-dark-tertiary">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: data.color }} />
                    <span className="text-sm font-medium">{name}</span>
                    <span className="ml-auto text-[10px] text-gray-400">{data.total}</span>
                  </div>
                  <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-dark-tertiary">
                    {statuses.map((s) => {
                      const pct = data.total > 0 ? (data.statuses[s] || 0) / data.total * 100 : 0;
                      if (pct === 0) return null;
                      return <div key={s} style={{ width: `${pct}%`, backgroundColor: ACTIVITY_STATUS_COLORS[s], minWidth: 4 }} />;
                    })}
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]">
                    {statuses.map((s) => (
                      <span key={s} className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ACTIVITY_STATUS_COLORS[s] }} />
                        {data.statuses[s] || 0}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activities list grouped */}
        <div className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Todas las actividades</h3>
          {groups.map(({ label, instances: groupInsts }) => (
            <div key={label} className="mb-4">
              <h4 className="mb-2 text-xs font-semibold text-blue-600 dark:text-blue-400">{label}</h4>
              <div className="space-y-1">
                {groupInsts.map((inst) => {
                  const d = definitions.find((def) => def.id === inst.definitionId);
                  const st = inst.status as ActivityStatus;
                  const isExpanded = expandedId === inst.id;
                  return (
                    <div key={inst.id}>
                      <div className="flex cursor-pointer items-center gap-2 rounded border border-l-4 p-2 text-xs hover:opacity-80 dark:border-dark-tertiary"
                        style={{ borderLeftColor: ACTIVITY_STATUS_COLORS[st], backgroundColor: `${ACTIVITY_STATUS_COLORS[st]}08` }}
                        onClick={() => setExpandedId(isExpanded ? null : inst.id)}>
                        <span className="shrink-0">{isExpanded ? <FiChevronDown size={12} /> : <FiChevronRight size={12} />}</span>
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: d?.color ?? '#666' }} />
                        <span className="font-medium">{d?.shortName}</span>
                        {inst.secondaryTitle && <span className="text-gray-500">— {inst.secondaryTitle}</span>}
                        <span className="ml-auto text-[9px] px-1 rounded text-white" style={{ backgroundColor: ACTIVITY_STATUS_COLORS[st] }}>
                          {ACTIVITY_STATUS_LABELS[st]}
                        </span>
                        <span className="text-[9px] text-gray-400">S{inst.weekOfMonth}</span>
                      </div>
                      {isExpanded && (
                        <div className="ml-5 border-l-2 border-gray-200 pl-3 pt-1 pb-2 text-xs dark:border-dark-tertiary">
                          {inst.description ? (
                            <div className="mb-1 text-gray-600 dark:text-gray-400" dangerouslySetInnerHTML={{ __html: inst.description }} />
                          ) : (
                            <div className="mb-1 italic text-gray-400">Sin descripción</div>
                          )}
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-500">
                            {month === undefined && <span>{MONTH_NAMES[inst.month]}</span>}
                            <span>Año {inst.year} · Mes {inst.month + 1} · S{inst.weekOfMonth}</span>
                            {inst.postponedFrom && <span>Pospuesto desde: {instances.find((i) => i.id === inst.postponedFrom)?.secondaryTitle || 'origen'}</span>}
                            {inst.postponedHistory.length > 0 && <span>Historial: {inst.postponedHistory.length} postergaciones</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActivityPeriodDetail;
