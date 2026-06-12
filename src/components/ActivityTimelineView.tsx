import React, { useMemo, useState } from 'react';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { useActivitiesStore } from '../stores/activitiesStore';
import type { ActivityStatus, ActivityInstance } from '../types';
import { ACTIVITY_STATUS_LABELS, ACTIVITY_STATUS_COLORS } from '../types';

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'];

interface Props {
  onViewMonth: (year: number, month: number) => void;
  onViewYear: (year: number) => void;
}

const ActivityTimelineView: React.FC<Props> = ({ onViewMonth, onViewYear }) => {
  const { definitions, instances } = useActivitiesStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Group instances by year then month
  const grouped = useMemo(() => {
    const map = new Map<number, Map<number, ActivityInstance[]>>();
    for (const inst of instances) {
      if (!map.has(inst.year)) map.set(inst.year, new Map());
      const monthMap = map.get(inst.year)!;
      if (!monthMap.has(inst.month)) monthMap.set(inst.month, []);
      monthMap.get(inst.month)!.push(inst);
    }
    // Sort years desc, months desc
    const result: { year: number; month: number; instances: ActivityInstance[] }[] = [];
    const sortedYears = [...map.keys()].sort((a, b) => b - a);
    for (const year of sortedYears) {
      const monthMap = map.get(year)!;
      const sortedMonths = [...monthMap.keys()].sort((a, b) => b - a);
      for (const month of sortedMonths) {
        result.push({ year, month, instances: monthMap.get(month)! });
      }
    }
    return result;
  }, [instances]);

  return (
    <div className="p-4" style={{ fontSize: 14 }}>
      {grouped.length === 0 && (
        <div className="py-10 text-center text-sm text-gray-500">Sin actividades</div>
      )}
      <div className="relative space-y-0">
        {grouped.map(({ year, month, instances: monthInsts }, idx) => {
          const isFirstOfYear = idx === 0 || grouped[idx - 1].year !== year;
          const timelineStatuses: ActivityStatus[] = ['pending', 'in-progress', 'completed', 'postponed', 'cancelled'];
          const totalByStatus: Record<ActivityStatus, number> = { pending: 0, 'in-progress': 0, completed: 0, postponed: 0, cancelled: 0 };
          for (const s of timelineStatuses) totalByStatus[s] = (monthInsts as ActivityInstance[]).filter((i) => i.status === s).length;

          return (
            <React.Fragment key={`${year}-${month}`}>
              {/* Year separator */}
              {isFirstOfYear && (
                <div className="flex cursor-pointer items-center gap-3 py-3" onClick={() => onViewYear(year)}>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400 hover:underline">{year}</span>
                  <div className="flex-1 h-px bg-blue-200 dark:bg-blue-800" />
                  <span className="text-[10px] text-gray-400">{instances.filter((i) => i.year === year).length} actividades</span>
                </div>
              )}
              {/* Month row */}
              <div className="relative flex gap-4">
                {/* Timeline line */}
                <div className="relative flex flex-col items-center">
                  <div className="z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-blue-400 bg-white text-xs font-bold text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:bg-dark-secondary dark:text-blue-400"
                    onClick={() => onViewMonth(year, month)}
                    title="Ver detalle">
                    {month + 1}
                  </div>
                  {idx < grouped.length - 1 && <div className="w-0.5 flex-1 bg-blue-200 dark:bg-blue-800" />}
                </div>
                {/* Month content */}
                <div className="flex-1 pb-6">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="cursor-pointer text-sm font-semibold text-gray-700 hover:underline dark:text-gray-300"
                      onClick={() => onViewMonth(year, month)}>
                      {MONTH_NAMES[month]}
                    </span>
                    <span className="text-[10px] text-gray-400">{monthInsts.length} actividades</span>
                    {/* Mini status dots */}
                    <div className="flex gap-1 ml-2">
                      {timelineStatuses.map((s) => {
                        const count = totalByStatus[s];
                        if (!count) return null;
                        return (
                          <span key={s} className="flex items-center gap-0.5 text-[9px] text-gray-500">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ACTIVITY_STATUS_COLORS[s] }} />
                            {count}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  {/* Activity list with accordion */}
                  <div className="space-y-1">
                    {(monthInsts as ActivityInstance[]).map((inst) => {
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
                          {/* Accordion content */}
                          {isExpanded && (
                            <div className="ml-5 border-l-2 border-gray-200 pl-3 pt-1 pb-2 text-xs dark:border-dark-tertiary">
                              {inst.description ? (
                                <div className="mb-1 text-gray-600 dark:text-gray-400" dangerouslySetInnerHTML={{ __html: inst.description }} />
                              ) : (
                                <div className="mb-1 italic text-gray-400">Sin descripción</div>
                              )}
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-500">
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
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityTimelineView;
