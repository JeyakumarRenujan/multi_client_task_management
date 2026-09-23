import React from 'react';
import { useApp } from '../../context/AppContext';
import { Task, TaskStatus } from '../../types';
import {
  CheckSquare,
  Play,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  Tag,
  Sparkles,
} from 'lucide-react';

interface TaskListViewProps {
  filteredTasks: Task[];
  onEditTask: (task: Task) => void;
  highlightedTaskId?: string | null;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  filteredTasks,
  onEditTask,
  highlightedTaskId,
}) => {
  const {
    projects,
    clients,
    moveTaskStatus,
    deleteTask,
    confirmAction,
    startTimer,
  } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-primary-400/70 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      {/* Mobile Card List View (< md) */}
      <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No tasks match your filter criteria.
          </div>
        ) : (
          filteredTasks.map(task => {
            const project = projects.find(p => p.id === task.projectId);
            const client = clients.find(c => c.id === task.clientId);
            const isOverdue = task.dueDate < todayStr && task.status !== 'done';
            const completedSubtasks = task.subtasks.filter(s => s.completed).length;
            const isHighlighted = highlightedTaskId === task.id;

            return (
              <div
                key={task.id}
                id={`task-mobile-${task.id}`}
                onClick={() => onEditTask(task)}
                className={`p-3.5 space-y-2.5 transition-colors cursor-pointer ${
                  isHighlighted
                    ? 'bg-emerald-50 dark:bg-emerald-950/70 ring-4 ring-emerald-500/60 shadow-xl rounded-xl'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                {isHighlighted && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/90 border border-emerald-300 dark:border-emerald-700/80 text-[10px] font-black text-emerald-800 dark:text-emerald-300 mb-1 w-fit shadow-xs">
                    <Sparkles className="w-3 h-3 text-emerald-600 animate-spin" />
                    <span>Pointed Task &bull; Matched Search</span>
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        moveTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done');
                      }}
                      className={`w-5 h-5 mt-0.5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                        task.status === 'done'
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                      }`}
                    >
                      {task.status === 'done' && <CheckSquare className="w-3.5 h-3.5" />}
                    </button>
                    <div className="min-w-0">
                      <h4
                        className={`text-sm font-bold leading-snug truncate ${
                          task.status === 'done'
                            ? 'line-through text-slate-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {client?.company || 'Client'} &bull; {project?.title || 'Project'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                      task.priority === 'urgent'
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                        : task.priority === 'high'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold ${
                        isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {task.dueDate}
                    </span>
                    {task.subtasks.length > 0 && (
                      <span className="text-slate-400 text-xs">
                        ({completedSubtasks}/{task.subtasks.length})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <select
                      value={task.status}
                      onChange={e => moveTaskStatus(task.id, e.target.value as TaskStatus)}
                      className="text-xs font-bold px-2 py-1 rounded-lg border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 uppercase"
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                    <button
                      onClick={() =>
                        startTimer(task.projectId, task.clientId, task.id, `Task: ${task.title}`)
                      }
                      className="p-1 rounded text-slate-400 hover:text-emerald-600"
                      title="Start Timer"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onEditTask(task)}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        confirmAction({
                          title: 'Delete Task?',
                          message: `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
                          confirmText: 'Delete Task',
                          danger: true,
                          itemType: 'task',
                          onConfirm: () => deleteTask(task.id),
                        });
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-600"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop/Tablet Table View (hidden on mobile) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider text-xs">
          <tr>
            <th className="py-3.5 px-4">Task Deliverable</th>
            <th className="py-3.5 px-4">Client / Project</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4">Priority</th>
            <th className="py-3.5 px-4">Due Date</th>
            <th className="py-3.5 px-4">Est. Hours</th>
            <th className="py-3.5 px-4">Checklist</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredTasks.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-12 text-center text-slate-400">
                No tasks match your filter criteria.
              </td>
            </tr>
          ) : (
            filteredTasks.map(task => {
              const project = projects.find(p => p.id === task.projectId);
              const client = clients.find(c => c.id === task.clientId);
              const isOverdue = task.dueDate < todayStr && task.status !== 'done';
              const completedSubtasks = task.subtasks.filter(s => s.completed).length;

              const isHighlighted = highlightedTaskId === task.id;

              return (
                <tr
                  key={task.id}
                  id={`task-row-${task.id}`}
                  onClick={() => onEditTask(task)}
                  className={`cursor-pointer transition-colors ${
                    isHighlighted
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 ring-2 ring-emerald-500 font-bold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-3.5 px-4 max-w-[240px]">
                    {isHighlighted && (
                      <div className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full mb-1 shadow-xs">
                        <Sparkles className="w-3 h-3 text-emerald-600 animate-spin" />
                        <span>Pointed Task &bull; Matched Search</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          moveTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done');
                        }}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                          task.status === 'done'
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                        }`}
                      >
                        {task.status === 'done' && <CheckSquare className="w-3.5 h-3.5" />}
                      </button>

                      <span
                        className={`text-sm font-bold truncate ${
                          task.status === 'done'
                            ? 'line-through text-slate-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {client?.company || 'Client'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                      {project?.title || 'Project'}
                    </div>
                  </td>

                  <td className="py-3.5 px-4" onClick={e => e.stopPropagation()}>
                    <select
                      value={task.status}
                      onChange={e => moveTaskStatus(task.id, e.target.value as TaskStatus)}
                      className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border uppercase focus:outline-none cursor-pointer ${
                        task.status === 'done'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                          : task.status === 'in-progress'
                          ? 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border-teal-300'
                          : task.status === 'review'
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300'
                      }`}
                    >
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="review">In Review</option>
                      <option value="done">Done</option>
                    </select>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${
                        task.priority === 'urgent'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                          : task.priority === 'high'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </td>

                  <td
                    className={`py-3.5 px-4 text-xs sm:text-sm ${
                      isOverdue
                        ? 'font-bold text-rose-600 dark:text-rose-400'
                        : 'font-semibold text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {task.dueDate}
                  </td>

                  <td className="py-3.5 px-4 text-xs sm:text-sm font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {task.estimatedHours}h
                  </td>

                  <td className="py-3.5 px-4 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
                    {task.subtasks.length > 0
                      ? `${completedSubtasks}/${task.subtasks.length}`
                      : '—'}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() =>
                          startTimer(task.projectId, task.clientId, task.id, `Task: ${task.title}`)
                        }
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        title="Start Timer"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEditTask(task)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          confirmAction({
                            title: 'Delete Task?',
                            message: `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
                            confirmText: 'Delete Task',
                            danger: true,
                            itemType: 'task',
                            onConfirm: () => deleteTask(task.id),
                          });
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
        </table>
      </div>
    </div>
  );
};
