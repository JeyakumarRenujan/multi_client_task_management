import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  CheckCircle2,
  Clock,
  FileText,
  Users,
  FolderKanban,
  Zap,
} from 'lucide-react';

export const RecentActivity: React.FC = () => {
  const { tasks, timeEntries, invoices, clients, projects } = useApp();

  // Combine recent events
  const completedTasksList = tasks
    .filter(t => t.status === 'done' && t.completedAt)
    .map(t => ({
      id: `act-task-${t.id}`,
      title: `Completed task "${t.title}"`,
      sub: `${clients.find(c => c.id === t.clientId)?.company || 'Client'}`,
      time: t.completedAt || 'Recently',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      type: 'task',
    }));

  const recentTimeList = timeEntries.slice(0, 3).map(e => ({
    id: `act-time-${e.id}`,
    title: `Tracked ${(e.durationSeconds / 3600).toFixed(1)} hrs on "${e.description}"`,
    sub: `${clients.find(c => c.id === e.clientId)?.company || 'Client'}`,
    time: e.date,
    icon: <Clock className="w-4 h-4 text-teal-600" />,
    type: 'time',
  }));

  const recentInvoicesList = invoices.slice(0, 2).map(inv => {
    const totalVal = (inv.total ?? (inv as any).totalAmount ?? 0);
    const curr = inv.currency || '$';
    return {
      id: `act-inv-${inv.id}`,
      title: `Invoice ${inv.invoiceNumber} (${curr}${totalVal.toLocaleString()}) ${inv.status}`,
      sub: inv.clientCompany || inv.clientName || 'Client',
      time: inv.issueDate,
      icon: <FileText className="w-4 h-4 text-amber-600" />,
      type: 'invoice',
    };
  });

  const combinedActivities = [
    ...completedTasksList,
    ...recentTimeList,
    ...recentInvoicesList,
  ].slice(0, 5);

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-primary-400/70 dark:border-slate-800/80 shadow-sm flex flex-col justify-between transition-shadow">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
              Live Activity Timeline
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Recent logs, completions &amp; billings
            </p>
          </div>
        </div>

        {combinedActivities.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            No recent activity recorded yet.
          </div>
        ) : (
          <div className="relative pl-6 space-y-3.5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {combinedActivities.map(act => (
              <div key={act.id} className="relative group">
                <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {act.icon}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                    {act.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {act.sub}
                    </span>
                    <span>&bull;</span>
                    <span>{act.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Automatic system audit trail</span>
        <span className="text-emerald-700 dark:text-emerald-400 font-bold">100% Synced</span>
      </div>
    </div>
  );
};
