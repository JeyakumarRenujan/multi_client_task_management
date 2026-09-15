import React from 'react';
import { useApp } from '../../context/AppContext';
import { Project } from '../../types';
import {
  Calendar,
  DollarSign,
  Clock,
  CheckSquare,
  Play,
  Archive,
  RotateCcw,
  Edit2,
  Trash2,
  Eye,
  AlertTriangle,
} from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onView: (project: Project) => void;
  onEdit: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onView, onEdit }) => {
  const { clients, tasks, deleteProject, archiveProject, restoreProject, startTimer, confirmAction } = useApp();

  const client = clients.find(c => c.id === project.clientId);
  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const completedTasks = projectTasks.filter(t => t.status === 'done').length;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    confirmAction({
      title: 'Delete Project?',
      message: `Are you sure you want to delete "${project.title}"? This action cannot be undone and will remove all associated tasks and time logs.`,
      confirmText: 'Delete Project',
      danger: true,
      itemType: 'project',
      onConfirm: () => deleteProject(project.id),
    });
  };

  const handleStartTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    startTimer(project.id, project.clientId, undefined, `Working on ${project.title}`);
  };

  const getPriorityBadge = () => {
    switch (project.priority) {
      case 'urgent':
        return 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400';
      case 'high':
        return 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400';
      case 'medium':
        return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300';
      case 'low':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
    }
  };

  return (
    <div
      onClick={() => onView(project)}
      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-300 flex flex-col justify-between cursor-pointer group"
    >
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="min-w-0">
            {client && (
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block truncate">
                {client.company}
              </span>
            )}
            <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate mt-0.5">
              {project.title}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getPriorityBadge()}`}
            >
              {project.priority}
            </span>
          </div>
        </div>

        {/* Deliverable Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {project.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Progress meter */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Progress ({completedTasks}/{projectTasks.length} tasks)
            </span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {project.progress}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-whatsapp-light rounded-full transition-all duration-500"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Info & Actions */}
      <div>
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">Due {project.deadline}</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              ${project.budget.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between mt-3 pt-2">
          <button
            onClick={handleStartTimer}
            className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Track Time</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={e => {
                e.stopPropagation();
                onEdit(project);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Edit"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
