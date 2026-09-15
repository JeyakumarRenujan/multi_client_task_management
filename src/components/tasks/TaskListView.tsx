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
} from 'lucide-react';

interface TaskListViewProps {
  filteredTasks: Task[];
  onEditTask: (task: Task) => void;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  filteredTasks,
  onEditTask,
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
    <div className="overflow-x-auto rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
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

              return (
                <tr
                  key={task.id}
                  onClick={() => onEditTask(task)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 max-w-[240px]">
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
                        className={`font-bold truncate ${
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
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {client?.company || 'Client'}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                      {project?.title || 'Project'}
                    </div>
                  </td>

                  <td className="py-3.5 px-4" onClick={e => e.stopPropagation()}>
                    <select
                      value={task.status}
                      onChange={e => moveTaskStatus(task.id, e.target.value as TaskStatus)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border uppercase focus:outline-none ${
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
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
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
                    className={`py-3.5 px-4 ${
                      isOverdue
                        ? 'font-bold text-rose-600 dark:text-rose-400'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {task.dueDate}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {task.estimatedHours}h
                  </td>

                  <td className="py-3.5 px-4 text-slate-500">
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
  );
};
