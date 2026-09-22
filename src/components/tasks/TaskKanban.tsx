import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Task, TaskStatus } from '../../types';
import {
  Plus,
  Clock,
  Calendar,
  Play,
  Edit2,
  Trash2,
  CheckSquare,
} from 'lucide-react';

interface TaskKanbanProps {
  filteredTasks: Task[];
  onEditTask: (task: Task) => void;
}

export const TaskKanban: React.FC<TaskKanbanProps> = ({ filteredTasks, onEditTask }) => {
  const {
    projects,
    clients,
    moveTaskStatus,
    deleteTask,
    confirmAction,
    startTimer,
    setIsTaskModalOpen,
    setSelectedTaskForEdit,
  } = useApp();

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const columns: { id: TaskStatus; label: string; color: string; badgeBg: string }[] = [
    {
      id: 'todo',
      label: 'To Do',
      color: 'border-slate-300 dark:border-slate-700',
      badgeBg: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
    },
    {
      id: 'in-progress',
      label: 'In Progress',
      color: 'border-teal-400 dark:border-teal-700',
      badgeBg: 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300',
    },
    {
      id: 'review',
      label: 'In Review',
      color: 'border-emerald-400 dark:border-emerald-700',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300',
    },
    {
      id: 'done',
      label: 'Completed',
      color: 'border-whatsapp-light dark:border-emerald-600',
      badgeBg: 'bg-emerald-500 text-white',
    },
  ];

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      moveTaskStatus(taskId, targetStatus);
    }
    setDraggedTaskId(null);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
      {columns.map(col => {
        const colTasks = filteredTasks.filter(t => t.status === col.id);

        return (
          <div
            key={col.id}
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, col.id)}
            className="flex flex-col bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-2.5 sm:p-3 min-h-[140px] md:min-h-[480px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-2 py-1.5 mb-2.5">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {col.label}
                </h3>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${col.badgeBg}`}>
                  {colTasks.length}
                </span>
              </div>

              <button
                onClick={() => {
                  setSelectedTaskForEdit(null);
                  setIsTaskModalOpen(true);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800"
                title="Add task to this list"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Task Cards in Column */}
            <div className="flex-1 space-y-2.5 sm:space-y-3">
              {colTasks.length === 0 ? (
                <div className="h-16 sm:h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-center p-2 sm:p-3">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Drag tasks here
                  </span>
                </div>
              ) : (
                colTasks.map(task => {
                  const project = projects.find(p => p.id === task.projectId);
                  const client = clients.find(c => c.id === task.clientId);
                  const isOverdue = task.dueDate < todayStr && task.status !== 'done';
                  const isDueToday = task.dueDate === todayStr && task.status !== 'done';

                  const priorityColors = {
                    urgent: 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400',
                    high: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400',
                    medium: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300',
                    low: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
                  }[task.priority];

                  const completedSubtasks = task.subtasks.filter(s => s.completed).length;

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={e => handleDragStart(e, task.id)}
                      onClick={() => onEditTask(task)}
                      className={`p-3.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/60 shadow-sm hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-grab active:cursor-grabbing group ${
                        draggedTaskId === task.id ? 'opacity-50' : ''
                      }`}
                    >
                      {/* Card Top: Client & Priority */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        {client ? (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: client.color }}
                            />
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate max-w-[110px]">
                              {client.company}
                            </span>
                          </div>
                        ) : (
                          <span />
                        )}

                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${priorityColors}`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {task.title}
                      </h4>

                      {/* Project Name */}
                      {project && (
                        <div className="text-[10px] text-slate-400 truncate mb-2.5">
                          {project.title}
                        </div>
                      )}

                      {/* Subtasks Progress */}
                      {task.subtasks.length > 0 && (
                        <div className="mb-2.5 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 text-[10px] text-slate-500">
                          <div className="flex items-center justify-between font-semibold mb-1">
                            <span className="flex items-center gap-1">
                              <CheckSquare className="w-3 h-3 text-emerald-600" />
                              Checklist
                            </span>
                            <span>
                              {completedSubtasks}/{task.subtasks.length}
                            </span>
                          </div>
                          <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-600 rounded-full"
                              style={{
                                width: `${Math.round(
                                  (completedSubtasks / task.subtasks.length) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Footer: Due Date & Quick Timer */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-500">
                        <div
                          className={`flex items-center gap-1 font-semibold ${
                            isOverdue
                              ? 'text-rose-600 dark:text-rose-400 font-bold'
                              : isDueToday
                              ? 'text-amber-600 dark:text-amber-400 font-bold'
                              : ''
                          }`}
                        >
                          <Calendar className="w-3 h-3" />
                          <span>{task.dueDate}</span>
                        </div>

                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() =>
                              startTimer(
                                task.projectId,
                                task.clientId,
                                task.id,
                                `Task: ${task.title}`
                              )
                            }
                            className="p-1 rounded text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60"
                            title="Start tracking time on this task"
                          >
                            <Play className="w-3 h-3" />
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
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
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
          </div>
        );
      })}
    </div>
  );
};
