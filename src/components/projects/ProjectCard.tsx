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
  Sparkles,
} from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onView: (project: Project) => void;
  onEdit: (project: Project) => void;
  isHighlighted?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onView, onEdit, isHighlighted }) => {
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

  const isArchived = project.status === 'archived';

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

  const getStatusBadge = () => {
    switch (project.status) {
      case 'archived':
        return (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
            <Archive className="w-3 h-3 text-slate-500" />
            Archived
          </span>
        );
      case 'completed':
        return (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
            Completed
          </span>
        );
      case 'in-progress':
        return (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
            In Progress
          </span>
        );
      case 'planning':
        return (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
            Planning
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      id={`project-card-${project.id}`}
      onClick={() => onView(project)}
      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between cursor-pointer group ${
        isHighlighted
          ? 'ring-4 ring-emerald-500/60 shadow-2xl scale-[1.02] border-emerald-500 dark:border-emerald-500 bg-white dark:bg-slate-900'
          : isArchived
          ? 'bg-slate-50/80 dark:bg-slate-900/60 border-dashed border-slate-300 dark:border-slate-700 shadow-xs opacity-90 hover:opacity-100 hover:border-slate-400 dark:hover:border-slate-600'
          : 'bg-white dark:bg-slate-900 border-primary-400/70 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-primary-500 dark:hover:border-emerald-600'
      }`}
    >
      <div>
        {/* Pointed Badge */}
        {isHighlighted && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/90 border border-emerald-300 dark:border-emerald-700/80 text-[11px] font-black text-emerald-800 dark:text-emerald-300 mb-2.5 w-fit shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
            <span>Pointed Project &bull; Matched Search</span>
          </div>
        )}

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

          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            {getStatusBadge()}
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
              className={`h-full rounded-full transition-all duration-500 ${
                isArchived
                  ? 'bg-slate-400 dark:bg-slate-600'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-whatsapp-light'
              }`}
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
          {isArchived ? (
            <button
              onClick={e => {
                e.stopPropagation();
                restoreProject(project.id);
              }}
              className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/40"
              title="Restore to Active Projects"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Project</span>
            </button>
          ) : (
            <button
              onClick={handleStartTimer}
              className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Track Time</span>
            </button>
          )}

          <div className="flex items-center gap-1">
            {isArchived ? (
              <button
                onClick={e => {
                  e.stopPropagation();
                  restoreProject(project.id);
                }}
                className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                title="Restore Project"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={e => {
                  e.stopPropagation();
                  archiveProject(project.id);
                }}
                className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40"
                title="Archive Project"
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
            )}
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
