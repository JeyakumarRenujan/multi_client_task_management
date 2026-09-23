import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export const DeadlineRadar: React.FC = () => {
  const { tasks, projects, clients, moveTaskStatus, setActiveTab } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  const upcomingTasks = tasks
    .filter(t => t.status !== 'done')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  const getUrgencyDetails = (dueDate: string) => {
    const today = new Date(todayStr);
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        label: `${Math.abs(diffDays)}d overdue`,
        badgeClass: 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 font-black',
        isUrgent: true,
      };
    } else if (diffDays === 0) {
      return {
        label: 'Due Today',
        badgeClass: 'bg-rose-500 text-white font-black animate-pulse',
        isUrgent: true,
      };
    } else if (diffDays === 1) {
      return {
        label: 'Tomorrow',
        badgeClass: 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 font-bold',
        isUrgent: false,
      };
    } else {
      return {
        label: `In ${diffDays} days`,
        badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold',
        isUrgent: false,
      };
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-black dark:border-slate-800 shadow-sm flex flex-col">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Deadline
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Time-sensitive client deliverables
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('tasks')}
            className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {upcomingTasks.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
            <p className="text-xs font-semibold">No urgent pending deadlines!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {upcomingTasks.map(task => {
              const project = projects.find(p => p.id === task.projectId);
              const client = clients.find(c => c.id === task.clientId);
              const urgency = getUrgencyDetails(task.dueDate);

              return (
                <div
                  key={task.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => moveTaskStatus(task.id, 'done')}
                      title="Mark task as complete"
                      className="w-5 h-5 rounded-lg border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500 hover:bg-emerald-500/20 transition-colors flex items-center justify-center shrink-0"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-transparent group-hover:text-emerald-500" />
                    </button>

                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {client && (
                          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                            {client.company}
                          </span>
                        )}
                        <span>&bull;</span>
                        <span className="truncate max-w-[140px]">
                          {project?.title || 'Project'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${urgency.badgeClass}`}
                  >
                    {urgency.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
