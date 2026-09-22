import React from 'react';
import { useApp } from '../../context/AppContext';
import { Project } from '../../types';
import {
  FolderKanban,
  CheckSquare,
  Clock,
  DollarSign,
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Archive,
  RotateCcw,
  X,
  Play,
} from 'lucide-react';

interface ProjectDetailModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (project: Project) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  isOpen,
  onClose,
  onEdit,
}) => {
  const {
    clients,
    tasks,
    timeEntries,
    deleteProject,
    confirmAction,
    archiveProject,
    restoreProject,
    moveTaskStatus,
    setIsTaskModalOpen,
    setSelectedTaskForEdit,
    startTimer,
    setActiveTab,
  } = useApp();

  if (!isOpen || !project) return null;

  const client = clients.find(c => c.id === project.clientId);
  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const completedTasks = projectTasks.filter(t => t.status === 'done').length;
  const projectTimeEntries = timeEntries.filter(t => t.projectId === project.id);

  const totalTimeSeconds = projectTimeEntries.reduce((acc, curr) => acc + curr.durationSeconds, 0);
  const totalHours = (totalTimeSeconds / 3600).toFixed(1);

  const handleDelete = () => {
    confirmAction({
      title: 'Delete Project?',
      message: `Are you sure you want to delete "${project.title}"? This action cannot be undone and will remove all associated tasks and time logs.`,
      confirmText: 'Delete Project',
      danger: true,
      itemType: 'project',
      onConfirm: () => {
        deleteProject(project.id);
        onClose();
      },
    });
  };

  const handleStartTimerForProject = () => {
    startTimer(project.id, project.clientId, undefined, `Working on ${project.title}`);
    onClose();
  };

  const handleCreateTask = () => {
    setSelectedTaskForEdit(null);
    setIsTaskModalOpen(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4 min-w-0">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-700/20 mt-1 shrink-0">
              <FolderKanban className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 truncate">
                  {project.title}
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 inline-flex items-center gap-1 ${
                    project.status === 'completed'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      : project.status === 'in-progress'
                      ? 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300'
                      : project.status === 'planning'
                      ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                      : project.status === 'archived'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {project.status === 'archived' && <Archive className="w-3 h-3 text-slate-500" />}
                  {project.status.replace('-', ' ')}
                </span>
              </div>

              {client && (
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1 truncate">
                  Client: <span className="text-slate-900 dark:text-slate-200">{client.company} ({client.name})</span>
                </p>
              )}

              <div className="flex items-center flex-wrap gap-2.5 sm:gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Due: {project.deadline}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Budget: ${project.budget.toLocaleString()} (${project.spent.toLocaleString()} spent)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-1.5 self-end md:self-auto shrink-0">
            <button
              onClick={handleStartTimerForProject}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-whatsapp-teal hover:from-emerald-700 hover:to-whatsapp-dark text-white rounded-xl text-xs font-bold shadow-sm"
              title="Track Time"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Start Timer</span>
            </button>
            <button
              onClick={() => {
                onEdit(project);
                onClose();
              }}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Edit Project"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            {project.status === 'archived' ? (
              <button
                onClick={() => restoreProject(project.id)}
                className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60"
                title="Restore Project"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => archiveProject(project.id)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Archive Project"
              >
                <Archive className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleDelete}
              className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60"
              title="Delete Project"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Archived notice banner */}
        {project.status === 'archived' && (
          <div className="px-4 sm:px-6 py-2.5 bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5 font-medium">
              <Archive className="w-4 h-4 shrink-0 text-slate-500" />
              <span>This project is archived. Milestone progress and tasks are kept for reference.</span>
            </span>
            <button
              onClick={() => restoreProject(project.id)}
              className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer shrink-0 ml-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Project</span>
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Progress & Budget Utilization */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-300">
                Milestone Progress ({completedTasks}/{projectTasks.length} tasks done)
              </span>
              <span className="font-mono text-emerald-700 dark:text-emerald-400 font-black">
                {project.progress}%
              </span>
            </div>

            <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-whatsapp-light rounded-full transition-all duration-500"
                style={{ width: `${project.progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Time Logged: {totalHours} hrs</span>
              <span>Budget Spent: ${project.spent.toLocaleString()} / ${project.budget.toLocaleString()}</span>
            </div>
          </div>

          {/* Description */}
          {project.description && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Description &amp; Goals
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
                {project.description}
              </p>
            </div>
          )}

          {/* Project Deliverable Tasks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                Tasks ({projectTasks.length})
              </h4>
              <button
                onClick={handleCreateTask}
                className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>

            {projectTasks.length === 0 ? (
              <div className="p-4 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-400">
                No tasks created for this project yet.
              </div>
            ) : (
              <div className="space-y-2">
                {projectTasks.map(task => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => moveTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done')}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                          task.status === 'done'
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                        }`}
                      >
                        {task.status === 'done' && <CheckSquare className="w-3.5 h-3.5" />}
                      </button>

                      <div className="min-w-0">
                        <span
                          className={`text-xs font-bold block truncate ${
                            task.status === 'done'
                              ? 'line-through text-slate-400'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {task.title}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Due: {task.dueDate} &bull; Est: {task.estimatedHours}h
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        task.status === 'done'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : task.status === 'in-progress'
                          ? 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300'
                          : task.status === 'review'
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <span className="text-xs text-slate-400">Project ID: {project.id}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
