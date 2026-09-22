import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  FolderKanban,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';

export const StatCards: React.FC = () => {
  const { clients, projects, tasks, timeEntries, invoices, user, setActiveTab } = useApp();

  const activeClients = clients.filter(c => c.status === 'active').length;
  const activeProjects = projects.filter(p => p.status === 'in-progress').length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const dueTodayTasks = tasks.filter(t => t.dueDate === todayStr && t.status !== 'done').length;
  const overdueTasks = tasks.filter(t => t.dueDate < todayStr && t.status !== 'done').length;

  const totalSecondsTracked = timeEntries.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);
  const totalHoursTracked = (totalSecondsTracked / 3600).toFixed(1);

  const stats = [
    {
      id: 'clients',
      title: 'Active Clients',
      value: activeClients,
      subValue: `${clients.length} total profiles`,
      icon: Users,
      iconColor: 'text-emerald-700 dark:text-emerald-400',
      bgLight: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      onClick: () => setActiveTab('clients'),
    },
    {
      id: 'projects',
      title: 'Ongoing Projects',
      value: activeProjects,
      subValue: `${projects.filter(p => p.status === 'completed').length} completed`,
      icon: FolderKanban,
      iconColor: 'text-teal-700 dark:text-teal-400',
      bgLight: 'bg-teal-500/10',
      borderColor: 'border-teal-500/20',
      onClick: () => setActiveTab('projects'),
    },
    {
      id: 'deadlines',
      title: 'Deadlines Today',
      value: dueTodayTasks + overdueTasks,
      subValue: overdueTasks > 0 ? `${overdueTasks} overdue!` : `${dueTodayTasks} due today`,
      icon: AlertCircle,
      iconColor: dueTodayTasks + overdueTasks > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400',
      bgLight: dueTodayTasks + overdueTasks > 0 ? 'bg-rose-500/10' : 'bg-amber-500/10',
      borderColor: dueTodayTasks + overdueTasks > 0 ? 'border-rose-500/30' : 'border-amber-500/20',
      highlight: dueTodayTasks + overdueTasks > 0,
      onClick: () => setActiveTab('tasks'),
    },
    {
      id: 'time',
      title: 'Tracked Hours',
      value: `${totalHoursTracked}h`,
      subValue: `${timeEntries.length} logged sessions`,
      icon: Clock,
      iconColor: 'text-emerald-700 dark:text-emerald-400',
      bgLight: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      onClick: () => setActiveTab('time'),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(stat => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.id}
            onClick={stat.onClick}
            className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border ${
              stat.borderColor
            } shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group flex flex-col justify-between ${
              stat.highlight ? 'ring-2 ring-rose-500/30' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {stat.title}
              </span>
              <div
                className={`p-2 rounded-xl ${stat.bgLight} ${stat.iconColor} transition-transform group-hover:scale-110`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <div>
                <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                  {stat.subValue}
                </div>
              </div>

              <div className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-emerald-600">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
