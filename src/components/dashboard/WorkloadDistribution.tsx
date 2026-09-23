import React from 'react';
import { useApp } from '../../context/AppContext';
import { FolderKanban, ArrowRight, BarChart3 } from 'lucide-react';

export const WorkloadDistribution: React.FC = () => {
  const { projects, clients, tasks, setActiveTab } = useApp();

  const activeProjects = projects.filter(p => p.status !== 'archived');

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Active Client Projects
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Milestone completion &amp; progress
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('projects')}
            className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>All Projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3.5">
          {activeProjects.slice(0, 4).map(project => {
            const client = clients.find(c => c.id === project.clientId);
            const projectTasks = tasks.filter(t => t.projectId === project.id);
            const completedTasks = projectTasks.filter(t => t.status === 'done').length;

            return (
              <div
                key={project.id}
                onClick={() => setActiveTab('projects')}
                className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-emerald-50/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate block">
                      {project.title}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {client?.company || 'Direct Client'} &bull; {completedTasks}/{projectTasks.length} tasks
                    </span>
                  </div>

                  <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                    {project.progress}%
                  </span>
                </div>

                {/* Progress bar in natural green gradient */}
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-whatsapp-light rounded-full transition-all duration-500"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
        <span>Managing {clients.length} Clients Concurrently</span>
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">Optimal Capacity</span>
      </div>
    </div>
  );
};
