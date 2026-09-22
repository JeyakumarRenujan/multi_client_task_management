import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Task, PriorityLevel } from '../../types';
import { TaskKanban } from './TaskKanban';
import { TaskCalendar } from './TaskCalendar';
import { TaskListView } from './TaskListView';
import {
  CheckSquare,
  Plus,
  Search,
  Kanban,
  Calendar,
  List,
  Sparkles,
} from 'lucide-react';

export const TasksView: React.FC = () => {
  const {
    tasks,
    projects,
    clients,
    setIsTaskModalOpen,
    setSelectedTaskForEdit,
    setIsAiModalOpen,
  } = useApp();

  const [viewType, setViewType] = useState<'kanban' | 'calendar' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | PriorityLevel>('all');

  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.description.toLowerCase().includes(search.toLowerCase()) ||
      task.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));

    const matchesProject = projectFilter === 'all' || task.projectId === projectFilter;
    const matchesClient = clientFilter === 'all' || task.clientId === clientFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

    return matchesSearch && matchesProject && matchesClient && matchesPriority;
  });

  const handleEditTask = (task: Task) => {
    setSelectedTaskForEdit(task);
    setIsTaskModalOpen(true);
  };

  const pendingTasksCount = tasks.filter(t => t.status !== 'done').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Task Deliverables
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              {pendingTasksCount} Pending / {tasks.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organize deliverables across Kanban boards, interactive calendars, and dense lists.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ask AI</span>
          </button>

          <button
            onClick={() => {
              setSelectedTaskForEdit(null);
              setIsTaskModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-whatsapp-teal hover:from-emerald-700 hover:to-whatsapp-dark text-white text-xs font-bold shadow-md shadow-emerald-700/25 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Control & Filter Toolbar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks, descriptions, or tags..."
            className="w-full pl-3.5 pr-9 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          <select
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
            className="flex-1 sm:flex-none min-w-[110px] px-2.5 sm:px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Clients</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.company}
              </option>
            ))}
          </select>

          <select
            value={projectFilter}
            onChange={e => setProjectFilter(e.target.value)}
            className="flex-1 sm:flex-none min-w-[110px] px-2.5 sm:px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value as any)}
            className="flex-1 sm:flex-none min-w-[110px] px-2.5 sm:px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* View Type Switcher */}
          <div className="flex items-center justify-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 w-full sm:w-auto mt-1 sm:mt-0">
            <button
              onClick={() => setViewType('kanban')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewType === 'kanban'
                  ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-sm'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>

            <button
              onClick={() => setViewType('calendar')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewType === 'calendar'
                  ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-sm'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>

            <button
              onClick={() => setViewType('list')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewType === 'list'
                  ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-sm'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main View Content */}
      <div>
        {viewType === 'kanban' && (
          <TaskKanban filteredTasks={filteredTasks} onEditTask={handleEditTask} />
        )}
        {viewType === 'calendar' && (
          <TaskCalendar filteredTasks={filteredTasks} onEditTask={handleEditTask} />
        )}
        {viewType === 'list' && (
          <TaskListView filteredTasks={filteredTasks} onEditTask={handleEditTask} />
        )}
      </div>
    </div>
  );
};
